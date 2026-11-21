/**
 * Class Caddy MCQ Engine — Safe Static JSON & JavaScript AST Parser
 *
 * SECURITY CRITICAL:
 * - NEVER executes JavaScript input via eval(), new Function(), or <script>.
 * - Uses Acorn static AST analysis exclusively.
 * - Flags any dynamic JS expressions (function calls, external variables,
 *   template interpolations) with warnings for manual user review.
 */

import * as acorn from 'acorn';
import { normalizeMcqItem, htmlToPlainText, hasRichMarkup, escapeHtmlBasic } from '../schema.js';
import { sanitizeRichHtml } from '../renderer.js';

const PREFERRED_COLLECTION_KEYS = new Set([
  'questions',
  'mcqs',
  'mcq',
  'mcqdata',
  'mcq_data',
  'quiz',
  'quizdata',
  'quiz_data',
  'questionbank',
  'question_bank',
  'data',
  'items',
  'bank',
  'records',
  'list',
  'problems',
  'exam',
  'test',
]);

const PRIMARY_QUESTION_KEYS = [
  'questionHtml',
  'question_html',
  'question',
  'q',
  'questionText',
  'question_text',
  'title',
  'prompt',
  'stem',
  'text',
  'query',
  'problem',
  'statement',
];

const STRICT_MAIN_QUESTION_KEYS = [
  'questionHtml',
  'question_html',
  'question',
  'q',
  'questionText',
  'question_text',
  'title',
  'prompt',
  'text',
  'query',
  'problem',
  'statement',
];

const STEM_CONTEXT_KEYS = [
  '__inheritedStem',
  's',
  'stem',
  'stemHtml',
  'stem_html',
  'stimulus',
  'context',
  'passage',
  'uddpok',
  'uddipok',
];

const ROMAN_ARRAY_KEYS = [
  'r',
  'romans',
  'roman',
  'statements',
  'romanStatements',
  'roman_statements',
  'romanList',
  'roman_list',
];

const SUB_QUESTION_KEYS = [
  'sq',
  'subQuestion',
  'sub_question',
  'subq',
  'sub_q',
  'tail',
  'footerPrompt',
  'footer_prompt',
];

const ROMAN_LABELS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];

const ALL_QUESTION_KEYS_LOWER = new Set([
  ...PRIMARY_QUESTION_KEYS.map((k) => k.toLowerCase()),
  's',
  'description',
]);

const OPTION_ARRAY_KEYS = [
  'options',
  'choices',
  'answers',
  'alternatives',
  'opts',
  'opt',
  'o',
  'optionList',
  'option_list',
];

const OPTION_ARRAY_KEYS_LOWER = new Set([
  ...OPTION_ARRAY_KEYS.map((k) => k.toLowerCase()),
  'optionshtml',
  'options_html',
]);

const OPTION_KEY_GROUPS = [
  ['a', 'b', 'c', 'd', 'e', 'f'],
  ['optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'optionF'],
  ['option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'option_f'],
  ['optA', 'optB', 'optC', 'optD', 'optE', 'optF'],
  ['opt_a', 'opt_b', 'opt_c', 'opt_d', 'opt_e', 'opt_f'],
  ['option1', 'option2', 'option3', 'option4', 'option5', 'option6'],
  ['option_1', 'option_2', 'option_3', 'option_4', 'option_5', 'option_6'],
  ['opt1', 'opt2', 'opt3', 'opt4', 'opt5', 'opt6'],
  ['opt_1', 'opt_2', 'opt_3', 'opt_4', 'opt_5', 'opt_6'],
  ['choiceA', 'choiceB', 'choiceC', 'choiceD', 'choiceE'],
  ['choice_a', 'choice_b', 'choice_c', 'choice_d', 'choice_e'],
  ['choice1', 'choice2', 'choice3', 'choice4', 'choice5'],
  ['ক', 'খ', 'গ', 'ঘ', 'ঙ'],
];

const ANSWER_KEYS_PRIMARY = [
  'answer',
  'ans',
  'correct',
  'correctAnswer',
  'correct_answer',
  'correctOption',
  'correct_option',
  'answerKey',
  'answer_key',
  'rightAnswer',
  'right_answer',
  'rightOption',
  'right_option',
  'key',
];

const ANSWER_INDEX_KEYS = [
  'correctIndex',
  'correct_index',
  'answerIndex',
  'answer_index',
  'rightIndex',
  'right_index',
];

const EXPLANATION_KEYS = [
  'explanationHtml',
  'explanation_html',
  'explanation',
  'explanationText',
  'explanation_text',
  'exp',
  'explain',
  'noteHtml',
  'note_html',
  'note',
  'details',
  'solutionText',
  'solution_text',
  'sol',
  'discussion',
  'rationale',
  'reference',
  'hint',
  'feedback',
  'remark',
  'analysis',
];

const LABEL_MAP = {
  a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7,
  'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3, 'ঙ': 4, 'চ': 5, 'ছ': 6, 'জ': 7,
};

const KEY_NAME_TO_INDEX = {
  a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7,
  optiona: 0, optionb: 1, optionc: 2, optiond: 3, optione: 4, optionf: 5,
  option_a: 0, option_b: 1, option_c: 2, option_d: 3, option_e: 4, option_f: 5,
  opta: 0, optb: 1, optc: 2, optd: 3, opte: 4, optf: 5,
  opt_a: 0, opt_b: 1, opt_c: 2, opt_d: 3, opt_e: 4, opt_f: 5,
  option1: 0, option2: 1, option3: 2, option4: 3, option5: 4, option6: 5,
  option_1: 0, option_2: 1, option_3: 2, option_4: 3, option_5: 4, option_6: 5,
  opt1: 0, opt2: 1, opt3: 2, opt4: 3, opt5: 4, opt6: 5,
  opt_1: 0, opt_2: 1, opt_3: 2, opt_4: 3, opt_5: 4, opt_6: 5,
  choicea: 0, choiceb: 1, choicec: 2, choiced: 3, choicee: 4,
  choice_a: 0, choice_b: 1, choice_c: 2, choice_d: 3, choice_e: 4,
  choice1: 0, choice2: 1, choice3: 2, choice4: 3, choice5: 4,
  'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3, 'ঙ': 4,
};

function normalizeDigitsToAscii(str) {
  return String(str ?? '').replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
}

function hasOptionArrayProperty(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return Object.keys(obj).some((rawKey) => {
    const k = rawKey.toLowerCase();
    if (!OPTION_ARRAY_KEYS_LOWER.has(k)) return false;
    const val = obj[rawKey];
    if (k === 'o' || k === 'opt') {
      return Array.isArray(val) || (Boolean(val) && typeof val === 'object');
    }
    return true;
  });
}

function hasQuestionKey(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj).map((k) => k.toLowerCase());
  return keys.some((k) => ALL_QUESTION_KEYS_LOWER.has(k));
}

function hasAnyMcqSignalKey(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  if (hasOptionArrayProperty(obj)) return true;
  const keys = Object.keys(obj).map((k) => k.toLowerCase());
  if (keys.some((k) => KEY_NAME_TO_INDEX[k] !== undefined)) return true;
  if (keys.some((k) => ANSWER_KEYS_PRIMARY.map((a) => a.toLowerCase()).includes(k))) return true;
  if (keys.some((k) => ANSWER_INDEX_KEYS.map((a) => a.toLowerCase()).includes(k))) return true;
  if (keys.some((k) => EXPLANATION_KEYS.map((e) => e.toLowerCase()).includes(k))) return true;
  return false;
}

export function looksLikeQuestionObject(obj, allowIncomplete = false) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  if (!hasQuestionKey(obj)) return false;

  const keys = Object.keys(obj).map((k) => k.toLowerCase());
  const hasOpts =
    hasOptionArrayProperty(obj) ||
    OPTION_KEY_GROUPS.some((grp) => {
      const present = grp.filter((gk) => keys.includes(gk.toLowerCase()));
      return present.length >= 2;
    });

  if (hasOpts) return true;
  if (allowIncomplete && hasAnyMcqSignalKey(obj)) return true;
  return false;
}

