/**
 * Class Caddy MCQ Engine — DOM, Style & Script-Aware HTML Parser
 *
 * Extracts MCQs from pasted HTML or uploaded .html/.htm documents while:
 * 1. Inspecting <script> elements BEFORE stripping scripts to extract
 *    JavaScript-embedded MCQ arrays/objects (e.g. `const mcqData = [...]`,
 *    `window.questions = [...]`), `<script type="application/json">`, and
 *    `<script type="application/ld+json">` via safe static Acorn AST analysis
 *    (NEVER executing untrusted scripts).
 * 2. Detecting `<div data-question="..." data-answer="..." data-option-a="...">`
 *    data-attribute MCQs.
 * 3. Extracting `<script type="math/tex">` & KaTeX LaTeX annotations BEFORE
 *    stripping chrome (nav, header, footer, aside, ads).
 * 4. Preserving meaningful inline & CSS-class styling (bold, italic, underline,
 *    strikethrough, color, background-color, sup/sub, lists, tables, pre/code,
 *    MathML, images with alt/dimensions).
 * 5. Detecting external `<script src="...">` dependencies and warning clearly
 *    when an HTML document loads its questions from an external JS file.
 */

import { normalizeMcqItem, decodeHtmlEntities } from '../schema.js';
import { sanitizeRichHtml } from '../renderer.js';
import { parseJsSourceMcqs, parseJsonMcqs, mapRawObjectToMcq } from './source-parser.js';
import { parsePlainTextMcqs } from './text-parser.js';

const CHROME_SELECTORS = [
  'script:not([type*="math/tex"])',
  'noscript',
  'iframe',
  'object',
  'embed',
  'nav',
  'header',
  'footer',
  'aside',
  '.navbar',
  '.nav',
  '.sidebar',
  '.footer',
  '.header',
  '.ads',
  '.ad-banner',
  '.advertisement',
  '.cookie-banner',
  '.social-share',
  '.breadcrumb',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="complementary"]',
].join(',');

const OPT_PREFIX_HTML_RE =
  /^\s*(?:<[^>]+>\s*)*(?:\(([a-hA-Hক-জ1-8])\)|\[([a-hA-Hক-জ1-8])\]|([a-hA-Hক-জ1-8])[\.\):])\s*(?:<\/[^>]+>\s*)*([\s\S]*)$/i;

const QUESTION_NUM_HTML_RE =
  /^\s*(?:<[^>]+>\s*)*(?:Q(?:uestion)?\s*\.?\s*|প্রশ্ন\s*\.?\s*)?(?:\(?([0-9০-৯]{1,4})\)?[\.\):])\s*(?:<\/[^>]+>\s*)*([\s\S]*)$/i;

function normalizeDigits(str) {
  return String(str || '').replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
}

const LABEL_MAP = {
  a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7,
  'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3, 'ঙ': 4, 'চ': 5, 'ছ': 6, 'জ': 7,
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7,
  '১': 0, '২': 1, '৩': 2, '৪': 3, '৫': 4, '৬': 5, '৭': 6, '৮': 7,
};

const KNOWN_LIB_SCRIPT_RE =
  /(?:mathjax|katex|tailwind|bootstrap|jquery|fontawesome|alpine|vue|react|gsap|chart\.js|lucide| feather|gtag|googletagmanager|analytics|polyfill|prism|highlight)/i;

/**
 * Inspects all <script> tags in raw HTML (works both with and without DOMParser)
 * BEFORE any scripts are removed from the document.
 * Extracts:
 * - Embedded JavaScript MCQ arrays/objects (`const mcqData = [...]`, `window.questions = [...]`)
 * - Embedded JSON (`<script type="application/json">`, `<script type="application/ld+json">`)
 * - External `<script src="...">` references (for diagnostic reporting if no inline data exists)
 */
