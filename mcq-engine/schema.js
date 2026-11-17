/**
 * Class Caddy MCQ Engine — Schema v2 & Backward Compatibility Layer
 * Preserves full compatibility with legacy plain-text Firestore MCQs while
 * enabling rich HTML, math (LaTeX/MathML), code blocks, images, tables,
 * explanations, tags, and extraction confidence metadata.
 */

export const FIRESTORE_ROW_WARN_BYTES = 240 * 1024;
export const FIRESTORE_DOC_HARD_LIMIT_BYTES = 950 * 1024;

const BENGALI_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ'];
const ENGLISH_LOWER_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function escapeHtmlBasic(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    });
}

/**
 * Converts HTML into readable plain text without destroying code/math spacing
 * or losing image alt tags.
 */
export function htmlToPlainText(input) {
  if (input === null || input === undefined) return '';
  const str = String(input);
  if (!str.includes('<') && !str.includes('&')) return str.trim();

  // Fast path if DOMParser is available (browser or JSDOM)
  if (typeof globalThis.DOMParser === 'function') {
    try {
      const doc = new globalThis.DOMParser().parseFromString(`<div>${str}</div>`, 'text/html');
      const root = doc.body.firstElementChild || doc.body;

      // Replace <br> with newline and block boundaries cleanly
      root.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
      root.querySelectorAll('img').forEach((img) => {
        const alt = img.getAttribute('alt') || 'Image';
        img.replaceWith(` [Image: ${alt}] `);
      });
      root.querySelectorAll('p, div, li, tr, blockquote, pre, h1, h2, h3, h4, h5, h6').forEach((el) => {
        if (el.tagName === 'LI') {
          el.prepend('• ');
        }
        if (el.tagName === 'TR') {
          const cells = Array.from(el.children);
          cells.forEach((cell, idx) => {
            if (idx > 0) cell.prepend(' | ');
          });
        }
        el.append('\n');
      });

      return (root.textContent || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch {
      // Fall through to regex fallback
    }
  }

  return decodeHtmlEntities(
    str
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6]|pre|blockquote)>/gi, '\n')
      .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, ' [Image: $1] ')
      .replace(/<img[^>]*>/gi, ' [Image] ')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function hasRichMarkup(str) {
  if (!str || typeof str !== 'string') return false;
  return /<(b|strong|i|em|u|s|del|ins|mark|sup|sub|span|p|div|br|ul|ol|li|table|tr|td|th|pre|code|blockquote|img|math|a|h[1-6])\b[^>]*>/i.test(str);
}

export function hasLatexSyntax(str) {
  if (!str || typeof str !== 'string') return false;
  return (
    /\$\$[\s\S]+?\$\$/.test(str) ||
    /\\\[[\s\S]+?\\\]/.test(str) ||
    /\\\([\s\S]+?\\\)/.test(str) ||
    /(^|[^\\$])\$(?!\s*\d[\d,.]*(?:\s|$))([^$\n]{1,300}?[^\\\s])\$(?!\d)/.test(str)
  );
}

export function hasCodeSyntax(str) {
  if (!str || typeof str !== 'string') return false;
  return /```[\s\S]*?```/.test(str) || /<(pre|code)\b/i.test(str);
}

export function hasMediaMarkup(str) {
  if (!str || typeof str !== 'string') return false;
  return /<img\b/i.test(str);
}

export function detectRichFlags(item) {
  const fields = [
    item?.questionHtml,
    item?.question,
    ...(Array.isArray(item?.optionsHtml) ? item.optionsHtml : []),
    ...(Array.isArray(item?.options) ? item.options : []),
    item?.explanationHtml,
    item?.explanation,
    item?.noteHtml,
    item?.note,
  ].filter(Boolean);

  const combined = fields.join('\n');
  return {
    hasMath: Boolean(item?.hasMath) || /<math\b/i.test(combined) || hasLatexSyntax(combined),
    hasCode: Boolean(item?.hasCode) || hasCodeSyntax(combined),
    hasMedia: Boolean(item?.hasMedia) || hasMediaMarkup(combined),
  };
}

export function getOptionPrefixLabel(index, sampleText = '') {
  const isBangla = /[\u0980-\u09FF]/.test(String(sampleText || ''));
  if (isBangla) {
    return BENGALI_LABELS[index] || String(index + 1);
  }
  return ENGLISH_LOWER_LABELS[index] || String(index + 1);
}