/**
 * Propagates multi-question stems (e.g., "নিচের উদ্দীপকটি লক্ষ কর এবং ৮ ও ৯ নং প্রশ্নের উত্তর দাও:")
 * to all referenced subsequent questions in the same array so each question remains self-contained
 * in View Mode, Practice Mode, and shuffled Exam Mode.
 */
function propagateMultiQuestionStems(collectedEntries) {
  if (!Array.isArray(collectedEntries) || collectedEntries.length < 2) return;

  const getFieldCI = (raw, names) => {
    if (!raw || typeof raw !== 'object') return undefined;
    for (const n of names) {
      if (raw[n] !== undefined && raw[n] !== null) return raw[n];
      const matchKey = Object.keys(raw).find((k) => k.toLowerCase() === n.toLowerCase());
      if (matchKey && raw[matchKey] !== undefined && raw[matchKey] !== null) return raw[matchKey];
    }
    return undefined;
  };

  const entryNumberMap = new Map();
  collectedEntries.forEach((entry, idx) => {
    const rawNum = getFieldCI(entry.raw, ['n', 'no', 'qno', 'sl', 'id', 'questionId', 'question_id', 'num', 'number']);
    const normStr = normalizeDigitsToAscii(rawNum !== undefined ? rawNum : idx + 1).trim();
    const numMatch = normStr.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : idx + 1;
    if (Number.isInteger(num)) {
      if (!entryNumberMap.has(num)) entryNumberMap.set(num, []);
      entryNumberMap.get(num).push(entry);
    }
  });

  collectedEntries.forEach((entry) => {
    const raw = entry?.raw;
    if (!raw || typeof raw !== 'object') return;
    const hasMainQ = getFieldCI(raw, STRICT_MAIN_QUESTION_KEYS) !== undefined;
    if (!hasMainQ) return;
    const stemVal = getFieldCI(raw, ['s', 'stem', 'stemHtml', 'stem_html', 'stimulus', 'context', 'passage', 'uddpok', 'uddipok']);
    if (stemVal === undefined || stemVal === null || String(stemVal).trim() === '') return;

    const stemPlain = normalizeDigitsToAscii(htmlToPlainText(String(stemVal)));
    // Match Bangla or English multi-question references e.g. "8 ও 9 নং প্রশ্নের", "13, 14 ও 15 নং", "20-21 নং", "questions 8 and 9"
    const refRegexes = [
      /(\d+(?:\s*(?:,|ও|এবং|থেকে|হতে|to|and|&|[-–—])\s*\d+)+)\s*(?:নং|নম্বর)?\s*(?:প্রশ্ন|প্রশ্নের)/i,
      /(?:questions?|q\.?\s*nos?\.?)\s*(\d+(?:\s*(?:,|ও|এবং|থেকে|হতে|to|and|&|[-–—])\s*\d+)+)/i,
    ];

    let refExpr = '';
    for (const re of refRegexes) {
      const m = stemPlain.match(re);
      if (m && m[1]) {
        refExpr = m[1];
        break;
      }
    }
    if (!refExpr) return;

    const targetNumbers = new Set();
    // Handle range patterns like "8-10" or "8 থেকে 10" or "8 to 10"
    const rangeRe = /(\d+)\s*(?:থেকে|হতে|to|[-–—])\s*(\d+)/gi;
    let rm;
    while ((rm = rangeRe.exec(refExpr)) !== null) {
      const start = parseInt(rm[1], 10);
      const end = parseInt(rm[2], 10);
      if (Number.isInteger(start) && Number.isInteger(end) && end >= start && end - start <= 15) {
        for (let k = start; k <= end; k++) targetNumbers.add(k);
      }
    }
    // Also add all individual numbers mentioned
    const allNums = refExpr.match(/\d+/g) || [];
    allNums.forEach((nStr) => {
      const n = parseInt(nStr, 10);
      if (Number.isInteger(n)) targetNumbers.add(n);
    });

    targetNumbers.forEach((targetNum) => {
      const matchingEntries = entryNumberMap.get(targetNum) || [];
      matchingEntries.forEach((targetEntry) => {
        if (targetEntry === entry || !targetEntry?.raw) return;
        const existingStem = getFieldCI(targetEntry.raw, STEM_CONTEXT_KEYS);
        if (existingStem === undefined || existingStem === null || String(existingStem).trim() === '') {
          targetEntry.raw.__inheritedStem = String(stemVal);
        }
      });
    });
  });
}

