/**
 * Class Caddy MCQ Engine — Universal Rich-Content Sanitizer & Renderer
 *
 * Security pipeline:
 * 1. DOMPurify sanitizes ALL HTML BEFORE math/code hydration (strips <script>,
 *    <iframe>, <object>, <embed>, on* attributes, raw untrusted <svg>,
 *    javascript: URIs, data:image/svg+xml, dangerous CSS expressions).
 * 2. Code blocks (<pre><code> and fenced markdown ```) are highlighted via
 *    highlight.js cleanly on textContent—code is NEVER parsed as HTML or LaTeX.
 * 3. LaTeX ($$...$$, \[...\], \(...\), careful $...$) is rendered via KaTeX
 *    synchronously in non-code text nodes (with graceful fallback on invalid TeX),
 *    while sanitized MathML (<math>) passes through natively.
 * 4. Shared identically across View MCQ, Study Mode, Classic Quiz, New Exam UI,
 *    Review Screens, Import Workspace, and Print Layouts.
 */

import DOMPurify from 'dompurify';
import katex from 'katex';
import hljs from 'highlight.js/lib/common';
import { escapeHtmlBasic, htmlToPlainText, getOptionPrefixLabel } from './schema.js';

const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 's', 'del', 'ins',
  'mark', 'sup', 'sub', 'small', 'blockquote', 'pre', 'code', 'kbd', 'samp',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'a', 'img', 'table', 'caption', 'colgroup', 'col', 'thead', 'tbody',
  'tfoot', 'tr', 'th', 'td', 'figure', 'figcaption', 'details', 'summary',
  // MathML tags
  'math', 'semantics', 'annotation', 'annotation-xml', 'mrow', 'mi', 'mn',
  'mo', 'ms', 'mtext', 'mspace', 'msup', 'msub', 'msubsup', 'mfrac', 'msqrt',
  'mroot', 'mstyle', 'merror', 'mpadded', 'mphantom', 'mfenced', 'mtable',
  'mtr', 'mtd', 'mlabeledtr', 'munder', 'mover', 'munderover', 'mmultiscripts',
  'mprescripts', 'none', 'menclose',
];

const ALLOWED_ATTR = [
  'class', 'title', 'alt', 'src', 'width', 'height', 'href', 'target', 'rel',
  'colspan', 'rowspan', 'scope', 'align', 'valign', 'start', 'type', 'style',
  'data-lang', 'data-latex',
  // MathML attrs
  'mathvariant', 'mathsize', 'mathcolor', 'mathbackground', 'display', 'xmlns',
  'encoding', 'columnalign', 'rowalign', 'linethickness', 'fence', 'separator',
  'stretchy', 'lspace', 'rspace', 'notation', 'accent', 'accentunder', 'bevelled',
];

const SAFE_STYLE_PROPS = new Set([
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-align',
  'vertical-align',
  'white-space',
  'max-width',
  'width',
  'height',
]);

let cachedPurifier = null;