function extractMcqsFromHtmlScripts(rawHtml, fileName = '') {
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  const items = [];
  const warnings = [];
  const detectedVariables = [];
  const externalScripts = [];
  let detectedSourceType = '';
  let rawDetectedCount = 0;

  let match;
  while ((match = scriptRegex.exec(rawHtml)) !== null) {
    const attrStr = match[1] || '';
    const body = (match[2] || '').trim();

    const srcMatch = attrStr.match(/\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
    const srcVal = srcMatch ? (srcMatch[1] || srcMatch[2] || srcMatch[3] || '').trim() : '';

    if (srcVal) {
      if (!KNOWN_LIB_SCRIPT_RE.test(srcVal)) {
        externalScripts.push(srcVal);
      }
      continue;
    }

    if (!body) continue;

    const typeMatch = attrStr.match(/\btype\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
    const typeVal = typeMatch ? (typeMatch[1] || typeMatch[2] || typeMatch[3] || '').trim().toLowerCase() : '';
    const idMatch = attrStr.match(/\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
    const scriptId = idMatch ? (idMatch[1] || idMatch[2] || idMatch[3] || '').trim() : '';

    // Skip MathJax inline TeX scripts here (handled by DOM math recovery)
    if (typeVal.includes('math/tex')) continue;

    // 1. JSON / JSON-LD script blocks
    if (typeVal === 'application/json' || typeVal === 'application/ld+json' || typeVal.endsWith('+json')) {
      const jsonRes = parseJsonMcqs(body, {
        fileName,
        variableName: scriptId || (typeVal === 'application/ld+json' ? 'JSON-LD' : 'application/json'),
        detectedSourceType: typeVal === 'application/ld+json' ? 'JSON-LD structured script' : 'Embedded JSON script',
      });
      if (jsonRes.items && jsonRes.items.length > 0) {
        items.push(...jsonRes.items);
        rawDetectedCount += jsonRes.rawDetectedCount || jsonRes.items.length;
        if (!detectedSourceType) detectedSourceType = jsonRes.detectedSourceType || 'Embedded JSON script';
        if (jsonRes.detectedVariableName && !detectedVariables.includes(jsonRes.detectedVariableName)) {
          detectedVariables.push(jsonRes.detectedVariableName);
        }
      }
      continue;
    }

    // 2. Standard JavaScript or ES module script blocks
    const isJsType =
      !typeVal ||
      typeVal === 'text/javascript' ||
      typeVal === 'application/javascript' ||
      typeVal === 'module' ||
      typeVal === 'text/ecmascript';

    if (!isJsType) continue;

    // Fast skip for tiny config scripts (e.g. `window.MathJax = { tex: ... }` with no array/question properties)
    if (body.length < 40 && !body.includes('[')) continue;

    const jsRes = parseJsSourceMcqs(body, {
      fileName,
      sourceFormat: 'html-js',
      detectedSourceType: 'JavaScript-embedded MCQ array',
    });

    if (jsRes.items && jsRes.items.length > 0) {
      // Re-index sequentially across multiple script blocks if multiple arrays exist
      jsRes.items.forEach((it) => {
        items.push(it);
      });
      rawDetectedCount += jsRes.rawDetectedCount || jsRes.items.length;
      detectedSourceType = 'JavaScript-embedded MCQ array';
      (jsRes.detectedVariableNames || []).forEach((v) => {
        if (v && !detectedVariables.includes(v)) detectedVariables.push(v);
      });
      (jsRes.warnings || []).forEach((w) => {
        if (!warnings.includes(w)) warnings.push(w);
      });
    }
  }

  return {
    items,
    warnings,
    detectedSourceType,
    detectedVariableName: detectedVariables.join(', '),
    detectedVariableNames: detectedVariables,
    rawDetectedCount,
    externalScripts,
  };
}

/**
 * Extracts MCQs from elements with `data-question` or `data-mcq` attributes
 * e.g. `<div class="mcq" data-question="..." data-answer="B" data-option-a="..." data-option-b="...">`
 * Works both with DOM and via regex fallback when DOMParser is absent.
 */
function extractDataAttributeMcqsFromRawHtml(rawHtml, fileName = '') {
  const tagRegex = /<([a-zA-Z0-9-]+)\b([^>]*\bdata-(?:question|mcq|q)\b[^>]*)>/gi;
  const items = [];
  let m;

  while ((m = tagRegex.exec(rawHtml)) !== null) {
    const attrStr = m[2] || '';
    const attrs = {};
    const attrRe = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
    let am;
    while ((am = attrRe.exec(attrStr)) !== null) {
      const k = am[1].toLowerCase();
      const v = decodeHtmlEntities(am[2] ?? am[3] ?? am[4] ?? '');
      attrs[k] = v;
    }

    if (attrs['data-mcq']) {
      try {
        const parsed = JSON.parse(attrs['data-mcq']);
        if (parsed && typeof parsed === 'object') {
          items.push(
            mapRawObjectToMcq(parsed, items.length, [], 'html', [], {
              detectedSourceType: 'HTML data-mcq attribute',
              variableName: 'data-mcq',
              fileName,
            })
          );
          continue;
        }
      } catch {
        // Ignore malformed JSON in data-mcq and check individual data-* attributes
      }
    }

    const qText = attrs['data-question'] || attrs['data-q'] || attrs['data-stem'] || attrs['data-prompt'] || '';
    if (!qText) continue;

    const rawObj = {
      id: attrs['data-id'] || items.length + 1,
      question: qText,
      a: attrs['data-option-a'] ?? attrs['data-a'] ?? attrs['data-opt-a'] ?? attrs['data-option1'],
      b: attrs['data-option-b'] ?? attrs['data-b'] ?? attrs['data-opt-b'] ?? attrs['data-option2'],
      c: attrs['data-option-c'] ?? attrs['data-c'] ?? attrs['data-opt-c'] ?? attrs['data-option3'],
      d: attrs['data-option-d'] ?? attrs['data-d'] ?? attrs['data-opt-d'] ?? attrs['data-option4'],
      e: attrs['data-option-e'] ?? attrs['data-e'] ?? attrs['data-opt-e'] ?? attrs['data-option5'],
      answer: attrs['data-answer'] ?? attrs['data-ans'] ?? attrs['data-correct'] ?? attrs['data-correct-answer'],
      explanation: attrs['data-explanation'] ?? attrs['data-note'] ?? attrs['data-solution'],
    };

    if (attrs['data-options']) {
      try {
        const parsedOpts = JSON.parse(attrs['data-options']);
        if (Array.isArray(parsedOpts)) rawObj.options = parsedOpts;
      } catch {
        rawObj.options = attrs['data-options'].split('|').map((s) => s.trim()).filter(Boolean);
      }
    }

    items.push(
      mapRawObjectToMcq(rawObj, items.length, [], 'html', [], {
        detectedSourceType: 'HTML data-* attributes',
        variableName: 'data-question',
        fileName,
      })
    );
  }

  return items;
}

/**
 * Parses <style> blocks into simple class -> inline declaration maps so
 * formatting from external/embedded stylesheets survives into sanitized HTML.
 */
function extractStyleClassRules(doc) {
  const classRules = new Map();
  doc.querySelectorAll('style').forEach((styleEl) => {
    const css = styleEl.textContent || '';
    const ruleRe = /\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g;
    let m;
    while ((m = ruleRe.exec(css)) !== null) {
      const cls = m[1];
      const decls = m[2].trim();
      const kept = [];
      decls.split(';').forEach((d) => {
        const idx = d.indexOf(':');
        if (idx === -1) return;
        const prop = d.slice(0, idx).trim().toLowerCase();
        const val = d.slice(idx + 1).trim();
        if (['color', 'background-color', 'font-weight', 'font-style', 'text-decoration', 'text-align'].includes(prop)) {
          kept.push(`${prop}: ${val}`);
        }
      });
      if (kept.length > 0) {
        const existing = classRules.get(cls) || '';
        classRules.set(cls, existing ? `${existing}; ${kept.join('; ')}` : kept.join('; '));
      }
    }
  });
  return classRules;
}

function applyClassStylesInline(root, classRules) {
  if (!classRules || classRules.size === 0) return;
  root.querySelectorAll('[class]').forEach((el) => {
    const applied = [];
    el.classList.forEach((cls) => {
      if (classRules.has(cls)) applied.push(classRules.get(cls));
    });
    if (applied.length > 0) {
      const prev = el.getAttribute('style') || '';
      el.setAttribute('style', prev ? `${applied.join('; ')}; ${prev}` : applied.join('; '));
    }
  });
}

/**
 * Recovers original TeX from KaTeX / MathJax DOM fragments or <script type="math/tex">
 * BEFORE cleaning the DOM so math renders crisp rather than duplicated text.
 */
function recoverMathSourceNodes(doc) {
  // 1. MathJax script[type*="math/tex"]
  doc.querySelectorAll('script[type*="math/tex"]').forEach((sc) => {
    const tex = (sc.textContent || '').trim();
    if (!tex) {
      sc.remove();
      return;
    }
    const isDisplay = /mode=display/i.test(sc.getAttribute('type') || '');
    const span = doc.createElement('span');
    span.textContent = isDisplay ? `$$${tex}$$` : `$${tex}$`;
    sc.replaceWith(span);
  });

  // 2. Rendered KaTeX blocks (replace bloated .katex with clean TeX if annotation exists)
  doc.querySelectorAll('.katex-display, .katex').forEach((kEl) => {
    if (kEl.parentElement && kEl.parentElement.closest('.katex-display')) return;
    const ann = kEl.querySelector('annotation[encoding="application/x-tex"]');
    if (ann && ann.textContent) {
      const tex = ann.textContent.trim();
      const isDisplay = kEl.classList.contains('katex-display');
      const repl = doc.createElement('span');
      repl.textContent = isDisplay ? `$$${tex}$$` : `$${tex}$`;
      kEl.replaceWith(repl);
    }
  });
}

function isGreenHighlightOrCorrect(el) {
  if (!el) return false;
  const cls = (el.getAttribute('class') || '').toLowerCase();
  if (/(?:^|\b)(?:correct|right-ans|right-answer|is-correct|ans-correct|answer-true)(?:\b|$)/.test(cls)) {
    return true;
  }
  if (el.getAttribute('data-correct') === 'true' || el.getAttribute('data-answer') === 'true') {
    return true;
  }
  const style = (el.getAttribute('style') || '').toLowerCase();
  if (/(background(?:-color)?|color)\s*:\s*(?:green|#10b981|#059669|#16a34a|#dcfce7|#d1fae5|rgb\(\s*0,\s*128|lightgreen)/i.test(style)) {
    return true;
  }
  const txt = (el.textContent || '').trim();
  if (/[✓✔☑]$/.test(txt)) return true;
  return false;
}

function cleanAndCheckCorrectOptionHtml(rawInnerHtml, elementRef = null) {
  let flaggedCorrect = isGreenHighlightOrCorrect(elementRef);
  let html = String(rawInnerHtml || '').trim();

  // Strip leading option label e.g. "a. ", "(B) ", "ক) "
  const prefixMatch = html.match(OPT_PREFIX_HTML_RE);
  if (prefixMatch) {
    html = (prefixMatch[4] || '').trim();
  }

  // Strip trailing checkmark symbol from text end
  if (/[✓✔☑]\s*(?:<\/[^>]+>)?\s*$/.test(html)) {
    flaggedCorrect = true;
    html = html.replace(/[✓✔☑]\s*(<\/[^>]+>)?\s*$/, '$1').trim();
  }

  return {
    html: sanitizeRichHtml(html),
    flaggedCorrect,
  };
}

function stripQuestionPrefixFromHtml(rawHtml) {
  const m = String(rawHtml || '').trim().match(QUESTION_NUM_HTML_RE);
  if (m) {
    return {
      num: parseInt(normalizeDigits(m[1]), 10),
      html: sanitizeRichHtml(m[2].trim()),
    };
  }
  return { num: null, html: sanitizeRichHtml(rawHtml) };
}

/**
 * Strategy 1: Semantic MCQ containers (.question-card, .mcq-item, .quiz-question, .question, etc.)
 */
function tryExtractFromSemanticCards(doc, preserveCss, fileName = '') {
  const selectors = [
    '.mcq-item',
    '.mcq-card',
    '.question-card',
    '.question-block',
    '.quiz-question',
    '.exam-question',
    '.question-container',
    '.question-box',
    '.q-card',
    '.question',
  ];
  let cards = [];
  let matchedSel = '';
  for (const sel of selectors) {
    const found = Array.from(doc.querySelectorAll(sel));
    if (found.length > 0) {
      cards = found;
      matchedSel = sel;
      break;
    }
  }
  if (cards.length === 0) return null;

  const items = [];
  cards.forEach((card, idx) => {
    const clone = card.cloneNode(true);
    if (!preserveCss) clone.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));

    const qNode = clone.querySelector('.question-text, .stem, .q-text, .prompt, .question-title, h3, h4, p');
    const optNodes = Array.from(clone.querySelectorAll('.option, .choice, .mcq-option, .opt, .options li, ul li, ol li'));
    const expNode = clone.querySelector('.explanation, .rationale, .note, .solution, .exp-box');
    const ansNode = clone.querySelector('.answer, .correct-answer, .ans');

    if (!qNode && optNodes.length === 0) return;

    const { num, html: qHtml } = stripQuestionPrefixFromHtml(qNode ? qNode.innerHTML : '');
    const optionsHtml = [];
    let correctIndex = -1;

    optNodes.forEach((optEl) => {
      const { html, flaggedCorrect } = cleanAndCheckCorrectOptionHtml(optEl.innerHTML, optEl);
      if (html) {
        if (flaggedCorrect && correctIndex === -1) correctIndex = optionsHtml.length;
        optionsHtml.push(html);
      }
    });

    let correctAnswerHtml = '';
    if (correctIndex === -1 && ansNode) {
      const ansText = (ansNode.textContent || '').replace(/^(?:correct\s*answer|answer|ans|সঠিক\s*উত্তর|উত্তর)\s*[:\-]\s*/i, '').trim();
      const letterM = ansText.match(/^\(?([a-hA-Hক-জ1-8])\)?[\.\)]?$/);
      if (letterM && LABEL_MAP[letterM[1].toLowerCase()] !== undefined) {
        const mapped = LABEL_MAP[letterM[1].toLowerCase()];
        if (optionsHtml[mapped]) {
          correctIndex = mapped;
          correctAnswerHtml = optionsHtml[mapped];
        }
      } else if (ansText) {
        const matchIdx = optNodes.findIndex((o) => (o.textContent || '').trim().toLowerCase() === ansText.toLowerCase());
        if (matchIdx !== -1) {
          correctIndex = matchIdx;
          correctAnswerHtml = optionsHtml[matchIdx];
        } else {
          correctAnswerHtml = sanitizeRichHtml(ansNode.innerHTML);
        }
      }
    }

    const expHtml = expNode ? sanitizeRichHtml(expNode.innerHTML.replace(/^(?:explanation|note|solution|ব্যাখ্যা)\s*[:\-]\s*/i, '')) : '';

    items.push(
      normalizeMcqItem(
        {
          id: num || idx + 1,
          questionHtml: qHtml,
          optionsHtml,
          correctIndex,
          correctAnswerHtml,
          explanationHtml: expHtml,
          noteHtml: expHtml,
          sourceFormat: 'html',
          detectedSourceType: 'Static HTML question cards',
          detectedVariableName: matchedSel,
          sourceFileName: fileName,
        },
        idx
      )
    );
  });

  return items.length > 0 ? items : null;
}

/**
 * Strategy 2: HTML Tables where each row has Question | Options | Answer | Explanation
 */
function tryExtractFromStructuredTables(doc, fileName = '') {
  const tables = Array.from(doc.querySelectorAll('table'));
  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) continue;

    const headerCells = Array.from(rows[0].querySelectorAll('th, td')).map((c) => (c.textContent || '').trim().toLowerCase());
    const qCol = headerCells.findIndex((h) => /question|stem|prompt|প্রশ্ন/.test(h));
    const optCol = headerCells.findIndex((h) => /option|choice|বিকল্প/.test(h));
    const ansCol = headerCells.findIndex((h) => /answer|correct|ans|উত্তর/.test(h));
    const expCol = headerCells.findIndex((h) => /exp|note|solution|ব্যাখ্যা/.test(h));

    if (qCol === -1) continue;

    const items = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = Array.from(rows[r].querySelectorAll('td, th'));
      if (cells.length <= qCol) continue;

      const { html: qHtml } = stripQuestionPrefixFromHtml(cells[qCol].innerHTML);
      let optionsHtml = [];

      if (optCol !== -1 && cells[optCol]) {
        const listItems = Array.from(cells[optCol].querySelectorAll('li, p, div'));
        if (listItems.length >= 2) {
          optionsHtml = listItems.map((li) => cleanAndCheckCorrectOptionHtml(li.innerHTML, li).html).filter(Boolean);
        } else {
          const splitLines = cells[optCol].innerHTML.split(/<br\s*\/?>|\n/i);
          optionsHtml = splitLines.map((l) => cleanAndCheckCorrectOptionHtml(l).html).filter(Boolean);
        }
      } else {
        // Check if columns Option A / B / C / D exist
        ['a', 'b', 'c', 'd', '1', '2', '3', '4'].forEach((k) => {
          const idx = headerCells.findIndex((h) => new RegExp(`(?:opt(?:ion)?\\s*)?${k}$`, 'i').test(h));
          if (idx !== -1 && cells[idx]) {
            const h = cleanAndCheckCorrectOptionHtml(cells[idx].innerHTML, cells[idx]).html;
            if (h) optionsHtml.push(h);
          }
        });
      }

      if (!qHtml && optionsHtml.length === 0) continue;

      const ansRaw = ansCol !== -1 && cells[ansCol] ? (cells[ansCol].textContent || '').trim() : '';
      const expHtml = expCol !== -1 && cells[expCol] ? sanitizeRichHtml(cells[expCol].innerHTML) : '';

      let correctIndex = -1;
      let correctAnswer = '';
      if (ansRaw) {
        const lm = ansRaw.match(/^\(?([a-hA-Hক-জ1-8])\)?[\.\)]?$/);
        if (lm && LABEL_MAP[lm[1].toLowerCase()] !== undefined) {
          correctIndex = LABEL_MAP[lm[1].toLowerCase()];
        } else {
          correctAnswer = ansRaw;
        }
      }

      items.push(
        normalizeMcqItem(
          {
            id: items.length + 1,
            questionHtml: qHtml,
            optionsHtml,
            correctIndex,
            correctAnswer,
            explanationHtml: expHtml,
            noteHtml: expHtml,
            sourceFormat: 'html',
            detectedSourceType: 'HTML Table MCQ structure',
            detectedVariableName: '<table>',
            sourceFileName: fileName,
          },
          items.length
        )
      );
    }

    if (items.length > 0) return items;
  }
  return null;
}

