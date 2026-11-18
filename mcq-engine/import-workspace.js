/**
 * Class Caddy MCQ Engine — Interactive Import & Rich Review Workspace
 * Replaces the basic plain textarea inside #add-mcq-modal while keeping
 * full compatibility with row tempMcq persistence and existing MCQs.
 */

import {
  normalizeMcqItem,
  normalizeMcqList,
  toStorageMcqList,
  escapeHtmlBasic,
  htmlToPlainText,
  getOptionPrefixLabel,
  estimateStorageBytes,
  FIRESTORE_ROW_WARN_BYTES,
  FIRESTORE_DOC_HARD_LIMIT_BYTES,
} from './schema.js';
import { renderRichHtmlString, sanitizeRichHtml } from './renderer.js';
import { extractMcqsFromInput } from './extractor.js';

function formatBytes(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export class McqImportWorkspace {
  constructor(mountEl, options = {}) {
    this.mountEl = mountEl;
    this.onConfirmSave = options.onConfirmSave || (() => {});
    this.onDeleteAll = options.onDeleteAll || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.onAlert = options.onAlert || (() => {});

    this.activeTab = 'text'; // 'text' | 'files' | 'html' | 'source'
    this.existingMcqs = [];
    this.items = []; // Working batch of review items
    this.summary = null; // Latest extraction validation summary
    this.selectedIndices = new Set();
    this.editingIndex = -1;
    this.sourceEditMode = false;
    this.filterMode = 'all'; // 'all' | 'samples' | 'review' | 'duplicates'
    this.saveMode = 'replace'; // 'replace' | 'append'
    this.fileQueue = [];
    this.fileReports = [];
    this.warnings = [];
    this.preserveCss = true;
    this.isExtracting = false;
    this.abortController = null;
    this.lastFocusedEditor = null;
    this.pageSize = 25;
    this.renderLimit = 25;
    this._footerRaf = null;

    this.renderShell();
    this.bindShellEvents();
  }

  /**
   * Opens the workspace for a row with optional pre-existing MCQs.
   */
  loadExistingRowMcqs(existingRawList = [], prefillPlainText = '') {
    this.abortExtraction();
    this.existingMcqs = normalizeMcqList(existingRawList || []);
    this.items = this.existingMcqs.map((q) => ({ ...q, duplicateStatus: 'none' }));
    this.summary = null;
    this.selectedIndices = new Set(this.items.map((_, i) => i));
    this.editingIndex = -1;
    this.filterMode = 'all';
    this.renderLimit = this.pageSize;
    this.saveMode = 'replace';
    this.fileQueue = [];
    this.fileReports = [];
    this.warnings = [];

    const textArea = this.mountEl.querySelector('#mcq-paste-textarea');
    if (textArea) textArea.value = prefillPlainText || '';

    const htmlArea = this.mountEl.querySelector('#cc-import-html-input');
    if (htmlArea) htmlArea.value = '';

    const srcArea = this.mountEl.querySelector('#cc-import-source-input');
    if (srcArea) srcArea.value = '';

    this.setActiveTab('text');
    this.renderFileQueue();
    this.renderWarnings();
    this.renderReviewSection();
  }

  abortExtraction() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isExtracting = false;
    this.toggleProgress(false);
  }

  renderShell() {
    this.mountEl.innerHTML = `
      <div class="cc-import-workspace">
        <div class="cc-import-tabs" role="tablist">
          <button type="button" class="cc-import-tab-btn active" data-cc-tab="text">
            <i class="fas fa-align-left"></i> Paste Text
          </button>
          <button type="button" class="cc-import-tab-btn" data-cc-tab="files">
            <i class="fas fa-file-upload"></i> Upload Docs
          </button>
          <button type="button" class="cc-import-tab-btn" data-cc-tab="html">
            <i class="fas fa-code"></i> Paste HTML
          </button>
          <button type="button" class="cc-import-tab-btn" data-cc-tab="source">
            <i class="fas fa-brackets-curly"></i> JS / JSON
          </button>
        </div>

        <!-- Tab 1: Paste Text -->
        <div class="cc-import-panel active" data-cc-panel="text">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>Supports English/Bengali/Roman numbering, a/b/c/d or ক/খ/গ/ঘ, inline answers, end-of-doc Answer Keys, LaTeX ($...$), and fenced \`\`\`code\`\`\` blocks.</span>
          </div>
          <textarea id="mcq-paste-textarea" class="cc-import-textarea" placeholder="1. Which gas is known as laughing gas?&#10;a. Nitrogen&#10;b. Nitrous Oxide&#10;c. Methane&#10;d. Ozone&#10;Correct answer: b. Nitrous Oxide&#10;Note: Chemical formula is N₂O"></textarea>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <button type="button" class="action-button action-button-secondary text-xs" id="cc-load-text-sample-btn">
              <i class="fas fa-magic mr-1"></i> Insert Sample Format
            </button>
            <button type="button" class="action-button text-xs" id="cc-extract-text-btn">
              <i class="fas fa-wand-magic-sparkles mr-1"></i> Extract & Preview Text
            </button>
          </div>
        </div>

        <!-- Tab 2: Upload Documents -->
        <div class="cc-import-panel" data-cc-panel="files">
          <div class="cc-dropzone" id="cc-import-dropzone" tabindex="0">
            <i class="fas fa-cloud-upload-alt text-2xl mb-1 text-indigo-500"></i>
            <div class="font-semibold text-sm">Drop multiple files here or click to browse</div>
            <div class="text-xs opacity-75 mt-1">Supported: .txt, .html, .htm (including JS-driven HTML question banks), .docx, .json, .js</div>
            <input type="file" id="cc-import-file-input" class="hidden" multiple accept=".txt,.md,.html,.htm,.docx,.doc,.json,.js,.mjs" />
          </div>
          <div class="cc-file-queue" id="cc-import-file-queue"></div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <button type="button" class="action-button action-button-secondary text-xs" id="cc-clear-files-btn">Clear Queue</button>
            <button type="button" class="action-button text-xs" id="cc-extract-files-btn">
              <i class="fas fa-cogs mr-1"></i> Extract Queued Files
            </button>
          </div>
        </div>

        <!-- Tab 3: Paste HTML -->
        <div class="cc-import-panel" data-cc-panel="html">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
            <label class="inline-flex items-center gap-2 font-medium cursor-pointer">
              <input type="checkbox" id="cc-preserve-css-toggle" checked class="w-4 h-4 rounded accent-indigo-600" />
              <span>Preserve meaningful CSS styles & extract embedded JavaScript MCQ arrays / MathJax LaTeX</span>
            </label>
          </div>
          <textarea id="cc-import-html-input" class="cc-import-textarea" placeholder="Paste full webpage HTML (including JavaScript-driven HTML question banks like const mcqData = [...]) or rich formatted fragment here..."></textarea>
          <div class="flex justify-end">
            <button type="button" class="action-button text-xs" id="cc-extract-html-btn">
              <i class="fas fa-code mr-1"></i> Extract Rich HTML
            </button>
          </div>
        </div>

        <!-- Tab 4: Paste JS / JSON -->
        <div class="cc-import-panel" data-cc-panel="source">
          <div class="text-xs px-3 py-2 rounded border border-indigo-200 bg-indigo-50 text-indigo-900 dark-safe-notice">
            <i class="fas fa-shield-alt mr-1"></i>
            <strong>Safe Static Extraction:</strong> JavaScript is parsed via Acorn AST only and is <strong>never executed</strong>. Dynamic runtime expressions are flagged for manual review.
          </div>
          <textarea id="cc-import-source-input" class="cc-import-textarea" placeholder='const quizData = [&#10;  {&#10;    question: "Water formula is H<sub>2</sub>O?",&#10;    options: ["True", "False"],&#10;    correctIndex: 0,&#10;    explanation: "Two Hydrogen + one Oxygen."&#10;  }&#10;];'></textarea>
          <div class="flex justify-end">
            <button type="button" class="action-button text-xs" id="cc-extract-source-btn">
              <i class="fas fa-project-diagram mr-1"></i> Extract JS / JSON Safely
            </button>
          </div>
        </div>

        <!-- Progress Indicator -->
        <div id="cc-import-progress" class="cc-progress-box hidden">
          <div class="flex items-center justify-between gap-2 text-xs font-semibold">
            <span id="cc-import-progress-text">Extracting...</span>
            <button type="button" id="cc-import-cancel-btn" class="cc-mini-btn danger">Cancel</button>
          </div>
          <div class="cc-progress-track">
            <div id="cc-import-progress-fill" class="cc-progress-fill" style="width: 0%"></div>
          </div>
        </div>

        <!-- Diagnostics / Warnings -->
        <div id="cc-import-warnings" class="hidden"></div>

        <!-- Import Validation Summary Banner -->
        <div id="cc-validation-summary" class="cc-validation-summary hidden"></div>

        <!-- Interactive Review & Rich Editor Workspace -->
        <div id="cc-review-section" class="flex flex-col gap-2">
          <div class="cc-review-header">
            <div class="cc-review-stats" id="cc-review-stats"></div>
            <div class="flex flex-wrap items-center gap-2">
              <select id="cc-save-mode-select" class="text-xs px-2 py-1.5 rounded border border-gray-300 bg-white font-semibold" title="Choose how extracted MCQs combine with existing row MCQs">
                <option value="replace">Mode: Replace Row MCQs</option>
                <option value="append">Mode: Append to Existing Row</option>
              </select>
              <button type="button" id="cc-add-manual-btn" class="cc-mini-btn">
                <i class="fas fa-plus"></i> Add Manual MCQ
              </button>
            </div>
          </div>

          <div class="cc-review-controls">
            <div class="flex flex-wrap gap-1.5 items-center">
              <button type="button" class="cc-mini-btn active-filter" data-cc-filter="all">All</button>
              <button type="button" class="cc-mini-btn" data-cc-filter="samples" title="Preview 1st, Middle, and Last extracted questions">Sample Preview (1st / Mid / Last)</button>
              <button type="button" class="cc-mini-btn" data-cc-filter="review">Needs Review</button>
              <button type="button" class="cc-mini-btn" data-cc-filter="duplicates">Duplicates</button>
            </div>
            <div class="flex flex-wrap gap-1.5 items-center">
              <button type="button" class="cc-mini-btn" id="cc-jump-first-btn" title="Jump to first question">1st</button>
              <button type="button" class="cc-mini-btn" id="cc-jump-mid-btn" title="Jump to middle question">Mid</button>
              <button type="button" class="cc-mini-btn" id="cc-jump-last-btn" title="Jump to last question">Last</button>
              <button type="button" class="cc-mini-btn" id="cc-select-all-btn">Select All</button>
              <button type="button" class="cc-mini-btn" id="cc-deselect-all-btn">Deselect All</button>
              <button type="button" class="cc-mini-btn hidden" id="cc-skip-dups-btn">Skip All Duplicates</button>
            </div>
          </div>

          <div id="cc-review-list" class="cc-review-list"></div>
        </div>

        <!-- Sticky Footer -->
        <div class="cc-import-footer">
          <div class="flex items-center gap-2">
            <button id="delete-all-mcqs-btn" type="button" class="action-button hidden" style="background-color: #ef4444;">
              <i class="fas fa-trash-alt mr-1"></i> Delete All Row MCQs
            </button>
            <span id="cc-payload-size-badge" class="text-xs font-medium opacity-75"></span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="action-button action-button-secondary" id="cc-workspace-cancel-btn">Cancel</button>
            <button id="save-mcq-btn" type="button" class="action-button">
              <i class="fas fa-check-circle mr-1"></i> Confirm & Attach (<span id="cc-confirm-count">0</span>)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindShellEvents() {
    // Tab switching
    this.mountEl.querySelectorAll('[data-cc-tab]').forEach((btn) => {
      btn.addEventListener('click', () => this.setActiveTab(btn.dataset.ccTab));
    });

    // Text tab
    this.mountEl.querySelector('#cc-load-text-sample-btn')?.addEventListener('click', () => {
      const ta = this.mountEl.querySelector('#mcq-paste-textarea');
      if (!ta) return;
      ta.value =
`1. What is the chemical formula of water with $x^2 + y^2 = r^2$?
a. H<sub>2</sub>O ✓
b. CO<sub>2</sub>
c. NaCl
d. H<sub>2</sub>SO<sub>4</sub>
Note: Water has two hydrogen atoms bonded to one oxygen atom.

2. What is the output of the JavaScript expression?
\`\`\`js
const arr = [1, 2, 3];
console.log(arr.length);
\`\`\`
a. 2
b. 3
c. 4
d. undefined
Correct answer: b`;
    });

    this.mountEl.querySelector('#cc-extract-text-btn')?.addEventListener('click', () => {
      const text = this.mountEl.querySelector('#mcq-paste-textarea')?.value || '';
      this.runExtraction({ mode: 'text', text });
    });

    // Dropzone & File Queue
    const dropzone = this.mountEl.querySelector('#cc-import-dropzone');
    const fileInput = this.mountEl.querySelector('#cc-import-file-input');
    dropzone?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput?.click();
      }
    });
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer?.files?.length) this.enqueueFiles(e.dataTransfer.files);
    });
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files?.length) this.enqueueFiles(e.target.files);
      fileInput.value = '';
    });
    this.mountEl.querySelector('#cc-clear-files-btn')?.addEventListener('click', () => {
      this.fileQueue = [];
      this.fileReports = [];
      this.renderFileQueue();
    });
    this.mountEl.querySelector('#cc-extract-files-btn')?.addEventListener('click', () => {
      if (this.fileQueue.length === 0) {
        this.onAlert('Please add at least one file to the queue first.', 'error');
        return;
      }
      this.runExtraction({ mode: 'files', files: this.fileQueue });
    });

    // HTML tab
    this.mountEl.querySelector('#cc-preserve-css-toggle')?.addEventListener('change', (e) => {
      this.preserveCss = Boolean(e.target.checked);
    });
    this.mountEl.querySelector('#cc-extract-html-btn')?.addEventListener('click', () => {
      const html = this.mountEl.querySelector('#cc-import-html-input')?.value || '';
      this.runExtraction({ mode: 'html', html, preserveCss: this.preserveCss });
    });

    // Source JS/JSON tab
    this.mountEl.querySelector('#cc-extract-source-btn')?.addEventListener('click', () => {
      const sourceText = this.mountEl.querySelector('#cc-import-source-input')?.value || '';
      this.runExtraction({ mode: 'source', sourceText });
    });

    // Cancel async extraction
    this.mountEl.querySelector('#cc-import-cancel-btn')?.addEventListener('click', () => {
      this.abortExtraction();
      this.onAlert('Extraction cancelled.', 'info');
    });

    // Save mode / Add Manual
    this.mountEl.querySelector('#cc-save-mode-select')?.addEventListener('change', (e) => {
      this.saveMode = e.target.value;
      this.updateFooterCounts();
    });
    this.mountEl.querySelector('#cc-add-manual-btn')?.addEventListener('click', () => {
      const newItem = normalizeMcqItem(
        {
          id: this.items.length + 1,
          question: 'New question stem...',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: 0,
          correctAnswer: 'Option A',
          explanation: '',
          note: '',
          sourceFormat: 'manual',
          confidence: 'high',
          warnings: [],
        },
        this.items.length
      );
      newItem.duplicateStatus = 'none';
      this.items.push(newItem);
      this.selectedIndices.add(this.items.length - 1);
      this.editingIndex = this.items.length - 1;
      this.renderReviewSection();
    });

    // Filter buttons
    this.mountEl.querySelectorAll('[data-cc-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterMode = btn.dataset.ccFilter;
        this.renderLimit = this.pageSize;
        this.renderReviewSection();
      });
    });

    // Quick Jump to First / Middle / Last Question
    const jumpToIndex = (targetIdx) => {
      if (this.items.length === 0) return;
      const clamped = Math.max(0, Math.min(this.items.length - 1, targetIdx));
      if (this.filterMode !== 'all' && this.filterMode !== 'samples') {
        this.filterMode = 'all';
      }
      if (this.filterMode === 'all' && clamped >= this.renderLimit) {
        this.renderLimit = Math.min(this.items.length, clamped + 15);
      }
      this.renderReviewSection();
      const listEl = this.mountEl.querySelector('#cc-review-list');
      const cardEl = listEl?.querySelector(`[data-card-idx="${clamped}"]`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardEl.style.outline = '2px solid var(--cc-accent, #4f46e5)';
        setTimeout(() => {
          cardEl.style.outline = '';
        }, 1200);
      }
    };
    this.mountEl.querySelector('#cc-jump-first-btn')?.addEventListener('click', () => jumpToIndex(0));
    this.mountEl.querySelector('#cc-jump-mid-btn')?.addEventListener('click', () =>
      jumpToIndex(Math.floor((this.items.length - 1) / 2))
    );
    this.mountEl.querySelector('#cc-jump-last-btn')?.addEventListener('click', () =>
      jumpToIndex(this.items.length - 1)
    );

    // Bulk selection buttons (update DOM in place without rebuilding all cards)
    this.mountEl.querySelector('#cc-select-all-btn')?.addEventListener('click', () => {
      this.items.forEach((_, idx) => this.selectedIndices.add(idx));
      this.syncCheckboxesAndCounts();
    });
    this.mountEl.querySelector('#cc-deselect-all-btn')?.addEventListener('click', () => {
      this.selectedIndices.clear();
      this.syncCheckboxesAndCounts();
    });
    this.mountEl.querySelector('#cc-skip-dups-btn')?.addEventListener('click', () => {
      this.items.forEach((it, idx) => {
        if (it.duplicateStatus === 'existing' || it.duplicateStatus === 'batch') {
          it.duplicateResolution = 'skip';
          this.selectedIndices.delete(idx);
        }
      });
      this.renderReviewSection();
    });

    // Delegated listeners for review card actions & batch pagination
    const listEl = this.mountEl.querySelector('#cc-review-list');
    if (listEl) {
      listEl.addEventListener('change', (e) => {
        const cb = e.target.closest('[data-cc-toggle]');
        if (cb) {
          const idx = parseInt(cb.dataset.ccToggle, 10);
          if (cb.checked) this.selectedIndices.add(idx);
          else this.selectedIndices.delete(idx);
          this.syncSelectedStatOnly();
          this.updateFooterCounts(true);
          return;
        }
        const dupSel = e.target.closest('[data-cc-dup-res]');
        if (dupSel) {
          const idx = parseInt(dupSel.dataset.ccDupRes, 10);
          const item = this.items[idx];
          if (!item) return;
          item.duplicateResolution = dupSel.value;
          if (dupSel.value === 'skip') this.selectedIndices.delete(idx);
          else this.selectedIndices.add(idx);
          this.renderReviewSection();
        }
      });

      listEl.addEventListener('click', (e) => {
        const loadMoreBtn = e.target.closest('#cc-load-more-review-btn');
        if (loadMoreBtn) {
          this.renderLimit += 30;
          this.renderReviewSection(true);
          return;
        }
        const showAllBtn = e.target.closest('#cc-show-all-review-btn');
        if (showAllBtn) {
          this.renderLimit = this.items.length;
          this.renderReviewSection(true);
          return;
        }

        const upBtn = e.target.closest('[data-cc-move-up]');
        if (upBtn) {
          const idx = parseInt(upBtn.dataset.ccMoveUp, 10);
          if (idx <= 0) return;
          const [moved] = this.items.splice(idx, 1);
          this.items.splice(idx - 1, 0, moved);
          this.rebuildSelectionSwap(idx, idx - 1);
          this.renderReviewSection(true);
          return;
        }

        const downBtn = e.target.closest('[data-cc-move-down]');
        if (downBtn) {
          const idx = parseInt(downBtn.dataset.ccMoveDown, 10);
          if (idx >= this.items.length - 1) return;
          const [moved] = this.items.splice(idx, 1);
          this.items.splice(idx + 1, 0, moved);
          this.rebuildSelectionSwap(idx, idx + 1);
          this.renderReviewSection(true);
          return;
        }

        const dupBtn = e.target.closest('[data-cc-dup-item]');
        if (dupBtn) {
          const idx = parseInt(dupBtn.dataset.ccDupItem, 10);
          const copy = normalizeMcqItem({ ...this.items[idx], uid: undefined }, this.items.length);
          copy.duplicateStatus = 'none';
          this.items.splice(idx + 1, 0, copy);
          this.selectedIndices = new Set(this.items.map((_, i) => i));
          this.renderLimit = Math.max(this.renderLimit, idx + 2);
          this.renderReviewSection(true);
          return;
        }

        const delBtn = e.target.closest('[data-cc-del]');
        if (delBtn) {
          const idx = parseInt(delBtn.dataset.ccDel, 10);
          this.items.splice(idx, 1);
          const nextSel = new Set();
          this.selectedIndices.forEach((s) => {
            if (s < idx) nextSel.add(s);
            else if (s > idx) nextSel.add(s - 1);
          });
          this.selectedIndices = nextSel;
          if (this.editingIndex === idx) this.editingIndex = -1;
          else if (this.editingIndex > idx) this.editingIndex--;
          this.renderReviewSection(true);
          return;
        }

        const editBtn = e.target.closest('[data-cc-edit]');
        if (editBtn) {
          this.editingIndex = parseInt(editBtn.dataset.ccEdit, 10);
          this.renderReviewSection(true);
        }
      });
    }

    // Footer buttons
    this.mountEl.querySelector('#cc-workspace-cancel-btn')?.addEventListener('click', () => {
      this.abortExtraction();
      this.onCancel();
    });
    this.mountEl.querySelector('#delete-all-mcqs-btn')?.addEventListener('click', () => {
      this.onDeleteAll();
    });
    this.mountEl.querySelector('#save-mcq-btn')?.addEventListener('click', () => {
      this.handleConfirmSave();
    });
  }

  syncSelectedStatOnly() {
    const statsSel = this.mountEl.querySelector('#cc-review-stats');
    if (statsSel && statsSel.children[1]) {
      statsSel.children[1].textContent = `Selected: ${this.selectedIndices.size}`;
    }
  }

  syncCheckboxesAndCounts() {
    const listEl = this.mountEl.querySelector('#cc-review-list');
    if (listEl) {
      listEl.querySelectorAll('[data-cc-toggle]').forEach((cb) => {
        const idx = parseInt(cb.dataset.ccToggle, 10);
        cb.checked = this.selectedIndices.has(idx);
      });
    }
    this.syncSelectedStatOnly();
    this.updateFooterCounts(true);
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    this.mountEl.querySelectorAll('[data-cc-tab]').forEach((b) => {
      b.classList.toggle('active', b.dataset.ccTab === tab);
    });
    this.mountEl.querySelectorAll('[data-cc-panel]').forEach((p) => {
      p.classList.toggle('active', p.dataset.ccPanel === tab);
    });
  }

  enqueueFiles(fileList) {
    Array.from(fileList).forEach((file) => {
      const exists = this.fileQueue.some((f) => f.name === file.name && f.size === file.size);
      if (!exists) this.fileQueue.push(file);
    });
    this.fileReports = [];
    this.renderFileQueue();
  }

  renderFileQueue() {
    const queueEl = this.mountEl.querySelector('#cc-import-file-queue');
    if (!queueEl) return;
    if (this.fileQueue.length === 0) {
      queueEl.innerHTML = '';
      return;
    }

    queueEl.innerHTML = this.fileQueue
      .map((file, idx) => {
        const rep = this.fileReports.find((r) => r.name === file.name);
        const statusHtml = rep
          ? rep.status === 'error'
            ? `<span class="cc-conf-badge cc-conf-low">Unsupported / Error</span>`
            : rep.status === 'ok'
            ? `<span class="cc-conf-badge cc-conf-high">${rep.count} Extracted</span>`
            : `<span class="cc-conf-badge cc-conf-medium">${rep.count} Found</span>`
          : `<span class="cc-conf-badge cc-conf-medium">Queued</span>`;

        const sourceSub =
          rep && rep.detectedSourceType
            ? ` • ${escapeHtmlBasic(rep.detectedSourceType)}${rep.detectedVariableName ? ` (${escapeHtmlBasic(rep.detectedVariableName)})` : ''}`
            : '';
        const warnSub = rep?.warnings?.length ? `<div class="text-xs text-amber-600 mt-0.5">${escapeHtmlBasic(rep.warnings[0])}</div>` : '';

        return `
          <div class="cc-file-item">
            <div class="cc-file-item-meta">
              <div class="cc-file-item-name">${escapeHtmlBasic(file.name)}</div>
              <div class="cc-file-item-sub">${formatBytes(file.size)}${sourceSub}</div>
              ${warnSub}
            </div>
            <div class="flex items-center gap-2">
              ${statusHtml}
              <button type="button" class="cc-mini-btn danger" data-cc-remove-file="${idx}" title="Remove file">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    queueEl.querySelectorAll('[data-cc-remove-file]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.ccRemoveFile, 10);
        this.fileQueue.splice(idx, 1);
        this.renderFileQueue();
      });
    });
  }

  toggleProgress(show, percent = 0, text = '') {
    const box = this.mountEl.querySelector('#cc-import-progress');
    const fill = this.mountEl.querySelector('#cc-import-progress-fill');
    const lbl = this.mountEl.querySelector('#cc-import-progress-text');
    if (!box) return;
    box.classList.toggle('hidden', !show);
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    if (lbl && text) lbl.textContent = text;
  }

  renderWarnings() {
    const warnBox = this.mountEl.querySelector('#cc-import-warnings');
    if (!warnBox) return;
    if (!this.warnings || this.warnings.length === 0) {
      warnBox.classList.add('hidden');
      warnBox.innerHTML = '';
      return;
    }
    warnBox.classList.remove('hidden');
    warnBox.innerHTML = `
      <div class="cc-warning-box">
        <div class="font-bold mb-1"><i class="fas fa-exclamation-triangle mr-1"></i> Import Diagnostics</div>
        <ul class="list-disc pl-4 space-y-0.5">
          ${this.warnings.map((w) => `<li>${escapeHtmlBasic(w)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  renderValidationSummary() {
    const sumEl = this.mountEl.querySelector('#cc-validation-summary');
    if (!sumEl) return;
    if (!this.summary || this.items.length === 0) {
      sumEl.classList.add('hidden');
      sumEl.innerHTML = '';
      return;
    }

    const s = this.summary;
    const discrepancy = s.detectedCount - s.validCount;
    const discrepancyReasons = [];
    if (s.missingOptionsCount > 0) discrepancyReasons.push(`${s.missingOptionsCount} missing options`);
    if (s.invalidAnswerCount > 0) discrepancyReasons.push(`${s.invalidAnswerCount} invalid answer reference(s)`);
    const otherUnresolved = Math.max(0, discrepancy - s.missingOptionsCount - s.invalidAnswerCount);
    if (otherUnresolved > 0) discrepancyReasons.push(`${otherUnresolved} missing correct answer key(s)`);

    sumEl.classList.remove('hidden');
    sumEl.innerHTML = `
      <div class="cc-val-header">
        <span><i class="fas fa-clipboard-check text-indigo-500 mr-1.5"></i>Import Validation Summary</span>
        <span class="text-xs font-normal opacity-80">${escapeHtmlBasic(s.fileName || 'Input Source')}</span>
      </div>
      <div class="cc-val-grid">
        <div class="cc-val-item" title="${escapeHtmlBasic(s.fileName || '')}">
          <span class="cc-val-label">Source File</span>
          <span class="cc-val-value">${escapeHtmlBasic(s.fileName || 'Pasted Input')}</span>
        </div>
        <div class="cc-val-item" title="${escapeHtmlBasic(s.detectedSourceType || '')}">
          <span class="cc-val-label">Source Type</span>
          <span class="cc-val-value">${escapeHtmlBasic(s.detectedSourceType || 'Auto-detected')}</span>
        </div>
        <div class="cc-val-item" title="${escapeHtmlBasic(s.detectedVariableName || 'N/A')}">
          <span class="cc-val-label">Data Variable</span>
          <span class="cc-val-value font-mono">${escapeHtmlBasic(s.detectedVariableName || 'N/A')}</span>
        </div>
        <div class="cc-val-item">
          <span class="cc-val-label">Objects Detected</span>
          <span class="cc-val-value">${s.detectedCount}</span>
        </div>
        <div class="cc-val-item">
          <span class="cc-val-label">Valid Questions</span>
          <span class="cc-val-value text-emerald-600">${s.validCount}</span>
        </div>
        <div class="cc-val-item">
          <span class="cc-val-label">Missing Options</span>
          <span class="cc-val-value ${s.missingOptionsCount > 0 ? 'text-amber-600' : ''}">${s.missingOptionsCount}</span>
        </div>
        <div class="cc-val-item">
          <span class="cc-val-label">Invalid Answer Refs</span>
          <span class="cc-val-value ${s.invalidAnswerCount > 0 ? 'text-amber-600' : ''}">${s.invalidAnswerCount}</span>
        </div>
        <div class="cc-val-item">
          <span class="cc-val-label">With Explanations</span>
          <span class="cc-val-value">${s.withExplanationCount}</span>
        </div>
        <div class="cc-val-item">
          <span class="cc-val-label">HTML Formatting</span>
          <span class="cc-val-value">${s.withHtmlCount}</span>
        </div>
        <div class="cc-val-item">
          <span class="cc-val-label">LaTeX Equations</span>
          <span class="cc-val-value">${s.withLatexCount}</span>
        </div>
        <div class="cc-val-item">
          <span class="cc-val-label">Duplicates</span>
          <span class="cc-val-value ${s.duplicateCount > 0 ? 'text-indigo-600' : ''}">${s.duplicateCount}</span>
        </div>
      </div>
      ${
        discrepancy > 0
          ? `<div class="text-xs text-amber-700 font-medium pt-1 border-t border-amber-200/60">
              <i class="fas fa-info-circle mr-1"></i>Discrepancy Notice: ${s.detectedCount} question object(s) detected vs ${s.validCount} valid (${discrepancyReasons.join(', ')}). Incomplete records are flagged for review and not auto-selected.
            </div>`
          : ''
      }
    `;
  }

  async runExtraction(params) {
    this.abortExtraction();
    this.isExtracting = true;
    this.abortController = new AbortController();
    this.toggleProgress(true, 5, 'Starting extraction...');

    try {
      const result = await extractMcqsFromInput({
        ...params,
        existingMcqs: this.existingMcqs,
        signal: this.abortController.signal,
        onProgress: ({ percent, status }) => this.toggleProgress(true, percent, status),
      });

      this.warnings = result.warnings || [];
      this.fileReports = result.fileReports || [];
      this.summary = result.summary || null;
      this.renderFileQueue();
      this.renderWarnings();

      if (result.items.length === 0) {
        this.renderValidationSummary();
        this.onAlert(
          this.warnings[0] || 'No MCQs extracted. Review the format or create questions manually.',
          'error'
        );
      } else {
        this.items = result.items;
        this.selectedIndices = new Set();
        this.items.forEach((it, idx) => {
          // Safe default: auto-select complete non-duplicate questions; never silently auto-select incomplete records
          if (it.duplicateStatus === 'none' && !it.isIncomplete) {
            this.selectedIndices.add(idx);
          }
        });
        this.editingIndex = -1;
        this.filterMode = 'all';
        this.renderLimit = this.pageSize;
        this.saveMode = this.existingMcqs.length > 0 ? 'append' : 'replace';
        const modeSel = this.mountEl.querySelector('#cc-save-mode-select');
        if (modeSel) modeSel.value = this.saveMode;

        this.renderReviewSection();
        this.onAlert(
          `Extracted ${result.items.length} question(s) (${result.summary.detectedSourceType}${result.summary.detectedVariableName && result.summary.detectedVariableName !== 'N/A' ? ': ' + result.summary.detectedVariableName : ''}): ${result.summary.validCount} valid.`,
          'success'
        );
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Extraction failed:', err);
        this.warnings = [err.message || 'Extraction failed unexpectedly.'];
        this.renderWarnings();
        this.onAlert('Extraction error: ' + (err.message || 'Unknown error'), 'error');
      }
    } finally {
      this.isExtracting = false;
      this.toggleProgress(false);
    }
  }

  computeFinalOutputList() {
    let baseList = this.saveMode === 'append' ? [...this.existingMcqs] : [];

    this.items.forEach((it, idx) => {
      if (!this.selectedIndices.has(idx)) return;
      if (it.duplicateStatus === 'existing' && it.duplicateResolution === 'replace' && typeof it.duplicateOfIndex === 'number') {
        if (this.saveMode === 'append' && baseList[it.duplicateOfIndex]) {
          baseList[it.duplicateOfIndex] = it;
          return;
        }
      }
      if (it.duplicateStatus !== 'none' && it.duplicateResolution === 'skip') return;
      baseList.push(it);
    });

    return toStorageMcqList(baseList);
  }

  updateFooterCounts(deferSizeCalc = false) {
    const finalItems = this.computeFinalOutputList();
    const confirmSpan = this.mountEl.querySelector('#cc-confirm-count');
    if (confirmSpan) confirmSpan.textContent = String(finalItems.length);

    const applySizeBadge = () => {
      const bytes = estimateStorageBytes(finalItems);
      const badge = this.mountEl.querySelector('#cc-payload-size-badge');
      if (badge) {
        let colorStyle = '';
        if (bytes > FIRESTORE_DOC_HARD_LIMIT_BYTES) {
          colorStyle = 'color: #ef4444; font-weight: 700;';
        } else if (bytes > FIRESTORE_ROW_WARN_BYTES) {
          colorStyle = 'color: #d97706; font-weight: 700;';
        }
        badge.innerHTML = `<span style="${colorStyle}">Payload: ${formatBytes(bytes)}</span>`;
      }
    };

    if (this._footerRaf) {
      cancelAnimationFrame(this._footerRaf);
      this._footerRaf = null;
    }
    if (deferSizeCalc && finalItems.length > 40) {
      this._footerRaf = requestAnimationFrame(() => {
        this._footerRaf = null;
        applySizeBadge();
      });
    } else {
      applySizeBadge();
    }
  }

  renderReviewSection(preserveScroll = false) {
    this.renderValidationSummary();

    const statsEl = this.mountEl.querySelector('#cc-review-stats');
    const listEl = this.mountEl.querySelector('#cc-review-list');
    const skipDupsBtn = this.mountEl.querySelector('#cc-skip-dups-btn');

    const total = this.items.length;
    const highCount = this.items.filter((q) => q.confidence === 'high').length;
    const reviewCount = this.items.filter((q) => q.confidence !== 'high' || q.warnings?.length > 0).length;
    const dupCount = this.items.filter((q) => q.duplicateStatus && q.duplicateStatus !== 'none').length;

    if (statsEl) {
      statsEl.innerHTML = `
        <span class="cc-stat-tag">Total: ${total}</span>
        <span class="cc-stat-tag">Selected: ${this.selectedIndices.size}</span>
        <span class="cc-stat-tag">Ready: ${highCount}</span>
        ${reviewCount > 0 ? `<span class="cc-stat-tag warn">Needs Review: ${reviewCount}</span>` : ''}
        ${dupCount > 0 ? `<span class="cc-stat-tag dup">Duplicates: ${dupCount}</span>` : ''}
        ${this.existingMcqs.length > 0 ? `<span class="cc-stat-tag">Row Existing: ${this.existingMcqs.length}</span>` : ''}
      `;
    }

    if (skipDupsBtn) skipDupsBtn.classList.toggle('hidden', dupCount === 0);

    this.mountEl.querySelectorAll('[data-cc-filter]').forEach((btn) => {
      const isAct = btn.dataset.ccFilter === this.filterMode;
      btn.style.background = isAct ? 'var(--cc-accent, #4f46e5)' : '';
      btn.style.color = isAct ? '#fff' : '';
      btn.style.borderColor = isAct ? 'var(--cc-accent, #4f46e5)' : '';
    });

    if (!listEl) return;

    const prevScrollTop = preserveScroll ? listEl.scrollTop : 0;

    const firstIdx = 0;
    const midIdx = Math.floor((total - 1) / 2);
    const lastIdx = Math.max(0, total - 1);
    const sampleSet = new Set([firstIdx, midIdx, lastIdx]);

    const visibleEntries = this.items
      .map((item, idx) => ({ item, idx }))
      .filter(({ item, idx }) => {
        if (this.filterMode === 'samples') return sampleSet.has(idx);
        if (this.filterMode === 'review') return item.confidence !== 'high' || (item.warnings && item.warnings.length > 0);
        if (this.filterMode === 'duplicates') return item.duplicateStatus && item.duplicateStatus !== 'none';
        return true;
      });

    if (visibleEntries.length === 0) {
      listEl.innerHTML = `<div class="text-center py-6 text-sm opacity-75">No MCQs in this view. Paste text/HTML/source, upload documents, or click "Add Manual MCQ".</div>`;
      this.updateFooterCounts();
      return;
    }

    const limit = this.filterMode === 'samples' ? visibleEntries.length : this.renderLimit;
    const slicedEntries = visibleEntries.slice(0, limit);
    const remaining = Math.max(0, visibleEntries.length - slicedEntries.length);

    let batchFooterHtml = '';
    if (remaining > 0) {
      const nextStep = Math.min(30, remaining);
      batchFooterHtml = `
        <div class="cc-batch-footer" style="margin: 4px 0 8px;">
          <span>Showing <strong>${slicedEntries.length}</strong> of <strong>${visibleEntries.length}</strong> questions (${remaining} more)</span>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cc-mini-btn" id="cc-load-more-review-btn">Load Next ${nextStep}</button>
            <button type="button" class="cc-mini-btn" id="cc-show-all-review-btn">Show All (${visibleEntries.length})</button>
          </div>
        </div>
      `;
    }

    listEl.innerHTML =
      slicedEntries
        .map(({ item, idx }) => (idx === this.editingIndex ? this.renderEditableCard(item, idx) : this.renderPreviewCard(item, idx)))
        .join('') + batchFooterHtml;

    if (preserveScroll) {
      listEl.scrollTop = prevScrollTop;
    }

    this.bindReviewCardEvents(listEl);
    this.updateFooterCounts(true);
  }

  renderPreviewCard(item, idx) {
    const isChecked = this.selectedIndices.has(idx);
    const isNeedsReview = item.confidence !== 'high' || (item.warnings && item.warnings.length > 0);
    const isDup = item.duplicateStatus && item.duplicateStatus !== 'none';
    const confLabel = item.confidence === 'high' ? 'High Confidence' : item.confidence === 'medium' ? 'Medium' : 'Needs Review';
    const confClass = `cc-conf-${item.confidence || 'manual'}`;

    const qRendered = renderRichHtmlString(item.questionHtml || item.question);
    const expSource = item.explanationHtml || item.explanation || item.noteHtml || item.note;
    const expRendered = expSource ? renderRichHtmlString(expSource) : '';

    return `
      <div class="cc-mcq-card ${isNeedsReview ? 'needs-review' : ''} ${isDup ? 'is-duplicate' : ''}" data-card-idx="${idx}">
        <div class="cc-mcq-card-top">
          <div class="cc-mcq-card-left">
            <input type="checkbox" class="w-4 h-4 accent-indigo-600 cursor-pointer" data-cc-toggle="${idx}" ${isChecked ? 'checked' : ''} />
            <span class="font-bold text-sm">#${idx + 1}</span>
            <span class="cc-conf-badge ${confClass}">${confLabel}</span>
            ${item.sourceFormat ? `<span class="text-xs opacity-60 uppercase font-semibold">${escapeHtmlBasic(item.sourceFormat)}</span>` : ''}
            ${item.hasMath ? `<span class="text-xs font-semibold text-indigo-500">Math</span>` : ''}
            ${item.hasCode ? `<span class="text-xs font-semibold text-emerald-600">Code</span>` : ''}
            ${
              isDup
                ? `<select class="text-xs px-1.5 py-0.5 rounded border border-indigo-400 font-semibold" data-cc-dup-res="${idx}">
                    <option value="skip" ${item.duplicateResolution === 'skip' ? 'selected' : ''}>Duplicate (${item.duplicateStatus}): Skip</option>
                    <option value="import" ${item.duplicateResolution === 'import' ? 'selected' : ''}>Import Anyway</option>
                    ${
                      item.duplicateStatus === 'existing'
                        ? `<option value="replace" ${item.duplicateResolution === 'replace' ? 'selected' : ''}>Replace Existing #${(item.duplicateOfIndex ?? 0) + 1}</option>`
                        : ''
                    }
                  </select>`
                : ''
            }
          </div>
          <div class="cc-mcq-card-actions">
            <button type="button" class="cc-mini-btn" data-cc-move-up="${idx}" title="Move up" ${idx === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
            <button type="button" class="cc-mini-btn" data-cc-move-down="${idx}" title="Move down" ${idx === this.items.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
            <button type="button" class="cc-mini-btn" data-cc-dup-item="${idx}" title="Duplicate"><i class="fas fa-copy"></i></button>
            <button type="button" class="cc-mini-btn" data-cc-edit="${idx}" title="Edit MCQ"><i class="fas fa-edit"></i> Edit</button>
            <button type="button" class="cc-mini-btn danger" data-cc-del="${idx}" title="Remove"><i class="fas fa-trash"></i></button>
          </div>
        </div>

        <div class="text-sm font-medium">${qRendered}</div>

        <div class="cc-preview-options">
          ${(item.optionsHtml || item.options || [])
            .map((optHtml, oIdx) => {
              const isCorr = item.correctIndex === oIdx;
              const prefix = getOptionPrefixLabel(oIdx, item.question);
              return `<div class="cc-preview-opt ${isCorr ? 'correct' : ''}">
                <span class="font-bold mr-1">${prefix}.</span>${renderRichHtmlString(optHtml, { inlineOnly: true })}
              </div>`;
            })
            .join('')}
        </div>

        ${
          expRendered
            ? `<div class="text-xs p-2 rounded border border-blue-200 bg-blue-50/70 text-blue-900 cc-exp-preview">
                <strong class="mr-1"><i class="fas fa-info-circle"></i> Explanation:</strong>${expRendered}
              </div>`
            : ''
        }

        ${
          item.warnings && item.warnings.length > 0
            ? `<div class="text-xs text-amber-600 font-medium"><i class="fas fa-exclamation-circle mr-1"></i>${item.warnings.map(escapeHtmlBasic).join(' • ')}</div>`
            : ''
        }
      </div>
    `;
  }

  renderEditableCard(item, idx) {
    const qHtml = sanitizeRichHtml(item.questionHtml || escapeHtmlBasic(item.question || ''));
    const expHtml = sanitizeRichHtml(item.explanationHtml || item.noteHtml || escapeHtmlBasic(item.explanation || item.note || ''));
    const optionsArr = item.optionsHtml?.length ? item.optionsHtml : item.options || [];

    return `
      <div class="cc-mcq-card" style="border: 2px solid var(--cc-accent, #4f46e5);" data-card-idx="${idx}">
        <div class="cc-mcq-card-top">
          <div class="cc-mcq-card-left">
            <span class="font-bold text-sm text-indigo-600">Editing Question #${idx + 1}</span>
            <label class="inline-flex items-center gap-1 text-xs font-semibold cursor-pointer ml-2">
              <input type="checkbox" id="cc-edit-source-toggle" ${this.sourceEditMode ? 'checked' : ''} />
              <span>HTML / LaTeX Source Mode</span>
            </label>
          </div>
          <div class="cc-mcq-card-actions">
            <button type="button" class="action-button text-xs" id="cc-edit-save-btn"><i class="fas fa-check mr-1"></i> Done Editing</button>
          </div>
        </div>

        <!-- Rich Formatting Toolbar -->
        <div class="cc-rich-toolbar" id="cc-edit-toolbar">
          <button type="button" class="cc-tb-btn" data-cc-cmd="bold" title="Bold"><b>B</b></button>
          <button type="button" class="cc-tb-btn" data-cc-cmd="italic" title="Italic"><i>I</i></button>
          <button type="button" class="cc-tb-btn" data-cc-cmd="underline" title="Underline"><u>U</u></button>
          <button type="button" class="cc-tb-btn" data-cc-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
          <button type="button" class="cc-tb-btn" data-cc-cmd="superscript" title="Superscript">x²</button>
          <button type="button" class="cc-tb-btn" data-cc-cmd="subscript" title="Subscript">x₂</button>
          <button type="button" class="cc-tb-btn" data-cc-insert="math-inline" title="Insert Inline LaTeX">$x$</button>
          <button type="button" class="cc-tb-btn" data-cc-insert="math-block" title="Insert Display LaTeX">$$</button>
          <button type="button" class="cc-tb-btn" data-cc-insert="code-block" title="Insert Code Block">&lt;/&gt;</button>
          <button type="button" class="cc-tb-btn" data-cc-cmd="removeFormat" title="Clear Formatting"><i class="fas fa-eraser"></i></button>
        </div>

        <label class="text-xs font-bold">Question Stem</label>
        ${
          this.sourceEditMode
            ? `<textarea class="cc-source-field" id="cc-edit-q-field">${escapeHtmlBasic(qHtml)}</textarea>`
            : `<div class="cc-editable-field" contenteditable="true" id="cc-edit-q-field">${qHtml}</div>`
        }

        <div class="flex items-center justify-between">
          <label class="text-xs font-bold">Options (select radio for Correct Answer)</label>
          <button type="button" class="cc-mini-btn" id="cc-edit-add-opt-btn"><i class="fas fa-plus"></i> Add Option</button>
        </div>

        <div id="cc-edit-options-list">
          ${optionsArr
            .map((optVal, oIdx) => {
              const safeOpt = sanitizeRichHtml(optVal);
              const isCorr = item.correctIndex === oIdx;
              return `
                <div class="cc-edit-option-row" data-opt-row="${oIdx}">
                  <input type="radio" name="cc-edit-correct" value="${oIdx}" class="mt-3 w-4 h-4 accent-emerald-600 cursor-pointer" ${isCorr ? 'checked' : ''} title="Mark as Correct Answer" />
                  <div class="flex-1 min-w-0">
                    ${
                      this.sourceEditMode
                        ? `<textarea class="cc-source-field cc-edit-opt-input" style="min-height: 40px;">${escapeHtmlBasic(safeOpt)}</textarea>`
                        : `<div class="cc-editable-field cc-edit-opt-input">${safeOpt}</div>`
                    }
                  </div>
                  <button type="button" class="cc-mini-btn danger mt-1" data-cc-edit-del-opt="${oIdx}" title="Remove option"><i class="fas fa-times"></i></button>
                </div>
              `;
            })
            .join('')}
        </div>

        <label class="text-xs font-bold">Explanation / Note</label>
        ${
          this.sourceEditMode
            ? `<textarea class="cc-source-field" id="cc-edit-exp-field">${escapeHtmlBasic(expHtml)}</textarea>`
            : `<div class="cc-editable-field" contenteditable="true" id="cc-edit-exp-field">${expHtml}</div>`
        }
      </div>
    `;
  }

  bindReviewCardEvents(listEl) {
    // Card checkbox, duplicate, move, delete, edit actions are delegated on listEl in bindShellEvents().
    // Only bind the inline rich editor when a card is open in edit mode.
    if (this.editingIndex !== -1) {
      const card = listEl.querySelector(`[data-card-idx="${this.editingIndex}"]`);
      if (card) this.bindActiveEditorEvents(card, this.editingIndex);
    }
  }

  rebuildSelectionSwap(a, b) {
    const hasA = this.selectedIndices.has(a);
    const hasB = this.selectedIndices.has(b);
    if (hasA) this.selectedIndices.add(b);
    else this.selectedIndices.delete(b);
    if (hasB) this.selectedIndices.add(a);
    else this.selectedIndices.delete(a);
  }

  commitActiveEditorDraft(card, idx) {
    const qField = card.querySelector('#cc-edit-q-field');
    const expField = card.querySelector('#cc-edit-exp-field');
    const optInputs = Array.from(card.querySelectorAll('.cc-edit-opt-input'));
    const checkedRadio = card.querySelector('input[name="cc-edit-correct"]:checked');

    const getVal = (el) => {
      if (!el) return '';
      const raw = el.tagName === 'TEXTAREA' ? el.value : el.innerHTML;
      return sanitizeRichHtml(raw);
    };

    const qHtml = getVal(qField);
    const expHtml = getVal(expField);
    const optionsHtml = optInputs.map(getVal).filter((v) => htmlToPlainText(v) !== '' || /<img|<math/i.test(v));
    const chosenIdx = checkedRadio ? parseInt(checkedRadio.value, 10) : -1;

    const updated = normalizeMcqItem(
      {
        ...this.items[idx],
        question: htmlToPlainText(qHtml),
        questionHtml: qHtml,
        options: optionsHtml.map((h) => htmlToPlainText(h)),
        optionsHtml,
        correctIndex: chosenIdx >= 0 && chosenIdx < optionsHtml.length ? chosenIdx : -1,
        correctAnswer: chosenIdx >= 0 && optionsHtml[chosenIdx] ? htmlToPlainText(optionsHtml[chosenIdx]) : '',
        explanation: htmlToPlainText(expHtml),
        explanationHtml: expHtml,
        note: htmlToPlainText(expHtml),
        noteHtml: expHtml,
        confidence: 'high',
        warnings: [],
      },
      idx
    );
    updated.duplicateStatus = this.items[idx].duplicateStatus || 'none';
    updated.duplicateResolution = this.items[idx].duplicateResolution;
    updated.duplicateOfIndex = this.items[idx].duplicateOfIndex;
    this.items[idx] = updated;
  }

  bindActiveEditorEvents(card, idx) {
    card.querySelectorAll('.cc-editable-field, .cc-source-field').forEach((el) => {
      el.addEventListener('focus', () => {
        this.lastFocusedEditor = el;
      });
    });

    card.querySelector('#cc-edit-source-toggle')?.addEventListener('change', (e) => {
      this.commitActiveEditorDraft(card, idx);
      this.sourceEditMode = Boolean(e.target.checked);
      this.renderReviewSection();
    });

    card.querySelector('#cc-edit-add-opt-btn')?.addEventListener('click', () => {
      this.commitActiveEditorDraft(card, idx);
      const cur = this.items[idx];
      cur.options.push(`Option ${cur.options.length + 1}`);
      cur.optionsHtml.push(`Option ${cur.options.length}`);
      this.renderReviewSection();
    });

    card.querySelectorAll('[data-cc-edit-del-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.commitActiveEditorDraft(card, idx);
        const oIdx = parseInt(btn.dataset.ccEditDelOpt, 10);
        const cur = this.items[idx];
        if (cur.options.length <= 2) {
          this.onAlert('At least 2 options are recommended.', 'error');
          return;
        }
        cur.options.splice(oIdx, 1);
        cur.optionsHtml.splice(oIdx, 1);
        if (cur.correctIndex === oIdx) cur.correctIndex = -1;
        else if (cur.correctIndex > oIdx) cur.correctIndex--;
        this.items[idx] = normalizeMcqItem(cur, idx);
        this.renderReviewSection();
      });
    });

    // Formatting toolbar buttons
    card.querySelectorAll('[data-cc-cmd]').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => e.preventDefault());
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.ccCmd;
        if (this.sourceEditMode) {
          const target = this.lastFocusedEditor || card.querySelector('#cc-edit-q-field');
          if (target && target.tagName === 'TEXTAREA') {
            const tagMap = { bold: 'b', italic: 'i', underline: 'u', strikeThrough: 's', superscript: 'sup', subscript: 'sub' };
            const t = tagMap[cmd];
            if (t) this.wrapTextareaSelection(target, `<${t}>`, `</${t}>`);
          }
        } else {
          document.execCommand(cmd, false, null);
        }
      });
    });

    card.querySelectorAll('[data-cc-insert]').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => e.preventDefault());
      btn.addEventListener('click', () => {
        const kind = btn.dataset.ccInsert;
        const snippet =
          kind === 'math-inline'
            ? ' $x^2$'
            : kind === 'math-block'
            ? '\n$$\\frac{a}{b}$$\n'
            : '\n<pre><code class="language-js">const x = 1;</code></pre>\n';

        const target = this.lastFocusedEditor || card.querySelector('#cc-edit-q-field');
        if (this.sourceEditMode && target?.tagName === 'TEXTAREA') {
          this.wrapTextareaSelection(target, snippet, '');
        } else if (!this.sourceEditMode) {
          if (kind === 'code-block') {
            document.execCommand('insertHTML', false, '<pre><code class="language-js">const x = 1;</code></pre>');
          } else {
            document.execCommand('insertText', false, snippet);
          }
        }
      });
    });

    card.querySelector('#cc-edit-save-btn')?.addEventListener('click', () => {
      this.commitActiveEditorDraft(card, idx);
      this.editingIndex = -1;
      this.renderReviewSection();
    });
  }

  wrapTextareaSelection(ta, prefix, suffix) {
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const sel = ta.value.slice(start, end);
    ta.value = ta.value.slice(0, start) + prefix + sel + suffix + ta.value.slice(end);
    ta.focus();
  }

  handleConfirmSave() {
    // Commit any active open inline editor card before saving
    if (this.editingIndex !== -1) {
      const card = this.mountEl.querySelector(`[data-card-idx="${this.editingIndex}"]`);
      if (card) this.commitActiveEditorDraft(card, this.editingIndex);
      this.editingIndex = -1;
    }

    const finalItems = this.computeFinalOutputList();
    if (finalItems.length === 0) {
      this.onAlert('No MCQs selected to attach. Extract or create at least 1 question.', 'error');
      return;
    }

    const bytes = estimateStorageBytes(finalItems);
    if (bytes > FIRESTORE_DOC_HARD_LIMIT_BYTES) {
      this.onAlert(
        `Combined MCQ payload (${formatBytes(bytes)}) approaches Firestore's 1 MB document limit. Please split into smaller rows or remove large embedded images.`,
        'error'
      );
      return;
    }

    const skippedDups = this.items.filter((q) => q.duplicateStatus !== 'none' && q.duplicateResolution === 'skip').length;
    this.onConfirmSave(finalItems, {
      totalSaved: finalItems.length,
      skippedDuplicates: skippedDups,
      bytes,
    });
  }
}