function getPurifier() {
  if (cachedPurifier && typeof cachedPurifier.sanitize === 'function') {
    return cachedPurifier;
  }

  let instance = DOMPurify;
  if (typeof DOMPurify === 'function' && typeof DOMPurify.sanitize !== 'function') {
    if (typeof globalThis.window !== 'undefined') {
      instance = DOMPurify(globalThis.window);
    }
  }

  if (instance && typeof instance.addHook === 'function' && !instance.__ccHooksInstalled) {
    instance.__ccHooksInstalled = true;

    instance.addHook('afterSanitizeAttributes', (node) => {
      if (!node || typeof node.getAttribute !== 'function') return;

      // 1. Validate <img src>
      if (node.tagName === 'IMG') {
        const src = (node.getAttribute('src') || '').trim();
        const isSafeUrl =
          /^https?:\/\//i.test(src) ||
          /^\//.test(src) ||
          /^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(src);
        if (!isSafeUrl) {
          node.removeAttribute('src');
          if (!node.getAttribute('alt')) {
            node.setAttribute('alt', 'Blocked unsafe image source');
          }
        }
        node.setAttribute('loading', 'lazy');
      }

      // 2. Validate <a href>
      if (node.tagName === 'A') {
        const href = (node.getAttribute('href') || '').trim();
        const isSafeHref =
          /^https?:\/\//i.test(href) ||
          /^mailto:/i.test(href) ||
          /^#/.test(href) ||
          /^\//.test(href);
        if (!isSafeHref) {
          node.removeAttribute('href');
        } else if (/^https?:\/\//i.test(href)) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }

      // 3. Strictly filter inline style properties
      if (node.hasAttribute('style')) {
        const rawStyle = node.getAttribute('style') || '';
        const cleaned = [];
        rawStyle.split(';').forEach((decl) => {
          const idx = decl.indexOf(':');
          if (idx === -1) return;
          const prop = decl.slice(0, idx).trim().toLowerCase();
          const val = decl.slice(idx + 1).trim();
          if (!SAFE_STYLE_PROPS.has(prop)) return;
          if (/expression|javascript:|vbscript:|url\s*\(|-moz-binding|@import/i.test(val)) return;
          if (val) cleaned.push(`${prop}: ${val}`);
        });
        if (cleaned.length > 0) {
          node.setAttribute('style', cleaned.join('; '));
        } else {
          node.removeAttribute('style');
        }
      }
    });
  }

  cachedPurifier = instance;
  return instance;
}

/**
 * Sanitizes rich HTML using DOMPurify allowlist.
 */
export function sanitizeRichHtml(dirtyHtml) {
  if (dirtyHtml === null || dirtyHtml === undefined) return '';
  const str = String(dirtyHtml);
  const purifier = getPurifier();
  if (purifier && typeof purifier.sanitize === 'function') {
    return purifier.sanitize(str, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'svg'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    });
  }
  return escapeHtmlBasic(htmlToPlainText(str));
}

function renderLatexSegment(expr, displayMode) {
  const cleaned = String(expr || '').trim();
  if (!cleaned) return '';
  try {
    return katex.renderToString(cleaned, {
      displayMode: Boolean(displayMode),
      throwOnError: true,
      strict: 'ignore',
      output: 'htmlAndMathml',
    });
  } catch {
    return `<code class="cc-math-fallback" data-latex="${escapeHtmlBasic(cleaned)}" title="LaTeX expression">${escapeHtmlBasic(
      displayMode ? `$$${cleaned}$$` : `$${cleaned}$`
    )}</code>`;
  }
}

function highlightCodeString(codeText, lang = '') {
  const cleanCode = String(codeText || '').replace(/^\n+|\n+$/g, '');
  const cleanLang = String(lang || '')
    .toLowerCase()
    .replace(/^language-/, '')
    .replace(/[^a-z0-9_+-]/g, '');

  try {
    if (cleanLang && hljs.getLanguage(cleanLang)) {
      const res = hljs.highlight(cleanCode, { language: cleanLang, ignoreIllegals: true });
      return { html: res.value, language: cleanLang };
    }
    const auto = hljs.highlightAuto(cleanCode);
    return { html: auto.value, language: auto.language || cleanLang || 'code' };
  } catch {
    return { html: escapeHtmlBasic(cleanCode), language: cleanLang || 'code' };
  }
}

/**
 * Converts fenced markdown code blocks (```lang ... ```) and inline `code`
 * inside plain-text strings into safe <pre><code> blocks while preserving
 * non-code text untouched for LaTeX rendering.
 */
function preprocessPlainTextInput(rawText, inlineOnly = false) {
  const str = String(rawText ?? '');
  const placeholders = [];
  const hold = (html) => {
    const token = `@@CC_BLK_${placeholders.length}@@`;
    placeholders.push(html);
    return token;
  };

  let working = str;

  // 1. Fenced code blocks ```lang\n...\n```
  if (!inlineOnly) {
    working = working.replace(/```([a-zA-Z0-9_+-]*)[ \t]*\r?\n([\s\S]*?)```/g, (_, lang, code) => {
      const highlighted = highlightCodeString(code, lang);
      const badge = highlighted.language ? `<span class="cc-code-lang">${escapeHtmlBasic(highlighted.language)}</span>` : '';
      return hold(
        `<div class="cc-code-block">${badge}<pre><code class="hljs language-${escapeHtmlBasic(highlighted.language)}">${highlighted.html}</code></pre></div>`
      );
    });
  }

  // 2. Inline code `...` (only when content does not span newlines and looks like code)
  working = working.replace(/`([^`\n]{1,180})`/g, (_, code) => {
    return hold(`<code class="cc-inline-code">${escapeHtmlBasic(code)}</code>`);
  });

  // 3. Escape remaining text & preserve newlines
  let escaped = escapeHtmlBasic(working);
  if (!inlineOnly) {
    escaped = escaped.replace(/\r?\n/g, '<br>');
  } else {
    escaped = escaped.replace(/\r?\n/g, ' ');
  }

  // 4. Restore code placeholders before LaTeX pass (note: placeholders have no $, so LaTeX ignores them)
  let restored = escaped.replace(/@@CC_BLK_(\d+)@@/g, (_, idx) => placeholders[Number(idx)] || '');

  return hydrateLatexInHtmlFragment(restored);
}

/**
 * Hydrates LaTeX delimiters ONLY in safe text nodes (never inside <pre>, <code>,
 * <math>, <kbd>, <samp>, .katex, or .cc-math-fallback) and enhances <pre><code>
 * blocks + tables in sanitized HTML fragments.
 */
function hydrateLatexInHtmlFragment(safeHtml) {
  if (!safeHtml) return '';

  if (typeof globalThis.DOMParser !== 'function') {
    return renderLatexInRawText(safeHtml);
  }

  try {
    const parser = new globalThis.DOMParser();
    const doc = parser.parseFromString(`<div class="cc-root">${safeHtml}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    if (!root) return safeHtml;

    // 1. Highlight <pre><code> and raw <pre> blocks first
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.closest('.cc-code-block')) return;
      const codeEl = pre.querySelector('code');
      const rawCode = codeEl ? codeEl.textContent : pre.textContent;
      const classAttr = (codeEl?.getAttribute('class') || pre.getAttribute('class') || '').trim();
      const langMatch = classAttr.match(/(?:language-|lang-)([a-z0-9_+-]+)/i);
      const dataLang = pre.getAttribute('data-lang') || codeEl?.getAttribute('data-lang') || (langMatch ? langMatch[1] : '');
      const highlighted = highlightCodeString(rawCode || '', dataLang);

      const wrapper = doc.createElement('div');
      wrapper.className = 'cc-code-block';
      if (highlighted.language) {
        const badge = doc.createElement('span');
        badge.className = 'cc-code-lang';
        badge.textContent = highlighted.language;
        wrapper.appendChild(badge);
      }
      const newPre = doc.createElement('pre');
      const newCode = doc.createElement('code');
      newCode.className = `hljs language-${highlighted.language}`;
      newCode.innerHTML = highlighted.html;
      newPre.appendChild(newCode);
      wrapper.appendChild(newPre);
      pre.replaceWith(wrapper);
    });

    // 2. Wrap standalone <table> in responsive scroll wrapper
    root.querySelectorAll('table').forEach((tbl) => {
      if (tbl.closest('.cc-table-scroll') || tbl.closest('.katex')) return;
      const wrap = doc.createElement('div');
      wrap.className = 'cc-table-scroll';
      tbl.parentNode.insertBefore(wrap, tbl);
      wrap.appendChild(tbl);
    });

    // 3. Walk text nodes outside protected elements and hydrate LaTeX
    const SKIP_TAGS = new Set(['PRE', 'CODE', 'KBD', 'SAMP', 'MATH', 'SCRIPT', 'STYLE', 'SVG']);
    const textNodes = [];
    const walk = (node) => {
      if (!node) return;
      if (node.nodeType === 1) {
        const tag = node.tagName ? node.tagName.toUpperCase() : '';
        if (SKIP_TAGS.has(tag)) return;
        if (node.classList && (node.classList.contains('katex') || node.classList.contains('cc-math-fallback') || node.classList.contains('cc-code-block'))) {
          return;
        }
      }
      if (node.nodeType === 3) {
        if (node.nodeValue && (node.nodeValue.includes('$') || node.nodeValue.includes('\\(') || node.nodeValue.includes('\\['))) {
          textNodes.push(node);
        }
        return;
      }
      const children = Array.from(node.childNodes || []);
      children.forEach(walk);
    };
    walk(root);

    textNodes.forEach((tn) => {
      const rendered = renderLatexInRawText(tn.nodeValue || '');
      if (rendered !== tn.nodeValue) {
        const tpl = doc.createElement('span');
        tpl.innerHTML = rendered;
        const frag = doc.createDocumentFragment();
        while (tpl.firstChild) frag.appendChild(tpl.firstChild);
        tn.parentNode.replaceChild(frag, tn);
      }
    });

    return root.innerHTML;
  } catch {
    return safeHtml;
  }
}

