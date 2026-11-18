/**
 * Class Caddy MCQ Engine — Chunked Extraction Orchestrator & Duplicate Detector
 *
 * Coordinates extraction across Plain Text, HTML, DOCX, DOC (rejected honestly),
 * JSON, and JS AST inputs with non-blocking chunked yields, progress updates,
 * cancellation support, confidence scoring, and batch/existing duplicate detection.
 */

import { normalizeMcqItem, computeFingerprint } from './schema.js';
import { parsePlainTextMcqs } from './parsers/text-parser.js';
import { parseHtmlMcqs } from './parsers/html-parser.js';
import { parseDocxArrayBuffer } from './parsers/docx-parser.js';
import { parseJsonMcqs, parseJsSourceMcqs } from './parsers/source-parser.js';

function yieldToMain() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function throwIfAborted(signal) {
  if (signal && signal.aborted) {
    const err = new DOMException('Import aborted by user.', 'AbortError');
    throw err;
  }
}

async function processItemsChunked(rawItems, existingMcqs = [], onProgress = null, signal = null) {
  const existingMap = new Map();
  existingMcqs.forEach((ex, idx) => {
    const fp = ex.fingerprint || computeFingerprint(ex);
    if (fp && fp !== '::') existingMap.set(fp, idx);
  });

  const batchMap = new Map();
  const normalized = [];
  const total = rawItems.length;
  const CHUNK_SIZE = 35;

  for (let i = 0; i < total; i++) {
    throwIfAborted(signal);
    const item = normalizeMcqItem(rawItems[i], i);
    const fp = item.fingerprint;

    if (fp && fp !== '::') {
      if (existingMap.has(fp)) {
        item.duplicateStatus = 'existing';
        item.duplicateOfIndex = existingMap.get(fp);
        item.duplicateResolution = 'skip'; // default safe action; user can switch to replace/import
      } else if (batchMap.has(fp)) {
        item.duplicateStatus = 'batch';
        item.duplicateOfIndex = batchMap.get(fp);
        item.duplicateResolution = 'skip';
      } else {
        item.duplicateStatus = 'none';
        batchMap.set(fp, i);
      }
    } else {
      item.duplicateStatus = 'none';
    }

    normalized.push(item);

    if ((i + 1) % CHUNK_SIZE === 0 && i + 1 < total) {
      if (onProgress) {
        onProgress({
          processed: i + 1,
          total,
          percent: Math.round(((i + 1) / total) * 100),
          status: `Validating & checking duplicates (${i + 1}/${total})...`,
        });
      }
      await yieldToMain();
    }
  }

  return normalized;
}

/**
 * Extracts MCQs from uploaded files (multi-file queue) or pasted content.
 */
