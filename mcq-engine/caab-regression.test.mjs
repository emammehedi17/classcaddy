/**
 * Permanent Regression Test Suite for Class Caddy MCQ Extraction Engine
 * Verifies the real CAAB Question Bank HTML file (200 JS-embedded MCQs) and
 * all required JavaScript/HTML/LaTeX/Bengali edge cases.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseHtmlMcqs } from './parsers/html-parser.js';
import { parseJsSourceMcqs, parseJsonMcqs } from './parsers/source-parser.js';
import { extractMcqsFromInput } from './extractor.js';
import { renderMcqFieldHtml, renderRichHtmlString } from './renderer.js';
import { toStorageMcqList, normalizeMcqList, isOptionCorrect, isUserSelectionCorrect } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAAB_HTML_PATH = path.resolve(
  __dirname,
  '../public/assets/aistudio/CAAB_Question_Bank_-_Part_1__Questions_1_to_200__b473ec34.html'
);

async function runTests() {
  console.log('=== Running CAAB Question Bank & Advanced HTML/JS Extraction Regression Suite ===');

  // 1. Verify CAAB HTML fixture exists
  assert.ok(fs.existsSync(CAAB_HTML_PATH), `CAAB HTML fixture must exist at ${CAAB_HTML_PATH}`);
  const caabHtml = fs.readFileSync(CAAB_HTML_PATH, 'utf8');

  // 2. Test direct parseHtmlMcqs on CAAB HTML
  const parsed = parseHtmlMcqs(caabHtml, {
    preserveCss: true,
    fileName: 'CAAB Question Bank - Part 1 (Questions 1 to 200).html',
  });

  assert.equal(parsed.detectedSourceType, 'JavaScript-embedded MCQ array', 'Must detect JavaScript-embedded MCQ array');
  assert.equal(parsed.detectedVariableName, 'mcqData', 'Must detect variable name mcqData');
  assert.equal(parsed.rawDetectedCount, 200, 'Must detect 200 raw question objects');
  assert.equal(parsed.items.length, 200, 'Must extract all 200 questions');
  assert.equal(parsed.warnings.length, 0, 'Must have 0 extraction warnings on valid CAAB file');

  // 3. Test full async extractor pipeline (simulating File Upload of CAAB HTML)
  const fakeFile = {
    name: 'CAAB Question Bank - Part 1 (Questions 1 to 200).html',
    size: Buffer.byteLength(caabHtml, 'utf8'),
    text: async () => caabHtml,
  };

  const extracted = await extractMcqsFromInput({
    mode: 'files',
    files: [fakeFile],
    existingMcqs: [],
    preserveCss: true,
  });

  const { items, summary } = extracted;
  assert.equal(items.length, 200, 'Extractor must return 200 items');
  assert.equal(summary.fileName, 'CAAB Question Bank - Part 1 (Questions 1 to 200).html');
  assert.equal(summary.detectedSourceType, 'JavaScript-embedded MCQ array');
  assert.equal(summary.detectedVariableName, 'mcqData');
  assert.equal(summary.detectedCount, 200);
  assert.equal(summary.validCount, 200);
  assert.equal(summary.missingOptionsCount, 0);
  assert.equal(summary.invalidAnswerCount, 0);
  assert.equal(summary.withExplanationCount, 200);
  assert.equal(summary.withHtmlCount, 196);
  assert.ok(summary.withLatexCount >= 61, `Expected >= 61 LaTeX questions, got ${summary.withLatexCount}`);
  assert.equal(summary.duplicateCount, 0);

  // 4. Verify sequential IDs 1..200, 4 options each, mapped correct answers, and non-empty notes
  items.forEach((item, idx) => {
    const expectedId = idx + 1;
    assert.equal(item.id, expectedId, `Question at index ${idx} must have id ${expectedId}`);
    assert.ok(item.question.length > 0, `Question #${expectedId} must have non-empty question stem`);
    assert.equal(item.options.length, 4, `Question #${expectedId} must have 4 options`);
    assert.ok(item.correctIndex >= 0 && item.correctIndex <= 3, `Question #${expectedId} must have valid correctIndex 0..3`);
    assert.equal(
      item.correctAnswer,
      item.options[item.correctIndex],
      `Question #${expectedId} correctAnswer must match options[correctIndex]`
    );
    assert.ok(item.explanation.length > 0, `Question #${expectedId} must have non-empty explanation`);
    assert.ok(item.note.length > 0, `Question #${expectedId} must have non-empty note`);
    assert.equal(item.isIncomplete, false, `Question #${expectedId} must not be marked incomplete`);
  });

  // 5. Inspect First (#1), Math/Division (#22), Fraction/HTML note (#28), Middle (#100), Angle Math (#191), and Last (#200)
  const q1 = items[0];
  assert.ok(q1.question.includes('কোন যুদ্ধের মাধ্যমে ভারতের মোগল সাম্রাজ্যের পতন ঘটেছিল?'), 'Q1 stem must match');
  assert.equal(q1.correctIndex, 1, 'Q1 ans is "b" -> correctIndex 1');
  assert.equal(q1.correctAnswer, 'পানিপথের তৃতীয় যুদ্ধ', 'Q1 correct option must be "পানিপথের তৃতীয় যুদ্ধ"');
  assert.ok(q1.noteHtml.includes('<b>') && q1.noteHtml.includes('<u>'), 'Q1 noteHtml must preserve <b> and <u> tags');

  const q22 = items[21]; // ID 22: contains $744 \div 8 = 93$ and <ul><li>
  assert.equal(q22.id, 22);
  assert.equal(q22.hasMath, true, 'Q22 must be flagged with hasMath: true');
  assert.ok(q22.noteHtml.includes('<ul>') && q22.noteHtml.includes('<li>'), 'Q22 noteHtml must preserve <ul><li> tags');

  const q28 = items[27]; // ID 28: contains \frac{100 \times 560}{112}
  assert.equal(q28.id, 28);
  assert.equal(q28.hasMath, true, 'Q28 must be flagged with hasMath: true');
  assert.equal(q28.correctIndex, 0, 'Q28 ans is "a" -> correctIndex 0 (৫০০ টাকা)');
  assert.equal(q28.correctAnswer, '৫০০ টাকা');

  const q100 = items[99]; // Middle question (#100)
  assert.equal(q100.id, 100);
  assert.equal(q100.correctIndex, 2, 'Q100 ans is "c" -> correctIndex 2');
  assert.equal(q100.correctAnswer, 'চট্টগ্রাম');

  const q191 = items[190]; // ID 191: contains $x > y$ inside HTML note
  assert.equal(q191.id, 191);
  assert.equal(q191.hasMath, true, 'Q191 must be flagged with hasMath: true');
  assert.equal(q191.correctIndex, 3, 'Q191 ans is "d" -> correctIndex 3 (2:1)');

  const q200 = items[199]; // Last question (#200)
  assert.equal(q200.id, 200);
  assert.ok(q200.question.includes('125 টি কমলা লেবু এবং 145 টি কলা'), 'Q200 stem must match');
  assert.equal(q200.correctIndex, 3, 'Q200 ans is "d" -> correctIndex 3');
  assert.equal(q200.correctAnswer, '5 জন');

  // 6. Render ALL 200 questions through Universal Renderer & verify 0 KaTeX fallback errors
  let renderedKaTeXCount = 0;
  items.forEach((item) => {
    const qRendered = renderMcqFieldHtml(item, 'question');
    const expRendered = renderMcqFieldHtml(item, 'explanation');
    assert.ok(!qRendered.includes('cc-math-fallback'), `Q#${item.id} question had KaTeX fallback error: ${qRendered}`);
    assert.ok(!expRendered.includes('cc-math-fallback'), `Q#${item.id} explanation had KaTeX fallback error: ${expRendered}`);
    if (qRendered.includes('class="katex"') || expRendered.includes('class="katex"')) {
      renderedKaTeXCount++;
    }
    item.options.forEach((_, oIdx) => {
      const optRendered = renderMcqFieldHtml(item, 'option', oIdx);
      assert.ok(!optRendered.includes('cc-math-fallback'), `Q#${item.id} option ${oIdx} had KaTeX fallback error`);
    });
  });
  assert.ok(renderedKaTeXCount >= 61, `Expected at least 61 questions to render KaTeX markup, got ${renderedKaTeXCount}`);

  // 7. Verify storage round-trip preserves HTML formatting and LaTeX source
  const stored = toStorageMcqList(items);
  assert.equal(stored.length, 200);
  const reloaded = normalizeMcqList(stored);
  assert.equal(reloaded.length, 200);
  assert.ok(reloaded[21].noteHtml.includes('<ul>'), 'Reloaded Q22 must preserve <ul>');
  assert.ok(reloaded[27].noteHtml.includes('\\frac'), 'Reloaded Q28 must preserve raw LaTeX \\frac');
  assert.equal(isOptionCorrect(reloaded[0], 1), true);
  assert.equal(isUserSelectionCorrect(reloaded[199], reloaded[199].options[3], 3), true);

  // 8. Test alternative JS variable patterns & property aliases inside HTML <script>
  const multiPatternHtml = `
    <!DOCTYPE html>
    <html>
    <body>
      <div id="app"></div>
      <script>
        window.MCQ_DATA = [
          {
            questionText: "What is $2^5$?",
            optionA: "16",
            optionB: "32",
            optionC: "64",
            optionD: "128",
            answerKey: "optionB",
            rationale: "<b>Explanation:</b> $2^5 = 32$"
          }
        ];
        let questionBank = {
          questions: [
            {
              prompt: "বাংলাদেশের রাজধানী কোনটি?",
              "ক": "চট্টগ্রাম",
              "খ": "ঢাকা",
              "গ": "খুলনা",
              "ঘ": "রাজশাহী",
              rightAnswer: "খ",
              solutionText: "ঢাকা বাংলাদেশের রাজধানী।"
            }
          ]
        };
      </script>
    </body>
    </html>
  `;
  const multiRes = parseHtmlMcqs(multiPatternHtml);
  assert.equal(multiRes.items.length, 2, 'Must extract from both window.MCQ_DATA and let questionBank');
  assert.equal(multiRes.items[0].correctIndex, 1);
  assert.equal(multiRes.items[0].correctAnswer, '32');
  assert.equal(multiRes.items[1].correctIndex, 1);
  assert.equal(multiRes.items[1].correctAnswer, 'ঢাকা');

  // 9. Test HTML data-* attributes extraction
  const dataAttrHtml = `
    <div class="mcq"
         data-question="Which planet is closest to the Sun?"
         data-option-a="Venus"
         data-option-b="Mercury"
         data-option-c="Mars"
         data-option-d="Jupiter"
         data-answer="B"
         data-explanation="Mercury is the closest planet to the Sun.">
    </div>
  `;
  const dataAttrRes = parseHtmlMcqs(dataAttrHtml);
  assert.equal(dataAttrRes.items.length, 1);
  assert.equal(dataAttrRes.detectedSourceType, 'HTML data-* attributes');
  assert.equal(dataAttrRes.items[0].correctIndex, 1);
  assert.equal(dataAttrRes.items[0].correctAnswer, 'Mercury');

  // 10. Test incomplete question objects & invalid answer references (must flag, not silently drop or invent)
  const incompleteJs = `
    const quizData = [
      { id: 1, q: "Valid question?", a: "Yes", b: "No", c: "Maybe", d: "None", ans: "a", note: "Valid" },
      { id: 2, q: "Question missing options?", a: "Only one option", ans: "a" },
      { id: 3, q: "Question with invalid answer ref?", a: "Opt 1", b: "Opt 2", c: "Opt 3", d: "Opt 4", ans: "z" }
    ];
  `;
  const incExt = await extractMcqsFromInput({ mode: 'source', sourceText: incompleteJs });
  assert.equal(incExt.summary.detectedCount, 3, 'Must detect all 3 question objects');
  assert.equal(incExt.summary.validCount, 1, 'Only 1 question is fully valid');
  assert.equal(incExt.summary.missingOptionsCount, 1, 'Must report 1 question with missing options');
  assert.equal(incExt.summary.invalidAnswerCount, 1, 'Must report 1 question with invalid answer ref');
  assert.equal(incExt.items[1].isIncomplete, true);
  assert.equal(incExt.items[2].isIncomplete, true);
  assert.equal(incExt.items[2].correctIndex, -1, 'Must not invent a correctIndex for invalid answer ref "z"');

  // 11. Test external <script src="..."> warning when HTML has no inline questions
  const externalScriptHtml = `
    <!DOCTYPE html>
    <html>
    <head><script src="questions-bank.js"></script></head>
    <body><div id="quiz"></div></body>
    </html>
  `;
  const extScriptRes = parseHtmlMcqs(externalScriptHtml);
  assert.equal(extScriptRes.items.length, 0);
  assert.ok(
    extScriptRes.warnings.some((w) => w.includes('questions-bank.js')),
    'Must warn clearly about external questions-bank.js reference'
  );

  // 12. Verify currency strings are NOT mistaken for LaTeX
  const currencyRendered = renderRichHtmlString('The ticket costs $50 or between $10 and $20.');
  assert.ok(!currencyRendered.includes('class="katex"'), 'Currency amounts must not be rendered as KaTeX');

  // 13. Verify Old View (raw stored) and New Exam (reloaded/normalized) produce identical HTML with no double-escaping
  stored.forEach((rawItem, idx) => {
    const normItem = reloaded[idx];
    assert.equal(renderMcqFieldHtml(normItem, 'question'), renderMcqFieldHtml(rawItem, 'question'), `Q#${idx + 1} question must match`);
    assert.equal(renderMcqFieldHtml(normItem, 'explanation'), renderMcqFieldHtml(rawItem, 'explanation'), `Q#${idx + 1} explanation must match`);
    assert.equal(renderMcqFieldHtml(normItem, 'note'), renderMcqFieldHtml(rawItem, 'note'), `Q#${idx + 1} note must match`);
    (rawItem.options || []).forEach((_, oIdx) => {
      assert.equal(renderMcqFieldHtml(normItem, 'option', oIdx), renderMcqFieldHtml(rawItem, 'option', oIdx), `Q#${idx + 1} option[${oIdx}] must match`);
    });
  });

  // Also guard legacy pre-escaped tagless *Html objects (e.g. from earlier drafts/history)
  const legacyDoubleRisk = {
    question: `'ননীর পুতুল' বাগধারাটির অর্থ কি?`,
    questionHtml: `&#039;ননীর পুতুল&#039; বাগধারাটির অর্থ কি?`,
    options: [`All's well`, `"Quote"`],
    optionsHtml: [`All&#039;s well`, `&quot;Quote&quot;`],
    explanation: `অর্থ 'তা'`,
    explanationHtml: `অর্থ &#039;তা&#039;`,
  };
  assert.ok(!renderMcqFieldHtml(legacyDoubleRisk, 'question').includes('&amp;#039;'));
  assert.ok(!renderMcqFieldHtml(legacyDoubleRisk, 'option', 0).includes('&amp;#039;'));
  assert.ok(!renderMcqFieldHtml(legacyDoubleRisk, 'option', 1).includes('&amp;quot;'));
  assert.ok(!renderMcqFieldHtml(legacyDoubleRisk, 'explanation').includes('&amp;#039;'));

  console.log('✓ All 13 CAAB & HTML/JS Extraction & Rendering regression test groups passed (200/200 CAAB questions verified)!');
}

runTests().catch((err) => {
  console.error('Regression test failed:', err);
  process.exit(1);
});