/**
 * Matches $$...$$, \[...\], \(...\), and careful $...$ inside plain text
 * without touching currency values such as $50 or $12.50.
 */
function renderLatexInRawText(text) {
  if (!text) return '';
  const str = String(text);

  // Order matters: display delimiters before inline delimiters
  const mathPattern =
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\\)\$(?!\s*\d+(?:[.,]\d+)?(?:\s|$|[).,;:!?]))([^$\n]{1,300}?)(?<!\\|\s)\$)/g;

  let lastIndex = 0;
  let out = '';
  let match;

  while ((match = mathPattern.exec(str)) !== null) {
    out += str.slice(lastIndex, match.index);
    const full = match[0];

    if (full.startsWith('$$') && full.endsWith('$$')) {
      out += renderLatexSegment(full.slice(2, -2), true);
    } else if (full.startsWith('\\[') && full.endsWith('\\]')) {
      out += renderLatexSegment(full.slice(2, -2), true);
    } else if (full.startsWith('\\(') && full.endsWith('\\)')) {
      out += renderLatexSegment(full.slice(2, -2), false);
    } else if (full.startsWith('$') && full.endsWith('$')) {
      const inner = full.slice(1, -1);
      // Avoid accidental currency range "$10 - $20"
      if (/^\s*\d[\d,.\s]*$/.test(inner)) {
        out += full;
      } else {
        out += renderLatexSegment(inner, false);
      }
    } else {
      out += full;
    }

    lastIndex = match.index + full.length;
  }

  out += str.slice(lastIndex);
  return out;
}

