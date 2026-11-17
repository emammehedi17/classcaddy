/**
 * Class Caddy MCQ Engine — DOM & Style-Aware HTML Parser
 *
 * Extracts MCQs from pasted HTML or uploaded .html/.htm documents while:
 * 1. Extracting <script type="math/tex"> & KaTeX LaTeX annotations BEFORE
 *    stripping scripts and chrome (nav, header, footer, aside, ads).
 * 2. Preserving meaningful inline & CSS-class styling (bold, italic, underline,
 *    strikethrough, color, background-color, sup/sub, lists, tables, pre/code,
 *    MathML, images with alt/dimensions).
 * 3. Detecting visual correct-answer clues (.correct, .right-answer, green fill,
 *    bolded option cues, checkmarks).
 * 4. Supporting semantic MCQ cards, tables, nested <ol>/<ul> lists, and HTML flow,
 *    falling back cleanly through sanitizeRichHtml().
 */

import { normalizeMcqItem } from '../schema.js';
import { sanitizeRichHtml } from '../renderer.js';

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

  // If still contains a trailing green checkmark span
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
 * Strategy 1: Semantic MCQ containers (.question-card, .mcq-item, .quiz-question, etc.)
 */
function tryExtractFromSemanticCards(doc, preserveCss) {
  const selectors = [
    '[data-mcq]',
    '[data-question]',
    '.mcq-item',
    '.mcq-card',
    '.question-card',
    '.question-block',
    '.quiz-question',
    '.exam-question',
  ];
  let cards = [];
  for (const sel of selectors) {
    const found = Array.from(doc.querySelectorAll(sel));
    if (found.length > 0) {
      cards = found;
      break;
    }
  }
  if (cards.length === 0) return null;

  const items = [];
  cards.forEach((card, idx) => {
    const clone = card.cloneNode(true);
    if (!preserveCss) clone.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));

    const qNode = clone.querySelector('.question-text, .stem, .q-text, .prompt, h3, h4, p');
    const optNodes = Array.from(clone.querySelectorAll('.option, .choice, .mcq-option, li'));
    const expNode = clone.querySelector('.explanation, .rationale, .note, .solution');
    const ansNode = clone.querySelector('.answer, .correct-answer');

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
      const ansText = (ansNode.textContent || '').replace(/^(?:correct\s*answer|answer|ans|উত্তর)\s*[:\-]\s*/i, '').trim();
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

    const expHtml = expNode ? sanitizeRichHtml(expNode.innerHTML.replace(/^(?:explanation|note|ব্যাখ্যা)\s*[:\-]\s*/i, '')) : '';

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
function tryExtractFromStructuredTables(doc) {
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
 * preserving HTML inside each extracted block!
 */
function extractFromRichFlow(root, preserveCss) {
  if (!preserveCss) {
    root.querySelectorAll('[style]').forEach((el) => {
      // Preserve green background/color on options for answer detection only if needed;
      // otherwise strip presentation clutter
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
          // Could be options list or unlabelled items
          lis.forEach((li) => {
            blockNodes.push({ html: li.innerHTML, text: li.textContent || '', el: li, fromList: true });
          });
          return;
        }
      }
      if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(tag)) {
        // Split on <br> if multiple lines inside single <p>
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
      // Recurse into generic wrapper <div> / <section> / <article> / <main>
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
  let state = 'idle'; // 'question' | 'option' | 'explanation'

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
      // Check Question start
      const qMatch = txt.match(/^(?:Q(?:uestion)?\s*\.?\s*|প্রশ্ন\s*\.?\s*)?(?:\(?([0-9০-৯]{1,4})\)?[\.\):])\s+([\s\S]+)$/i);
      if (qMatch) {
        // Avoid mistaking numeric option "1." when already inside an active question with 0 options
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

      // Explanation / Note
      const expMatch = txt.match(/^(?:Explanation|Solution|Details|Note|ব্যাখ্যা|নোট|সমাধান)\s*[:\-–—]\s*([\s\S]*)$/i);
      if (expMatch && current) {
        state = 'explanation';
        const cleanedExp = blk.html.replace(/^(?:<[^>]+>\s*)*(?:Explanation|Solution|Details|Note|ব্যাখ্যা|নোট|সমাধান)\s*[:\-–—]\s*(?:<\/[^>]+>\s*)*/i, '');
        if (cleanedExp.trim()) current.expParts.push(cleanedExp.trim());
        continue;
      }

      // Answer line
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

      // Option line
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

    // Continuation inside active question (e.g., <pre><code> block, <table>, <img>, paragraph 2 of stem)
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
 */
export function parseHtmlMcqs(rawHtml, options = {}) {
  const { preserveCss = true } = options;
  if (!rawHtml || typeof rawHtml !== 'string') {
    return { items: [], warnings: ['No HTML input provided.'] };
  }
  if (typeof globalThis.DOMParser !== 'function') {
    return { items: [], warnings: ['DOMParser is unavailable in this environment.'] };
  }

  const parser = new globalThis.DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // 1. Extract CSS class styles & Math TeX BEFORE stripping chrome/scripts
  const classRules = preserveCss ? extractStyleClassRules(doc) : new Map();
  recoverMathSourceNodes(doc);

  // 2. Remove chrome, scripts, ads, styles
  doc.querySelectorAll(CHROME_SELECTORS).forEach((el) => el.remove());
  doc.querySelectorAll('style').forEach((el) => el.remove());

  if (preserveCss) {
    applyClassStylesInline(doc.body, classRules);
  }

  // 3. Try structural strategies from highest fidelity to flow fallback
  let items = tryExtractFromSemanticCards(doc, preserveCss);
  if (!items || items.length === 0) {
    items = tryExtractFromStructuredTables(doc);
  }
  if (!items || items.length === 0) {
    items = extractFromRichFlow(doc.body, preserveCss);
  }

  return {
    items: items || [],
    warnings:
      !items || items.length === 0
        ? ['Could not find recognizable MCQ structures in the pasted HTML. Try checking your source or switching to Paste Text.']
        : [],
  };
}