export function normalizeCompareText(str) {
  const plain = hasRichMarkup(str) ? htmlToPlainText(str) : String(str || '');
  return plain
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function computeFingerprint(item) {
  const qNorm = normalizeCompareText(item?.questionHtml || item?.question || item?.questionText || '');
  const opts = Array.isArray(item?.optionsHtml) && item.optionsHtml.some(Boolean)
    ? item.optionsHtml
    : (Array.isArray(item?.options) ? item.options : []);
  const oNorm = opts.map((o) => normalizeCompareText(o)).filter(Boolean).join('||');
  return `${qNorm}::${oNorm}`;
}

function makeUid(seed = '') {
  const cleanSeed = String(seed || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8);
  const rand = Math.random().toString(36).slice(2, 8);
  return `mcq_${cleanSeed ? cleanSeed + '_' : ''}${Date.now().toString(36)}_${rand}`;
}

/**
 * Resolves the canonical 0-based index of the correct answer from either
 * `correctIndex`, `correctAnswerHtml`, or `correctAnswer`.
 */
export function getCanonicalCorrectIndex(rawItem) {
  if (!rawItem) return -1;
  const optionsPlain = Array.isArray(rawItem.options)
    ? rawItem.options.map((o) => (hasRichMarkup(o) ? htmlToPlainText(o) : String(o ?? '').trim()))
    : [];
  const optionsHtml = Array.isArray(rawItem.optionsHtml)
    ? rawItem.optionsHtml
    : optionsPlain;

  if (
    typeof rawItem.correctIndex === 'number' &&
    Number.isInteger(rawItem.correctIndex) &&
    rawItem.correctIndex >= 0 &&
    rawItem.correctIndex < Math.max(optionsPlain.length, optionsHtml.length)
  ) {
    return rawItem.correctIndex;
  }

  const targetHtml = rawItem.correctAnswerHtml ? String(rawItem.correctAnswerHtml).trim() : '';
  const targetPlain = rawItem.correctAnswer !== undefined && rawItem.correctAnswer !== null
    ? String(rawItem.correctAnswer).trim()
    : '';

  if (targetHtml) {
    const exactHtmlIdx = optionsHtml.findIndex((o) => String(o || '').trim() === targetHtml);
    if (exactHtmlIdx !== -1) return exactHtmlIdx;
  }

  if (targetPlain) {
    // 1. Exact string match on plain options
    const exactIdx = optionsPlain.findIndex((o) => o === targetPlain);
    if (exactIdx !== -1) return exactIdx;

    // 2. Normalized comparison (handles whitespace / minor HTML entity differences)
    const normTarget = normalizeCompareText(targetPlain);
    if (normTarget) {
      const normIdx = optionsPlain.findIndex((o) => normalizeCompareText(o) === normTarget);
      if (normIdx !== -1) return normIdx;
    }

    // 3. Single label fallback ('a', 'b', 'c', 'd', 'ক', 'খ', 'গ', 'ঘ', '1'-'4')
    const letterOnly = targetPlain.match(/^\(?([a-hA-Hক-জ1-8])\)?[\.\)]?$/);
    if (letterOnly) {
      const ch = letterOnly[1].toLowerCase();
      const map = {
        a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7,
        'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3, 'ঙ': 4, 'চ': 5, 'ছ': 6, 'জ': 7,
        '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7,
      };
      if (map[ch] !== undefined && map[ch] < optionsPlain.length) {
        return map[ch];
      }
    }
  }

  return -1;
}

/**
 * Checks whether an option index / option string is the correct answer for an MCQ.
 */
export function isOptionCorrect(mcq, optionIdx, optionValue = null) {
  if (!mcq) return false;
  const canonicalIdx = getCanonicalCorrectIndex(mcq);
  if (canonicalIdx !== -1 && typeof optionIdx === 'number' && optionIdx >= 0) {
    return optionIdx === canonicalIdx;
  }
  if (optionValue !== null && optionValue !== undefined) {
    const normOpt = normalizeCompareText(optionValue);
    const normAns = normalizeCompareText(mcq.correctAnswerHtml || mcq.correctAnswer || '');
    return Boolean(normOpt && normAns && normOpt === normAns);
  }
  return false;
}

/**
 * Unified grading helper for both Classic Quiz and New Examination Module.
 */
export function isUserSelectionCorrect(mcq, userAnswer, userIndex = null) {
  if (!mcq) return false;
  if (typeof userIndex === 'number' && userIndex >= 0) {
    const canonicalIdx = getCanonicalCorrectIndex(mcq);
    if (canonicalIdx !== -1) {
      return userIndex === canonicalIdx;
    }
  }
  if (userAnswer === null || userAnswer === undefined || userAnswer === '') return false;
  const normUser = normalizeCompareText(userAnswer);
  const normAns = normalizeCompareText(mcq.correctAnswerHtml || mcq.correctAnswer || '');
  return Boolean(normUser && normAns && normUser === normAns);
}

/**
 * Normalizes any legacy or v2 MCQ object into a complete v2 structure.
 * Keeps `question`, `options`, `correctAnswer`, `note`, `explanation` always
 * populated as strings/arrays for 100% legacy compatibility.
 */