/**
 * Primary universal HTML string renderer.
 * Accepts either rich HTML or plain text (optionally containing LaTeX / fenced code).
 * Guarantees sanitized, KaTeX + highlight.js hydrated HTML output wrapped safely.
 */
export function renderRichHtmlString(value, options = {}) {
  const { inlineOnly = false, forcePlainText = false } = options;
  if (value === null || value === undefined || value === '') return '';

  const str = String(value);
  const looksLikeHtml =
    !forcePlainText &&
    /<(b|strong|i|em|u|s|del|ins|mark|sup|sub|span|p|div|br|ul|ol|li|table|tr|td|th|pre|code|blockquote|img|math|a|h[1-6]|script|iframe|svg)\b/i.test(str);

  let hydrated;
  if (!looksLikeHtml) {
    hydrated = preprocessPlainTextInput(str, inlineOnly);
  } else {
    // CRITICAL SECURITY ORDER: Sanitize HTML first, THEN highlight code & render LaTeX
    const clean = sanitizeRichHtml(str);
    hydrated = hydrateLatexInHtmlFragment(clean);
  }

  if (inlineOnly) {
    return `<span class="cc-rich-content cc-rich-inline">${hydrated}</span>`;
  }
  return `<div class="cc-rich-content">${hydrated}</div>`;
}

/**
 * Renders a specific field of a normalized or legacy MCQ object through the
 * universal rich renderer.
 */
export function renderMcqFieldHtml(mcq, field = 'question', optIndex = 0, opts = {}) {
  if (!mcq) return '';
  if (field === 'question') {
    const val = mcq.questionHtml || mcq.question || mcq.questionText || '';
    return renderRichHtmlString(val, opts);
  }
  if (field === 'option') {
    const val =
      (Array.isArray(mcq.optionsHtml) && mcq.optionsHtml[optIndex]) ||
      (Array.isArray(mcq.options) && mcq.options[optIndex]) ||
      '';
    return renderRichHtmlString(val, { inlineOnly: true, ...opts });
  }
  if (field === 'correctAnswer') {
    const val = mcq.correctAnswerHtml || mcq.correctAnswer || '';
    return renderRichHtmlString(val, { inlineOnly: true, ...opts });
  }
  if (field === 'explanation') {
    const val = mcq.explanationHtml || mcq.explanation || mcq.noteHtml || mcq.note || '';
    return renderRichHtmlString(val, opts);
  }
  if (field === 'note') {
    const val = mcq.noteHtml || mcq.note || mcq.explanationHtml || mcq.explanation || '';
    return renderRichHtmlString(val, opts);
  }
  return '';
}

export function renderRichIntoElement(element, value, options = {}) {
  if (!element) return;
  element.innerHTML = renderRichHtmlString(value, options);
}

/**
 * Formats an array of legacy or v2 MCQs cleanly for clipboard copy (readable plain text).
 */
export function formatMcqsForClipboardPlain(mcqs) {
  if (!Array.isArray(mcqs) || mcqs.length === 0) return '';
  return mcqs
    .map((mcq, index) => {
      const qText = mcq.questionText || htmlToPlainText(mcq.questionHtml || mcq.question || '');
      const opts = Array.isArray(mcq.options)
        ? mcq.options.map((o) => htmlToPlainText(o))
        : [];
      const optLines = opts
        .map((opt, i) => `${getOptionPrefixLabel(i, qText)}. ${opt}`)
        .join('\n');

      const correctPlain = htmlToPlainText(mcq.correctAnswer || '');
      let ansLine = '';
      if (correctPlain) {
        const idx = opts.findIndex((o) => o === correctPlain);
        if (idx !== -1) {
          ansLine = `Correct answer: ${getOptionPrefixLabel(idx, qText)}. ${correctPlain}`;
        } else {
          ansLine = `Correct answer: ${correctPlain}`;
        }
      } else {
        ansLine = `Correct answer: ${htmlToPlainText(mcq.explanation || '') || 'Unresolved'}`;
      }

      const notePlain = htmlToPlainText(mcq.note || mcq.explanation || '');
      if (notePlain && !ansLine.includes(notePlain)) {
        ansLine += `\nNote: ${notePlain}`;
      }

      return `${index + 1}. ${qText}\n${optLines}\n${ansLine}`;
    })
    .join('\n\n');
}