/**
 * Recursively collects candidate question objects from nested JS/JSON structures.
 * Also captures incomplete question objects inside an identified MCQ array so
 * validation summaries can report missing options accurately instead of silently dropping them.
 */
export function collectQuestionObjects(root, results = [], parentTags = [], sourceVariableName = '') {
  if (!root || typeof root !== 'object') return results;

  if (Array.isArray(root)) {
    const hasCompleteMcq = root.some((el) => looksLikeQuestionObject(el, false));
    const startIdx = results.length;
    root.forEach((entry) => {
      if (looksLikeQuestionObject(entry, hasCompleteMcq)) {
        results.push({ raw: entry, inheritedTags: parentTags, variableName: sourceVariableName });
      } else if (entry && typeof entry === 'object') {
        collectQuestionObjects(entry, results, parentTags, sourceVariableName);
      }
    });
    if (results.length > startIdx + 1) {
      propagateMultiQuestionStems(results.slice(startIdx));
    }
    return results;
  }

  if (looksLikeQuestionObject(root, false)) {
    results.push({ raw: root, inheritedTags: parentTags, variableName: sourceVariableName });
    return results;
  }

  // Traverse properties, preferring collection keys first
  const entries = Object.entries(root);
  entries.sort(([ka], [kb]) => {
    const aPref = PREFERRED_COLLECTION_KEYS.has(ka.toLowerCase()) ? 0 : 1;
    const bPref = PREFERRED_COLLECTION_KEYS.has(kb.toLowerCase()) ? 0 : 1;
    return aPref - bPref;
  });

  for (const [key, val] of entries) {
    if (val && typeof val === 'object') {
      const nextTags = PREFERRED_COLLECTION_KEYS.has(key.toLowerCase())
        ? parentTags
        : [...parentTags, key];
      const nextVarName = sourceVariableName || key;
      collectQuestionObjects(val, results, nextTags, nextVarName);
    }
  }
  return results;
}

