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
import { normalizeMcqItem, htmlToPlainText } from '../schema.js';

const PREFERRED_COLLECTION_KEYS = new Set([
  'questions',
  'mcqs',
  'mcq',
  'quiz',
  'quizdata',
  'questionbank',
  'data',
  'items',
  'bank',
  'records',
  'list',
]);

const LABEL_MAP = {
  a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7,
  'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3, 'ঙ': 4, 'চ': 5, 'ছ': 6, 'জ': 7,
};

function looksLikeQuestionObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj).map((k) => k.toLowerCase());
  const hasQ = keys.some((k) =>
    ['question', 'questionhtml', 'questiontext', 'question_text', 'q', 'stem', 'prompt', 'title', 'text'].includes(k)
  );
  const hasOpts =
    keys.some((k) => ['options', 'optionshtml', 'choices', 'answers', 'alternatives', 'opts'].includes(k)) ||
    (keys.includes('a') && keys.includes('b')) ||
    (keys.includes('optiona') && keys.includes('optionb')) ||
    (keys.includes('option1') && keys.includes('option2'));
  return hasQ && hasOpts;
}

/**
 * Recursively collects candidate question objects from nested JS/JSON structures.
 */
function collectQuestionObjects(root, results = [], parentTags = []) {
  if (!root || typeof root !== 'object') return results;

  if (Array.isArray(root)) {
    root.forEach((entry) => {
      if (looksLikeQuestionObject(entry)) {
        results.push({ raw: entry, inheritedTags: parentTags });
      } else if (entry && typeof entry === 'object') {
        collectQuestionObjects(entry, results, parentTags);
      }
    });
    return results;
  }

  if (looksLikeQuestionObject(root)) {
    results.push({ raw: root, inheritedTags: parentTags });
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
      collectQuestionObjects(val, results, nextTags);
    }
  }
  return results;
}

