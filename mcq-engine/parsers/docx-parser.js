/**
 * Class Caddy MCQ Engine — DOCX Parser & Legacy DOC Guard
 *
 * Uses JSZip to:
 * 1. Detect legacy binary .doc files (OLE2 magic header D0 CF 11 E0) cleanly
 *    without pretending to parse binary garbage.
 * 2. Inspect word/document.xml and convert Microsoft Word OMML equations
 *    (<m:oMath>, <m:oMathPara>) into clean LaTeX runs ($...$ / $$...$$)
 *    before passing the patched docx zip buffer to Mammoth!
 * 3. Enforce image byte budgets to protect Firestore's 1 MB document limit.
 */

import JSZip from 'jszip';
import mammoth from 'mammoth';
import { parseHtmlMcqs } from './html-parser.js';
import { parsePlainTextMcqs } from './text-parser.js';

const MAX_INLINE_IMAGE_BYTES = 110 * 1024; // Protect Firestore 1 MB per-week doc cap

function hasMagicBytes(bytes, signature) {
  if (!bytes || bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

export function detectBinaryDocFormat(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  // OLE2 Compound Document (.doc, .xls, .ppt)
  if (hasMagicBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return 'legacy-doc';
  }
  // PDF (%PDF-)
  if (hasMagicBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return 'pdf';
  }
  // ZIP / OOXML (.docx)
  if (hasMagicBytes(bytes, [0x50, 0x4b, 0x03, 0x04]) || hasMagicBytes(bytes, [0x50, 0x4b, 0x05, 0x06])) {
    return 'zip';
  }
  return 'unknown';
}

/**
 * Recursive converter from Word OMML XML element (<m:oMath>) to readable LaTeX.
 */
function ommlNodeToLatex(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.nodeValue || '';
  if (node.nodeType !== 1) return '';

  const localName = (node.localName || node.nodeName.split(':').pop() || '').toLowerCase();
  const childByName = (name) =>
    Array.from(node.children || []).find(
      (c) => (c.localName || c.nodeName.split(':').pop() || '').toLowerCase() === name
    );
  const childrenLatex = (target = node) =>
    Array.from(target.childNodes || []).map(ommlNodeToLatex).join('');

  switch (localName) {
    case 't':
      return node.textContent || '';
    case 'r':
    case 'omath':
    case 'omathpara':
    case 'e':
    case 'num':
    case 'den':
    case 'sup':
    case 'sub':
    case 'deg':
      return childrenLatex(node);
    case 'f': {
      const num = ommlNodeToLatex(childByName('num'));
      const den = ommlNodeToLatex(childByName('den'));
      return `\\frac{${num}}{${den}}`;
    }
    case 'ssup': {
      const base = ommlNodeToLatex(childByName('e'));
      const sup = ommlNodeToLatex(childByName('sup'));
      return `${base}^{${sup}}`;
    }
    case 'ssub': {
      const base = ommlNodeToLatex(childByName('e'));
      const sub = ommlNodeToLatex(childByName('sub'));
      return `${base}_{${sub}}`;
    }
    case 'ssubsup': {
      const base = ommlNodeToLatex(childByName('e'));
      const sub = ommlNodeToLatex(childByName('sub'));
      const sup = ommlNodeToLatex(childByName('sup'));
      return `${base}_{${sub}}^{${sup}}`;
    }
    case 'rad': {
      const deg = ommlNodeToLatex(childByName('deg')).trim();
      const body = ommlNodeToLatex(childByName('e'));
      return deg ? `\\sqrt[${deg}]{${body}}` : `\\sqrt{${body}}`;
    }
    case 'd': {
      const body = Array.from(node.children || [])
        .filter((c) => (c.localName || c.nodeName.split(':').pop() || '').toLowerCase() === 'e')
        .map(ommlNodeToLatex)
        .join(', ');
      return `\\left(${body}\\right)`;
    }
    case 'nary': {
      const chrEl = node.getElementsByTagNameNS ? node.getElementsByTagNameNS('*', 'chr')[0] : null;
      const sym = chrEl?.getAttribute('m:val') || chrEl?.getAttribute('val') || '∑';
      const cmd = sym === '∫' ? '\\int' : sym === '∏' ? '\\prod' : '\\sum';
      const sub = ommlNodeToLatex(childByName('sub')).trim();
      const sup = ommlNodeToLatex(childByName('sup')).trim();
      const e = ommlNodeToLatex(childByName('e'));
      return `${cmd}${sub ? `_{${sub}}` : ''}${sup ? `^{${sup}}` : ''} ${e}`;
    }
    case 'm': {
      const rows = Array.from(node.children || [])
        .filter((c) => (c.localName || c.nodeName.split(':').pop() || '').toLowerCase() === 'mr')
        .map((mr) =>
          Array.from(mr.children || [])
            .filter((e) => (e.localName || e.nodeName.split(':').pop() || '').toLowerCase() === 'e')
            .map(ommlNodeToLatex)
            .join(' & ')
        )
        .join(' \\\\ ');
      return `\\begin{matrix} ${rows} \\end{matrix}`;
    }
    default:
      return childrenLatex(node);
  }
}

/**
 * Patches word/document.xml inside an in-memory .docx zip so Word native
 * OMML equations become plain $...$ / $$...$$ runs that Mammoth preserves!
 */
async function preprocessDocxWithOmmlMath(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docEntry = zip.file('word/document.xml');
  if (!docEntry) {
    throw new Error('Invalid .docx archive: missing word/document.xml.');
  }

  let mathCount = 0;
  if (typeof globalThis.DOMParser === 'function' && typeof globalThis.XMLSerializer === 'function') {
    try {
      const xmlStr = await docEntry.async('string');
      if (xmlStr.includes('oMath')) {
        const xmlDoc = new globalThis.DOMParser().parseFromString(xmlStr, 'application/xml');
        const wNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const oMathParas = Array.from(xmlDoc.getElementsByTagNameNS('*', 'oMathPara'));
        oMathParas.forEach((para) => {
          const tex = ommlNodeToLatex(para).trim();
          if (tex) {
            mathCount++;
            const run = xmlDoc.createElementNS(wNs, 'w:r');
            const txt = xmlDoc.createElementNS(wNs, 'w:t');
            txt.setAttribute('xml:space', 'preserve');
            txt.textContent = ` $$${tex}$$ `;
            run.appendChild(txt);
            para.replaceWith(run);
          }
        });

        const oMaths = Array.from(xmlDoc.getElementsByTagNameNS('*', 'oMath'));
        oMaths.forEach((om) => {
          const tex = ommlNodeToLatex(om).trim();
          if (tex) {
            mathCount++;
            const run = xmlDoc.createElementNS(wNs, 'w:r');
            const txt = xmlDoc.createElementNS(wNs, 'w:t');
            txt.setAttribute('xml:space', 'preserve');
            txt.textContent = ` $${tex}$ `;
            run.appendChild(txt);
            om.replaceWith(run);
          }
        });

        const serialized = new globalThis.XMLSerializer().serializeToString(xmlDoc);
        zip.file('word/document.xml', serialized);
        const patchedBuffer = await zip.generateAsync({ type: 'arraybuffer' });
        return { buffer: patchedBuffer, mathCount };
      }
    } catch {
      // If XML patching fails, proceed gracefully with original docx buffer
    }
  }

  return { buffer: arrayBuffer, mathCount: 0 };
}

/**
 * Parses a .docx ArrayBuffer (or detects .doc) and returns extracted MCQs + diagnostics.
 */
export async function parseDocxArrayBuffer(arrayBuffer, fileName = 'document.docx') {
  const warnings = [];
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    return {
      items: [],
      warnings: [`"${fileName}" is empty.`],
      unsupportedFormat: true,
    };
  }

  const format = detectBinaryDocFormat(arrayBuffer);
  if (format === 'legacy-doc' || /\.doc$/i.test(fileName)) {
    if (format === 'legacy-doc') {
      return {
        items: [],
        unsupportedFormat: true,
        warnings: [
          `"${fileName}" uses the legacy binary .doc format (OLE2), which browsers cannot decode directly. Please save/export it as .docx or .html in Word/Google Docs/LibreOffice, or copy & paste the questions into the Paste Text / Paste HTML tab.`,
        ],
      };
    }
  }
  if (format !== 'zip') {
    return {
      items: [],
      unsupportedFormat: true,
      warnings: [`"${fileName}" does not appear to be a valid .docx archive (corrupted or unsupported binary file).`],
    };
  }

  let preparedBuffer = arrayBuffer;
  let mathCount = 0;
  try {
    const pre = await preprocessDocxWithOmmlMath(arrayBuffer);
    preparedBuffer = pre.buffer;
    mathCount = pre.mathCount;
  } catch (err) {
    return {
      items: [],
      warnings: [err.message || `Could not open "${fileName}" as a .docx archive.`],
    };
  }

  const mammothInput = typeof globalThis.Buffer === 'function'
    ? { arrayBuffer: preparedBuffer, buffer: globalThis.Buffer.from(preparedBuffer) }
    : { arrayBuffer: preparedBuffer };

  let oversizedImageCount = 0;
  const mammothResult = await mammoth.convertToHtml(
    mammothInput,
    {
      styleMap: [
        'u => u',
        'strike => s',
        "p[style-name='Heading 1'] => h3:fresh",
        "p[style-name='Heading 2'] => h4:fresh",
      ],
      convertImage: mammoth.images.imgElement(async (image) => {
        const b64 = await image.read('base64');
        const approxBytes = Math.ceil((b64.length * 3) / 4);
        const ct = String(image.contentType || '').toLowerCase();
        const isSafeImageType = /^image\/(png|jpeg|jpg|gif|webp)$/i.test(ct);
        if (!isSafeImageType) {
          oversizedImageCount++;
          return { alt: image.altText || `Unsupported image (${ct || 'unknown'})` };
        }
        if (approxBytes > MAX_INLINE_IMAGE_BYTES) {
          oversizedImageCount++;
          return {
            alt: image.altText || `Omitted oversized image (${Math.round(approxBytes / 1024)} KB) to keep Firestore doc under 1 MB`,
          };
        }
        return {
          src: `data:${ct};base64,${b64}`,
          alt: image.altText || 'Document diagram',
        };
      }),
    }
  );

  if (oversizedImageCount > 0) {
    warnings.push(
      `${oversizedImageCount} image(s) exceeded 110 KB or used an unsafe format and were replaced by alt-text placeholders to stay within Firestore's 1 MB document limit.`
    );
  }
  if (mathCount > 0) {
    warnings.push(`Recovered ${mathCount} Word OMML equation(s) into LaTeX math.`);
  }

  const htmlParsed = parseHtmlMcqs(mammothResult.value || '', { preserveCss: true });
  let items = (htmlParsed.items || []).map((it) => ({ ...it, sourceFormat: 'docx' }));

  // Fallback: if Word document had flat lines that HTML splitter missed, try Mammoth raw text
  if (items.length === 0) {
    const rawRes = await mammoth.extractRawText(mammothInput);
    const textParsed = parsePlainTextMcqs(rawRes.value || '');
    items = (textParsed.items || []).map((it) => ({ ...it, sourceFormat: 'docx' }));
  }

  if (items.length === 0) {
    warnings.push(`No recognizable MCQs were found inside "${fileName}".`);
  }

  return { items, warnings };
}