export function mapRawObjectToMcq(raw, idx, inheritedTags = [], sourceFormat = 'js', dynamicWarnings = [], meta = {}) {
  const warnings = [...dynamicWarnings];
  const getAny = (...names) => {
    for (const n of names) {
      if (raw[n] !== undefined && raw[n] !== null) return raw[n];
      const matchKey = Object.keys(raw).find((k) => k.toLowerCase() === n.toLowerCase());
      if (matchKey && raw[matchKey] !== undefined && raw[matchKey] !== null) return raw[matchKey];
    }
    return undefined;
  };

  // 1. Question extraction (including optional stem `s`, Roman numeral statements `r`, and sub-question `sq`)
  const qHtmlExplicit = getAny('questionHtml', 'question_html');
  const strictMainQVal = getAny(...STRICT_MAIN_QUESTION_KEYS);
  let qVal = strictMainQVal !== undefined ? strictMainQVal : getAny(...PRIMARY_QUESTION_KEYS);
  let usedDescriptionAsQuestion = false;
  if (qVal === undefined && qHtmlExplicit === undefined) {
    const descVal = getAny('description');
    if (descVal !== undefined) {
      qVal = descVal;
      usedDescriptionAsQuestion = true;
    }
  }

  // Extract separate stem (`s`, `stem`, `stimulus`, `context`, `passage`, `__inheritedStem`) if distinct from main question
  let stemRawStr = '';
  if (strictMainQVal !== undefined || qHtmlExplicit !== undefined) {
    const stemCandidate = getAny(...STEM_CONTEXT_KEYS);
    if (stemCandidate !== undefined && stemCandidate !== null && String(stemCandidate).trim() !== '') {
      const sTrimmed = String(stemCandidate).trim();
      if (sTrimmed !== String(qVal ?? '').trim()) {
        stemRawStr = sTrimmed;
      }
    }
  } else if (qVal === undefined) {
    const sOnly = getAny('s');
    if (sOnly !== undefined && sOnly !== null) {
      qVal = sOnly;
    }
  }

  // Extract optional Roman numeral statements (`r`, `romans`, `statements`)
  const rawRomans = getAny(...ROMAN_ARRAY_KEYS);
  let romanBlockHtml = '';
  let romanBlockPlain = '';
  if (Array.isArray(rawRomans) && rawRomans.length > 0) {
    const romanHtmlItems = [];
    const romanPlainItems = [];
    rawRomans.forEach((rItem, rIdx) => {
      const rStr = String(rItem ?? '').trim();
      if (!rStr) return;
      const rLabel = ROMAN_LABELS[rIdx] || String(rIdx + 1);
      const rSafeHtml = hasRichMarkup(rStr) ? sanitizeRichHtml(rStr) : escapeHtmlBasic(rStr);
      const rPlain = hasRichMarkup(rStr) ? htmlToPlainText(rStr) : rStr;
      romanHtmlItems.push(
        `<li class="cc-roman-item"><span class="cc-roman-num">${rLabel}.</span> <span class="cc-roman-text">${rSafeHtml}</span></li>`
      );
      romanPlainItems.push(`${rLabel}. ${rPlain}`);
    });
    if (romanHtmlItems.length > 0) {
      romanBlockHtml = `<ul class="cc-roman-list">${romanHtmlItems.join('')}</ul>`;
      romanBlockPlain = romanPlainItems.join('\n');
    }
  }

  // Extract optional sub-question (`sq`, `subQuestion`, `tail`)
  const rawSubQ = getAny(...SUB_QUESTION_KEYS);
  let subQHtml = '';
  let subQPlain = '';
  if (rawSubQ !== undefined && rawSubQ !== null && String(rawSubQ).trim() !== '') {
    const sqStr = String(rawSubQ).trim();
    const sqSafeHtml = hasRichMarkup(sqStr) ? sanitizeRichHtml(sqStr) : escapeHtmlBasic(sqStr);
    subQHtml = `<div class="cc-sub-q">${sqSafeHtml}</div>`;
    subQPlain = hasRichMarkup(sqStr) ? htmlToPlainText(sqStr) : sqStr;
  }

  const rawQStr = qVal !== undefined ? String(qVal).trim() : '';
  const hasCompoundParts = Boolean(stemRawStr || romanBlockHtml || subQHtml);

  let rawQHtmlStr;
  let cleanQPlain;

  if (hasCompoundParts) {
    const htmlParts = [];
    const plainParts = [];

    if (stemRawStr) {
      const safeStemHtml = hasRichMarkup(stemRawStr) ? sanitizeRichHtml(stemRawStr) : escapeHtmlBasic(stemRawStr);
      htmlParts.push(`<div class="cc-stem-block">${safeStemHtml}</div>`);
      plainParts.push(hasRichMarkup(stemRawStr) ? htmlToPlainText(safeStemHtml) : stemRawStr);
    }

    const baseQHtml = qHtmlExplicit !== undefined
      ? sanitizeRichHtml(String(qHtmlExplicit).trim())
      : hasRichMarkup(rawQStr)
      ? sanitizeRichHtml(rawQStr)
      : escapeHtmlBasic(rawQStr);
    const baseQPlain = qHtmlExplicit !== undefined
      ? htmlToPlainText(baseQHtml)
      : hasRichMarkup(rawQStr)
      ? htmlToPlainText(baseQHtml)
      : rawQStr;

    if (baseQHtml) {
      htmlParts.push(`<div class="cc-q-main">${baseQHtml}</div>`);
    }
    if (baseQPlain) {
      plainParts.push(baseQPlain);
    }
    if (romanBlockHtml) {
      htmlParts.push(romanBlockHtml);
      plainParts.push(romanBlockPlain);
    }
    if (subQHtml) {
      htmlParts.push(subQHtml);
      plainParts.push(subQPlain);
    }

    rawQHtmlStr = htmlParts.join('');
    cleanQPlain = plainParts.filter(Boolean).join('\n');
  } else {
    rawQHtmlStr = qHtmlExplicit !== undefined
      ? sanitizeRichHtml(String(qHtmlExplicit).trim())
      : hasRichMarkup(rawQStr)
      ? sanitizeRichHtml(rawQStr)
      : undefined;
    cleanQPlain = rawQHtmlStr ? htmlToPlainText(rawQHtmlStr) : rawQStr;
  }

  // 2. Options extraction (array `options`/`o`/`opts`, object map {a,b,c,d}, or top-level keys a/b/c/d, optionA..D, option_1..4, ক..ঘ)
  let rawOptions = getAny(...OPTION_ARRAY_KEYS);
  let rawOptionsHtml = getAny('optionsHtml', 'options_html');
  let optionKeyOrder = [];
  let usedIndividualOptionKeys = false;

  if (rawOptions && typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
    const keys = Object.keys(rawOptions);
    optionKeyOrder = keys.map((k) => k.toLowerCase());
    rawOptions = keys.map((k) => rawOptions[k]);
  } else if (!Array.isArray(rawOptions)) {
    let bestOpts = [];
    let bestKeys = [];
    for (const grp of OPTION_KEY_GROUPS) {
      const currentOpts = [];
      const currentKeys = [];
      grp.forEach((k) => {
        const val = getAny(k);
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          currentOpts.push(val);
          currentKeys.push(k.toLowerCase());
        }
      });
      if (currentOpts.length > bestOpts.length) {
        bestOpts = currentOpts;
        bestKeys = currentKeys;
      }
      if (bestOpts.length >= 4) break;
    }
    if (bestOpts.length >= 2) {
      rawOptions = bestOpts;
      optionKeyOrder = bestKeys;
      usedIndividualOptionKeys = true;
    } else {
      rawOptions = bestOpts;
      optionKeyOrder = bestKeys;
    }
  }

  const extractedOptionStrings = Array.isArray(rawOptions)
    ? rawOptions
        .map((o) => {
          if (o && typeof o === 'object') {
            return String(o.html ?? o.text ?? o.label ?? o.value ?? o.option ?? o.content ?? '').trim();
          }
          return String(o ?? '').trim();
        })
        .filter((s) => s !== '')
    : [];

  const cleanOptionsHtml = Array.isArray(rawOptionsHtml)
    ? rawOptionsHtml.map((o) => sanitizeRichHtml(String(o ?? '')))
    : extractedOptionStrings.map((o) => (hasRichMarkup(o) ? sanitizeRichHtml(o) : undefined));

  const hasAnyRichOption = cleanOptionsHtml.some((h) => h !== undefined);
  const finalOptionsHtml = hasAnyRichOption
    ? extractedOptionStrings.map((o, i) => cleanOptionsHtml[i] || sanitizeRichHtml(o))
    : undefined;

  const cleanOptionsPlain = extractedOptionStrings.map((o) => (hasRichMarkup(o) ? htmlToPlainText(o) : o));
  const missingOptions = cleanOptionsPlain.length < 2;

  // 3. Correct answer resolution (supports index, letter, key name, boolean option flags, shorthand `a`, or full text)
  let correctIndex = -1;
  let correctAnswer = '';
  let invalidAnswerRef = false;
  let rawAnswerRef = '';

  // Check if options objects carry { isCorrect: true } / { correct: true }
  const origArr = getAny(...OPTION_ARRAY_KEYS);
  if (Array.isArray(origArr)) {
    const objCorrectIdx = origArr.findIndex(
      (o) => o && typeof o === 'object' && (o.isCorrect === true || o.correct === true || o.is_correct === true)
    );
    if (objCorrectIdx !== -1 && objCorrectIdx < cleanOptionsPlain.length) {
      correctIndex = objCorrectIdx;
    }
  }

  const rawIdx = getAny(...ANSWER_INDEX_KEYS);
  if (correctIndex === -1 && rawIdx !== undefined && rawIdx !== null && rawIdx !== '') {
    rawAnswerRef = String(rawIdx);
    const numIdx = typeof rawIdx === 'number' ? rawIdx : Number(String(rawIdx).trim());
    if (Number.isInteger(numIdx)) {
      if (numIdx >= 0 && numIdx < cleanOptionsPlain.length) {
        correctIndex = numIdx;
      } else if (numIdx >= 1 && numIdx <= cleanOptionsPlain.length) {
        correctIndex = numIdx - 1;
        warnings.push('Interpreted numeric correctIndex as 1-based index.');
      } else if (cleanOptionsPlain.length > 0) {
        invalidAnswerRef = true;
      }
    } else {
      invalidAnswerRef = true;
    }
  }

  // When options come from an array (e.g. `o: [...]` or `options: [...]`) rather than `{a, b, c, d}`, allow shorthand `a` as answer key
  const answerCandidateKeys = usedIndividualOptionKeys
    ? ANSWER_KEYS_PRIMARY
    : [...ANSWER_KEYS_PRIMARY, 'a'];
  let rawAns = getAny(...answerCandidateKeys);
  const rawSolution = getAny('solution');
  let solutionUsedAsAnswer = false;

  if (rawAns === undefined && rawIdx === undefined && rawSolution !== undefined) {
    const solStr = String(rawSolution).trim();
    const isShortKey =
      /^\(?([a-hA-Hক-জ1-8])\)?[\.\)]?$/.test(solStr) ||
      KEY_NAME_TO_INDEX[solStr.toLowerCase()] !== undefined ||
      cleanOptionsPlain.some((o) => o.toLowerCase() === htmlToPlainText(solStr).toLowerCase());
    if (isShortKey) {
      rawAns = rawSolution;
      solutionUsedAsAnswer = true;
    }
  }

  if (correctIndex === -1 && rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== '') {
    rawAnswerRef = String(rawAns).trim();
    if (typeof rawAns === 'number' && Number.isInteger(rawAns)) {
      if (rawAns >= 0 && rawAns < cleanOptionsPlain.length) {
        correctIndex = rawAns;
      } else if (rawAns >= 1 && rawAns <= cleanOptionsPlain.length) {
        correctIndex = rawAns - 1;
      } else if (cleanOptionsPlain.length > 0) {
        invalidAnswerRef = true;
      }
    } else {
      const trimmed = String(rawAns).trim();
      const lower = trimmed.toLowerCase();

      // Match against explicit option key order (e.g., 'a', 'b', 'c', 'd' or 'optiona', 'option1')
      if (optionKeyOrder.includes(lower)) {
        correctIndex = optionKeyOrder.indexOf(lower);
      } else if (KEY_NAME_TO_INDEX[lower] !== undefined) {
        const mapped = KEY_NAME_TO_INDEX[lower];
        if (mapped < cleanOptionsPlain.length) {
          correctIndex = mapped;
        } else {
          invalidAnswerRef = true;
        }
      } else {
        // Single letter / number label e.g. "(b)", "B.", "খ", "2"
        const lm = trimmed.match(/^\(?([a-hA-Hক-জ1-8])\)?[\.\)]?$/);
        if (lm) {
          const tok = lm[1].toLowerCase();
          if (LABEL_MAP[tok] !== undefined) {
            if (LABEL_MAP[tok] < cleanOptionsPlain.length) {
              correctIndex = LABEL_MAP[tok];
            } else {
              invalidAnswerRef = true;
            }
          } else {
            const numTok = parseInt(tok, 10);
            if (numTok >= 1 && numTok <= cleanOptionsPlain.length) {
              correctIndex = numTok - 1;
            } else {
              invalidAnswerRef = true;
            }
          }
        } else {
          // Prefix + text e.g. "b. Second option" or exact option text
          const prefixM = trimmed.match(/^\(?([a-hA-Hক-জ])\)?[\.\):]\s+([\s\S]+)$/);
          const candidatePlain = htmlToPlainText(trimmed).trim().toLowerCase();
          const textMatch = cleanOptionsPlain.findIndex(
            (o) => o.trim().toLowerCase() === candidatePlain || o.trim().toLowerCase() === trimmed.toLowerCase()
          );
          if (textMatch !== -1) {
            correctIndex = textMatch;
          } else if (prefixM && LABEL_MAP[prefixM[1].toLowerCase()] !== undefined && LABEL_MAP[prefixM[1].toLowerCase()] < cleanOptionsPlain.length) {
            correctIndex = LABEL_MAP[prefixM[1].toLowerCase()];
          } else if (cleanOptionsPlain.length > 0) {
            // Answer reference was provided but does not match any option
            invalidAnswerRef = true;
          } else {
            correctAnswer = trimmed;
          }
        }
      }
    }
  }

  // 4. Explanation / Note resolution (preserving HTML tags, SVG diagrams & LaTeX)
  // Allow shorthand `e` for explanation whenever `e` was not used as Option E
  const explanationCandidateKeys = optionKeyOrder.includes('e')
    ? EXPLANATION_KEYS
    : [...EXPLANATION_KEYS, 'e'];
  let expVal = getAny(...explanationCandidateKeys);
  if (expVal === undefined && !usedDescriptionAsQuestion) {
    expVal = getAny('description');
  }
  if (expVal === undefined && !solutionUsedAsAnswer && rawSolution !== undefined) {
    expVal = rawSolution;
  }

  const noteVal = getAny('noteHtml', 'note_html', 'note');
  const chosenExpRaw = expVal !== undefined ? String(expVal).trim() : noteVal !== undefined ? String(noteVal).trim() : '';
  const chosenNoteRaw = noteVal !== undefined ? String(noteVal).trim() : chosenExpRaw;

  const expHtml = hasRichMarkup(chosenExpRaw) ? sanitizeRichHtml(chosenExpRaw) : undefined;
  const noteHtml = hasRichMarkup(chosenNoteRaw) ? sanitizeRichHtml(chosenNoteRaw) : expHtml;

  const rawTags = getAny('tags', 'tag', 'category', 'topic', 'subject', 'chapter', 'section');
  const tags = [
    ...inheritedTags,
    ...(Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : []),
  ]
    .filter(Boolean)
    .map(String);

  const rawIdCandidate = getAny('id', 'questionId', 'question_id', 'no', 'qno', 'sl', 'n', 'num', 'number');
  let resolvedId = idx + 1;
  if (rawIdCandidate !== undefined && rawIdCandidate !== null && String(rawIdCandidate).trim() !== '') {
    const asciiDigits = normalizeDigitsToAscii(rawIdCandidate).trim();
    const parsedNum = Number(asciiDigits);
    resolvedId = Number.isInteger(parsedNum) && parsedNum > 0 ? parsedNum : rawIdCandidate;
  }

  return normalizeMcqItem(
    {
      id: resolvedId,
      question: cleanQPlain,
      questionHtml: rawQHtmlStr,
      options: cleanOptionsPlain,
      optionsHtml: finalOptionsHtml,
      correctIndex,
      correctAnswer: correctIndex !== -1 ? cleanOptionsPlain[correctIndex] : correctAnswer,
      correctAnswerHtml: correctIndex !== -1 && finalOptionsHtml ? finalOptionsHtml[correctIndex] : undefined,
      explanation: chosenExpRaw ? htmlToPlainText(chosenExpRaw) : '',
      explanationHtml: expHtml,
      note: chosenNoteRaw ? htmlToPlainText(chosenNoteRaw) : '',
      noteHtml,
      tags: [...new Set(tags)],
      sourceFormat,
      detectedSourceType: meta.detectedSourceType || (sourceFormat === 'json' ? 'JSON MCQ array/object' : 'JavaScript MCQ array/object'),
      detectedVariableName: meta.variableName || '',
      sourceFileName: meta.fileName || '',
      rawAnswerRef,
      missingOptions,
      invalidAnswerRef,
      confidence: dynamicWarnings.length > 0 || missingOptions || invalidAnswerRef ? 'manual' : undefined,
      warnings,
    },
    idx
  );
}