/**
 * Strategy 3: Nested <ol>/<ul> lists OR generic flow elements (<div>, <p>, <pre>, <table>, <img>)
 * preserving HTML inside each extracted block.
 */
function extractFromRichFlow(root, preserveCss, fileName = '') {
  if (!preserveCss) {
    root.querySelectorAll('[style]').forEach((el) => {
      if (!isGreenHighlightOrCorrect(el)) el.removeAttribute('style');
    });
  }

  // First check top-level <ol> whose direct <li> children contain nested <ol>/<ul> options
  const topOls = Array.from(root.querySelectorAll('ol'));
  for (const ol of topOls) {
    const directLis = Array.from(ol.children).filter((c) => c.tagName === 'LI');
    if (directLis.length >= 1 && directLis.some((li) => li.querySelector('ol, ul'))) {
      const listItems = [];
      directLis.forEach((li, idx) => {
        const clone = li.cloneNode(true);
        const nestedList = clone.querySelector('ol, ul');
        const optionsHtml = [];
        let correctIndex = -1;
        if (nestedList) {
          Array.from(nestedList.children)
            .filter((c) => c.tagName === 'LI')
            .forEach((optLi) => {
              const { html, flaggedCorrect } = cleanAndCheckCorrectOptionHtml(optLi.innerHTML, optLi);
              if (html) {
                if (flaggedCorrect && correctIndex === -1) correctIndex = optionsHtml.length;
                optionsHtml.push(html);
              }
            });
          nestedList.remove();
        }
        const expNode = clone.querySelector('.explanation, .note');
        let expHtml = '';
        if (expNode) {
          expHtml = sanitizeRichHtml(expNode.innerHTML);
          expNode.remove();
        }
        const { num, html: qHtml } = stripQuestionPrefixFromHtml(clone.innerHTML);
        if (qHtml || optionsHtml.length > 0) {
          listItems.push(
            normalizeMcqItem(
              {
                id: num || idx + 1,
                questionHtml: qHtml,
                optionsHtml,
                correctIndex,
                explanationHtml: expHtml,
                noteHtml: expHtml,
                sourceFormat: 'html',
                detectedSourceType: 'HTML Nested List MCQs',
                detectedVariableName: '<ol>/<ul>',
                sourceFileName: fileName,
              },
              idx
            )
          );
        }
      });
      if (listItems.length > 0) return listItems;
    }
  }

  // Otherwise collect flat flow blocks preserving <pre>, <table>, <ul>, <ol>, <img>, math, etc.
  const blockNodes = [];
  const collect = (parent) => {
    Array.from(parent.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        const txt = (node.nodeValue || '').trim();
        if (txt) blockNodes.push({ html: txt, text: txt, el: null });
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toUpperCase();
      if (['PRE', 'TABLE', 'BLOCKQUOTE', 'FIGURE', 'MATH', 'IMG'].includes(tag)) {
        blockNodes.push({ html: node.outerHTML, text: node.textContent || '', el: node });
        return;
      }
      if (['UL', 'OL'].includes(tag)) {
        const lis = Array.from(node.children).filter((c) => c.tagName === 'LI');
        if (lis.length > 0 && lis.every((li) => !li.querySelector('ol, ul'))) {
          lis.forEach((li) => {
            blockNodes.push({ html: li.innerHTML, text: li.textContent || '', el: li, fromList: true });
          });
          return;
        }
      }
      if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(tag)) {
        if (node.querySelector('br') && !node.querySelector('pre, table, math')) {
          const parts = node.innerHTML.split(/<br\s*\/?>/i);
          parts.forEach((partHtml) => {
            const tmp = node.ownerDocument.createElement('div');
            tmp.innerHTML = partHtml;
            const txt = (tmp.textContent || '').trim();
            if (txt || tmp.querySelector('img, math')) {
              blockNodes.push({ html: partHtml.trim(), text: txt, el: node });
            }
          });
        } else {
          blockNodes.push({ html: node.innerHTML.trim(), text: (node.textContent || '').trim(), el: node });
        }
        return;
      }
      const hasBlockChildren = Array.from(node.children).some((c) =>
        ['DIV', 'SECTION', 'ARTICLE', 'P', 'UL', 'OL', 'TABLE', 'PRE', 'H1', 'H2', 'H3', 'H4'].includes(c.tagName.toUpperCase())
      );
      if (hasBlockChildren) {
        collect(node);
      } else if ((node.textContent || '').trim() || node.querySelector('img, math')) {
        blockNodes.push({ html: node.innerHTML.trim(), text: (node.textContent || '').trim(), el: node });
      }
    });
  };
  collect(root);

  // Build questions from rich blockNodes
  const items = [];
  let current = null;
  let state = 'idle';

  const flushCurrent = () => {
    if (!current) return;
    if (current.questionParts.length === 0 && current.optionsHtml.length === 0) {
      current = null;
      return;
    }
    const qHtml = sanitizeRichHtml(current.questionParts.join('<br>'));
    const expHtml = sanitizeRichHtml(current.expParts.join('<br>'));
    items.push(
      normalizeMcqItem(
        {
          id: current.id || items.length + 1,
          questionHtml: qHtml,
          optionsHtml: current.optionsHtml,
          correctIndex: current.correctIndex,
          correctAnswer: current.correctAnswerRaw,
          explanationHtml: expHtml,
          noteHtml: expHtml,
          sourceFormat: 'html',
          detectedSourceType: 'HTML Document Flow',
          detectedVariableName: 'DOM Flow',
          sourceFileName: fileName,
        },
        items.length
      )
    );
    current = null;
  };

  for (const blk of blockNodes) {
    const txt = (blk.text || '').trim();
    const isCodeOrTable = blk.el && ['PRE', 'TABLE', 'IMG', 'MATH', 'FIGURE'].includes(blk.el.tagName.toUpperCase());

    if (!isCodeOrTable && txt) {
      const qMatch = txt.match(/^(?:Q(?:uestion)?\s*\.?\s*|প্রশ্ন\s*\.?\s*)?(?:\(?([0-9০-৯]{1,4})\)?[\.\):])\s+([\s\S]+)$/i);
      if (qMatch) {
        const numVal = parseInt(normalizeDigits(qMatch[1]), 10);
        if (!(current && numVal === 1 && current.optionsHtml.length === 0 && state === 'question')) {
          flushCurrent();
          const stripped = stripQuestionPrefixFromHtml(blk.html);
          current = {
            id: stripped.num || numVal,
            questionParts: [stripped.html || blk.html],
            optionsHtml: [],
            correctIndex: -1,
            correctAnswerRaw: '',
            expParts: [],
          };
          state = 'question';
          continue;
        }
      }

      const expMatch = txt.match(/^(?:Explanation|Solution|Details|Note|ব্যাখ্যা|নোট|সমাধান)\s*[:\-–—]\s*([\s\S]*)$/i);
      if (expMatch && current) {
        state = 'explanation';
        const cleanedExp = blk.html.replace(/^(?:<[^>]+>\s*)*(?:Explanation|Solution|Details|Note|ব্যাখ্যা|নোট|সমাধান)\s*[:\-–—]\s*(?:<\/[^>]+>\s*)*/i, '');
        if (cleanedExp.trim()) current.expParts.push(cleanedExp.trim());
        continue;
      }

      const ansMatch = txt.match(/^(?:Correct\s*Answer|Right\s*Answer|Correct|Answer|Ans|সঠিক\s*উত্তর|উত্তর|সঠিক)\s*[:\-–—=]\s*(.*)$/i);
      if (ansMatch && current) {
        const rawAns = ansMatch[1].trim();
        const lm = rawAns.match(/^\(?([a-hA-Hক-জ1-8])\)?[\.\)]?$/);
        if (lm && LABEL_MAP[lm[1].toLowerCase()] !== undefined) {
          current.correctIndex = LABEL_MAP[lm[1].toLowerCase()];
        } else {
          const prefixM = rawAns.match(/^\(?([a-hA-Hক-জ1-8])\)?[\.\)]\s+(.+)$/);
          if (prefixM && LABEL_MAP[prefixM[1].toLowerCase()] !== undefined) {
            current.correctIndex = LABEL_MAP[prefixM[1].toLowerCase()];
          } else {
            current.correctAnswerRaw = rawAns;
          }
        }
        state = 'explanation';
        continue;
      }

      const optMatch = txt.match(/^(?:\(([a-hA-Hক-জ1-8])\)|\[([a-hA-Hক-জ1-8])\]|([a-hA-Hক-জ1-8])[\.\):])\s*(.+)$/);
      if (optMatch && current && (state === 'question' || state === 'option')) {
        state = 'option';
        const { html, flaggedCorrect } = cleanAndCheckCorrectOptionHtml(blk.html, blk.el);
        if (flaggedCorrect && current.correctIndex === -1) {
          current.correctIndex = current.optionsHtml.length;
        }
        current.optionsHtml.push(html);
        continue;
      }

      if (blk.fromList && current && (state === 'question' || state === 'option')) {
        state = 'option';
        const { html, flaggedCorrect } = cleanAndCheckCorrectOptionHtml(blk.html, blk.el);
        if (flaggedCorrect && current.correctIndex === -1) {
          current.correctIndex = current.optionsHtml.length;
        }
        current.optionsHtml.push(html);
        continue;
      }
    }

    if (current) {
      if (state === 'question') {
        current.questionParts.push(sanitizeRichHtml(blk.html));
      } else if (state === 'option' && current.optionsHtml.length > 0 && !isCodeOrTable) {
        current.optionsHtml[current.optionsHtml.length - 1] += `<br>${sanitizeRichHtml(blk.html)}`;
      } else if (state === 'explanation') {
        current.expParts.push(sanitizeRichHtml(blk.html));
      } else if (isCodeOrTable) {
        current.questionParts.push(sanitizeRichHtml(blk.html));
      }
    }
  }
  flushCurrent();

  return items;
}

