/**
 * Class Caddy MCQ Engine — Plain Text Parser
 * Supports English, Bengali, Roman, and unnumbered MCQ formats, inline/block
 * options, multi-line code blocks/math, inline checkmarks/asterisks,
 * explanations/notes, non-question prose skipping, and end-of-doc answer keys.
 */

import { normalizeMcqItem, getOptionPrefixLabel } from '../schema.js';

const LABEL_TO_INDEX = {
  a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7,
  'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3, 'ঙ': 4, 'চ': 5, 'ছ': 6, 'জ': 7,
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7,
  '১': 0, '২': 1, '৩': 2, '৪': 3, '৫': 4, '৬': 5, '৭': 6, '৮': 7,
};

function normalizeDigits(str) {
  return String(str || '').replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
}

function romanToInt(roman) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  const s = String(roman || '').toUpperCase();
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]] || 0;
    const next = map[s[i + 1]] || 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

/**
 * Protects fenced code blocks (```...```) and display math ($$...$$, \[...\])
 * so question/option splitters never tear apart code or formulas.
 */
function protectSpecialBlocks(text) {
  const blocks = [];
  const hold = (raw) => {
    const token = `@@CC_TXTBLK_${blocks.length}@@`;
    blocks.push(raw);
    return token;
  };

  let protectedText = String(text || '').replace(/\r\n/g, '\n');
  protectedText = protectedText.replace(/```[\s\S]*?```/g, (m) => hold(m));
  protectedText = protectedText.replace(/\$\$[\s\S]+?\$\$/g, (m) => hold(m));
  protectedText = protectedText.replace(/\\\[[\s\S]+?\\\]/g, (m) => hold(m));

  const restore = (s) =>
    String(s || '').replace(/@@CC_TXTBLK_(\d+)@@/g, (_, idx) => blocks[Number(idx)] || '');

  return { protectedText, restore };
}

/**
 * Parses an End-of-Document Answer Key block into Map<questionNumber, letterOrText>.
 */
function extractEndAnswerKey(text) {
  const keySectionRegex =
    /(?:^|\n)[ \t]*(?:#+\s*)?(?:Answer\s*Keys?|Answers|উত্তরমালা|উত্তর\s*পত্র|সঠিক\s*উত্তর\s*(?:মালা|সমূহ)?)\s*[:\-–—]?\s*\n([\s\S]+)$/i;
  const match = text.match(keySectionRegex);
  if (!match) {
    return { bodyText: text, answerKeyMap: new Map() };
  }

  const keyBlock = match[1];
  const pairMatches = [...keyBlock.matchAll(/(?:^|[\s,;|])(?:\(?([0-9০-৯]{1,4})\)?)\s*[\.\-\):=>\s]+\s*\(?([a-hA-Hক-জ1-8])\)?(?=$|[\s,;|.\)])/gm)];
  if (pairMatches.length < 2) {
    // Not a dense answer key section; might be part of the last question
    return { bodyText: text, answerKeyMap: new Map() };
  }

  const answerKeyMap = new Map();
  pairMatches.forEach((m) => {
    const qNum = parseInt(normalizeDigits(m[1]), 10);
    const label = m[2].toLowerCase();
    if (Number.isFinite(qNum) && LABEL_TO_INDEX[label] !== undefined) {
      answerKeyMap.set(qNum, LABEL_TO_INDEX[label]);
    }
  });

  const bodyText = text.slice(0, match.index).trim();
  return { bodyText, answerKeyMap };
}

/**
 * Splits a single line if multiple options appear on the same line, e.g.:
 * "a) Dhaka   b) Chattogram   c) Rajshahi   d) Khulna"
 * "ক. ঢাকা  খ. খুলনা  গ. রাজশাহী  ঘ. সিলেট"
 */
function splitInlineOptionsOnLine(line) {
  const inlineRegex = /(?:^|\s{2,}|\t)(?:\(?([a-hA-Hক-জ1-8])[\.\)])\s+/g;
  const matches = [...line.matchAll(inlineRegex)];
  if (matches.length < 2) return null;

  // Verify labels look progressive (a..b or ক..খ or 1..2)
  const firstLabel = matches[0][1].toLowerCase();
  const secondLabel = matches[1][1].toLowerCase();
  if (LABEL_TO_INDEX[firstLabel] === undefined || LABEL_TO_INDEX[secondLabel] === undefined) return null;
  if (LABEL_TO_INDEX[secondLabel] <= LABEL_TO_INDEX[firstLabel]) return null;

  const extracted = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : line.length;
    const optVal = line.slice(start, end).trim();
    if (optVal) extracted.push(optVal);
  }
  return extracted.length >= 2 ? extracted : null;
}