/**
 * Safely parses JSON text into normalized v2 MCQs.
 */
export function parseJsonMcqs(rawJson, options = {}) {
  if (!rawJson || typeof rawJson !== 'string') {
    return { items: [], warnings: ['No JSON input provided.'] };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return {
      items: [],
      warnings: [`Invalid JSON syntax: ${err.message}`],
      syntaxError: true,
    };
  }

  // Handle Schema.org Quiz / Question JSON-LD format if present
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const ldPart = parsed.hasPart || parsed.mainEntity || parsed.questions;
    if (Array.isArray(ldPart) && ldPart.some((p) => p && (p['@type'] === 'Question' || p.acceptedAnswer || p.suggestedAnswer))) {
      const converted = ldPart.map((qObj, idx) => {
        const stem = qObj.text || qObj.name || qObj.question || '';
        const suggested = Array.isArray(qObj.suggestedAnswer) ? qObj.suggestedAnswer : [];
        const accepted = qObj.acceptedAnswer;
        const opts = suggested.map((s) => (typeof s === 'object' ? s.text || s.name || '' : String(s)));
        const accText = accepted && typeof accepted === 'object' ? accepted.text || accepted.name || '' : String(accepted || '');
        const expText = (accepted && typeof accepted === 'object' && accepted.answerExplanation?.text) || qObj.comment?.text || '';
        return {
          id: idx + 1,
          question: stem,
          options: opts,
          correctAnswer: accText,
          explanation: expText,
        };
      });
      const items = converted.map((raw, idx) =>
        mapRawObjectToMcq(raw, idx, [], 'json', [], {
          detectedSourceType: options.detectedSourceType || 'JSON-LD structured MCQ data',
          variableName: options.variableName || '@graph/hasPart',
          fileName: options.fileName || '',
        })
      );
      return {
        items,
        warnings: [],
        detectedSourceType: options.detectedSourceType || 'JSON-LD structured MCQ data',
        detectedVariableName: options.variableName || 'JSON-LD',
        rawDetectedCount: items.length,
      };
    }
  }

  const collected = collectQuestionObjects(parsed, [], [], options.variableName || '');
  if (collected.length === 0) {
    return {
      items: [],
      warnings: ['JSON parsed successfully, but no recognizable question objects (with question + options) were found.'],
    };
  }

  const detectedVar = collected[0]?.variableName || options.variableName || 'JSON root';
  const detectedSourceType = options.detectedSourceType || 'JSON MCQ array/object';
  const items = collected.map((entry, idx) =>
    mapRawObjectToMcq(entry.raw, idx, entry.inheritedTags, 'json', [], {
      detectedSourceType,
      variableName: entry.variableName || detectedVar,
      fileName: options.fileName || '',
    })
  );
  return {
    items,
    warnings: [],
    detectedSourceType,
    detectedVariableName: detectedVar,
    rawDetectedCount: collected.length,
  };
}