/**
 * Parses an HTML string (or full HTML document) into rich v2 MCQs.
 * Inspects embedded JavaScript (<script>) and JSON/JSON-LD blocks FIRST before
 * falling back to data-* attributes, semantic HTML cards, tables, and rich flow.
 */
export function parseHtmlMcqs(rawHtml, options = {}) {
  const { preserveCss = true, fileName = '' } = options;
  if (!rawHtml || typeof rawHtml !== 'string') {
    return { items: [], warnings: ['No HTML input provided.'] };
  }

  // STEP 1: Inspect <script> elements BEFORE stripping scripts or requiring DOMParser!
  const scriptRes = extractMcqsFromHtmlScripts(rawHtml, fileName);
  if (scriptRes.items.length > 0) {
    return {
      items: scriptRes.items,
      warnings: scriptRes.warnings,
      detectedSourceType: scriptRes.detectedSourceType || 'JavaScript-embedded MCQ array',
      detectedVariableName: scriptRes.detectedVariableName || '',
      rawDetectedCount: scriptRes.rawDetectedCount || scriptRes.items.length,
    };
  }

  // STEP 2: Check for data-question / data-mcq attribute MCQs
  const dataAttrItems = extractDataAttributeMcqsFromRawHtml(rawHtml, fileName);
  if (dataAttrItems.length > 0) {
    return {
      items: dataAttrItems,
      warnings: [],
      detectedSourceType: 'HTML data-* attributes',
      detectedVariableName: 'data-question',
      rawDetectedCount: dataAttrItems.length,
    };
  }

  // STEP 3: If DOMParser is unavailable (e.g. Node.js without DOM), strip scripts/styles and parse via text/HTML flow fallback
  if (typeof globalThis.DOMParser !== 'function') {
    const cleanedHtml = rawHtml
      .replace(/<(script|style|noscript|nav|header|footer|aside)\b[\s\S]*?<\/\1\s*>/gi, '\n')
      .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6])\b[^>]*>/gi, '\n');
    const plainFallback = parsePlainTextMcqs(decodeHtmlEntities(cleanedHtml.replace(/<[^>]+>/g, '')));
    if (plainFallback.items && plainFallback.items.length > 0) {
      return {
        items: plainFallback.items,
        warnings: plainFallback.warnings || [],
        detectedSourceType: 'Static HTML flow',
        detectedVariableName: 'HTML body',
        rawDetectedCount: plainFallback.items.length,
      };
    }

    const warnings = [];
    if (scriptRes.externalScripts.length > 0) {
      warnings.push(
        `This HTML file references external JavaScript file(s) (${scriptRes.externalScripts.join(', ')}) and contains no inline questions. Please also upload the referenced .js file.`
      );
    } else {
      warnings.push('Could not find recognizable MCQ structures in the HTML document.');
    }
    return { items: [], warnings };
  }

  // STEP 4: Full Browser DOMParser pipeline for static HTML cards, tables, lists, and flow
  const parser = new globalThis.DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Extract CSS class styles & Math TeX BEFORE stripping chrome/scripts
  const classRules = preserveCss ? extractStyleClassRules(doc) : new Map();
  recoverMathSourceNodes(doc);

  // Remove chrome, scripts, ads, styles
  doc.querySelectorAll(CHROME_SELECTORS).forEach((el) => el.remove());
  doc.querySelectorAll('style').forEach((el) => el.remove());

  if (preserveCss) {
    applyClassStylesInline(doc.body, classRules);
  }

  // Try structural strategies from highest fidelity to flow fallback
  let items = tryExtractFromSemanticCards(doc, preserveCss, fileName);
  let detectedSourceType = 'Static HTML question cards';
  let detectedVariableName = '.question-card';

  if (!items || items.length === 0) {
    items = tryExtractFromStructuredTables(doc, fileName);
    detectedSourceType = 'HTML Table MCQ structure';
    detectedVariableName = '<table>';
  }
  if (!items || items.length === 0) {
    items = extractFromRichFlow(doc.body, preserveCss, fileName);
    detectedSourceType = items?.[0]?.detectedSourceType || 'HTML Document Flow';
    detectedVariableName = items?.[0]?.detectedVariableName || 'DOM Flow';
  }

  const warnings = [];
  if (!items || items.length === 0) {
    if (scriptRes.externalScripts.length > 0) {
      warnings.push(
        `This HTML file references external JavaScript file(s) (${scriptRes.externalScripts.join(', ')}) and contains no inline questions. Please upload the referenced .js file alongside the HTML file.`
      );
    } else {
      warnings.push(
        'Could not find recognizable MCQ structures in the HTML. Checked inline <script> arrays, JSON-LD, data-* attributes, question cards, tables, and lists.'
      );
    }
  }

  return {
    items: items || [],
    warnings,
    detectedSourceType: items && items.length > 0 ? detectedSourceType : 'Unrecognized HTML',
    detectedVariableName: items && items.length > 0 ? detectedVariableName : '',
    rawDetectedCount: items ? items.length : 0,
  };
}