function mapRawObjectToMcq(raw, idx, inheritedTags, sourceFormat, dynamicWarnings = []) {
  const warnings = [...dynamicWarnings];
  const getAny = (...names) => {
    for (const n of names) {
      if (raw[n] !== undefined && raw[n] !== null) return raw[n];
      const matchKey = Object.keys(raw).find((k) => k.toLowerCase() === n.toLowerCase());
      if (matchKey && raw[matchKey] !== undefined && raw[matchKey] !== null) return raw[matchKey];
    }
    return undefined;
  };

  const qHtmlVal = getAny('questionHtml', 'question_html');
  const qVal = getAny('question', 'questionText', 'question_text', 'q', 'stem', 'prompt', 'title', 'text');
  const qStr = qVal !== undefined ? String(qVal) : '';

  // Options extraction (array, object map {a,b,c,d}, or top-level keys a/b/c/d, optionA/B/C/D)
  let rawOptions = getAny('options', 'choices', 'answers', 'alternatives', 'opts');
  let rawOptionsHtml = getAny('optionsHtml', 'options_html');
  let optionKeyOrder = [];

  if (rawOptions && typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
    const keys = Object.keys(rawOptions);
    optionKeyOrder = keys.map((k) => k.toLowerCase());
    rawOptions = keys.map((k) => rawOptions[k]);
  } else if (!Array.isArray(rawOptions)) {
    const extractedOpts = [];
    const letterGroups = [
      ['a', 'b', 'c', 'd', 'e'],
      ['optionA', 'optionB', 'optionC', 'optionD', 'optionE'],
      ['optA', 'optB', 'optC', 'optD', 'optE'],
      ['option1', 'option2', 'option3', 'option4', 'option5'],
      ['ক', 'খ', 'গ', 'ঘ'],
    ];
    for (const grp of letterGroups) {
      const vals = grp.map((k) => getAny(k)).filter((v) => v !== undefined && v !== '');
      if (vals.length >= 2) {
        vals.forEach((v, i) => {
          extractedOpts.push(v);
          optionKeyOrder.push(grp[i].toLowerCase());
        });
        break;
      }
    }
    rawOptions = extractedOpts;
  }

  const cleanOptions = Array.isArray(rawOptions)
    ? rawOptions.map((o) => {
        if (o && typeof o === 'object') {
          return String(o.text ?? o.label ?? o.value ?? o.option ?? '');
        }
        return String(o ?? '');
      })
    : [];

  const cleanOptionsHtml = Array.isArray(rawOptionsHtml)
    ? rawOptionsHtml.map((o) => String(o ?? ''))
    : undefined;

  // Correct answer resolution (supports index, letter, boolean option flags, or string)
  let correctIndex = -1;
  let correctAnswer = '';

  // Check if options objects carry { isCorrect: true } / { correct: true }
  const origArr = getAny('options', 'choices', 'answers');
  if (Array.isArray(origArr)) {
    const objCorrectIdx = origArr.findIndex(
      (o) => o && typeof o === 'object' && (o.isCorrect === true || o.correct === true)
    );
    if (objCorrectIdx !== -1) correctIndex = objCorrectIdx;
  }

  const rawIdx = getAny('correctIndex', 'correct_index', 'answerIndex', 'answer_index', 'rightIndex');
  if (correctIndex === -1 && typeof rawIdx === 'number' && Number.isInteger(rawIdx)) {
    if (rawIdx >= 0 && rawIdx < cleanOptions.length) {
      correctIndex = rawIdx;
    } else if (rawIdx >= 1 && rawIdx <= cleanOptions.length) {
      correctIndex = rawIdx - 1;
      warnings.push('Interpreted out-of-range numeric correctIndex as 1-based index.');
    }
  }

  const rawAns = getAny('correctAnswer', 'correct_answer', 'correct', 'answer', 'ans', 'rightAnswer', 'right_option');
  if (correctIndex === -1 && rawAns !== undefined) {
    if (typeof rawAns === 'number' && Number.isInteger(rawAns)) {
      if (rawAns >= 0 && rawAns < cleanOptions.length) {
        correctIndex = rawAns;
      } else if (rawAns === cleanOptions.length) {
        correctIndex = rawAns - 1;
      }
    } else if (typeof rawAns === 'string') {
      const trimmed = rawAns.trim();
      const lower = trimmed.toLowerCase();
      if (optionKeyOrder.includes(lower)) {
        correctIndex = optionKeyOrder.indexOf(lower);
      } else {
        const lm = trimmed.match(/^\(?([a-hA-Hক-জ])\)?[\.\)]?$/);
        if (lm && LABEL_MAP[lm[1].toLowerCase()] !== undefined && cleanOptions[LABEL_MAP[lm[1].toLowerCase()]] !== undefined) {
          correctIndex = LABEL_MAP[lm[1].toLowerCase()];
        } else {
          const textMatch = cleanOptions.findIndex(
            (o) => htmlToPlainText(o).trim().toLowerCase() === htmlToPlainText(trimmed).trim().toLowerCase()
          );
          if (textMatch !== -1) {
            correctIndex = textMatch;
          } else {
            correctAnswer = trimmed;
          }
        }
      }
    }
  }

  const expVal = getAny('explanationHtml', 'explanation_html', 'explanation', 'rationale', 'solution', 'hint', 'details');
  const noteVal = getAny('noteHtml', 'note_html', 'note');
  const rawTags = getAny('tags', 'tag', 'category', 'topic', 'subject');
  const tags = [
    ...inheritedTags,
    ...(Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : []),
  ]
    .filter(Boolean)
    .map(String);

  return normalizeMcqItem(
    {
      id: getAny('id') ?? idx + 1,
      question: qStr,
      questionHtml: qHtmlVal ? String(qHtmlVal) : undefined,
      options: cleanOptions,
      optionsHtml: cleanOptionsHtml,
      correctIndex,
      correctAnswer: correctIndex !== -1 ? cleanOptions[correctIndex] : correctAnswer,
      explanation: expVal !== undefined ? String(expVal) : noteVal !== undefined ? String(noteVal) : '',
      note: noteVal !== undefined ? String(noteVal) : expVal !== undefined ? String(expVal) : '',
      tags: [...new Set(tags)],
      sourceFormat,
      confidence: dynamicWarnings.length > 0 ? 'manual' : undefined,
      warnings,
    },
    idx
  );
}

/**
 * Safely parses JSON text into normalized v2 MCQs.
 */
export function parseJsonMcqs(rawJson) {
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

  const collected = collectQuestionObjects(parsed);
  if (collected.length === 0) {
    return {
      items: [],
      warnings: ['JSON parsed successfully, but no recognizable question objects (with question + options) were found.'],
    };
  }

  const items = collected.map((entry, idx) =>
    mapRawObjectToMcq(entry.raw, idx, entry.inheritedTags, 'json')
  );
  return { items, warnings: [] };
}

/**
 * Static AST evaluator: evaluates ONLY pure literals, static arrays, static objects,
 * binary '+' string concatenation, and zero-expression template literals.
 * NEVER executes functions or external identifiers—marks dynamic fields cleanly.
 */