/**
 * Static AST evaluator: evaluates ONLY pure literals, static arrays, static objects,
 * binary '+' string concatenation, static identifier references declared in the same script,
 * and template literals with static interpolated variables.
 * NEVER executes functions or external code.
 */
function evalStaticAstNode(node, meta = { dynamicCount: 0, dynamicPaths: [] }, path = '', scopeMap = new Map()) {
  if (!node) return undefined;

  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'Identifier':
      if (node.name === 'undefined') return undefined;
      if (scopeMap && scopeMap.has(node.name)) {
        return scopeMap.get(node.name);
      }
      meta.dynamicCount++;
      meta.dynamicPaths.push(path || node.name);
      return `[Dynamic JS Identifier: ${node.name}]`;

    case 'TemplateLiteral': {
      if (!node.expressions || node.expressions.length === 0) {
        return node.quasis.map((q) => q.value?.cooked ?? q.value?.raw ?? '').join('');
      }
      let out = '';
      for (let i = 0; i < node.quasis.length; i++) {
        out += node.quasis[i].value?.cooked ?? node.quasis[i].value?.raw ?? '';
        if (i < node.expressions.length) {
          const exprVal = evalStaticAstNode(
            node.expressions[i],
            meta,
            path ? `${path}.\${${i}}` : `\${${i}}`,
            scopeMap
          );
          if (exprVal !== undefined && exprVal !== null) {
            out += String(exprVal);
          }
        }
      }
      return out;
    }

    case 'UnaryExpression':
      if (node.operator === '-' || node.operator === '+') {
        const arg = evalStaticAstNode(node.argument, meta, path, scopeMap);
        if (typeof arg === 'number') return node.operator === '-' ? -arg : +arg;
      }
      if (node.operator === '!') {
        const arg = evalStaticAstNode(node.argument, meta, path, scopeMap);
        if (typeof arg === 'boolean') return !arg;
      }
      meta.dynamicCount++;
      return undefined;

    case 'BinaryExpression':
      if (node.operator === '+') {
        const left = evalStaticAstNode(node.left, meta, path, scopeMap);
        const right = evalStaticAstNode(node.right, meta, path, scopeMap);
        if ((typeof left === 'string' || typeof left === 'number') && (typeof right === 'string' || typeof right === 'number')) {
          return left + right;
        }
      }
      meta.dynamicCount++;
      return undefined;

    case 'ArrayExpression': {
      const arr = [];
      node.elements.forEach((el, i) => {
        if (!el) return;
        if (el.type === 'SpreadElement') {
          const spreadVal = evalStaticAstNode(el.argument, meta, `${path}[...${i}]`, scopeMap);
          if (Array.isArray(spreadVal)) {
            arr.push(...spreadVal);
          } else {
            meta.dynamicCount++;
          }
        } else {
          arr.push(evalStaticAstNode(el, meta, `${path}[${i}]`, scopeMap));
        }
      });
      return arr;
    }

    case 'ObjectExpression': {
      const obj = {};
      for (const prop of node.properties) {
        if (prop.type === 'SpreadElement') {
          const spreadObj = evalStaticAstNode(prop.argument, meta, `${path}...spread`, scopeMap);
          if (spreadObj && typeof spreadObj === 'object' && !Array.isArray(spreadObj)) {
            Object.assign(obj, spreadObj);
          } else {
            meta.dynamicCount++;
            meta.dynamicPaths.push(`${path}...spread`);
          }
          continue;
        }
        let key;
        if (!prop.computed && prop.key.type === 'Identifier') key = prop.key.name;
        else if (prop.key.type === 'Literal') key = String(prop.key.value);
        else {
          meta.dynamicCount++;
          continue;
        }
        obj[key] = evalStaticAstNode(prop.value, meta, path ? `${path}.${key}` : key, scopeMap);
      }
      return obj;
    }

    case 'CallExpression': {
      // Support safe static array helpers like Array.from([...]) or [...].concat([...])
      if (
        node.callee?.type === 'MemberExpression' &&
        !node.callee.computed &&
        node.callee.property?.name === 'concat' &&
        node.callee.object?.type === 'ArrayExpression'
      ) {
        const baseArr = evalStaticAstNode(node.callee.object, meta, path, scopeMap);
        if (Array.isArray(baseArr)) {
          const out = [...baseArr];
          for (const arg of node.arguments || []) {
            const ev = evalStaticAstNode(arg, meta, path, scopeMap);
            if (Array.isArray(ev)) out.push(...ev);
          }
          return out;
        }
      }
      meta.dynamicCount++;
      meta.dynamicPaths.push(path || 'CallExpression');
      return `[Dynamic JS Expression: CallExpression]`;
    }

    default:
      meta.dynamicCount++;
      meta.dynamicPaths.push(path || node.type);
      return `[Dynamic JS Expression: ${node.type}]`;
  }
}