const QUESTION_START_RE =
  /^\s*(?:(?:Q(?:uestion)?\s*\.?\s*)|(?:প্রশ্ন\s*\.?\s*))?(?:(?:\(?([0-9০-৯]{1,4})\)?[\.\):])|(?:\(([0-9০-৯]{1,4})\))|(?:([IVXL]{1,5})[\.\)]))\s+([\s\S]+)$/i;

const OPTION_LINE_RE =
  /^\s*(?:\(([a-hA-Hক-জ1-8])\)|\[([a-hA-Hক-জ1-8])\]|([a-hA-Hক-জ1-8])[\.\):])\s*(.*)$/;

const BULLET_OPTION_RE = /^\s*(?:[•▪◦‣–—\-]|\*(?!\*))\s+(.+)$/;

const ANS_LINE_RE =
  /^\s*(?:Correct\s*Answer|Right\s*Answer|Correct\s*Option|Correct|Answer|Ans|সঠিক\s*উত্তর|উত্তর|সঠিক)\s*[:\-–—=]\s*(.*)$/i;

const EXP_LINE_RE =
  /^\s*(?:Explanation|Solution|Details|Rationale|Hint|Note|ব্যাখ্যা|নোট|সমাধান)\s*[:\-–—]\s*(.*)$/i;

const INLINE_CORRECT_MARKER_RE = /\s*(?:[✓✔☑]|\[correct\]|\(correct\)|\(সঠিক\)|\*correct\*|\*)\s*$/i;

function isNoiseLine(line) {
  const t = line.trim();
  if (!t) return true;
  if (/^(?:page\s*\d+(?:\s*of\s*\d+)?|[-=_*]{4,}|section\s+[a-z0-9]+)$/i.test(t)) return true;
  return false;
}

/**
 * Splits normalized lines into raw question blocks. Handles numbered questions,
 * Q-prefixed questions, Roman numerals, AND unnumbered question blocks separated
 * by blank lines.
 */
function segmentQuestionBlocks(text) {
  const lines = text.split('\n');
  const numberedIndices = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(QUESTION_START_RE);
    if (m) {
      // Avoid mistaking numeric option "1. Option" right after an unnumbered stem if it's options 1..4
      const numVal = m[1] || m[2]
        ? parseInt(normalizeDigits(m[1] || m[2]), 10)
        : romanToInt(m[3]);
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      // If prev line is non-empty prose and next line also starts with "2.", this "1." is likely numeric options!
      if (numVal === 1 && prevLine && !ANS_LINE_RE.test(prevLine) && !EXP_LINE_RE.test(prevLine) && /^\s*2[\.\)]/.test(nextLine)) {
        continue;
      }
      numberedIndices.push(i);
    }
  }

  if (numberedIndices.length > 0) {
    const blocks = [];
    for (let k = 0; k < numberedIndices.length; k++) {
      const start = numberedIndices[k];
      const end = k + 1 < numberedIndices.length ? numberedIndices[k + 1] : lines.length;
      const chunk = lines.slice(start, end).join('\n').trim();
      if (chunk) blocks.push({ numbered: true, text: chunk });
    }
    const preamble = lines.slice(0, numberedIndices[0]).join('\n').trim();
    return {
      blocks,
      ignoredProseCount: preamble ? preamble.split(/\n\s*\n/).filter(Boolean).length : 0,
    };
  }

  // Unnumbered fallback: group paragraphs separated by blank lines that contain options or answers
  const paraGroups = text.split(/\n{2,}/).map((g) => g.trim()).filter(Boolean);
  const blocks = [];
  let ignoredProseCount = 0;
  paraGroups.forEach((group) => {
    const gLines = group.split('\n');
    const hasOpts =
      gLines.filter((l) => OPTION_LINE_RE.test(l) || BULLET_OPTION_RE.test(l)).length >= 2 ||
      gLines.some((l) => splitInlineOptionsOnLine(l) !== null);
    if (hasOpts) {
      blocks.push({ numbered: false, text: group });
    } else {
      ignoredProseCount++;
    }
  });

  return { blocks, ignoredProseCount };
}