export function normalizeMcqItem(raw, fallbackIdx = 0) {
  const item = raw && typeof raw === 'object' ? raw : {};

  // Question
  const rawQuestionHtml = typeof item.questionHtml === 'string' && item.questionHtml.trim()
    ? item.questionHtml.trim()
    : (typeof item.question === 'string' && hasRichMarkup(item.question) ? item.question.trim() : '');
  const rawQuestionText = typeof item.questionText === 'string' && item.questionText.trim()
    ? item.questionText.trim()
    : (typeof item.question === 'string'
        ? (hasRichMarkup(item.question) ? htmlToPlainText(item.question) : item.question.trim())
        : '');
  const questionPlain = rawQuestionText || htmlToPlainText(rawQuestionHtml);
  const questionHtml = rawQuestionHtml || (questionPlain ? escapeHtmlBasic(questionPlain).replace(/\n/g, '<br>') : '');

  // Options
  const sourceOptions = Array.isArray(item.options) ? item.options : [];
  const sourceOptionsHtml = Array.isArray(item.optionsHtml) ? item.optionsHtml : [];
  const sourceOptionsText = Array.isArray(item.optionsText) ? item.optionsText : [];
  const maxLen = Math.max(sourceOptions.length, sourceOptionsHtml.length, sourceOptionsText.length);

  const optionsPlain = [];
  const optionsHtml = [];
  for (let i = 0; i < maxLen; i++) {
    const rawOpt = sourceOptions[i];
    const rawOptHtml = typeof sourceOptionsHtml[i] === 'string' ? sourceOptionsHtml[i].trim() : '';
    const rawOptText = typeof sourceOptionsText[i] === 'string' ? sourceOptionsText[i].trim() : '';

    let plain = rawOptText;
    if (!plain && rawOpt !== undefined && rawOpt !== null) {
      plain = hasRichMarkup(String(rawOpt)) ? htmlToPlainText(String(rawOpt)) : String(rawOpt).trim();
    }
    if (!plain && rawOptHtml) {
      plain = htmlToPlainText(rawOptHtml);
    }

    const html = rawOptHtml ||
      (typeof rawOpt === 'string' && hasRichMarkup(rawOpt) ? rawOpt.trim() : escapeHtmlBasic(plain).replace(/\n/g, '<br>'));

    if (plain || html) {
      optionsPlain.push(plain || htmlToPlainText(html));
      optionsHtml.push(html);
    }
  }

  // Note & Explanation
  const rawExp = item.explanationHtml || item.explanation || item.noteHtml || item.note || '';
  const rawNote = item.noteHtml || item.note || item.explanationHtml || item.explanation || '';

  const explanationHtml = typeof item.explanationHtml === 'string' && item.explanationHtml.trim()
    ? item.explanationHtml.trim()
    : (hasRichMarkup(rawExp) ? String(rawExp).trim() : (rawExp ? escapeHtmlBasic(String(rawExp).trim()).replace(/\n/g, '<br>') : ''));
  const explanationPlain = typeof item.explanationText === 'string' && item.explanationText.trim()
    ? item.explanationText.trim()
    : (rawExp ? htmlToPlainText(rawExp) : '');

  const noteHtml = typeof item.noteHtml === 'string' && item.noteHtml.trim()
    ? item.noteHtml.trim()
    : (hasRichMarkup(rawNote) ? String(rawNote).trim() : (rawNote ? escapeHtmlBasic(String(rawNote).trim()).replace(/\n/g, '<br>') : ''));
  const notePlain = typeof item.noteText === 'string' && item.noteText.trim()
    ? item.noteText.trim()
    : (rawNote ? htmlToPlainText(rawNote) : '');

  // Correct index & answer resolution
  const probe = {
    options: optionsPlain,
    optionsHtml,
    correctIndex: item.correctIndex,
    correctAnswer: item.correctAnswer,
    correctAnswerHtml: item.correctAnswerHtml,
  };
  const correctIndex = getCanonicalCorrectIndex(probe);
  const correctAnswer = correctIndex !== -1
    ? optionsPlain[correctIndex]
    : (item.correctAnswer ? htmlToPlainText(String(item.correctAnswer)) : '');
  const correctAnswerHtml = correctIndex !== -1
    ? optionsHtml[correctIndex]
    : (item.correctAnswerHtml || (correctAnswer ? escapeHtmlBasic(correctAnswer).replace(/\n/g, '<br>') : ''));

  const warnings = Array.isArray(item.warnings) ? [...item.warnings] : [];
  if (!questionPlain && !hasMediaMarkup(questionHtml)) {
    if (!warnings.includes('Empty question stem')) warnings.push('Empty question stem');
  }
  if (optionsPlain.length < 2) {
    if (!warnings.includes('Fewer than 2 options extracted')) warnings.push('Fewer than 2 options extracted');
  }
  if (correctIndex === -1 && !correctAnswer) {
    if (!warnings.includes('Correct answer not identified')) warnings.push('Correct answer not identified');
  }

  let confidence = item.confidence;
  let confidenceScore = typeof item.confidenceScore === 'number' ? item.confidenceScore : null;
  if (!confidence) {
    if (warnings.length === 0 && optionsPlain.length >= 2 && (correctIndex !== -1 || correctAnswer)) {
      confidence = 'high';
      confidenceScore = 0.95;
    } else if (questionPlain && optionsPlain.length >= 2) {
      confidence = 'medium';
      confidenceScore = 0.72;
    } else {
      confidence = 'manual';
      confidenceScore = 0.35;
    }
  }
  if (confidenceScore === null) {
    confidenceScore = confidence === 'high' ? 0.95 : confidence === 'medium' ? 0.72 : confidence === 'low' ? 0.5 : 0.3;
  }

  const normalized = {
    version: 2,
    id: item.id !== undefined ? item.id : fallbackIdx + 1,
    uid: item.uid || makeUid(questionPlain),
    question: questionPlain,
    questionText: questionPlain,
    questionHtml,
    options: optionsPlain,
    optionsText: optionsPlain,
    optionsHtml,
    correctIndex,
    correctAnswer,
    correctAnswerHtml,
    explanation: explanationPlain,
    explanationText: explanationPlain,
    explanationHtml,
    note: notePlain,
    noteText: notePlain,
    noteHtml,
    tags: Array.isArray(item.tags) ? item.tags.filter(Boolean).map(String) : [],
    sourceFormat: item.sourceFormat || 'legacy',
    confidence,
    confidenceScore,
    warnings,
    ...detectRichFlags({
      questionHtml,
      question: questionPlain,
      optionsHtml,
      options: optionsPlain,
      explanationHtml,
      noteHtml,
      hasMath: item.hasMath,
      hasCode: item.hasCode,
      hasMedia: item.hasMedia,
    }),
  };

  normalized.fingerprint = item.fingerprint || computeFingerprint(normalized);
  if (item.userAnswer !== undefined) normalized.userAnswer = item.userAnswer;
  if (item.userAnswerIndex !== undefined) normalized.userAnswerIndex = item.userAnswerIndex;
  if (item.isCorrect !== undefined) normalized.isCorrect = item.isCorrect;
  return normalized;
}