function formatAssignmentTargetName(leftNode) {
  if (!leftNode) return 'assignedData';
  if (leftNode.type === 'Identifier') return leftNode.name;
  if (leftNode.type === 'MemberExpression') {
    const objName =
      leftNode.object?.type === 'Identifier'
        ? leftNode.object.name
        : leftNode.object?.type === 'MemberExpression' && leftNode.object.property?.name
        ? leftNode.object.property.name
        : 'window';
    const propName =
      !leftNode.computed && leftNode.property?.type === 'Identifier'
        ? leftNode.property.name
        : leftNode.property?.type === 'Literal'
        ? String(leftNode.property.value)
        : 'data';
    if (objName === 'window' || objName === 'globalThis' || objName === 'self') {
      return `${objName}.${propName}`;
    }
    return `${objName}.${propName}`;
  }
  return 'assignedData';
}

function isDataContainerNode(node) {
  if (!node) return false;
  if (node.type === 'ArrayExpression' || node.type === 'ObjectExpression') return true;
  if (
    node.type === 'CallExpression' &&
    node.callee?.type === 'MemberExpression' &&
    node.callee.property?.name === 'concat'
  ) {
    return true;
  }
  return false;
}

/**
 * Pre-populates `scopeMap` with static scalar/template/string/number bindings
 * declared in the script (e.g. `const svgStarToMesh = "<svg>...</svg>"`) so
 * template literals inside MCQ objects can reference them statically.
 */
function populateStaticScopeBindings(ast, scopeMap) {
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.init && !isDataContainerNode(node.init)) {
      const tmpMeta = { dynamicCount: 0, dynamicPaths: [] };
      const val = evalStaticAstNode(node.init, tmpMeta, node.id.name, scopeMap);
      if (tmpMeta.dynamicCount === 0 && (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean')) {
        scopeMap.set(node.id.name, val);
      }
      return;
    }

    if (
      node.type === 'AssignmentExpression' &&
      node.left?.type === 'Identifier' &&
      node.right &&
      !isDataContainerNode(node.right)
    ) {
      const tmpMeta = { dynamicCount: 0, dynamicPaths: [] };
      const val = evalStaticAstNode(node.right, tmpMeta, node.left.name, scopeMap);
      if (tmpMeta.dynamicCount === 0 && (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean')) {
        scopeMap.set(node.left.name, val);
      }
      return;
    }

    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'range') continue;
      const val = node[key];
      if (val && typeof val === 'object') visit(val);
    }
  };

  visit(ast);
}