function parseSingleBlock(blockObj, seqIdx, answerKeyMap, restore) {
  const rawLines = blockObj.text.split('\n');
  let explicitNumber = seqIdx + 1;

  const firstMatch = rawLines[0].match(QUESTION_START_RE);
  if (firstMatch) {
    if (firstMatch[1] || firstMatch[2]) {
      explicitNumber = parseInt(normalizeDigits(firstMatch[1] || firstMatch[2]), 10) || seqIdx + 1;
    } else if (firstMatch[3]) {
      explicitNumber = romanToInt(firstMatch[3]) || seqIdx + 1;
    }
    rawLines[0] = firstMatch[4];
  }

  const questionLines = [];
  const options = [];
  let inlineCorrectIdx = -1;
  let rawAnsString = '';
  const expLines = [];
  let state = 'question'; // 'question' | 'option' | 'answer' | 'explanation'

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (state === 'question' && questionLines.length > 0 && questionLines[questionLines.length - 1] !== '') {
        questionLines.push('');
      } else if (state === 'explanation' && expLines.length > 0) {
        expLines.push('');
      }
      continue;
    }

    if (isNoiseLine(trimmed)) continue;

    // Explanation / Note line
    const expMatch = trimmed.match(EXP_LINE_RE);
    if (expMatch) {
      state = 'explanation';
      if (expMatch[1].trim()) expLines.push(expMatch[1].trim());
      continue;
    }

    // Answer line
    const ansMatch = trimmed.match(ANS_LINE_RE);
    if (ansMatch) {
      state = 'answer';
      rawAnsString = ansMatch[1].trim();
      continue;
    }

    // Inline multi-option line (e.g., "a) X   b) Y   c) Z   d) W")
    if (state === 'question' || state === 'option') {
      const multiOpts = splitInlineOptionsOnLine(trimmed);
      if (multiOpts) {
        state = 'option';
        multiOpts.forEach((rawOpt) => {
          let cleaned = rawOpt;
          if (INLINE_CORRECT_MARKER_RE.test(cleaned)) {
            inlineCorrectIdx = options.length;
            cleaned = cleaned.replace(INLINE_CORRECT_MARKER_RE, '').trim();
          }
          options.push(cleaned);
        });
        continue;
      }
    }

    // Single option line
    const optMatch = trimmed.match(OPTION_LINE_RE);
    if (optMatch && (state === 'question' || state === 'option')) {
      state = 'option';
      let optText = (optMatch[4] || '').trim();
      if (INLINE_CORRECT_MARKER_RE.test(optText)) {
        inlineCorrectIdx = options.length;
        optText = optText.replace(INLINE_CORRECT_MARKER_RE, '').trim();
      }
      options.push(optText);
      continue;
    }

    // Bullet option line only if already collecting bullet options or stem ends with ?/:
    const bulletMatch = trimmed.match(BULLET_OPTION_RE);
    if (bulletMatch && (state === 'option' || (state === 'question' && questionLines.length > 0))) {
      state = 'option';
      let optText = bulletMatch[1].trim();
      if (INLINE_CORRECT_MARKER_RE.test(optText)) {
        inlineCorrectIdx = options.length;
        optText = optText.replace(INLINE_CORRECT_MARKER_RE, '').trim();
      }
      options.push(optText);
      continue;
    }

    // Continuation lines
    if (state === 'question') {
      questionLines.push(line);
    } else if (state === 'option' && options.length > 0) {
      options[options.length - 1] = `${options[options.length - 1]}\n${trimmed}`;
    } else if (state === 'explanation') {
      expLines.push(trimmed);
    } else if (state === 'answer') {
      // Sometimes explanation follows directly after answer line without prefix
      expLines.push(trimmed);
    }
  }

  const questionRestored = restore(questionLines.join('\n').trim());
  const optionsRestored = options.map((o) => restore(o.trim())).filter(Boolean);
  const expRestored = restore(expLines.join('\n').trim());
  const ansRestored = restore(rawAnsString);

  // Resolve correct answer index & string
  let correctIndex = -1;
  let correctAnswer = '';
  const warnings = [];

  if (ansRestored) {
    // Letter or letter+text like "b. Chattogram" or "(গ)"
    const prefixOnly = ansRestored.match(/^\(?([a-hA-Hক-জ1-8১-৮])\)?[\.\)]?$/);
    const prefixWithText = ansRestored.match(/^\(?([a-hA-Hক-জ1-8১-৮])\)?[\.\)]\s+([\s\S]+)$/);

    if (prefixOnly) {
      const idx = LABEL_TO_INDEX[prefixOnly[1].toLowerCase()];
      if (idx !== undefined && optionsRestored[idx] !== undefined) {
        correctIndex = idx;
        correctAnswer = optionsRestored[idx];
      } else {
        warnings.push(`Answer label "${prefixOnly[1]}" does not match available options`);
      }
    } else if (prefixWithText) {
      const idx = LABEL_TO_INDEX[prefixWithText[1].toLowerCase()];
      const statedText = prefixWithText[2].trim();
      if (idx !== undefined && optionsRestored[idx] !== undefined) {
        correctIndex = idx;
        correctAnswer = optionsRestored[idx];
      } else {
        const textIdx = optionsRestored.findIndex((o) => o.toLowerCase() === statedText.toLowerCase());
        correctIndex = textIdx;
        correctAnswer = textIdx !== -1 ? optionsRestored[textIdx] : statedText;
      }
    } else {
      const textIdx = optionsRestored.findIndex((o) => o.toLowerCase() === ansRestored.toLowerCase());
      if (textIdx !== -1) {
        correctIndex = textIdx;
        correctAnswer = optionsRestored[textIdx];
      } else if (!/^(?:cancelled|none|n\/a|unknown|\?\?)$/i.test(ansRestored)) {
        correctAnswer = ansRestored;
        warnings.push('Answer text did not exactly match any option');
      }
    }
  } else if (inlineCorrectIdx !== -1 && optionsRestored[inlineCorrectIdx] !== undefined) {
    correctIndex = inlineCorrectIdx;
    correctAnswer = optionsRestored[inlineCorrectIdx];
  } else if (answerKeyMap.has(explicitNumber)) {
    const keyIdx = answerKeyMap.get(explicitNumber);
    if (optionsRestored[keyIdx] !== undefined) {
      correctIndex = keyIdx;
      correctAnswer = optionsRestored[keyIdx];
    } else {
      warnings.push(`Answer key entry for #${explicitNumber} out of option range`);
    }
  }

  // Fallback ignore pure prose blocks without question mark & < 2 options
  if (optionsRestored.length === 0 && !questionRestored.includes('?') && !ansRestored) {
    return null;
  }

  if (optionsRestored.length < 2) {
    warnings.push('Fewer than 2 options detected');
  }
  if (correctIndex === -1 && !correctAnswer) {
    warnings.push('Correct answer not found');
  }

  const confidence =
    warnings.length === 0 && optionsRestored.length >= 2 && (correctIndex !== -1 || correctAnswer)
      ? 'high'
      : optionsRestored.length >= 2 && questionRestored
      ? 'medium'
      : 'manual';

  return normalizeMcqItem(
    {
      id: explicitNumber,
      question: questionRestored,
      options: optionsRestored,
      correctIndex,
      correctAnswer,
      note: expRestored,
      explanation: expRestored,
      sourceFormat: 'text',
      confidence,
      warnings,
    },
    seqIdx
  );
}