function evalStaticAstNode(node, meta = { dynamicCount: 0, dynamicPaths: [] }, path = '') {
  if (!node) return undefined;

  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'TemplateLiteral':
      if (!node.expressions || node.expressions.length === 0) {
        return node.quasis.map((q) => q.value?.cooked ?? q.value?.raw ?? '').join('');
      }
      meta.dynamicCount++;
      meta.dynamicPaths.push(path || 'template-expression');
      return `[Dynamic Template Value]`;

    case 'UnaryExpression':
      if (node.operator === '-' || node.operator === '+') {
        const arg = evalStaticAstNode(node.argument, meta, path);
        if (typeof arg === 'number') return node.operator === '-' ? -arg : +arg;
      }
      if (node.operator === '!') {
        const arg = evalStaticAstNode(node.argument, meta, path);
        if (typeof arg === 'boolean') return !arg;
      }
      meta.dynamicCount++;
      return undefined;

    case 'BinaryExpression':
      if (node.operator === '+') {
        const left = evalStaticAstNode(node.left, meta, path);
        const right = evalStaticAstNode(node.right, meta, path);
        if ((typeof left === 'string' || typeof left === 'number') && (typeof right === 'string' || typeof right === 'number')) {
          return left + right;
        }
      }
      meta.dynamicCount++;
      return undefined;

    case 'ArrayExpression':
      return node.elements.map((el, i) => (el ? evalStaticAstNode(el, meta, `${path}[${i}]`) : undefined));

    case 'ObjectExpression': {
      const obj = {};
      for (const prop of node.properties) {
        if (prop.type === 'SpreadElement') {
          meta.dynamicCount++;
          meta.dynamicPaths.push(`${path}...spread`);
          continue;
        }
        let key;
        if (!prop.computed && prop.key.type === 'Identifier') key = prop.key.name;
        else if (prop.key.type === 'Literal') key = String(prop.key.value);
        else {
          meta.dynamicCount++;
          continue;
        }
        obj[key] = evalStaticAstNode(prop.value, meta, path ? `${path}.${key}` : key);
      }
      return obj;
    }

    default:
      meta.dynamicCount++;
      meta.dynamicPaths.push(path || node.type);
      return `[Dynamic JS Expression: ${node.type}]`;
  }
}

function collectAstCandidateRoots(ast) {
  const candidates = [];

  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (node.type === 'VariableDeclarator' && node.init && (node.init.type === 'ArrayExpression' || node.init.type === 'ObjectExpression')) {
      candidates.push({ name: node.id?.name || '', node: node.init });
      return;
    }
    if (node.type === 'AssignmentExpression' && node.right && (node.right.type === 'ArrayExpression' || node.right.type === 'ObjectExpression')) {
      candidates.push({ name: 'assignedExport', node: node.right });
      return;
    }
    if (node.type === 'ExportDefaultDeclaration' && node.declaration && (node.declaration.type === 'ArrayExpression' || node.declaration.type === 'ObjectExpression')) {
      candidates.push({ name: 'defaultExport', node: node.declaration });
      return;
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
export function parseJsSourceMcqs(rawJs) {
  if (!rawJs || typeof rawJs !== 'string') {
    return { items: [], warnings: ['No JavaScript input provided.'] };
  }

  const trimmed = rawJs.trim();
  // Quick check: if it's actually plain JSON, route straight to JSON parser
  if ((trimmed.startsWith('[') || trimmed.startsWith('{')) && !trimmed.includes('function') && !trimmed.includes('=>')) {
    try {
      const jsonCheck = JSON.parse(trimmed);
      if (jsonCheck) return parseJsonMcqs(trimmed);
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
  let totalDynamicCount = 0;

  candidateAstRoots.forEach((cand) => {
    const meta = { dynamicCount: 0, dynamicPaths: [] };
    const evaluated = evalStaticAstNode(cand.node, meta, cand.name);
    if (meta.dynamicCount > 0) {
      totalDynamicCount += meta.dynamicCount;
    }
    const collected = collectQuestionObjects(evaluated);
    collected.forEach((entry) => {
      const itemWarnings = meta.dynamicCount > 0
        ? [`Source JS contained ${meta.dynamicCount} dynamic expression(s) skipped for security; verify values manually.`]
        : [];
      items.push(mapRawObjectToMcq(entry.raw, items.length, entry.inheritedTags, 'js', itemWarnings));
    });
  });

  if (totalDynamicCount > 0) {
    warnings.push(
      `Security notice: ${totalDynamicCount} dynamic JavaScript expression(s) were detected and NOT executed. Affected fields are flagged for manual review.`
    );
  }
  if (items.length === 0) {
    warnings.push('No static MCQ arrays/objects were found in the JavaScript source.');
  }

  return { items, warnings };
}