function collectAstCandidateRoots(ast) {
  const candidates = [];

  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (node.type === 'VariableDeclarator' && node.init && isDataContainerNode(node.init)) {
      candidates.push({ name: node.id?.name || 'variable', node: node.init });
      return;
    }
    if (node.type === 'AssignmentExpression' && node.right && isDataContainerNode(node.right)) {
      candidates.push({ name: formatAssignmentTargetName(node.left), node: node.right });
      return;
    }
    if (node.type === 'ExportDefaultDeclaration' && node.declaration && isDataContainerNode(node.declaration)) {
      candidates.push({ name: 'defaultExport', node: node.declaration });
      return;
    }
    if (node.type === 'CallExpression' && Array.isArray(node.arguments)) {
      // Check if an inline array/object of questions is passed directly to a render/init function e.g. renderQuiz([...])
      const calleeName =
        node.callee?.type === 'Identifier'
          ? node.callee.name
          : node.callee?.type === 'MemberExpression' && node.callee.property?.name
          ? node.callee.property.name
          : 'callArg';
      node.arguments.forEach((arg) => {
        if (arg && (arg.type === 'ArrayExpression' || arg.type === 'ObjectExpression')) {
          candidates.push({ name: `${calleeName}(...)`, node: arg });
        }
      });
    }

    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'range') continue;
      const val = node[key];
      if (val && typeof val === 'object') visit(val);
    }
  };

  visit(ast);
  return candidates;
}

/**
 * Safely extracts static MCQ objects from JavaScript source code using Acorn AST.
 * NEVER executes code.
 */
export function parseJsSourceMcqs(rawJs, options = {}) {
  if (!rawJs || typeof rawJs !== 'string') {
    return { items: [], warnings: ['No JavaScript input provided.'] };
  }

  const trimmed = rawJs.trim();
  // Quick check: if it's actually plain JSON, route straight to JSON parser
  if ((trimmed.startsWith('[') || trimmed.startsWith('{')) && !trimmed.includes('function') && !trimmed.includes('=>')) {
    try {
      const jsonCheck = JSON.parse(trimmed);
      if (jsonCheck) return parseJsonMcqs(trimmed, options);
    } catch {
      // Fall through to Acorn (could be a JS object literal with unquoted keys)
    }
  }

  let ast = null;
  let parseErr = null;
  for (const sourceType of ['module', 'script']) {
    try {
      ast = acorn.parse(trimmed, { ecmaVersion: 'latest', sourceType, allowReturnOutsideFunction: true });
      break;
    } catch (err) {
      parseErr = err;
    }
  }

  // Fallback for bare object/array expression snippets e.g. `{ questions: [...] }`
  if (!ast && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
    try {
      ast = acorn.parse(`(${trimmed})`, { ecmaVersion: 'latest', sourceType: 'script' });
    } catch (err) {
      parseErr = err;
    }
  }

  if (!ast) {
    return {
      items: [],
      warnings: [`Could not parse JavaScript syntax safely: ${parseErr?.message || 'Syntax error'}`],
      syntaxError: true,
    };
  }

  const candidateAstRoots = collectAstCandidateRoots(ast);
  // Also allow standalone ExpressionStatement (like `([...])`)
  if (candidateAstRoots.length === 0 && ast.body?.length === 1 && ast.body[0].type === 'ExpressionStatement') {
    candidateAstRoots.push({ name: 'expression', node: ast.body[0].expression });
  }

  const items = [];
  const warnings = [];
  const detectedVariableNames = [];
  const scopeMap = new Map();
  populateStaticScopeBindings(ast, scopeMap);

  let totalDynamicCount = 0;
  let rawDetectedCount = 0;

  const detectedSourceType = options.detectedSourceType || 'JavaScript-embedded MCQ array';

  candidateAstRoots.forEach((cand) => {
    const meta = { dynamicCount: 0, dynamicPaths: [] };
    const evaluated = evalStaticAstNode(cand.node, meta, cand.name, scopeMap);
    if (cand.name && evaluated !== undefined) {
      scopeMap.set(cand.name, evaluated);
    }
    const collected = collectQuestionObjects(evaluated, [], [], cand.name);
    if (collected.length > 0) {
      rawDetectedCount += collected.length;
      if (cand.name && !detectedVariableNames.includes(cand.name)) {
        detectedVariableNames.push(cand.name);
      }
      if (meta.dynamicCount > 0) {
        totalDynamicCount += meta.dynamicCount;
      }
      collected.forEach((entry) => {
        const itemWarnings = meta.dynamicCount > 0
          ? [`Source JS contained ${meta.dynamicCount} dynamic expression(s) skipped for security; verify values manually.`]
          : [];
        items.push(
          mapRawObjectToMcq(entry.raw, items.length, entry.inheritedTags, options.sourceFormat || 'js', itemWarnings, {
            detectedSourceType,
            variableName: entry.variableName || cand.name || '',
            fileName: options.fileName || '',
          })
        );
      });
    }
  });

  if (totalDynamicCount > 0) {
    warnings.push(
      `Security notice: ${totalDynamicCount} dynamic JavaScript expression(s) were detected and NOT executed. Affected fields are flagged for manual review.`
    );
  }
  if (items.length === 0) {
    warnings.push('No static MCQ arrays/objects were found in the JavaScript source.');
  }

  return {
    items,
    warnings,
    detectedSourceType,
    detectedVariableName: detectedVariableNames.join(', '),
    detectedVariableNames,
    rawDetectedCount,
  };
}