/**
 * Parses plain text into normalized v2 MCQs.
 */
export function parsePlainTextMcqs(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { items: [], warnings: [], stats: { ignoredBlocks: 0, answerKeyCount: 0 } };
  }

  const { protectedText, restore } = protectSpecialBlocks(rawText);
  const { bodyText, answerKeyMap } = extractEndAnswerKey(protectedText);
  const { blocks, ignoredProseCount } = segmentQuestionBlocks(bodyText);

  const items = [];
  blocks.forEach((blk, idx) => {
    const parsed = parseSingleBlock(blk, idx, answerKeyMap, restore);
    if (parsed) items.push(parsed);
  });

  // Safety check: if end key wasn't stripped and didn't apply, no harm; report stats cleanly
  return {
    items,
    warnings:
      items.length === 0
        ? ['No structured MCQs detected in text. Try numbered questions (1. ...) with options (a. / b. / c. / d.) or add manually.']
        : [],
    stats: {
      ignoredBlocks: ignoredProseCount,
      answerKeyCount: answerKeyMap.size,
      totalBlocks: blocks.length,
    },
  };
}

export function formatNormalizedMcqToText(mcq, index = 0) {
  const opts = (mcq.optionsText || mcq.options || [])
    .map((o, i) => `${getOptionPrefixLabel(i, mcq.question)}. ${o}`)
    .join('\n');
  let ansLine = 'Correct answer: ??';
  if (mcq.correctIndex !== undefined && mcq.correctIndex >= 0 && mcq.options?.[mcq.correctIndex]) {
    ansLine = `Correct answer: ${getOptionPrefixLabel(mcq.correctIndex, mcq.question)}. ${mcq.options[mcq.correctIndex]}`;
  } else if (mcq.correctAnswer) {
    ansLine = `Correct answer: ${mcq.correctAnswer}`;
  }
  const exp = mcq.explanation || mcq.note || '';
  return `${index + 1}. ${mcq.question}\n${opts}\n${ansLine}${exp ? `\nNote: ${exp}` : ''}`;
}