export function normalizeMcqList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item, idx) => normalizeMcqItem(item, idx));
}

function isSimpleEscapedHtml(plain, html) {
  if (!html) return true;
  const expected = escapeHtmlBasic(plain).replace(/\n/g, '<br>');
  return html === expected || html === escapeHtmlBasic(plain);
}

/**
 * Compacts normalized v2 items for Firestore persistence.
 * Keeps documents lightweight (avoiding Firestore's 1 MB document limit)
 * while preserving rich HTML fields whenever rich content/math/code/images exist.
 */
export function toStorageMcqList(items) {
  if (!Array.isArray(items)) return [];
  return items.map((raw, idx) => {
    const n = normalizeMcqItem(raw, idx);
    const out = {
      version: 2,
      id: idx + 1,
      uid: n.uid,
      question: n.question,
      options: n.options,
      correctAnswer: n.correctAnswer,
      correctIndex: n.correctIndex,
      note: n.note || '',
      explanation: n.explanation || n.note || '',
    };

    if (n.questionHtml && !isSimpleEscapedHtml(n.question, n.questionHtml)) {
      out.questionHtml = n.questionHtml;
    }
    if (n.optionsHtml.some((h, i) => !isSimpleEscapedHtml(n.options[i] || '', h))) {
      out.optionsHtml = n.optionsHtml;
    }
    if (n.correctAnswerHtml && !isSimpleEscapedHtml(n.correctAnswer, n.correctAnswerHtml)) {
      out.correctAnswerHtml = n.correctAnswerHtml;
    }
    if (n.noteHtml && !isSimpleEscapedHtml(n.note, n.noteHtml)) {
      out.noteHtml = n.noteHtml;
    }
    if (n.explanationHtml && !isSimpleEscapedHtml(n.explanation, n.explanationHtml)) {
      out.explanationHtml = n.explanationHtml;
    }
    if (n.tags && n.tags.length > 0) out.tags = n.tags;
    if (n.sourceFormat && n.sourceFormat !== 'legacy') out.sourceFormat = n.sourceFormat;
    if (n.hasMath) out.hasMath = true;
    if (n.hasCode) out.hasCode = true;
    if (n.hasMedia) out.hasMedia = true;
    return out;
  });
}

export function estimateStorageBytes(data) {
  try {
    const json = JSON.stringify(data);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(json).length;
    }
    return json.length * 2;
  } catch {
    return 0;
  }
}