export async function extractMcqsFromInput({
  mode = 'text',
  text = '',
  html = '',
  sourceText = '',
  files = [],
  existingMcqs = [],
  preserveCss = true,
  onProgress = null,
  signal = null,
}) {
  const collectedRaw = [];
  const warnings = [];
  const fileReports = [];
  const sourceTypes = [];
  const variableNames = [];
  const fileNames = [];
  let totalDetectedRaw = 0;

  const recordMeta = (res, name = '') => {
    if (name && !fileNames.includes(name)) fileNames.push(name);
    if (res?.detectedSourceType && !sourceTypes.includes(res.detectedSourceType)) {
      sourceTypes.push(res.detectedSourceType);
    }
    if (res?.detectedVariableName) {
      res.detectedVariableName
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((v) => {
          if (!variableNames.includes(v)) variableNames.push(v);
        });
    }
    const rawCount = typeof res?.rawDetectedCount === 'number' && res.rawDetectedCount > 0
      ? res.rawDetectedCount
      : (res?.items || []).length;
    totalDetectedRaw += rawCount;
  };

  const report = (percent, status, processed = 0, total = 0) => {
    if (onProgress) onProgress({ percent, status, processed, total });
  };

  throwIfAborted(signal);

  if (mode === 'files') {
    const fileList = Array.from(files || []);
    for (let fIdx = 0; fIdx < fileList.length; fIdx++) {
      throwIfAborted(signal);
      const file = fileList[fIdx];
      const name = file.name || `file-${fIdx + 1}`;
      const lower = name.toLowerCase();
      const basePct = Math.round((fIdx / Math.max(1, fileList.length)) * 70);
      report(basePct, `Reading "${name}"...`, fIdx, fileList.length);

      try {
        if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
          const buf = await file.arrayBuffer();
          const res = await parseDocxArrayBuffer(buf, name);
          collectedRaw.push(...(res.items || []));
          recordMeta(
            {
              ...res,
              detectedSourceType: res.detectedSourceType || 'Word Document (.docx)',
              detectedVariableName: res.detectedVariableName || 'DOCX body',
            },
            name
          );
          (res.warnings || []).forEach((w) => warnings.push(w));
          fileReports.push({
            name,
            size: file.size || 0,
            count: (res.items || []).length,
            detectedSourceType: res.detectedSourceType || 'Word Document (.docx)',
            detectedVariableName: res.detectedVariableName || '',
            status: res.unsupportedFormat ? 'error' : (res.items || []).length > 0 ? 'ok' : 'warning',
            warnings: res.warnings || [],
          });
        } else if (lower.endsWith('.html') || lower.endsWith('.htm')) {
          const content = await file.text();
          const res = parseHtmlMcqs(content, { preserveCss, fileName: name });
          collectedRaw.push(...(res.items || []));
          recordMeta(res, name);
          (res.warnings || []).forEach((w) => warnings.push(`${name}: ${w}`));
          fileReports.push({
            name,
            size: file.size || 0,
            count: (res.items || []).length,
            detectedSourceType: res.detectedSourceType || 'HTML Document',
            detectedVariableName: res.detectedVariableName || '',
            status: (res.items || []).length > 0 ? 'ok' : 'warning',
            warnings: res.warnings || [],
          });
        } else if (lower.endsWith('.json')) {
          const content = await file.text();
          const res = parseJsonMcqs(content, { fileName: name });
          collectedRaw.push(...(res.items || []));
          recordMeta(res, name);
          (res.warnings || []).forEach((w) => warnings.push(`${name}: ${w}`));
          fileReports.push({
            name,
            size: file.size || 0,
            count: (res.items || []).length,
            detectedSourceType: res.detectedSourceType || 'JSON file',
            detectedVariableName: res.detectedVariableName || '',
            status: res.syntaxError ? 'error' : (res.items || []).length > 0 ? 'ok' : 'warning',
            warnings: res.warnings || [],
          });
        } else if (lower.endsWith('.js') || lower.endsWith('.mjs')) {
          const content = await file.text();
          const res = parseJsSourceMcqs(content, { fileName: name, detectedSourceType: 'JavaScript MCQ file' });
          collectedRaw.push(...(res.items || []));
          recordMeta(res, name);
          (res.warnings || []).forEach((w) => warnings.push(`${name}: ${w}`));
          fileReports.push({
            name,
            size: file.size || 0,
            count: (res.items || []).length,
            detectedSourceType: res.detectedSourceType || 'JavaScript MCQ file',
            detectedVariableName: res.detectedVariableName || '',
            status: res.syntaxError ? 'error' : (res.items || []).length > 0 ? 'ok' : 'warning',
            warnings: res.warnings || [],
          });
        } else if (lower.endsWith('.txt') || lower.endsWith('.md')) {
          const content = await file.text();
          const res = parsePlainTextMcqs(content);
          collectedRaw.push(...(res.items || []));
          recordMeta(
            {
              ...res,
              detectedSourceType: 'Plain Text / Markdown',
              detectedVariableName: 'Text blocks',
            },
            name
          );
          (res.warnings || []).forEach((w) => warnings.push(`${name}: ${w}`));
          fileReports.push({
            name,
            size: file.size || 0,
            count: (res.items || []).length,
            detectedSourceType: 'Plain Text / Markdown',
            detectedVariableName: '',
            status: (res.items || []).length > 0 ? 'ok' : 'warning',
            warnings: res.warnings || [],
          });
        } else {
          const msg = `"${name}" is not a supported document format. Supported: .txt, .html/.htm, .docx, .json, .js.`;
          warnings.push(msg);
          fileReports.push({ name, size: file.size || 0, count: 0, status: 'error', warnings: [msg] });
        }
      } catch (err) {
        const msg = `Failed to read "${name}": ${err.message || 'Corrupted or unreadable file'}`;
        warnings.push(msg);
        fileReports.push({ name, size: file.size || 0, count: 0, status: 'error', warnings: [msg] });
      }

      await yieldToMain();
    }
  } else if (mode === 'html') {
    report(25, 'Inspecting HTML scripts, DOM & CSS styles...');
    await yieldToMain();
    const res = parseHtmlMcqs(html, { preserveCss, fileName: 'Pasted HTML' });
    collectedRaw.push(...(res.items || []));
    recordMeta(res, 'Pasted HTML');
    warnings.push(...(res.warnings || []));
  } else if (mode === 'source') {
    report(25, 'Running static AST / JSON extraction (no code executed)...');
    await yieldToMain();
    const trimmedSrc = String(sourceText || '').trim();
    const res =
      /^<!DOCTYPE\s+html/i.test(trimmedSrc) || /<html\b|<script\b/i.test(trimmedSrc)
        ? parseHtmlMcqs(sourceText, { preserveCss, fileName: 'Pasted HTML/Script' })
        : parseJsSourceMcqs(sourceText, { fileName: 'Pasted JS/JSON' });
    collectedRaw.push(...(res.items || []));
    recordMeta(res, 'Pasted JS/JSON');
    warnings.push(...(res.warnings || []));
  } else {
    report(25, 'Parsing input content...');
    await yieldToMain();
    const trimmedText = String(text || '').trim();
    let res;
    if (/^<!DOCTYPE\s+html/i.test(trimmedText) || /<html\b|<script\b/i.test(trimmedText)) {
      res = parseHtmlMcqs(text, { preserveCss, fileName: 'Pasted HTML' });
      recordMeta(res, 'Pasted HTML');
    } else if (
      /^(?:const|let|var|window\.|export\s+)/.test(trimmedText) ||
      ((trimmedText.startsWith('[') || trimmedText.startsWith('{')) && /question|options|"q"\s*:|\bq\s*:/i.test(trimmedText))
    ) {
      res = parseJsSourceMcqs(text, { fileName: 'Pasted JS/JSON' });
      recordMeta(res, 'Pasted JS/JSON');
    } else {
      res = parsePlainTextMcqs(text);
      recordMeta(
        {
          ...res,
          detectedSourceType: 'Plain Text MCQ blocks',
          detectedVariableName: 'Text numbering',
        },
        'Pasted Text'
      );
    }
    collectedRaw.push(...(res.items || []));
    warnings.push(...(res.warnings || []));
  }

  throwIfAborted(signal);
  report(75, `Normalizing ${collectedRaw.length} question(s)...`, 0, collectedRaw.length);

  const items = await processItemsChunked(collectedRaw, existingMcqs, onProgress, signal);

  report(100, `Ready: ${items.length} question(s) extracted`, items.length, items.length);

  const duplicatesExisting = items.filter((q) => q.duplicateStatus === 'existing').length;
  const duplicatesBatch = items.filter((q) => q.duplicateStatus === 'batch').length;
  const missingOptionsCount = items.filter((q) => q.missingOptions || (q.options || []).length < 2).length;
  const invalidAnswerCount = items.filter((q) => q.invalidAnswerRef).length;
  const validCount = items.filter(
    (q) =>
      !q.isIncomplete &&
      !q.missingOptions &&
      !q.invalidAnswerRef &&
      (q.options || []).length >= 2 &&
      (q.correctIndex !== -1 || Boolean(q.correctAnswer))
  ).length;
  const withExplanationCount = items.filter((q) => Boolean((q.explanation || q.note || '').trim())).length;
  const withHtmlCount = items.filter((q) => Boolean(q.hasHtmlFormatting)).length;
  const withLatexCount = items.filter((q) => Boolean(q.hasMath)).length;

  const summary = {
    total: items.length,
    fileName: fileNames.join(', ') || (mode === 'files' ? 'Uploaded File' : 'Pasted Input'),
    detectedSourceType: sourceTypes.join(', ') || 'Auto-detected MCQ input',
    detectedVariableName: variableNames.join(', ') || 'N/A',
    detectedCount: Math.max(totalDetectedRaw, items.length),
    validCount,
    missingOptionsCount,
    invalidAnswerCount,
    withExplanationCount,
    withHtmlCount,
    withLatexCount,
    duplicateCount: duplicatesExisting + duplicatesBatch,
    highConfidence: items.filter((q) => q.confidence === 'high').length,
    needsReview: items.filter((q) => q.confidence !== 'high' || (q.warnings && q.warnings.length > 0)).length,
    duplicatesExisting,
    duplicatesBatch,
  };

  return { items, warnings: [...new Set(warnings)], fileReports, summary };
}
