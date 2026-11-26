// ============================================================================
// Class Caddy — New BCS Mate-Inspired Examination Module (UI & Runtime)
// Preserves 100% of existing Classic Quiz System while adding independent UI
// ============================================================================

import {
    DEFAULT_EXAM_SETTINGS,
    loadExamSettings,
    saveExamSettings,
    resetExamSettings,
    saveExamDraft,
    loadExamDraft,
    clearExamDraft,
    loadLocalBookmarks,
    syncBookmarksFromBridge,
    toggleBookmarkPersist,
    fetchExamHistory,
    persistExamResult,
    removeExamHistoryEntry,
    playExamSound
} from './exam-storage.js';

import {
    getLocalizedOptionLabel,
    processOptionBundle,
    processOptionsOrder,
    shuffleArrayCopy,
    buildStudyPlanRepository,
    resolveInitialScopeFromContext,
    selectQuestionsForExam,
    computeQuestionUid
} from './exam-bank.js';

import {
    isOptionCorrect,
    isUserSelectionCorrect,
    htmlToPlainText,
    getCanonicalCorrectIndex,
    normalizeMcqItem,
    escapeHtmlBasic,
    hasRichMarkup,
    normalizeCompareText,
    computeFingerprint
} from '../mcq-engine/schema.js';

import { renderMcqFieldHtml } from '../mcq-engine/renderer.js';

function getExamPrintRichHeadHtml() {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
    const katexCssUrls = [];
    try {
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            if (link.href && /katex/i.test(link.href)) {
                katexCssUrls.push(`<link rel="stylesheet" href="${link.href}">`);
            }
        });
    } catch {
        // Ignore stylesheet inspection issues
    }
    if (katexCssUrls.length === 0) {
        katexCssUrls.push('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">');
    }
    return `
        ${katexCssUrls.join('\n')}
        <style>
            @font-face {
                font-family: 'Inter';
                font-weight: 100 900;
                font-style: normal;
                font-display: swap;
                src: url('${origin}/fonts/font_1.woff2') format('woff2');
                unicode-range: U+0000-024F, U+1E00-1EFF, U+2000-206F, U+FB00-FB06;
            }
            @font-face {
                font-family: 'Kalpurush';
                font-weight: 100 900;
                font-style: normal;
                font-display: swap;
                src: url('${origin}/fonts/font_2.woff2') format('woff2');
                unicode-range: U+0980-09FF, U+0964-0965, U+200C-200D, U+25CC;
            }
            .katex .mtext, .katex .mord.text { font-family: 'Kalpurush', KaTeX_Main, 'Times New Roman', serif !important; }
            .cc-rich-content { font-family: 'Inter', 'Kalpurush', sans-serif; line-height: 1.5; overflow-wrap: anywhere; word-break: break-word; }
            .cc-rich-content.cc-rich-inline { display: inline; }
            .cc-rich-content p { margin: 0.25em 0; }
            .cc-rich-content p:first-child { margin-top: 0; }
            .cc-rich-content p:last-child { margin-bottom: 0; }
            .cc-rich-content img { max-width: 100%; height: auto; border-radius: 4px; margin: 4px 0; }
            .cc-code-block { position: relative; margin: 4px 0; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; overflow: hidden; }
            .cc-code-lang { position: absolute; top: 2px; right: 5px; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #475569; }
            .cc-code-block pre { margin: 0; padding: 6px 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Kalpurush', monospace; font-size: 9.5px; white-space: pre-wrap; word-break: break-word; color: #0f172a; }
            .cc-inline-code, .cc-rich-content code:not(.hljs) { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Kalpurush', monospace; font-size: 0.9em; padding: 1px 4px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; }
            .cc-table-scroll { width: 100%; overflow-x: auto; margin: 4px 0; }
            .cc-table-scroll table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
            .cc-table-scroll th, .cc-table-scroll td { border: 1px solid #cbd5e1; padding: 3px 5px; text-align: left; }
            .hljs-comment, .hljs-quote { color: #64748b; font-style: italic; }
            .hljs-keyword, .hljs-selector-tag { color: #7c3aed; font-weight: 600; }
            .hljs-number, .hljs-literal, .hljs-variable { color: #0369a1; }
            .hljs-string, .hljs-doctag { color: #047857; }
            .hljs-title, .hljs-section { color: #b91c1c; font-weight: 600; }
        </style>
    `;
}

const EXAM_PRESETS = [
    {
        id: 'topic',
        title: 'Topic Test',
        subtitle: 'Focused chapter drill · 25 Qs · 36s/Q',
        icon: 'fa-bullseye',
        apply(state, repo) {
            state.settings.questionCount = 25;
            state.settings.timingType = 'whole';
            state.settings.totalMinutes = 15;
            state.settings.secondsPerQuestion = 36;
            state.settings.customTimeOverride = false;
            state.settings.mode = 'exam';
            state.settings.positiveMark = 1;
            state.settings.negativeMark = 0.5;
            state.settings.unansweredMark = 0;
            state.settings.passPercent = 50;
            state.settings.wrongOnly = false;
            state.settings.bookmarkedOnly = false;
            const resolved = resolveInitialScopeFromContext(repo);
            state.scopeMode = resolved.scopeMode;
            state.selectedSubjectKey = resolved.selectedSubjectKey;
            state.selectedSubjectKeys = resolved.selectedSubjectKeys || (resolved.selectedSubjectKey ? [resolved.selectedSubjectKey] : []);
            state.selectedTopicKeys = resolved.selectedTopicKeys;
        }
    },
    {
        id: 'custom',
        title: 'Custom Examination',
        subtitle: 'Configure every rule freely',
        icon: 'fa-sliders-h',
        apply(state) {
            state.settings.wrongOnly = false;
            state.settings.bookmarkedOnly = false;
        }
    },
    {
        id: 'previous',
        title: 'Previous Question Paper',
        subtitle: 'Tagged BCS / Past Paper sets in DB',
        icon: 'fa-landmark',
        apply(state, repo) {
            state.settings.questionCount = 100;
            state.settings.timingType = 'whole';
            state.settings.totalMinutes = 60;
            state.settings.secondsPerQuestion = 36;
            state.settings.customTimeOverride = false;
            state.settings.mode = 'exam';
            state.settings.positiveMark = 1;
            state.settings.negativeMark = 0.5;
            state.settings.unansweredMark = 0;
            state.settings.passPercent = 40;
            state.settings.wrongOnly = false;
            state.settings.bookmarkedOnly = false;
            if (repo.previousPaperTopics.length > 0) {
                state.scopeMode = 'all';
                state.selectedSubjectKeys = Array.from(new Set(repo.previousPaperTopics.map(t => t.subjectKey)));
                state.selectedSubjectKey = state.selectedSubjectKeys[0] || '';
                state.selectedTopicKeys = repo.previousPaperTopics.map(t => t.topicKey);
            }
        }
    },
    {
        id: 'half',
        title: 'Half Mock Test',
        subtitle: '100 Qs · 60 min · All Subjects',
        icon: 'fa-stopwatch',
        apply(state, repo) {
            state.settings.questionCount = 100;
            state.settings.timingType = 'whole';
            state.settings.totalMinutes = 60;
            state.settings.secondsPerQuestion = 36;
            state.settings.customTimeOverride = false;
            state.settings.mode = 'exam';
            state.settings.layout = 'screen';
            state.settings.positiveMark = 1;
            state.settings.negativeMark = 0.5;
            state.settings.unansweredMark = 0;
            state.settings.passPercent = 40;
            state.settings.wrongOnly = false;
            state.settings.bookmarkedOnly = false;
            state.scopeMode = 'all';
            state.selectedSubjectKeys = repo.subjects.map(s => s.key);
            state.selectedSubjectKey = state.selectedSubjectKeys[0] || '';
            state.selectedTopicKeys = repo.allTopics.map(t => t.topicKey);
        }
    },
    {
        id: 'full',
        title: 'Full Mock Test',
        subtitle: '200 Qs · 120 min · BCS Prelim Style',
        icon: 'fa-award',
        apply(state, repo) {
            state.settings.questionCount = 200;
            state.settings.timingType = 'whole';
            state.settings.totalMinutes = 120;
            state.settings.secondsPerQuestion = 36;
            state.settings.customTimeOverride = false;
            state.settings.mode = 'exam';
            state.settings.positiveMark = 1;
            state.settings.negativeMark = 0.5;
            state.settings.unansweredMark = 0;
            state.settings.passPercent = 40;
            state.settings.wrongOnly = false;
            state.settings.bookmarkedOnly = false;
            state.scopeMode = 'all';
            state.selectedSubjectKeys = repo.subjects.map(s => s.key);
            state.selectedSubjectKey = state.selectedSubjectKeys[0] || '';
            state.selectedTopicKeys = repo.allTopics.map(t => t.topicKey);
        }
    },
    {
        id: 'wrong',
        title: 'Mistakes Drill',
        subtitle: 'Practice your missed questions',
        icon: 'fa-rotate-left',
        apply(state, repo) {
            state.settings.questionCount = 30;
            state.settings.timingType = 'unlimited';
            state.settings.mode = 'untimed-practice';
            state.settings.wrongOnly = true;
            state.settings.bookmarkedOnly = false;
            state.settings.includeAttempted = true;
            state.settings.avoidRecent = false;
            state.scopeMode = 'all';
            state.selectedSubjectKeys = repo.subjects.map(s => s.key);
            state.selectedSubjectKey = state.selectedSubjectKeys[0] || '';
            state.selectedTopicKeys = repo.allTopics.map(t => t.topicKey);
        }
    }
];

function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatClock(totalSeconds) {
    const secs = Math.max(0, Math.floor(totalSeconds || 0));
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatDurationWords(totalSeconds) {
    const secs = Math.max(0, Math.round(totalSeconds || 0));
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0 && s > 0) return `${m}m ${s}s`;
    if (m > 0) return `${m} min`;
    return `${s} sec`;
}

function formatDateTime(tsMs) {
    if (!tsMs) return 'Recent';
    try {
        return new Date(tsMs).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Recent';
    }
}

function fieldValueForEdit(plainVal, htmlVal) {
    const html = typeof htmlVal === 'string' ? htmlVal.trim() : '';
    if (!html) return String(plainVal || '');
    const withoutBrs = html.replace(/<br\s*\/?>/gi, '\n');
    if (!hasRichMarkup(withoutBrs)) {
        return htmlToPlainText(html) || String(plainVal || '');
    }
    return html;
}

function buildEditedFieldProps(rawInput) {
    const trimmed = String(rawInput ?? '').trim();
    const isRich = hasRichMarkup(trimmed);
    const plain = isRich ? htmlToPlainText(trimmed) : trimmed;
    const html = isRich
        ? trimmed
        : (/\r?\n/.test(trimmed) ? escapeHtmlBasic(trimmed).replace(/\r?\n/g, '<br>') : '');
    return { plain, html };
}

class NewExamSystemController {
    constructor() {
        this.root = document.getElementById('new-exam-ui-root');
        this.bridge = null;
        this.view = 'config'; // 'config' | 'run' | 'result' | 'history'
        this.isLoadingRepo = false;
        this.repo = null;
        this.bookmarks = new Set();
        this.history = [];
        this.draft = null;

        this.config = {
            scopeMode: 'all', // 'inherited' | 'all' | 'subject'
            selectedSubjectKey: '',
            selectedSubjectKeys: [],
            selectedTopicKeys: [],
            topicSearch: '',
            customTitle: '',
            sectionBExpanded: false,
            settings: loadExamSettings()
        };

        // Active runtime state
        this.run = null;
        this.timerInterval = null;
        this.activeResult = null;
        this.resultFilter = 'all'; // 'all' | 'correct' | 'wrong' | 'skip' | 'marked'
        this.resultSubjectFilter = 'all';
        this.resultSearch = '';
        this.historySearch = '';
        this.historySubjectFilter = 'all';
        this.submitDialogOpen = false;
        this.editingQuestionIndex = null;
        this._pausedByEditModal = false;
        this.omrMobileTab = 'paper'; // 'paper' | 'sheet'
        this.toastTimer = null;

        this.bindGlobalListeners();
    }

    getBridge() {
        this.bridge = window.__StudyPlanQuizBridge || null;
        return this.bridge;
    }

    bindGlobalListeners() {
        // Keyboard navigation & answer selection during exam runtime
        document.addEventListener('keydown', (e) => {
            if (!this.root || this.root.classList.contains('hidden')) return;
            if (this.editingQuestionIndex !== null) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeEditQuestionModal();
                }
                return;
            }
            if (this.view !== 'run' || !this.run || this.run.paused || this.submitDialogOpen) return;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;

            const q = this.run.questions[this.run.currentIndex];
            if (!q) return;

            const key = e.key.toLowerCase();
            if (['1', '2', '3', '4', 'a', 'b', 'c', 'd'].includes(key)) {
                const idx = ({ '1': 0, 'a': 0, '2': 1, 'b': 1, '3': 2, 'c': 2, '4': 3, 'd': 3 })[key];
                if (q.options[idx] !== undefined) {
                    e.preventDefault();
                    this.handleAnswerSelect(this.run.currentIndex, q.options[idx], idx);
                }
            } else if (key === 'arrowright') {
                e.preventDefault();
                if (this.run.currentIndex < this.run.questions.length - 1) {
                    this.goToQuestion(this.run.currentIndex + 1);
                }
            } else if (key === 'arrowleft') {
                if (this.run.config.allowNavigation && this.run.currentIndex > 0) {
                    e.preventDefault();
                    this.goToQuestion(this.run.currentIndex - 1);
                }
            } else if (key === 'm' && this.run.config.allowMarkForReview) {
                e.preventDefault();
                this.toggleMarkForReview(this.run.currentIndex);
            } else if (key === 'b') {
                e.preventDefault();
                this.toggleBookmark(q.uid);
            } else if (key === 'e' && this.canEditActiveQuestion(q)) {
                e.preventDefault();
                this.openEditQuestionModal(this.run.currentIndex);
            }
        });

        // Tab / window switch counter during active exam
        document.addEventListener('visibilitychange', () => {
            if (!this.root || this.root.classList.contains('hidden')) return;
            if (this.view !== 'run' || !this.run || this.run.paused) return;
            if (!this.run.config.trackTabSwitches) return;

            if (document.hidden) {
                this.run.tabSwitches = (this.run.tabSwitches || 0) + 1;
                this.persistActiveDraft();
            } else {
                this.showToast(`Tab switch #${this.run.tabSwitches} recorded during examination.`);
                this.updateRunHeaderCounters();
            }
        });
    }

    async openFromQuizModal() {
        const bridge = this.getBridge();
        if (!bridge) {
            alert('Study Plan bridge is still initializing. Please try again in a moment.');
            return;
        }

        // Hide classic quiz modal without touching its internal DOM state
        const classicQuizModal = document.getElementById('quiz-modal');
        if (classicQuizModal) classicQuizModal.style.display = 'none';

        this.root = document.getElementById('new-exam-ui-root');
        this.root.classList.remove('hidden');
        this.root.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        this.view = 'config';
        this.isLoadingRepo = true;
        this.render();

        try {
            const uid = bridge.getUserId?.() || 'guest';
            this.draft = loadExamDraft(uid);
            this.bookmarks = loadLocalBookmarks(uid);

            const [repo, syncedBookmarks, historyList] = await Promise.all([
                buildStudyPlanRepository(bridge),
                syncBookmarksFromBridge(bridge),
                fetchExamHistory(bridge)
            ]);

            this.repo = repo;
            this.bookmarks = syncedBookmarks;
            this.history = historyList;

            // Inherit context automatically from clicked Quiz button!
            const resolved = resolveInitialScopeFromContext(repo);
            this.config.scopeMode = resolved.scopeMode;
            this.config.selectedSubjectKey = resolved.selectedSubjectKey;
            this.config.selectedSubjectKeys = resolved.selectedSubjectKeys || (resolved.selectedSubjectKey ? [resolved.selectedSubjectKey] : []);
            this.config.selectedTopicKeys = resolved.selectedTopicKeys;
            this.config.customTitle = repo.inheritedCollection?.title || '';
            this.config.topicSearch = '';
            this.config.sectionBExpanded = false;
        } catch (err) {
            console.error('[NewExamUI] Failed to initialize repository:', err);
            this.showToast('Could not load Study Plan questions. Check your connection.');
        } finally {
            this.isLoadingRepo = false;
            this.render();
        }
    }

    close() {
        if (this.view === 'run' && this.run && !this.run.paused) {
            this.pauseExam(true);
            this.persistActiveDraft();
        }
        this.stopTimerLoop();
        if (document.fullscreenElement === this.root) {
            document.exitFullscreen?.().catch(() => {});
        }
        if (this.root) {
            this.root.classList.add('hidden');
            this.root.setAttribute('aria-hidden', 'true');
        }
        document.body.style.overflow = '';
    }

    showToast(msg) {
        const existing = this.root?.querySelector('.ex-toast');
        if (existing) existing.remove();
        if (this.toastTimer) clearTimeout(this.toastTimer);

        const el = document.createElement('div');
        el.className = 'ex-toast';
        el.textContent = msg;
        this.root?.appendChild(el);
        this.toastTimer = setTimeout(() => el.remove(), 3400);
    }

    // ------------------------------------------------------------------------
    // Configuration Helpers & Computed Selection
    // ------------------------------------------------------------------------
    getCurrentSelectionPreview() {
        if (!this.repo) {
            return { totalEligible: 0, actualCount: 0, requestedCount: 0, questions: [] };
        }
        return selectQuestionsForExam(this.repo, this.config, this.bookmarks);
    }

    isAuto36SecMode(cfg = this.config.settings) {
        if (!cfg) return false;
        return (cfg.mode === 'exam' || cfg.mode === 'practice')
            && cfg.timingType === 'whole'
            && !cfg.customTimeOverride;
    }

    getTimingSummary(qCount) {
        const s = this.config.settings;
        if (s.mode === 'untimed-practice' || s.timingType === 'unlimited') {
            return {
                totalSeconds: 0,
                unlimited: true,
                secPerQuestion: 0,
                displayDuration: 'Unlimited',
                paceText: 'Self-paced (no countdown)'
            };
        }

        let totalSeconds = 0;
        if (s.timingType === 'per-question') {
            const perQ = Math.max(5, parseInt(s.secondsPerQuestion, 10) || 36);
            totalSeconds = Math.max(1, qCount) * perQ;
        } else if (this.isAuto36SecMode(s)) {
            totalSeconds = qCount > 0 ? qCount * 36 : 0;
        } else {
            const mins = Math.max(0.1, parseFloat(s.totalMinutes) || 15);
            totalSeconds = Math.round(mins * 60);
        }

        const secPerQ = qCount > 0 ? Math.round(totalSeconds / qCount) : 0;
        return {
            totalSeconds,
            unlimited: false,
            secPerQuestion: secPerQ,
            displayDuration: qCount > 0 ? formatDurationWords(totalSeconds) : '0 sec',
            paceText: qCount > 0 ? `${secPerQ} sec / question` : '—'
        };
    }

    buildExamTitle() {
        if (this.config.customTitle && this.config.scopeMode === 'inherited') {
            return this.config.customTitle;
        }
        if (this.config.scopeMode === 'inherited' && this.repo?.inheritedCollection) {
            return this.repo.inheritedCollection.title;
        }
        if (this.config.scopeMode === 'subject') {
            const subjectKeys = Array.isArray(this.config.selectedSubjectKeys) && this.config.selectedSubjectKeys.length > 0
                ? this.config.selectedSubjectKeys
                : (this.config.selectedSubjectKey ? [this.config.selectedSubjectKey] : []);
            const selectedSubjects = (this.repo?.subjects || []).filter(s => subjectKeys.includes(s.key));
            const selectedTopicSet = new Set(this.config.selectedTopicKeys || []);
            const topicCountInScope = selectedSubjects.reduce(
                (acc, sub) => acc + sub.topics.filter(t => selectedTopicSet.has(t.topicKey)).length,
                0
            );
            if (selectedSubjects.length === 1) {
                const subj = selectedSubjects[0];
                if (topicCountInScope === 1) {
                    const topic = subj.topics.find(t => selectedTopicSet.has(t.topicKey));
                    if (topic) return `${subj.name}: ${topic.title}`;
                }
                return `${subj.name} (${topicCountInScope || subj.topics.length} topics)`;
            }
            if (selectedSubjects.length > 1) {
                const names = selectedSubjects.slice(0, 2).map(s => s.name).join(' + ');
                const extra = selectedSubjects.length > 2 ? ` +${selectedSubjects.length - 2} more` : '';
                return `${names}${extra} (${topicCountInScope} topics)`;
            }
            return 'Custom Subject Selection';
        }
        const preset = EXAM_PRESETS.find(p => p.id === this.config.settings.presetId);
        return preset ? `${preset.title} — Study Plan` : 'Study Plan Examination';
    }

    // ------------------------------------------------------------------------
    // Exam Execution Lifecycle
    // ------------------------------------------------------------------------
    startExamination(customQuestions = null, customMeta = null) {
        if (!customQuestions && !this.repo) return;

        const selection = customQuestions
            ? { questions: customQuestions, actualCount: customQuestions.length }
            : this.getCurrentSelectionPreview();

        if (!selection.questions || selection.questions.length === 0) {
            this.showToast('No eligible questions match your selected topics and filters.');
            return;
        }

        const cfg = customMeta?.configSnapshot
            ? { ...customMeta.configSnapshot }
            : { ...this.config.settings };

        if (cfg.mode === 'untimed-practice') {
            cfg.timingType = 'unlimited';
        }

        const timing = this.getTimingSummaryForConfig(selection.questions.length, cfg);
        if (this.isAuto36SecMode(cfg) && timing.totalSeconds > 0) {
            cfg.totalMinutes = Number((timing.totalSeconds / 60).toFixed(2));
        }

        const nowMs = Date.now();
        const attemptId = 'ex_' + nowMs.toString(36) + '_' + Math.random().toString(36).slice(2, 7);

        this.run = {
            attemptId,
            title: customMeta?.title || this.buildExamTitle(),
            subjectSummary: customMeta?.subjectSummary || this.getSubjectSummaryLabel(selection.questions),
            questions: selection.questions.map((q, idx) => ({
                ...q,
                examIndex: idx,
                userAnswer: null,
                userAnswerIndex: null,
                isCorrect: null,
                markedForReview: false
            })),
            config: cfg,
            currentIndex: 0,
            startTimeMs: nowMs,
            totalAllowedSeconds: timing.totalSeconds,
            unlimited: timing.unlimited,
            endTimeMs: timing.unlimited ? null : nowMs + timing.totalSeconds * 1000,
            paused: false,
            pausedRemainingMs: timing.unlimited ? null : timing.totalSeconds * 1000,
            pausedElapsedMs: 0,
            lastActiveStartMs: nowMs,
            timerHidden: false,
            tabSwitches: 0,
            paletteOpen: cfg.showPalette !== false
        };

        this.submitDialogOpen = false;
        this.omrMobileTab = 'paper';
        this.view = 'run';
        this.persistActiveDraft();
        this.startTimerLoop();
        this.render();
    }

    getTimingSummaryForConfig(qCount, cfg) {
        if (cfg.mode === 'untimed-practice' || cfg.timingType === 'unlimited') {
            return { totalSeconds: 0, unlimited: true };
        }
        if (cfg.timingType === 'per-question') {
            return {
                totalSeconds: Math.max(1, qCount) * (Math.max(5, parseInt(cfg.secondsPerQuestion, 10) || 36)),
                unlimited: false
            };
        }
        if (this.isAuto36SecMode(cfg)) {
            return {
                totalSeconds: Math.max(1, qCount) * 36,
                unlimited: false
            };
        }
        return {
            totalSeconds: Math.round((Math.max(0.1, parseFloat(cfg.totalMinutes) || 15)) * 60),
            unlimited: false
        };
    }

    getSubjectSummaryLabel(questions) {
        const set = new Set((questions || []).map(q => q.subject || 'General'));
        const arr = Array.from(set);
        if (arr.length === 0) return 'General';
        if (arr.length <= 2) return arr.join(', ');
        return `${arr[0]} + ${arr.length - 1} subjects`;
    }

    resumeFromDraft() {
        if (!this.draft) return;
        const d = this.draft;
        const nowMs = Date.now();
        const remainingMs = d.unlimited ? 0 : Math.max(1000, d.pausedRemainingMs ?? 60000);

        this.run = {
            ...d,
            paused: false,
            lastActiveStartMs: nowMs,
            endTimeMs: d.unlimited ? null : nowMs + remainingMs
        };

        this.draft = null;
        this.view = 'run';
        this.submitDialogOpen = false;
        this.startTimerLoop();
        this.render();
        this.showToast('Resumed unfinished examination.');
    }

    discardDraft() {
        const uid = this.getBridge()?.getUserId?.() || 'guest';
        clearExamDraft(uid);
        this.draft = null;
        this.render();
        this.showToast('Unfinished draft discarded.');
    }

    persistActiveDraft() {
        if (!this.run) return;
        const uid = this.getBridge()?.getUserId?.() || 'guest';
        const nowMs = Date.now();
        const remainingMs = this.run.unlimited
            ? 0
            : (this.run.paused ? this.run.pausedRemainingMs : Math.max(0, (this.run.endTimeMs || nowMs) - nowMs));
        const elapsedMs = this.run.paused
            ? this.run.pausedElapsedMs
            : (this.run.pausedElapsedMs || 0) + (nowMs - (this.run.lastActiveStartMs || nowMs));

        saveExamDraft(uid, {
            attemptId: this.run.attemptId,
            title: this.run.title,
            subjectSummary: this.run.subjectSummary,
            questions: this.run.questions,
            config: this.run.config,
            currentIndex: this.run.currentIndex,
            startTimeMs: this.run.startTimeMs,
            totalAllowedSeconds: this.run.totalAllowedSeconds,
            unlimited: this.run.unlimited,
            pausedRemainingMs: remainingMs,
            pausedElapsedMs: elapsedMs,
            tabSwitches: this.run.tabSwitches || 0,
            timerHidden: !!this.run.timerHidden,
            paletteOpen: !!this.run.paletteOpen
        });
    }

    stopTimerLoop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    startTimerLoop() {
        this.stopTimerLoop();
        if (!this.run) return;

        const tick = () => {
            if (!this.run || this.view !== 'run' || this.run.paused) return;

            const clockEl = this.root?.querySelector('#ex-live-clock');
            const nowMs = Date.now();

            if (this.run.unlimited) {
                const elapsedSec = Math.floor(((this.run.pausedElapsedMs || 0) + (nowMs - this.run.lastActiveStartMs)) / 1000);
                if (clockEl) clockEl.textContent = formatClock(elapsedSec);
                return;
            }

            const remMs = Math.max(0, (this.run.endTimeMs || nowMs) - nowMs);
            const remSec = Math.ceil(remMs / 1000);

            // Auto-reveal timer in the final 5 minutes if user hid it
            if (remSec <= 300 && this.run.timerHidden) {
                this.run.timerHidden = false;
                if (clockEl) clockEl.classList.remove('hidden-timer');
            }

            if (clockEl) {
                clockEl.textContent = formatClock(remSec);
                clockEl.classList.toggle('low', remSec <= 60);
            }

            if (remMs <= 0) {
                this.stopTimerLoop();
                if (this.run.config.autoSubmitOnTimeout !== false) {
                    this.showToast('Time expired — examination submitted automatically.');
                    this.finalizeAndSubmitExam(true);
                } else {
                    this.run.paused = true;
                    this.run.pausedRemainingMs = 0;
                    this.showToast('Time expired! Please submit your examination.');
                    this.render();
                }
            }
        };

        tick();
        this.timerInterval = setInterval(tick, 500);
    }

    pauseExam(silent = false) {
        if (!this.run || this.run.paused) return;
        const nowMs = Date.now();
        this.run.pausedElapsedMs = (this.run.pausedElapsedMs || 0) + (nowMs - (this.run.lastActiveStartMs || nowMs));
        if (!this.run.unlimited) {
            this.run.pausedRemainingMs = Math.max(0, (this.run.endTimeMs || nowMs) - nowMs);
        }
        this.run.paused = true;
        this.persistActiveDraft();
        if (!silent) this.render();
    }

    resumeExam(silent = false) {
        if (!this.run || !this.run.paused) return;
        const nowMs = Date.now();
        this.run.lastActiveStartMs = nowMs;
        if (!this.run.unlimited) {
            this.run.endTimeMs = nowMs + Math.max(0, this.run.pausedRemainingMs || 0);
        }
        this.run.paused = false;
        this.persistActiveDraft();
        this.startTimerLoop();
        if (!silent) this.render();
    }

    isPracticeInstantMode(cfg = this.run?.config) {
        if (!cfg) return false;
        return cfg.mode === 'practice' || cfg.mode === 'timed-practice' || cfg.mode === 'untimed-practice';
    }

    handleAnswerSelect(qIndex, optionText, optIdx = null) {
        if (!this.run) return;
        const q = this.run.questions[qIndex];
        if (!q) return;

        const pickedIdx = (typeof optIdx === 'number' && !Number.isNaN(optIdx) && optIdx >= 0) ? optIdx : null;
        const isInstant = this.isPracticeInstantMode();
        if (this.run.config.lockAnswer && q.userAnswer !== null) return;
        if (isInstant && q.userAnswer !== null) return;

        const isSamePick = (pickedIdx !== null && typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0)
            ? (pickedIdx === q.userAnswerIndex)
            : (q.userAnswer === optionText);

        // Clicking same selected option in unlocked Exam Mode clears it
        if (!isInstant && !this.run.config.lockAnswer && isSamePick) {
            q.userAnswer = null;
            q.userAnswerIndex = null;
            q.isCorrect = null;
            playExamSound(this.run.config.soundEffects, 'select');
        } else {
            q.userAnswer = optionText;
            q.userAnswerIndex = pickedIdx;
            q.isCorrect = isUserSelectionCorrect(q, optionText, pickedIdx);

            if (isInstant) {
                playExamSound(this.run.config.soundEffects, q.isCorrect ? 'correct' : 'wrong');
            } else {
                playExamSound(this.run.config.soundEffects, 'select');
            }
        }

        this.persistActiveDraft();

        // Auto-advance if enabled and not halted by wrong explanation in practice mode
        if (this.run.config.autoAdvance && q.userAnswer !== null && (!isInstant || q.isCorrect) && qIndex < this.run.questions.length - 1 && this.run.config.layout === 'screen') {
            setTimeout(() => {
                if (this.view === 'run' && this.run && this.run.currentIndex === qIndex) {
                    this.goToQuestion(qIndex + 1);
                }
            }, isInstant ? 380 : 120);
        } else if (this.run.config.layout === 'omr' || this.run.config.layout === 'scroll') {
            this.patchRunQuestionInPlace(qIndex);
        } else {
            this.render();
        }
    }

    renderQuestionFeedbackHtml(q) {
        if (!q || q.userAnswer === null) return '';
        const ok = q.isCorrect === true;
        const correctIdx = getCanonicalCorrectIndex(q);
        const correctDisplayHtml = correctIdx !== -1
            ? renderMcqFieldHtml(q, 'option', correctIdx)
            : ((q.correctAnswerHtml || q.correctAnswer) ? renderMcqFieldHtml(q, 'correctAnswer') : 'N/A');
        const hasExp = Boolean(q.explanationHtml || q.explanation || q.noteHtml || q.note);
        const expField = (q.explanationHtml || q.explanation) ? 'explanation' : 'note';
        return `
            <div class="ex-feedback ${ok ? '' : 'bad'}">
                <div style="font-weight:700; margin-bottom:${hasExp ? '4px' : '0'};">
                    <i class="fas ${ok ? 'fa-check-circle' : 'fa-times-circle'}" style="margin-right:6px;"></i>
                    ${ok ? 'Correct Answer!' : `Incorrect · Correct Answer: ${correctDisplayHtml}`}
                </div>
                ${hasExp ? `<div style="font-size:0.88rem;"><b>Explanation:</b> ${renderMcqFieldHtml(q, expField)}</div>` : ''}
            </div>
        `;
    }

    renderBookletFeedbackHtml(q) {
        if (!q || q.userAnswer === null) return '';
        const hasExp = Boolean(q.explanationHtml || q.explanation || q.noteHtml || q.note);
        if (!hasExp) return '';
        const expField = (q.explanationHtml || q.explanation) ? 'explanation' : 'note';
        return `<div style="margin-top:6px; font-size:0.82rem; color:var(--ex-good);"><b>Explanation:</b> ${renderMcqFieldHtml(q, expField)}</div>`;
    }

    patchRunQuestionInPlace(qIndex) {
        if (!this.run || !this.root) return;
        const r = this.run;
        const q = r.questions[qIndex];
        if (!q) return;

        const isInstant = this.isPracticeInstantMode(r.config);
        const isLocked = Boolean((r.config.lockAnswer && q.userAnswer !== null) || (isInstant && q.userAnswer !== null));

        // Capture card position before patching so any layout change never jumps the viewport
        const scrollAnchorEl = this.root.querySelector(`[data-scroll-q="${qIndex}"]`);
        const beforeTop = scrollAnchorEl ? scrollAnchorEl.getBoundingClientRect().top : null;
        const bookletEl = this.root.querySelector('.ex-booklet');
        const bookletScrollTop = bookletEl ? bookletEl.scrollTop : 0;

        const total = r.questions.length;
        const answeredCount = r.questions.filter(item => item.userAnswer !== null).length;
        const unansweredCount = total - answeredCount;
        const markedCount = r.questions.filter(item => item.markedForReview).length;
        const correctCount = isInstant ? r.questions.filter(item => item.isCorrect === true).length : 0;
        const wrongCount = isInstant ? r.questions.filter(item => item.userAnswer !== null && item.isCorrect === false).length : 0;
        const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

        // 1. Update top bar counters
        const ansBadge = this.root.querySelector('#ex-answered-badge');
        if (ansBadge) ansBadge.textContent = `Answered ${answeredCount}/${total}`;
        const progFill = this.root.querySelector('#ex-progress-fill');
        if (progFill) progFill.style.width = `${progressPct}%`;

        // 2. Update option buttons, booklet options & OMR bubbles for this question
        this.root.querySelectorAll(`[data-pick-q="${qIndex}"]`).forEach((btn) => {
            const oIdxRaw = btn.dataset.pickIdx;
            const oIdx = oIdxRaw !== undefined ? parseInt(oIdxRaw, 10) : -1;
            const optVal = btn.dataset.pickOpt;
            const isPicked = (typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0)
                ? (oIdx === q.userAnswerIndex)
                : (q.userAnswer !== null && q.userAnswer === optVal);
            const isRight = (oIdx >= 0) ? isOptionCorrect(q, oIdx, q.options?.[oIdx] ?? optVal) : false;

            if (btn.classList.contains('ex-ob')) {
                if (isInstant && q.userAnswer !== null) {
                    btn.classList.remove('on');
                    btn.classList.toggle('ok', isRight);
                    btn.classList.toggle('no', !isRight && isPicked);
                } else {
                    btn.classList.remove('ok', 'no');
                    btn.classList.toggle('on', isPicked);
                }
                btn.disabled = isLocked;
            } else if (btn.classList.contains('ex-opt-btn')) {
                if (isInstant && q.userAnswer !== null) {
                    btn.classList.remove('picked');
                    btn.classList.toggle('right', isRight);
                    btn.classList.toggle('wrong', !isRight && isPicked);
                } else {
                    btn.classList.remove('right', 'wrong');
                    btn.classList.toggle('picked', isPicked);
                }
                btn.disabled = isLocked;
            } else {
                if (isInstant && q.userAnswer !== null) {
                    btn.classList.remove('picked');
                    btn.classList.toggle('right', isRight);
                    btn.classList.toggle('wrong', !isRight && isPicked);
                } else {
                    btn.classList.remove('right', 'wrong');
                    btn.classList.toggle('picked', isPicked);
                }
                if (btn.tagName === 'BUTTON') btn.disabled = isLocked;
            }
        });

        // 3. Reveal instant practice feedback & explanation inline without re-rendering page
        const fbSlot = this.root.querySelector(`[data-feedback-slot="${qIndex}"]`);
        if (fbSlot) {
            fbSlot.innerHTML = isInstant ? this.renderQuestionFeedbackHtml(q) : '';
        }
        const bkFbSlot = this.root.querySelector(`[data-bk-feedback-slot="${qIndex}"]`);
        if (bkFbSlot) {
            bkFbSlot.innerHTML = isInstant ? this.renderBookletFeedbackHtml(q) : '';
        }

        // 4. Update active highlight (.cur) for OMR / Scroll rows
        this.root.querySelectorAll('[data-scroll-q].cur, .ex-omr-row.cur').forEach(el => el.classList.remove('cur'));
        this.root.querySelectorAll(`[data-scroll-q="${qIndex}"], .ex-omr-row[data-omr-q="${qIndex}"]`).forEach(el => el.classList.add('cur'));

        // 5. Update palette sidebar button & legend counts without rebuilding cards
        const palCard = this.root.querySelector('.ex-palette-card');
        if (palCard) {
            const palCount = palCard.querySelector('#ex-pal-answered-count');
            if (palCount) palCount.textContent = `${answeredCount}/${total}`;
            const legOk = palCard.querySelector('#ex-leg-ok');
            if (legOk) legOk.innerHTML = `<i class="ex-pal-dot ok"></i> Correct (${correctCount})`;
            const legNo = palCard.querySelector('#ex-leg-no');
            if (legNo) legNo.innerHTML = `<i class="ex-pal-dot no"></i> Wrong (${wrongCount})`;
            const legAns = palCard.querySelector('#ex-leg-ans');
            if (legAns) legAns.innerHTML = `<i class="ex-pal-dot ans"></i> Answered (${answeredCount})`;
            const legUnans = palCard.querySelector('#ex-leg-unans');
            if (legUnans) legUnans.innerHTML = `<i class="ex-pal-dot"></i> Unanswered (${unansweredCount})`;
            const legMarked = palCard.querySelector('#ex-leg-marked');
            if (legMarked) legMarked.innerHTML = `<i class="ex-pal-dot fl"></i> Marked (${markedCount})`;

            palCard.querySelectorAll('.ex-pal-btn.cur').forEach(b => b.classList.remove('cur'));
            const palBtn = palCard.querySelector(`.ex-pal-btn[data-go-q="${qIndex}"]`);
            if (palBtn) {
                palBtn.classList.add('cur');
                palBtn.classList.toggle('fl', Boolean(q.markedForReview));
                if (isInstant) {
                    palBtn.classList.remove('ans');
                    palBtn.classList.toggle('ok', q.userAnswer !== null && q.isCorrect === true);
                    palBtn.classList.toggle('no', q.userAnswer !== null && q.isCorrect === false);
                } else {
                    palBtn.classList.remove('ok', 'no');
                    palBtn.classList.toggle('ans', q.userAnswer !== null);
                }
            }
        }

        // 6. Keep the clicked question pinned to its exact vertical position on screen
        if (bookletEl) {
            bookletEl.scrollTop = bookletScrollTop;
        }
        if (scrollAnchorEl && beforeTop !== null) {
            const afterTop = scrollAnchorEl.getBoundingClientRect().top;
            const delta = afterTop - beforeTop;
            if (Math.abs(delta) > 1) {
                this.root.scrollTop += delta;
            }
        }
    }

    clearAnswer(qIndex) {
        if (!this.run) return;
        const q = this.run.questions[qIndex];
        if (!q || this.run.config.lockAnswer || this.isPracticeInstantMode()) return;
        q.userAnswer = null;
        q.userAnswerIndex = null;
        q.isCorrect = null;
        this.persistActiveDraft();
        if (this.run.config.layout === 'omr' || this.run.config.layout === 'scroll') {
            this.patchRunQuestionInPlace(qIndex);
        } else {
            this.render();
        }
    }

    toggleMarkForReview(qIndex) {
        if (!this.run || !this.run.config.allowMarkForReview) return;
        const q = this.run.questions[qIndex];
        if (!q) return;
        q.markedForReview = !q.markedForReview;
        this.persistActiveDraft();
        if (this.run.config.layout === 'scroll' && this.root) {
            const markBtn = this.root.querySelector(`[data-mark-q="${qIndex}"]`);
            if (markBtn) {
                markBtn.style.cssText = q.markedForReview ? 'border-color:var(--ex-amber); color:var(--ex-amber); background:var(--ex-amber-soft);' : '';
                markBtn.innerHTML = `<i class="fas fa-flag"></i> ${q.markedForReview ? 'Marked' : 'Mark'}`;
            }
            const palBtn = this.root.querySelector(`.ex-pal-btn[data-go-q="${qIndex}"]`);
            if (palBtn) palBtn.classList.toggle('fl', Boolean(q.markedForReview));
            const legMarked = this.root.querySelector('#ex-leg-marked');
            if (legMarked) {
                const markedCount = this.run.questions.filter(item => item.markedForReview).length;
                legMarked.innerHTML = `<i class="ex-pal-dot fl"></i> Marked (${markedCount})`;
            }
        } else {
            this.render();
        }
    }

    async toggleBookmark(questionUid) {
        const isNowBookmarked = !this.bookmarks.has(questionUid);
        this.bookmarks = await toggleBookmarkPersist(this.getBridge(), questionUid, isNowBookmarked);
        this.showToast(isNowBookmarked ? 'Question bookmarked.' : 'Bookmark removed.');
        if (this.view === 'run' && this.run && this.run.config.layout === 'scroll' && this.root) {
            const safeAttr = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(questionUid) : questionUid;
            this.root.querySelectorAll(`[data-bookmark-uid="${safeAttr}"]`).forEach((btn) => {
                btn.style.cssText = isNowBookmarked ? 'border-color:var(--ex-indigo); color:var(--ex-indigo); background:var(--ex-indigo-soft);' : '';
                btn.innerHTML = `<i class="${isNowBookmarked ? 'fas' : 'far'} fa-bookmark"></i>`;
            });
        } else {
            this.render();
        }
    }

    canEditActiveQuestion(q = null) {
        if (!this.run || !this.run.config) return false;
        if (this.run.config.mode === 'exam') return false;
        if (!this.isPracticeInstantMode(this.run.config)) return false;
        if (q && q.kind === 'vocab') return false;
        return true;
    }

    openEditQuestionModal(qIndex) {
        if (!this.run || !this.root) return;
        const q = this.run.questions[qIndex];
        if (!q || !this.canEditActiveQuestion(q)) {
            this.showToast('Question editing is only available in Practice or Unlimited Practice mode.');
            return;
        }

        this.root.querySelector('#ex-edit-modal-veil')?.remove();

        if (!this.run.paused) {
            this.pauseExam(true);
            this._pausedByEditModal = true;
        } else {
            this._pausedByEditModal = false;
        }
        this.editingQuestionIndex = qIndex;

        const qTextVal = fieldValueForEdit(q.question, q.questionHtml);
        const expTextVal = fieldValueForEdit(q.explanation || q.note || '', q.explanationHtml || q.noteHtml || '');
        const opts = Array.isArray(q.options) && q.options.length > 0 ? q.options : ['', ''];
        const optsHtml = Array.isArray(q.optionsHtml) ? q.optionsHtml : [];
        const currentCorrectIdx = getCanonicalCorrectIndex(q);
        const selectedCorrectIdx = currentCorrectIdx >= 0 && currentCorrectIdx < opts.length ? currentCorrectIdx : 0;
        const wasAnswered = (q.userAnswer !== null && q.userAnswer !== undefined && q.userAnswer !== '') || (typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0);

        const buildOptionRowHtml = (optIdx, optVal, isCorrectOpt, origIdxVal) => {
            const lbl = getLocalizedOptionLabel(optIdx, qTextVal, opts);
            return `
                <div class="ex-edit-opt-row ${isCorrectOpt ? 'is-correct' : ''}" data-orig-opt-idx="${origIdxVal}">
                    <input type="radio" name="ex-edit-correct" class="ex-edit-opt-radio" value="${optIdx}" ${isCorrectOpt ? 'checked' : ''} title="Mark as correct answer">
                    <span class="ex-edit-opt-badge">${esc(lbl)}</span>
                    <textarea class="ex-input ex-edit-opt-ta" rows="2" placeholder="Alternative ${esc(lbl)}...">${esc(optVal)}</textarea>
                    <button type="button" class="ex-btn sm" data-edit-remove-opt title="Remove alternative">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
        };

        const veil = document.createElement('div');
        veil.id = 'ex-edit-modal-veil';
        veil.className = 'ex-veil';
        veil.innerHTML = `
            <div class="ex-dlg ex-edit-dlg" role="dialog" aria-modal="true" aria-labelledby="ex-edit-modal-title">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                    <div>
                        <h3 id="ex-edit-modal-title" style="margin:0; font-size:1.12rem; font-weight:800;">
                            <i class="fas fa-pen-to-square" style="color:var(--ex-accent); margin-right:6px;"></i>Edit Question #${qIndex + 1}
                        </h3>
                        <div style="font-size:0.78rem; color:var(--ex-muted); margin-top:2px;">
                            ${esc(q.subject || 'General')}${q.topic ? ` · ${esc(q.topic)}` : ''}
                        </div>
                    </div>
                    <button type="button" class="ex-btn sm" data-edit-cancel title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="ex-edit-field">
                    <label class="ex-edit-label" for="ex-edit-question">
                        <span>Question Stem</span>
                    </label>
                    <textarea id="ex-edit-question" class="ex-input ex-edit-ta" rows="3" placeholder="Enter question text...">${esc(qTextVal)}</textarea>
                </div>

                <div class="ex-edit-field">
                    <div class="ex-edit-label">
                        <span>Alternatives (select the correct answer)</span>
                        <button type="button" class="ex-btn sm" id="ex-edit-add-opt">
                            <i class="fas fa-plus"></i> Add Option
                        </button>
                    </div>
                    <div id="ex-edit-opts-list" class="ex-edit-opts">
                        ${opts.map((opt, idx) => buildOptionRowHtml(
                            idx,
                            fieldValueForEdit(opt, optsHtml[idx] || ''),
                            idx === selectedCorrectIdx,
                            String(idx)
                        )).join('')}
                    </div>
                </div>

                <div class="ex-edit-field">
                    <label class="ex-edit-label" for="ex-edit-explanation">
                        <span>Explanation / Note</span>
                    </label>
                    <textarea id="ex-edit-explanation" class="ex-input ex-edit-ta" rows="3" placeholder="Optional explanation shown after answering...">${esc(expTextVal)}</textarea>
                </div>

                <div id="ex-edit-error" class="ex-callout warn" style="display:none; margin:0; font-size:0.82rem;"></div>

                ${wasAnswered ? `
                    <div style="font-size:0.79rem; color:var(--ex-muted); background:var(--ex-sunk); padding:8px 10px; border-radius:var(--ex-radius); border:1px solid var(--ex-line);">
                        <i class="fas fa-calculator" style="color:var(--ex-accent); margin-right:5px;"></i>
                        You have already answered this question — saving will automatically recalculate your result and palette status.
                    </div>
                ` : ''}

                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:4px;">
                    <button type="button" class="ex-btn" data-edit-cancel>Cancel</button>
                    <button type="button" class="ex-btn primary" id="ex-edit-save-btn">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        `;

        this.root.appendChild(veil);

        const optsList = veil.querySelector('#ex-edit-opts-list');
        const refreshOptionRowsUi = () => {
            const rows = Array.from(optsList.querySelectorAll('.ex-edit-opt-row'));
            const currentSampleQ = veil.querySelector('#ex-edit-question')?.value || qTextVal;
            const currentSampleOpts = rows.map(r => r.querySelector('.ex-edit-opt-ta')?.value || '');
            let anyChecked = false;
            rows.forEach((row, idx) => {
                const radio = row.querySelector('.ex-edit-opt-radio');
                const badge = row.querySelector('.ex-edit-opt-badge');
                if (radio) {
                    radio.value = String(idx);
                    if (radio.checked) anyChecked = true;
                }
                if (badge) {
                    badge.textContent = getLocalizedOptionLabel(idx, currentSampleQ, currentSampleOpts);
                }
            });
            if (!anyChecked && rows[0]) {
                const firstRadio = rows[0].querySelector('.ex-edit-opt-radio');
                if (firstRadio) firstRadio.checked = true;
            }
            rows.forEach((row) => {
                const radio = row.querySelector('.ex-edit-opt-radio');
                row.classList.toggle('is-correct', Boolean(radio?.checked));
            });
        };

        const bindRowListeners = (row) => {
            row.querySelector('.ex-edit-opt-radio')?.addEventListener('change', refreshOptionRowsUi);
            row.querySelector('[data-edit-remove-opt]')?.addEventListener('click', () => {
                const rows = optsList.querySelectorAll('.ex-edit-opt-row');
                if (rows.length <= 2) {
                    this.showToast('At least 2 alternatives are required.');
                    return;
                }
                row.remove();
                refreshOptionRowsUi();
            });
        };

        optsList.querySelectorAll('.ex-edit-opt-row').forEach(bindRowListeners);

        veil.querySelector('#ex-edit-add-opt')?.addEventListener('click', () => {
            const rows = optsList.querySelectorAll('.ex-edit-opt-row');
            if (rows.length >= 6) {
                this.showToast('Maximum 6 alternatives supported.');
                return;
            }
            const nextIdx = rows.length;
            const tmp = document.createElement('div');
            tmp.innerHTML = buildOptionRowHtml(nextIdx, '', false, '').trim();
            const newRow = tmp.firstElementChild;
            if (newRow) {
                optsList.appendChild(newRow);
                bindRowListeners(newRow);
                refreshOptionRowsUi();
                newRow.querySelector('.ex-edit-opt-ta')?.focus({ preventScroll: true });
            }
        });

        veil.addEventListener('click', (e) => {
            if (e.target === veil) this.closeEditQuestionModal();
        });
        veil.querySelectorAll('[data-edit-cancel]').forEach(btn => {
            btn.addEventListener('click', () => this.closeEditQuestionModal());
        });
        veil.querySelector('#ex-edit-save-btn')?.addEventListener('click', () => {
            this.saveEditedQuestion(qIndex);
        });

        requestAnimationFrame(() => {
            veil.querySelector('#ex-edit-question')?.focus({ preventScroll: true });
        });
    }

    closeEditQuestionModal() {
        this.root?.querySelector('#ex-edit-modal-veil')?.remove();
        this.editingQuestionIndex = null;
        if (this._pausedByEditModal) {
            this._pausedByEditModal = false;
            this.resumeExam(true);
        }
    }

    syncUpdatedQuestionToRepo(oldQ, updatedQ) {
        if (!this.repo) return;
        const matchesRepoItem = (item) => {
            if (!item || item.kind === 'vocab') return false;
            if (oldQ.sourceMcqUid && item.sourceMcqUid && item.sourceMcqUid === oldQ.sourceMcqUid) return true;
            if (oldQ.uid && item.uid && item.uid === oldQ.uid) {
                if (!oldQ.topicKey || !item.topicKey || item.topicKey === oldQ.topicKey) return true;
            }
            if (
                oldQ.topicKey && item.topicKey === oldQ.topicKey &&
                typeof oldQ.sourceMcqIndex === 'number' && item.sourceMcqIndex === oldQ.sourceMcqIndex
            ) {
                return true;
            }
            return false;
        };

        const applyFields = (target) => {
            target.uid = updatedQ.uid;
            target.question = updatedQ.question;
            target.questionHtml = updatedQ.questionHtml;
            target.options = updatedQ.options.slice();
            target.optionsHtml = updatedQ.optionsHtml.slice();
            target.correctAnswer = updatedQ.correctAnswer;
            target.correctAnswerHtml = updatedQ.correctAnswerHtml;
            target.correctIndex = updatedQ.correctIndex;
            target.explanation = updatedQ.explanation;
            target.explanationHtml = updatedQ.explanationHtml;
            target.note = updatedQ.note;
            target.noteHtml = updatedQ.noteHtml;
            target.hasMath = updatedQ.hasMath;
            target.hasCode = updatedQ.hasCode;
            target.hasMedia = updatedQ.hasMedia;
        };

        const seen = new Set();
        const touchList = (list) => {
            if (!Array.isArray(list)) return;
            list.forEach((item) => {
                if (!item || seen.has(item)) return;
                if (matchesRepoItem(item)) {
                    seen.add(item);
                    applyFields(item);
                }
            });
        };

        touchList(this.repo.allQuestions);
        (this.repo.allTopics || []).forEach(t => touchList(t?.questions));
        if (this.repo.inheritedCollection) {
            touchList(this.repo.inheritedCollection.questions);
        }
    }

    patchEditedQuestionInPlace(qIndex) {
        if (!this.run || !this.root) return;
        const r = this.run;
        const q = r.questions[qIndex];
        if (!q) return;
        const isInstant = this.isPracticeInstantMode(r.config);
        const cardEl = this.root.querySelector(`article.ex-qcard[data-scroll-q="${qIndex}"]`);
        if (cardEl) {
            const beforeTop = cardEl.getBoundingClientRect().top;
            const tpl = document.createElement('template');
            tpl.innerHTML = this.renderQuestionCardHtml(q, qIndex, isInstant, r.config.layout !== 'scroll').trim();
            const newCard = tpl.content.firstElementChild;
            if (newCard) {
                if (r.currentIndex === qIndex) newCard.classList.add('cur');
                cardEl.replaceWith(newCard);
                this.bindQuestionContainerEvents(newCard);
                const afterTop = newCard.getBoundingClientRect().top;
                const delta = afterTop - beforeTop;
                if (Math.abs(delta) > 1) {
                    this.root.scrollTop += delta;
                }
            }
        }
        this.patchRunQuestionInPlace(qIndex);
    }

    async saveEditedQuestion(qIndex) {
        if (!this.run || !this.root) return;
        const q = this.run.questions[qIndex];
        if (!q || !this.canEditActiveQuestion(q)) {
            this.closeEditQuestionModal();
            return;
        }

        const veil = this.root.querySelector('#ex-edit-modal-veil');
        if (!veil) return;

        const errEl = veil.querySelector('#ex-edit-error');
        const showErr = (msg) => {
            if (errEl) {
                errEl.textContent = msg;
                errEl.style.display = 'block';
            }
        };

        const rawQ = veil.querySelector('#ex-edit-question')?.value ?? '';
        const qProps = buildEditedFieldProps(rawQ);
        if (!qProps.plain && !qProps.html) {
            showErr('Question text cannot be empty.');
            return;
        }

        const rows = Array.from(veil.querySelectorAll('.ex-edit-opt-row'));
        const nextOptionsPlain = [];
        const nextOptionsHtml = [];
        const origIndexMap = [];
        let selectedRowIndex = -1;

        rows.forEach((row) => {
            const ta = row.querySelector('.ex-edit-opt-ta');
            const radio = row.querySelector('.ex-edit-opt-radio');
            const optProps = buildEditedFieldProps(ta?.value ?? '');
            if (!optProps.plain && !optProps.html) return;
            const pushedIdx = nextOptionsPlain.length;
            if (radio?.checked) selectedRowIndex = pushedIdx;
            const origAttr = row.dataset.origOptIdx;
            origIndexMap.push(origAttr !== '' && origAttr !== undefined ? parseInt(origAttr, 10) : -1);
            nextOptionsPlain.push(optProps.plain);
            nextOptionsHtml.push(optProps.html);
        });

        if (nextOptionsPlain.length < 2) {
            showErr('Please provide at least 2 non-empty alternatives.');
            return;
        }
        if (selectedRowIndex < 0 || selectedRowIndex >= nextOptionsPlain.length) {
            showErr('Please select one of the non-empty alternatives as the correct answer.');
            return;
        }

        const rawExp = veil.querySelector('#ex-edit-explanation')?.value ?? '';
        const expProps = buildEditedFieldProps(rawExp);

        const norm = normalizeMcqItem({
            id: q.id,
            uid: q.sourceMcqUid || q.uid,
            question: qProps.plain,
            questionText: qProps.plain,
            questionHtml: qProps.html,
            options: nextOptionsPlain,
            optionsText: nextOptionsPlain,
            optionsHtml: nextOptionsHtml,
            correctIndex: selectedRowIndex,
            correctAnswer: nextOptionsPlain[selectedRowIndex],
            correctAnswerHtml: nextOptionsHtml[selectedRowIndex] || '',
            explanation: expProps.plain,
            explanationText: expProps.plain,
            explanationHtml: expProps.html,
            note: expProps.plain,
            noteText: expProps.plain,
            noteHtml: expProps.html,
            tags: q.tags,
            sourceFormat: q.sourceFormat
        }, q.sourceMcqIndex ?? qIndex);

        const newUid = computeQuestionUid(norm.question, norm.correctAnswer);
        const bookmarkMigrated = Boolean(q.uid && newUid && q.uid !== newUid && this.bookmarks.has(q.uid));
        if (bookmarkMigrated) {
            this.bookmarks.delete(q.uid);
            this.bookmarks.add(newUid);
        }

        const updatedQ = {
            ...q,
            version: norm.version,
            uid: newUid,
            question: norm.question,
            questionHtml: norm.questionHtml,
            options: norm.options.slice(),
            optionsHtml: norm.optionsHtml.slice(),
            correctAnswer: norm.correctAnswer,
            correctAnswerHtml: norm.correctAnswerHtml,
            correctIndex: norm.correctIndex,
            explanation: norm.explanation || null,
            explanationHtml: norm.explanationHtml || null,
            note: norm.note || null,
            noteHtml: norm.noteHtml || null,
            hasMath: norm.hasMath,
            hasCode: norm.hasCode,
            hasMedia: norm.hasMedia
        };

        // Recalculate user answer & correctness if already answered
        const wasAnswered = (q.userAnswer !== null && q.userAnswer !== undefined && q.userAnswer !== '') || (typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0);
        if (wasAnswered) {
            let nextUserIdx = -1;
            if (typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0) {
                nextUserIdx = origIndexMap.indexOf(q.userAnswerIndex);
            }
            if (nextUserIdx === -1 && q.userAnswer !== null && q.userAnswer !== undefined) {
                const prevNorm = normalizeCompareText(q.userAnswer);
                if (prevNorm) {
                    nextUserIdx = updatedQ.options.findIndex(o => normalizeCompareText(o) === prevNorm);
                }
            }

            if (nextUserIdx >= 0 && nextUserIdx < updatedQ.options.length) {
                updatedQ.userAnswerIndex = nextUserIdx;
                updatedQ.userAnswer = updatedQ.options[nextUserIdx];
                updatedQ.isCorrect = isUserSelectionCorrect(updatedQ, updatedQ.userAnswer, updatedQ.userAnswerIndex);
            } else {
                updatedQ.userAnswerIndex = null;
                updatedQ.userAnswer = null;
                updatedQ.isCorrect = null;
            }
        } else {
            updatedQ.userAnswerIndex = null;
            updatedQ.userAnswer = null;
            updatedQ.isCorrect = null;
        }

        this.run.questions[qIndex] = updatedQ;
        this.syncUpdatedQuestionToRepo(q, updatedQ);
        this.persistActiveDraft();

        const layout = this.run.config.layout;
        if (layout === 'scroll') {
            this.closeEditQuestionModal();
            this.patchEditedQuestionInPlace(qIndex);
        } else {
            const prevRootScroll = this.root.scrollTop;
            const prevBookletScroll = this.root.querySelector('.ex-booklet')?.scrollTop || 0;
            this.closeEditQuestionModal();
            this.render();
            this.root.scrollTop = prevRootScroll;
            const bookletEl = this.root.querySelector('.ex-booklet');
            if (bookletEl) bookletEl.scrollTop = prevBookletScroll;
        }

        // Persist migrated bookmark & updated MCQ back to Study Plan Firestore
        const bridge = this.getBridge();
        if (bookmarkMigrated) {
            toggleBookmarkPersist(bridge, q.uid, false)
                .then(() => toggleBookmarkPersist(bridge, newUid, true))
                .then((nextSet) => { this.bookmarks = nextSet; })
                .catch(() => {});
        }
        if (bridge && typeof bridge.updateStudyPlanMcq === 'function') {
            try {
                const saveRes = await bridge.updateStudyPlanMcq({
                    monthId: q.monthId || null,
                    weekId: q.weekId || null,
                    dayIndex: q.dayIndex ?? null,
                    rowIndex: q.rowIndex ?? null,
                    sourceMcqIndex: q.sourceMcqIndex ?? null,
                    sourceMcqUid: q.sourceMcqUid || null,
                    originalQuestion: q.questionHtml || q.question || '',
                    originalFingerprint: computeFingerprint(q),
                    updatedMcq: {
                        uid: q.sourceMcqUid || norm.uid,
                        question: norm.question,
                        questionText: norm.questionText,
                        questionHtml: norm.questionHtml,
                        options: norm.options,
                        optionsText: norm.optionsText,
                        optionsHtml: norm.optionsHtml,
                        correctIndex: norm.correctIndex,
                        correctAnswer: norm.correctAnswer,
                        correctAnswerHtml: norm.correctAnswerHtml,
                        explanation: norm.explanation,
                        explanationText: norm.explanationText,
                        explanationHtml: norm.explanationHtml,
                        note: norm.note,
                        noteText: norm.noteText,
                        noteHtml: norm.noteHtml,
                        tags: norm.tags
                    }
                });
                if (saveRes?.savedRemote) {
                    this.showToast(wasAnswered
                        ? 'Question updated, result adjusted & saved to Study Plan.'
                        : 'Question updated & saved to Study Plan.');
                } else {
                    this.showToast(wasAnswered
                        ? 'Question updated & result adjusted for this session.'
                        : 'Question updated for this session.');
                }
            } catch (err) {
                console.warn('[NewExamUI] Study Plan persistence failed:', err);
                this.showToast(wasAnswered
                    ? 'Question updated & result adjusted locally.'
                    : 'Question updated locally.');
            }
        } else {
            this.showToast(wasAnswered
                ? 'Question updated & result adjusted.'
                : 'Question updated.');
        }
    }

    goToQuestion(targetIdx) {
        if (!this.run) return;
        if (targetIdx < 0 || targetIdx >= this.run.questions.length) return;
        if (!this.run.config.allowNavigation && targetIdx < this.run.currentIndex) return;

        this.run.currentIndex = targetIdx;
        this.persistActiveDraft();

        if ((this.run.config.layout === 'omr' || this.run.config.layout === 'scroll') && this.root) {
            this.root.querySelectorAll('[data-scroll-q].cur, .ex-omr-row.cur, .ex-pal-btn.cur').forEach(el => el.classList.remove('cur'));
            this.root.querySelectorAll(`[data-scroll-q="${targetIdx}"], .ex-omr-row[data-omr-q="${targetIdx}"], .ex-pal-btn[data-go-q="${targetIdx}"]`).forEach(el => el.classList.add('cur'));
            requestAnimationFrame(() => {
                const el = this.root?.querySelector(`[data-scroll-q="${targetIdx}"]`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            return;
        }

        this.render();
    }

    updateRunHeaderCounters() {
        if (!this.run) return;
        const badge = this.root?.querySelector('#ex-tab-switch-badge');
        if (badge) {
            badge.textContent = `${this.run.tabSwitches} tab switch${this.run.tabSwitches === 1 ? '' : 'es'}`;
            badge.style.display = this.run.tabSwitches > 0 ? 'inline-flex' : 'none';
        }
    }

    requestSubmit() {
        if (!this.run) return;
        if (this.run.config.confirmSubmit !== false) {
            this.submitDialogOpen = true;
            this.render();
        } else {
            this.finalizeAndSubmitExam(false);
        }
    }

    async finalizeAndSubmitExam(autoSubmitted = false) {
        if (!this.run) return;
        this.stopTimerLoop();
        this.submitDialogOpen = false;

        const nowMs = Date.now();
        const totalElapsedMs = this.run.paused
            ? (this.run.pausedElapsedMs || 0)
            : (this.run.pausedElapsedMs || 0) + (nowMs - (this.run.lastActiveStartMs || nowMs));
        const timeTakenSec = Math.max(1, Math.round(totalElapsedMs / 1000));

        const cfg = this.run.config;
        const pos = Number(cfg.positiveMark ?? 1);
        const neg = Number(cfg.negativeMark ?? 0.5);
        const unans = Number(cfg.unansweredMark ?? 0);
        const passPct = Number(cfg.passPercent ?? 50);

        let correctCount = 0;
        let wrongCount = 0;
        let unansweredCount = 0;
        let markedCount = 0;

        const subjectStatsMap = new Map();
        const topicStatsMap = new Map();

        const analyzedQuestions = this.run.questions.map((q) => {
            const answered = (q.userAnswer !== null && q.userAnswer !== undefined && q.userAnswer !== '') || (typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0);
            const isCorrect = answered ? isUserSelectionCorrect(q, q.userAnswer, q.userAnswerIndex) : null;
            if (q.markedForReview) markedCount++;

            let delta = unans;
            if (isCorrect === true) {
                correctCount++;
                delta = pos;
            } else if (answered) {
                wrongCount++;
                delta = -neg;
            } else {
                unansweredCount++;
            }

            const subjName = q.subject || 'General';
            if (!subjectStatsMap.has(subjName)) {
                subjectStatsMap.set(subjName, { name: subjName, total: 0, correct: 0, wrong: 0, unanswered: 0, netMarks: 0 });
            }
            const sStat = subjectStatsMap.get(subjName);
            sStat.total++;
            if (isCorrect === true) sStat.correct++;
            else if (answered) sStat.wrong++;
            else sStat.unanswered++;
            sStat.netMarks += delta;

            const topicName = `${subjName} — ${q.topic || 'General'}`;
            if (!topicStatsMap.has(topicName)) {
                topicStatsMap.set(topicName, { key: q.topicKey, subject: subjName, topic: q.topic || 'General', total: 0, correct: 0, wrong: 0, unanswered: 0, netMarks: 0 });
            }
            const tStat = topicStatsMap.get(topicName);
            tStat.total++;
            if (isCorrect === true) tStat.correct++;
            else if (answered) tStat.wrong++;
            else tStat.unanswered++;
            tStat.netMarks += delta;

            return {
                ...q,
                isCorrect,
                markDelta: delta
            };
        });

        const totalQuestions = analyzedQuestions.length;
        const attemptedCount = correctCount + wrongCount;
        const maxScore = totalQuestions * pos;
        const netScore = (correctCount * pos) - (wrongCount * neg) + (unansweredCount * unans);
        const percentage = maxScore > 0 ? Math.max(0, (netScore / maxScore) * 100) : 0;
        const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;
        const passThresholdMarks = (maxScore * passPct) / 100;
        const passed = netScore >= passThresholdMarks;

        const finalizeBreakdown = (arr) => arr.map(item => {
            const att = item.correct + item.wrong;
            const acc = att > 0 ? (item.correct / att) * 100 : 0;
            const pct = (item.total * pos) > 0 ? Math.max(0, (item.netMarks / (item.total * pos)) * 100) : 0;
            return {
                ...item,
                accuracy: Number(acc.toFixed(1)),
                percentage: Number(pct.toFixed(1))
            };
        });

        const resultRecord = {
            attemptId: this.run.attemptId,
            timestampMs: nowMs,
            title: this.run.title,
            subjectSummary: this.run.subjectSummary,
            mode: cfg.mode,
            layout: cfg.layout,
            presetId: cfg.presetId || 'custom',
            totalQuestions,
            attemptedCount,
            correctCount,
            wrongCount,
            unansweredCount,
            markedCount,
            positiveMark: pos,
            negativeMark: neg,
            unansweredMark: unans,
            maxScore: Number(maxScore.toFixed(2)),
            netScore: Number(netScore.toFixed(2)),
            percentage: Number(percentage.toFixed(1)),
            accuracy: Number(accuracy.toFixed(1)),
            passPercent: passPct,
            passThresholdMarks: Number(passThresholdMarks.toFixed(2)),
            passed,
            timeTakenSec,
            avgTimePerQSec: totalQuestions > 0 ? Number((timeTakenSec / totalQuestions).toFixed(1)) : 0,
            tabSwitches: this.run.tabSwitches || 0,
            autoSubmitted: !!autoSubmitted,
            subjectBreakdown: finalizeBreakdown(Array.from(subjectStatsMap.values())),
            topicBreakdown: finalizeBreakdown(Array.from(topicStatsMap.values())),
            configSnapshot: cfg,
            questions: analyzedQuestions
        };

        playExamSound(cfg.soundEffects, 'submit');

        // Clear unfinished draft immediately so reload never reopens finished exam
        const bridge = this.getBridge();
        clearExamDraft(bridge?.getUserId?.() || 'guest');
        this.draft = null;
        this.run = null;

        this.activeResult = resultRecord;
        this.resultFilter = 'all';
        this.resultSubjectFilter = 'all';
        this.resultSearch = '';
        this.view = 'result';
        this.saveStatus = { saving: true, savedRemote: false, reason: '' };
        this.render();

        // Persist result & feed reviewQuestions for Study Plan ecosystem sync
        const saveRes = await persistExamResult(bridge, resultRecord);
        if (saveRes.savedRemote && bridge && !bridge.isGuestMode?.()) {
            try {
                await bridge.syncWrongQuestionsToReview(resultRecord);
            } catch (e) {
                console.warn('[NewExamUI] Review sync skipped:', e);
            }
        }
        this.saveStatus = { saving: false, savedRemote: saveRes.savedRemote, reason: saveRes.reason || '' };
        this.history = await fetchExamHistory(bridge);
        this.render();
    }

    retrySameExam(sourceResult = this.activeResult, onlyIncorrect = false) {
        if (!sourceResult || !Array.isArray(sourceResult.questions)) return;
        let pool = sourceResult.questions;
        if (onlyIncorrect) {
            pool = pool.filter(q => q.isCorrect !== true);
            if (pool.length === 0) {
                this.showToast('You had no incorrect or skipped questions in this exam!');
                return;
            }
        }

        const cfg = { ...(sourceResult.configSnapshot || this.config.settings) };
        if (onlyIncorrect) {
            cfg.mode = 'practice';
            cfg.timingType = 'unlimited';
        }

        const prepared = (cfg.questionOrder === 'serial' ? pool : shuffleArrayCopy(pool)).map((q, idx) => {
            const bundle = processOptionBundle(q, cfg.shuffleOptions !== false);
            return {
                ...q,
                examIndex: idx,
                options: bundle.options,
                optionsHtml: bundle.optionsHtml,
                correctIndex: bundle.correctIndex,
                correctAnswer: bundle.correctIndex !== -1 ? bundle.options[bundle.correctIndex] : q.correctAnswer,
                correctAnswerHtml: bundle.correctIndex !== -1 ? bundle.optionsHtml[bundle.correctIndex] : q.correctAnswerHtml,
                userAnswer: null,
                userAnswerIndex: null,
                isCorrect: null,
                markedForReview: false
            };
        });

        this.startExamination(prepared, {
            title: onlyIncorrect ? `Mistakes Practice — ${sourceResult.title}` : sourceResult.title,
            subjectSummary: sourceResult.subjectSummary,
            configSnapshot: cfg
        });
    }

    printAnswerScript(resultObj = this.activeResult) {
        if (!resultObj || !resultObj.questions?.length) return;
        const win = window.open('', '_blank', 'height=900,width=1100');
        if (!win) {
            this.showToast('Please allow popups to print the answer script.');
            return;
        }

        const rowsHtml = resultObj.questions.map((q, idx) => {
            const statusText = q.isCorrect === true ? 'Correct' : (q.userAnswer ? 'Wrong' : 'Skipped');
            const statusColor = q.isCorrect === true ? '#16a34a' : (q.userAnswer ? '#dc2626' : '#64748b');
            const hasExp = Boolean(q.explanationHtml || q.explanation || q.noteHtml || q.note);
            const expField = (q.explanationHtml || q.explanation) ? 'explanation' : 'note';
            return `
                <div class="q-item">
                    <div class="q-top">
                        <span><b>Q${idx + 1}.</b> ${renderMcqFieldHtml(q, 'question')}</span>
                        <span style="color:${statusColor}; font-weight:700; font-size:10px; white-space:nowrap;">[${statusText} | ${q.markDelta >= 0 ? '+' : ''}${q.markDelta}]</span>
                    </div>
                    <div class="q-opts">
                        ${(q.options || []).map((opt, i) => {
                            const lbl = getLocalizedOptionLabel(i, q.question, q.options);
                            const isRight = isOptionCorrect(q, i, opt);
                            const isMine = (typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0)
                                ? (i === q.userAnswerIndex)
                                : (q.userAnswer !== null && opt === q.userAnswer);
                            return `<div class="${isRight ? 'opt-ok' : (isMine ? 'opt-bad' : '')}"><b>${lbl}.</b> ${renderMcqFieldHtml(q, 'option', i)} ${isRight ? '✓' : (isMine ? '✗ (You)' : '')}</div>`;
                        }).join('')}
                    </div>
                    ${hasExp ? `<div class="q-exp"><b>Explanation:</b> ${renderMcqFieldHtml(q, expField)}</div>` : ''}
                </div>`;
        }).join('');

        win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(resultObj.title)} — Answer Script</title>
        ${getExamPrintRichHeadHtml()}
        <style>
            @page { size: A4; margin: 1.1cm; }
            body { font-family: 'Inter', 'Kalpurush', sans-serif; color: #0f172a; font-size: 11px; line-height: 1.45; }
            .hdr { border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
            .hdr h1 { margin: 0 0 4px; font-size: 18px; }
            .cols { column-count: 2; column-gap: 18px; }
            .q-item { break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; margin-bottom: 10px; }
            .q-top { display: flex; justify-content: space-between; gap: 6px; margin-bottom: 5px; }
            .q-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 8px; font-size: 10px; }
            .opt-ok { color: #15803d; font-weight: 700; }
            .opt-bad { color: #b91c1c; font-weight: 600; }
            .q-exp { margin-top: 5px; padding-top: 4px; border-top: 1px dashed #e2e8f0; font-size: 10px; color: #334155; }
        </style></head><body>
            <div class="hdr">
                <div>
                    <h1>${esc(resultObj.title)}</h1>
                    <div>Subject: ${esc(resultObj.subjectSummary)} · Date: ${esc(formatDateTime(resultObj.timestampMs))}</div>
                </div>
                <div style="text-align:right">
                    <b>Score: ${resultObj.netScore} / ${resultObj.maxScore} (${resultObj.percentage}%)</b><br>
                    Correct: ${resultObj.correctCount} · Wrong: ${resultObj.wrongCount} · Unanswered: ${resultObj.unansweredCount} · ${resultObj.passed ? 'PASSED' : 'FAILED'}
                </div>
            </div>
            <div class="cols">${rowsHtml}</div>
            <script>window.onload = () => setTimeout(() => window.print(), 300);<\/script>
        </body></html>`);
        win.document.close();
    }

    // ------------------------------------------------------------------------
    // Master Render Router
    // ------------------------------------------------------------------------
    render() {
        if (!this.root) return;

        const sameView = this._lastRenderedView === this.view;
        const prevRootScrollTop = sameView ? this.root.scrollTop : 0;
        const prevBookletScrollTop = sameView ? (this.root.querySelector('.ex-booklet')?.scrollTop || 0) : 0;
        const prevOmrScrollTop = sameView ? (this.root.querySelector('.ex-omr-pane')?.scrollTop || 0) : 0;
        const prevPalScrollTop = sameView ? (this.root.querySelector('.ex-palette-card')?.scrollTop || 0) : 0;

        const isRun = this.view === 'run' && this.run;
        const headerHtml = isRun ? '' : this.renderTopNavHtml();

        let bodyHtml = '';
        if (this.view === 'config') {
            bodyHtml = this.renderConfigViewHtml();
        } else if (this.view === 'run' && this.run) {
            bodyHtml = this.renderRunViewHtml();
        } else if (this.view === 'result' && this.activeResult) {
            bodyHtml = this.renderResultViewHtml();
        } else if (this.view === 'history') {
            bodyHtml = this.renderHistoryViewHtml();
        } else {
            bodyHtml = this.renderConfigViewHtml();
        }

        this.root.innerHTML = `${headerHtml}${bodyHtml}`;
        this.bindViewEvents();
        this._lastRenderedView = this.view;

        if (sameView) {
            this.root.scrollTop = prevRootScrollTop;
            const booklet = this.root.querySelector('.ex-booklet');
            if (booklet) booklet.scrollTop = prevBookletScrollTop;
            const omrPane = this.root.querySelector('.ex-omr-pane');
            if (omrPane) omrPane.scrollTop = prevOmrScrollTop;
            const palCard = this.root.querySelector('.ex-palette-card');
            if (palCard) palCard.scrollTop = prevPalScrollTop;
        } else {
            this.root.scrollTop = 0;
        }
    }

    renderTopNavHtml() {
        const ctxLabel = this.repo?.inheritedCollection?.title
            ? `Context: ${this.repo.inheritedCollection.title}`
            : 'Study Plan Question Bank';

        return `
            <header class="ex-topnav">
                <div class="ex-topnav-in">
                    <div class="ex-brand">
                        <div class="ex-brand-badge"><i class="fas fa-graduation-cap"></i></div>
                        <div class="ex-brand-title">
                            <b>Examination Studio</b>
                            <small>${esc(ctxLabel)}</small>
                        </div>
                    </div>

                    <div class="ex-nav-actions">
                        <div class="ex-tabs" role="tablist">
                            <button type="button" class="ex-tab-btn ${this.view === 'config' ? 'on' : ''}" data-action="nav-config">
                                <i class="fas fa-sliders-h"></i> Configure Exam
                            </button>
                            <button type="button" class="ex-tab-btn ${this.view === 'history' ? 'on' : ''}" data-action="nav-history">
                                <i class="fas fa-history"></i> History
                                <span class="ex-count-badge">${this.history.length}</span>
                            </button>
                        </div>
                        <button type="button" class="ex-btn sm" data-action="close-new-ui">
                            <i class="fas fa-arrow-left"></i> Return to Study Plan
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    // ------------------------------------------------------------------------
    // VIEW 1: Configuration Page (BCS Mate Inspired)
    // ------------------------------------------------------------------------
    renderConfigViewHtml() {
        if (this.isLoadingRepo || !this.repo) {
            return `
                <main class="ex-main">
                    <div class="ex-card" style="text-align:center; padding:48px 20px;">
                        <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--ex-accent); margin-bottom:12px;"></i>
                        <div style="font-weight:700; font-size:1.05rem;">Indexing your Study Plan Question Bank...</div>
                        <p style="color:var(--ex-muted); font-size:0.88rem; margin-top:4px;">Loading subjects, topics, vocabulary pools, and attempt history.</p>
                    </div>
                </main>
            `;
        }

        const repo = this.repo;
        const s = this.config.settings;
        const preview = this.getCurrentSelectionPreview();
        const timing = this.getTimingSummary(preview.actualCount);
        const maxScore = Number((preview.actualCount * Number(s.positiveMark || 1)).toFixed(2));
        const passMarks = Number(((maxScore * Number(s.passPercent || 50)) / 100).toFixed(2));

        // 1. Draft recovery callout
        const draftBannerHtml = this.draft ? `
            <div class="ex-callout">
                <div>
                    <div style="font-weight:700; font-size:0.95rem;"><i class="fas fa-clock" style="color:var(--ex-accent); margin-right:6px;"></i>Unfinished Examination Saved</div>
                    <div style="font-size:0.84rem; color:var(--ex-muted); margin-top:2px;">
                        <b>${esc(this.draft.title)}</b> · ${this.draft.questions.filter(q => q.userAnswer !== null).length}/${this.draft.questions.length} answered ·
                        ${this.draft.unlimited ? 'Unlimited time' : formatClock(Math.ceil((this.draft.pausedRemainingMs || 0) / 1000)) + ' left'} ·
                        Saved ${formatDateTime(this.draft.updatedAt)}
                    </div>
                </div>
                <div class="ex-row">
                    <button type="button" class="ex-btn primary sm" data-action="resume-draft"><i class="fas fa-play"></i> Resume Exam</button>
                    <button type="button" class="ex-btn danger-soft sm" data-action="discard-draft">Discard</button>
                </div>
            </div>
        ` : '';

        // 2. Presets HTML
        const presetsHtml = EXAM_PRESETS.map(p => `
            <button type="button" class="ex-preset ${s.presetId === p.id ? 'on' : ''}" data-preset="${p.id}">
                <span class="ex-pre-ic"><i class="fas ${p.icon}"></i></span>
                <span class="ex-pre-text">
                    <b>${esc(p.title)}</b>
                    <small>${esc(p.subtitle)}</small>
                </span>
            </button>
        `).join('');

        const previousPaperNotice = (s.presetId === 'previous' && repo.previousPaperTopics.length === 0)
            ? `<div class="ex-callout warn" style="margin:6px 0 0;">
                    <div style="font-size:0.83rem;">
                        <b>No separate Past-Paper Archive in Database:</b> Your Study Plan currently has no topics tagged with BCS/Previous Paper keywords.
                        No external past-paper bank is bundled — select from your real Study Plan subjects &amp; topics below, or tag a topic with "BCS" / "Previous".
                    </div>
               </div>`
            : '';

        // 3. Subject & Topic Selection HTML (Multi-subject & Multi-topic + Collapsible)
        const selectedSubjectKeys = Array.isArray(this.config.selectedSubjectKeys)
            ? this.config.selectedSubjectKeys
            : (this.config.selectedSubjectKey ? [this.config.selectedSubjectKey] : []);
        const selectedSubjectSet = new Set(selectedSubjectKeys);
        const selectedSubjects = repo.subjects.filter(sub => selectedSubjectSet.has(sub.key));

        const visibleTopics = this.config.scopeMode === 'subject'
            ? selectedSubjects.flatMap(sub => sub.topics)
            : repo.allTopics;
        const searchLower = (this.config.topicSearch || '').trim().toLowerCase();
        const filteredTopics = searchLower
            ? visibleTopics.filter(t => t.title.toLowerCase().includes(searchLower) || t.subject.toLowerCase().includes(searchLower) || t.subtitle.toLowerCase().includes(searchLower))
            : visibleTopics;
        const selectedTopicSet = new Set(this.config.selectedTopicKeys || []);
        const selectedInVisibleCount = visibleTopics.filter(t => selectedTopicSet.has(t.topicKey)).length;

        let sectionBSummary = '';
        if (this.config.scopeMode === 'inherited' && repo.inheritedCollection) {
            sectionBSummary = `${repo.inheritedCollection.title} · ${repo.inheritedCollection.questions.length} Qs`;
        } else if (this.config.scopeMode === 'subject') {
            if (selectedSubjects.length === 0) {
                sectionBSummary = 'No subjects selected';
            } else if (selectedSubjects.length === 1) {
                sectionBSummary = `${selectedSubjects[0].name} · ${selectedInVisibleCount}/${visibleTopics.length} topics`;
            } else {
                sectionBSummary = `${selectedSubjects.length} subjects · ${selectedInVisibleCount}/${visibleTopics.length} topics`;
            }
        } else {
            sectionBSummary = `All Subjects · ${selectedInVisibleCount}/${visibleTopics.length} topics`;
        }

        const subjectChipsHtml = this.config.scopeMode === 'subject' ? `
            <div class="ex-subject-toolbar">
                <span style="font-size:0.78rem; font-weight:600; color:var(--ex-muted);">
                    Subjects (${selectedSubjects.length}/${repo.subjects.length} selected · click to toggle multiple)
                </span>
                <div class="ex-row">
                    <button type="button" class="ex-btn sm" data-action="subjects-select-all">Select All (${repo.subjects.length})</button>
                    <button type="button" class="ex-btn sm" data-action="subjects-clear">Clear</button>
                </div>
            </div>
            <div class="ex-chips" style="margin-top:2px;">
                ${repo.subjects.map(sub => {
                    const isOn = selectedSubjectSet.has(sub.key);
                    return `
                        <button type="button" class="ex-chip ${isOn ? 'on' : ''}" data-subject-key="${esc(sub.key)}" aria-pressed="${isOn ? 'true' : 'false'}">
                            ${isOn ? '<i class="fas fa-check" style="font-size:0.7rem;"></i>' : ''}
                            <span>${esc(sub.name)}</span>
                            <span class="cnt ex-num">${sub.questionCount}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        ` : '';

        const emptyTopicsMsg = (this.config.scopeMode === 'subject' && selectedSubjects.length === 0)
            ? 'Select one or more subjects above to pick topics.'
            : 'No topics with questions match this filter.';

        const topicPickerHtml = (this.config.scopeMode !== 'inherited') ? `
            <div class="ex-topic-picker">
                <div class="ex-topic-toolbar">
                    <input type="text" id="ex-topic-search-input" class="ex-input" placeholder="Filter topics or chapters..." value="${esc(this.config.topicSearch)}" style="flex:1; min-width:180px;">
                    <div class="ex-row">
                        <button type="button" class="ex-btn sm" data-action="topics-select-all">Select All (${filteredTopics.length})</button>
                        <button type="button" class="ex-btn sm" data-action="topics-clear">Clear</button>
                    </div>
                </div>
                <div class="ex-topic-list">
                    ${filteredTopics.length === 0 ? `<div style="grid-column:1/-1; padding:12px; text-align:center; color:var(--ex-muted); font-size:0.84rem;">${emptyTopicsMsg}</div>` : filteredTopics.map(t => {
                        const checked = selectedTopicSet.has(t.topicKey);
                        return `
                            <label class="ex-topic-item ${checked ? 'checked' : ''}">
                                <input type="checkbox" data-topic-key="${esc(t.topicKey)}" ${checked ? 'checked' : ''}>
                                <span class="ex-topic-meta">
                                    <b>${esc(t.title)}</b>
                                    <small>${esc(t.subject)} · ${esc(t.subtitle)} · <strong class="ex-num">${t.questionCount} Qs</strong></small>
                                </span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : `
            <div style="padding:10px 12px; border-radius:var(--ex-radius); background:var(--ex-accent-soft); border:1px solid color-mix(in srgb, var(--ex-accent) 35%, transparent); font-size:0.86rem;">
                <b>Inherited Selection:</b> ${esc(repo.inheritedCollection?.title || 'Selected Quiz')}
                (${esc(repo.inheritedCollection?.subjectName || 'Mixed')} · <b class="ex-num">${repo.inheritedCollection?.questions.length || 0} questions</b>)
            </div>
        `;

        // 4. Question Count Presets
        const countPresets = [10, 20, 25, 30, 50, 100, 150, 200];
        const rangeActive = (s.questionRangeStart !== '' && s.questionRangeStart !== null && s.questionRangeStart !== undefined)
            || (s.questionRangeEnd !== '' && s.questionRangeEnd !== null && s.questionRangeEnd !== undefined);
        let countUnavailableNotice = '';
        if (preview.totalEligible === 0) {
            countUnavailableNotice = `<div style="font-size:0.8rem; color:var(--ex-red); font-weight:600;"><i class="fas fa-exclamation-triangle"></i> 0 eligible questions match your selected topics &amp; filters.</div>`;
        } else if (rangeActive && preview.rangeError === 'invalid') {
            countUnavailableNotice = `<div style="font-size:0.8rem; color:var(--ex-red); font-weight:600;">The question range is invalid. Enter a start and end number, with the end greater than or equal to the start.</div>`;
        } else if (rangeActive && preview.actualCount < preview.requestedCount) {
            countUnavailableNotice = `<div style="font-size:0.8rem; color:var(--ex-amber); font-weight:600;"><i class="fas fa-info-circle"></i> Range ${preview.rangeStart}–${preview.rangeEnd}: only ${preview.actualCount} question${preview.actualCount === 1 ? '' : 's'} available in this selection.</div>`;
        } else if (!rangeActive && Number(s.questionCount) > preview.totalEligible && preview.totalEligible > 0) {
            countUnavailableNotice = `<div style="font-size:0.8rem; color:var(--ex-amber); font-weight:600;"><i class="fas fa-info-circle"></i> Requested ${s.questionCount} questions, but ${preview.totalEligible} eligible questions are available. Exam will include all ${preview.totalEligible}.</div>`;
        }

        // 5. Recent History Preview on Config bottom
        const recentHistoryHtml = this.history.length > 0 ? `
            <div class="ex-card" style="margin-top:20px;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; gap:10px;">
                    <h3 style="margin:0; font-size:1rem; font-weight:700;"><i class="fas fa-history" style="color:var(--ex-accent); margin-right:6px;"></i>Recent Examinations</h3>
                    <button type="button" class="ex-btn sm ghost" data-action="nav-history">View All (${this.history.length})</button>
                </div>
                <div class="ex-table-wrap">
                    <table class="ex-tbl">
                        <thead>
                            <tr>
                                <th>Examination</th>
                                <th>Mode</th>
                                <th class="num">Score</th>
                                <th class="num">Accuracy</th>
                                <th>Status</th>
                                <th class="num">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.history.slice(0, 5).map(h => `
                                <tr>
                                    <td>
                                        <div style="font-weight:600;">${esc(h.title)}</div>
                                        <div style="font-size:0.74rem; color:var(--ex-muted);">${esc(formatDateTime(h.timestampMs))} · ${h.totalQuestions} Qs</div>
                                    </td>
                                    <td><span class="ex-tag">${esc(h.mode)}</span></td>
                                    <td class="num"><b>${h.netScore}</b> / ${h.maxScore} (${h.percentage}%)</td>
                                    <td class="num">${h.accuracy}%</td>
                                    <td><span class="ex-tag" style="color:${h.passed ? 'var(--ex-good)' : 'var(--ex-red)'}; border-color:currentColor;">${h.passed ? 'PASS' : 'FAIL'}</span></td>
                                    <td class="num">
                                        <button type="button" class="ex-btn sm" data-open-history="${esc(h.attemptId || h.id)}">Review</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : '';

        return `
            <main class="ex-main">
                ${draftBannerHtml}
                <div class="ex-config-grid">
                    <div class="ex-config-left">
                        <div class="ex-card" style="display:flex; flex-direction:column; gap:18px;">
                            <!-- Section A: Examination Presets -->
                            <fieldset class="ex-fieldset">
                                <legend class="ex-legend"><i class="fas fa-layer-group"></i> A. Examination Presets</legend>
                                <div class="ex-presets">${presetsHtml}</div>
                                ${previousPaperNotice}
                            </fieldset>

                            <!-- Section B: What to Examine (Collapsed by default) -->
                            <fieldset class="ex-fieldset">
                                <button type="button" class="ex-section-toggle" data-action="toggle-section-b" aria-expanded="${this.config.sectionBExpanded ? 'true' : 'false'}">
                                    <span class="ex-legend" style="margin-bottom:0;"><i class="fas fa-book-open"></i> B. What to Examine — Subjects &amp; Topics</span>
                                    <span class="ex-section-toggle-right">
                                        <span class="ex-collapse-summary">${esc(sectionBSummary)}</span>
                                        <span class="ex-collapse-icon" aria-hidden="true">
                                            <i class="fas ${this.config.sectionBExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
                                        </span>
                                    </span>
                                </button>
                                ${this.config.sectionBExpanded ? `
                                    <div class="ex-row">
                                        <span class="ex-label-col">Scope</span>
                                        <div class="ex-seg">
                                            ${repo.inheritedCollection ? `<button type="button" class="${this.config.scopeMode === 'inherited' ? 'on' : ''}" data-scope="inherited">Current Selection (${repo.inheritedCollection.questions.length})</button>` : ''}
                                            <button type="button" class="${this.config.scopeMode === 'all' ? 'on' : ''}" data-scope="all">All Subjects (${repo.allQuestions.length})</button>
                                            <button type="button" class="${this.config.scopeMode === 'subject' ? 'on' : ''}" data-scope="subject">By Subject</button>
                                        </div>
                                    </div>
                                    ${subjectChipsHtml}
                                    ${topicPickerHtml}
                                ` : ''}
                            </fieldset>

                            <!-- Section C: Question Count -->
                            <fieldset class="ex-fieldset">
                                <legend class="ex-legend"><i class="fas fa-list-ol"></i> C. Question Count</legend>
                                <div class="ex-row">
                                    <span class="ex-label-col">Questions</span>
                                    <div class="ex-chips" style="flex:1;">
                                        ${countPresets.map(n => `
                                            <button type="button" class="ex-chip ${!rangeActive && Number(s.questionCount) === n ? 'on' : ''}" data-qcount="${n}">${n}</button>
                                        `).join('')}
                                        <button type="button" class="ex-chip ${!rangeActive && Number(s.questionCount) === preview.totalEligible && preview.totalEligible > 0 ? 'on' : ''}" data-qcount="${Math.max(1, preview.totalEligible)}">All (${preview.totalEligible})</button>
                                        <input type="number" id="ex-custom-qcount" class="ex-input ex-num" min="1" max="1000" value="${rangeActive ? '' : s.questionCount}" placeholder="Count" style="width:86px;" aria-label="Custom Question Count">
                                        <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap; padding:2px 0;">
                                            <span style="font-size:0.72rem; color:var(--ex-muted); font-weight:700;">RANGE</span>
                                            <input type="number" id="ex-question-range-start" class="ex-input ex-num" min="1" max="10000" value="${rangeActive ? esc(s.questionRangeStart) : ''}" placeholder="From" style="width:72px;" aria-label="Question range start">
                                            <span style="color:var(--ex-muted);">–</span>
                                            <input type="number" id="ex-question-range-end" class="ex-input ex-num" min="1" max="10000" value="${rangeActive ? esc(s.questionRangeEnd) : ''}" placeholder="To" style="width:72px;" aria-label="Question range end">
                                            <button type="button" class="ex-btn sm" data-action="apply-question-range">Apply</button>
                                            ${rangeActive ? `<button type="button" class="ex-btn sm ghost" data-action="clear-question-range">Clear</button>` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div style="font-size:0.74rem; color:var(--ex-muted); margin-top:4px;">Select a numbered range from the eligible questions; random selection only shuffles questions inside that range.</div>
                                ${countUnavailableNotice}
                            </fieldset>

                            <!-- Section D: Question Selection Options -->
                            <fieldset class="ex-fieldset">
                                <legend class="ex-legend"><i class="fas fa-filter"></i> D. Question Selection Options</legend>
                                <div class="ex-row">
                                    <span class="ex-label-col">Order</span>
                                    <div class="ex-seg">
                                        <button type="button" class="${s.questionOrder === 'random' ? 'on' : ''}" data-order="random">Random Selection</button>
                                        <button type="button" class="${s.questionOrder === 'serial' ? 'on' : ''}" data-order="serial">Original Order</button>
                                    </div>
                                </div>
                                <div class="ex-tgl-grid">
                                    <label class="ex-tgl ${s.questionOrder === 'serial' ? 'disabled' : ''}">
                                        <input type="checkbox" data-setting="shuffleQuestions" ${s.shuffleQuestions && s.questionOrder !== 'serial' ? 'checked' : ''} ${s.questionOrder === 'serial' ? 'disabled' : ''}>
                                        <span><b>Shuffle Questions</b><small>Randomize question sequence</small></span>
                                    </label>
                                    <label class="ex-tgl">
                                        <input type="checkbox" data-setting="shuffleOptions" ${s.shuffleOptions ? 'checked' : ''}>
                                        <span><b>Shuffle Answer Options</b><small>Preserves "All / None of above"</small></span>
                                    </label>
                                    <label class="ex-tgl">
                                        <input type="checkbox" data-setting="avoidRecent" ${s.avoidRecent ? 'checked' : ''}>
                                        <span><b>Avoid Recently Attempted</b><small>Prioritize fresh questions (${repo.recentAttemptedCount} recent)</small></span>
                                    </label>
                                    <label class="ex-tgl">
                                        <input type="checkbox" data-setting="includeAttempted" ${s.includeAttempted ? 'checked' : ''}>
                                        <span><b>Include Previously Attempted</b><small>Turn off for unseen only</small></span>
                                    </label>
                                    <label class="ex-tgl">
                                        <input type="checkbox" data-setting="wrongOnly" ${s.wrongOnly ? 'checked' : ''}>
                                        <span><b>Incorrect Questions Only</b><small>From wrong &amp; review history (${repo.wrongHistoryCount} recorded)</small></span>
                                    </label>
                                    <label class="ex-tgl">
                                        <input type="checkbox" data-setting="bookmarkedOnly" ${s.bookmarkedOnly ? 'checked' : ''}>
                                        <span><b>Bookmarked Questions Only</b><small>${this.bookmarks.size} bookmarked available</small></span>
                                    </label>
                                </div>
                            </fieldset>

                            <!-- Section E: Examination Mode & Interface -->
                            <fieldset class="ex-fieldset">
                                <legend class="ex-legend"><i class="fas fa-laptop"></i> E. Examination Mode &amp; Interface</legend>
                                <div class="ex-mode-grid">
                                    <button type="button" class="ex-ui-card ${s.mode === 'exam' ? 'on' : ''}" data-mode="exam">
                                        <span class="ui-head"><i class="fas fa-file-signature"></i> Exam Mode</span>
                                        <small>Answers &amp; explanations stay hidden until final submission.</small>
                                    </button>
                                    <button type="button" class="ex-ui-card ${s.mode === 'practice' ? 'on' : ''}" data-mode="practice">
                                        <span class="ui-head"><i class="fas fa-book-reader"></i> Practice Mode</span>
                                        <small>Instant right/wrong reveal + explanation after every answer.</small>
                                    </button>
                                    <button type="button" class="ex-ui-card ${s.mode === 'timed-practice' ? 'on' : ''}" data-mode="timed-practice">
                                        <span class="ui-head"><i class="fas fa-stopwatch"></i> Timed Practice</span>
                                        <small>Learn with instant explanations under a custom countdown.</small>
                                    </button>
                                    <button type="button" class="ex-ui-card ${s.mode === 'untimed-practice' ? 'on' : ''}" data-mode="untimed-practice">
                                        <span class="ui-head"><i class="fas fa-infinity"></i> Untimed Practice</span>
                                        <small>No time limit — practice calmly at your own pace.</small>
                                    </button>
                                </div>

                                <div class="ex-row" style="margin-top:4px;">
                                    <span class="ex-label-col">Workspace View</span>
                                    <div class="ex-seg">
                                        <button type="button" class="${s.layout === 'screen' ? 'on' : ''}" data-layout="screen"><i class="fas fa-square"></i> On-Screen (1-by-1)</button>
                                        <button type="button" class="${s.layout === 'omr' ? 'on' : ''}" data-layout="omr"><i class="fas fa-dot-circle"></i> OMR Bubble Sheet</button>
                                        <button type="button" class="${s.layout === 'scroll' ? 'on' : ''}" data-layout="scroll"><i class="fas fa-align-justify"></i> All-in-One Scroll</button>
                                    </div>
                                </div>
                            </fieldset>

                            <!-- Section F: Time Configuration -->
                            ${(() => {
                                const isAuto36 = this.isAuto36SecMode(s);
                                const displayedMinutes = (isAuto36 && preview.actualCount > 0)
                                    ? Number(((preview.actualCount * 36) / 60).toFixed(2))
                                    : Number(s.totalMinutes || 15);
                                return `
                                    <fieldset class="ex-fieldset">
                                        <legend class="ex-legend"><i class="fas fa-clock"></i> F. Time Configuration</legend>
                                        <div class="ex-row">
                                            <span class="ex-label-col">Timing Rule</span>
                                            <div class="ex-seg">
                                                <button type="button" class="${s.timingType === 'whole' && s.mode !== 'untimed-practice' ? 'on' : ''}" data-timing="whole" ${s.mode === 'untimed-practice' ? 'disabled' : ''}>Whole Exam (min)</button>
                                                <button type="button" class="${s.timingType === 'per-question' && s.mode !== 'untimed-practice' ? 'on' : ''}" data-timing="per-question" ${s.mode === 'untimed-practice' ? 'disabled' : ''}>Time Per Question (sec)</button>
                                                <button type="button" class="${s.timingType === 'unlimited' || s.mode === 'untimed-practice' ? 'on' : ''}" data-timing="unlimited">Unlimited Time</button>
                                            </div>
                                        </div>
                                        ${s.timingType === 'whole' && s.mode !== 'untimed-practice' ? `
                                            <div class="ex-row">
                                                <span class="ex-label-col">Minutes</span>
                                                <div class="ex-chips" style="flex:1;">
                                                    ${[5, 10, 15, 25, 30, 60, 90, 120].map(m => `
                                                        <button type="button" class="ex-chip ${!isAuto36 && Math.abs(displayedMinutes - m) < 0.01 ? 'on' : ''}" data-minutes="${m}">${m}m</button>
                                                    `).join('')}
                                                    <input type="number" id="ex-custom-minutes" class="ex-input ex-num" min="0.5" max="360" step="any" value="${displayedMinutes}" style="width:86px;" aria-label="Custom Minutes">
                                                </div>
                                            </div>
                                        ` : ''}
                                        ${s.timingType === 'per-question' && s.mode !== 'untimed-practice' ? `
                                            <div class="ex-row">
                                                <span class="ex-label-col">Sec / Question</span>
                                                <div class="ex-chips" style="flex:1;">
                                                    ${[15, 30, 36, 45, 60, 90].map(sec => `
                                                        <button type="button" class="ex-chip ${Number(s.secondsPerQuestion) === sec ? 'on' : ''}" data-secperq="${sec}">${sec}s</button>
                                                    `).join('')}
                                                    <input type="number" id="ex-custom-secperq" class="ex-input ex-num" min="5" max="600" value="${s.secondsPerQuestion}" style="width:80px;" aria-label="Custom Seconds Per Question">
                                                </div>
                                            </div>
                                        ` : ''}
                                        <div style="font-size:0.83rem; color:var(--ex-muted); background:var(--ex-sunk); padding:8px 12px; border-radius:4px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                                            <span>
                                                <i class="fas fa-tachometer-alt" style="color:var(--ex-accent); margin-right:6px;"></i>
                                                <b>Pace:</b> ${preview.actualCount} questions / ${esc(timing.displayDuration)} = <b class="ex-num">${esc(timing.paceText)}</b>
                                            </span>
                                            ${isAuto36 ? `<span class="ex-tag" style="color:var(--ex-accent); border-color:color-mix(in srgb, var(--ex-accent) 40%, transparent);">Auto 36s × ${preview.actualCount} Qs</span>` : ''}
                                        </div>
                                    </fieldset>
                                `;
                            })()}

                            <!-- Section G: Marking System -->
                            <fieldset class="ex-fieldset">
                                <legend class="ex-legend"><i class="fas fa-calculator"></i> G. Marking System</legend>
                                <div class="ex-row">
                                    <span class="ex-label-col">Presets</span>
                                    <div class="ex-chips">
                                        <button type="button" class="ex-chip ${Number(s.positiveMark) === 1 && Number(s.negativeMark) === 0.5 && Number(s.unansweredMark) === 0 ? 'on' : ''}" data-mark-preset="bcs">BCS (+1 / -0.5)</button>
                                        <button type="button" class="ex-chip ${Number(s.positiveMark) === 1 && Number(s.negativeMark) === 0.25 && Number(s.unansweredMark) === 0 ? 'on' : ''}" data-mark-preset="classic">Classic (+1 / -0.25)</button>
                                        <button type="button" class="ex-chip ${Number(s.positiveMark) === 1 && Number(s.negativeMark) === 0 && Number(s.unansweredMark) === 0 ? 'on' : ''}" data-mark-preset="nopen">No Negative (+1 / 0)</button>
                                    </div>
                                </div>
                                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:10px;">
                                    <label style="display:flex; flex-direction:column; gap:4px; font-size:0.8rem; font-weight:600;">
                                        Correct Answer (+)
                                        <input type="number" id="ex-mark-pos" class="ex-input ex-num" step="0.25" min="0.25" value="${s.positiveMark}">
                                    </label>
                                    <label style="display:flex; flex-direction:column; gap:4px; font-size:0.8rem; font-weight:600;">
                                        Wrong Deduction (-)
                                        <input type="number" id="ex-mark-neg" class="ex-input ex-num" step="0.05" min="0" value="${s.negativeMark}">
                                    </label>
                                    <label style="display:flex; flex-direction:column; gap:4px; font-size:0.8rem; font-weight:600;">
                                        Unanswered (+/-)
                                        <input type="number" id="ex-mark-unans" class="ex-input ex-num" step="0.25" value="${s.unansweredMark}">
                                    </label>
                                </div>
                            </fieldset>

                            <!-- Section H: Additional Examination Settings -->
                            <details class="ex-more" open>
                                <summary>
                                    <div>
                                        <b style="font-size:0.95rem;"><i class="fas fa-cog" style="color:var(--ex-accent); margin-right:6px;"></i>Additional Examination Settings</b>
                                        <small style="display:block; color:var(--ex-muted); font-size:0.76rem;">Pass mark (${s.passPercent}%), navigation rules, answer lock, sound &amp; tab guard</small>
                                    </div>
                                    <i class="fas fa-chevron-right chev"></i>
                                </summary>
                                <div style="display:flex; flex-direction:column; gap:14px; padding-top:8px;">
                                    <div class="ex-row">
                                        <span class="ex-label-col">Pass Mark</span>
                                        <input type="range" id="ex-pass-range" min="10" max="100" step="5" value="${s.passPercent}" style="flex:1; accent-color:var(--ex-accent);">
                                        <b class="ex-num" style="min-width:110px; text-align:right;">${s.passPercent}% (${passMarks} / ${maxScore})</b>
                                    </div>

                                    <div class="ex-tgl-grid">
                                        <label class="ex-tgl">
                                            <input type="checkbox" data-setting="allowNavigation" ${s.allowNavigation ? 'checked' : ''}>
                                            <span><b>Free Navigation (Prev &amp; Jump)</b><small>Jump across questions via palette</small></span>
                                        </label>
                                        <label class="ex-tgl">
                                            <input type="checkbox" data-setting="allowMarkForReview" ${s.allowMarkForReview ? 'checked' : ''}>
                                            <span><b>Mark for Review</b><small>Flag uncertain questions to revisit</small></span>
                                        </label>
                                        <label class="ex-tgl">
                                            <input type="checkbox" data-setting="lockAnswer" ${s.lockAnswer ? 'checked' : ''}>
                                            <span><b>Lock Answer After Click</b><small>Prevent changing selected option</small></span>
                                        </label>
                                        <label class="ex-tgl">
                                            <input type="checkbox" data-setting="confirmSubmit" ${s.confirmSubmit ? 'checked' : ''}>
                                            <span><b>Confirm Before Submit</b><small>Show summary dialog before finishing</small></span>
                                        </label>
                                        <label class="ex-tgl">
                                            <input type="checkbox" data-setting="autoSubmitOnTimeout" ${s.autoSubmitOnTimeout ? 'checked' : ''}>
                                            <span><b>Auto-Submit on Timeout</b><small>Submit automatically at 00:00</small></span>
                                        </label>
                                        <label class="ex-tgl">
                                            <input type="checkbox" data-setting="autoAdvance" ${s.autoAdvance ? 'checked' : ''}>
                                            <span><b>Auto-Advance Next</b><small>Move to next Q after selecting</small></span>
                                        </label>
                                        <label class="ex-tgl">
                                            <input type="checkbox" data-setting="showPalette" ${s.showPalette ? 'checked' : ''}>
                                            <span><b>Show Question Palette</b><small>Display side navigator panel</small></span>
                                        </label>
                                        <label class="ex-tgl">
                                            <input type="checkbox" data-setting="soundEffects" ${s.soundEffects ? 'checked' : ''}>
                                            <span><b>Sound Effects</b><small>Subtle audio cues on click &amp; submit</small></span>
                                        </label>
                                        <label class="ex-tgl">
                                            <input type="checkbox" data-setting="trackTabSwitches" ${s.trackTabSwitches ? 'checked' : ''}>
                                            <span><b>Tab / Window Switch Guard</b><small>Warn &amp; record switches during exam</small></span>
                                        </label>
                                    </div>

                                    <div style="display:flex; justify-content:flex-end;">
                                        <button type="button" class="ex-btn sm" data-action="reset-settings"><i class="fas fa-undo"></i> Reset to Default</button>
                                    </div>
                                </div>
                            </details>
                        </div>

                        ${recentHistoryHtml}
                    </div>

                    <!-- Right Sticky Summary Cover (xcover) -->
                    <aside class="ex-cover">
                        <div class="ex-card" style="display:flex; flex-direction:column; gap:14px;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span class="ex-pre-ic big"><i class="fas ${EXAM_PRESETS.find(p => p.id === s.presetId)?.icon || 'fa-file-alt'}"></i></span>
                                <div style="min-width:0;">
                                    <div style="font-size:0.74rem; text-transform:uppercase; font-weight:700; color:var(--ex-accent);">${esc(EXAM_PRESETS.find(p => p.id === s.presetId)?.title || 'Custom Exam')}</div>
                                    <h2 style="margin:2px 0 0; font-size:1.15rem; font-weight:800; line-height:1.3;">${esc(this.buildExamTitle())}</h2>
                                </div>
                            </div>

                            <ul class="ex-rules">
                                <li><span class="rk"><i class="fas fa-list-ol"></i> Questions</span><span class="rv ex-num">${preview.actualCount} <small style="font-weight:500; color:var(--ex-muted);">/ ${preview.totalEligible} eligible</small></span></li>
                                <li><span class="rk"><i class="fas fa-clock"></i> Duration</span><span class="rv ex-num">${esc(timing.displayDuration)}</span></li>
                                <li><span class="rk"><i class="fas fa-tachometer-alt"></i> Pace</span><span class="rv ex-num">${esc(timing.paceText)}</span></li>
                                <li><span class="rk"><i class="fas fa-graduation-cap"></i> Mode</span><span class="rv">${esc(s.mode.replace('-', ' ').toUpperCase())} · ${esc(s.layout.toUpperCase())}</span></li>
                                <li><span class="rk"><i class="fas fa-balance-scale"></i> Marking</span><span class="rv ex-num">+${s.positiveMark} / -${s.negativeMark} / ${s.unansweredMark}</span></li>
                                <li><span class="rk"><i class="fas fa-trophy"></i> Max &amp; Pass</span><span class="rv ex-num">${maxScore} (Pass ≥ ${passMarks})</span></li>
                            </ul>

                            <button type="button" class="ex-btn primary big" style="width:100%;" data-action="start-exam" ${preview.actualCount === 0 ? 'disabled' : ''}>
                                <i class="fas fa-play"></i> Start Examination (${preview.actualCount} Qs)
                            </button>
                        </div>
                    </aside>
                </div>

                <!-- Sticky Mobile Launch Bar (xgo) -->
                <div class="ex-mobile-go">
                    <div style="min-width:0;">
                        <b class="ex-num" style="font-size:0.95rem;">${preview.actualCount} Qs · ${esc(timing.displayDuration)}</b>
                        <div style="font-size:0.76rem; color:var(--ex-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">+${s.positiveMark} / -${s.negativeMark} · ${esc(s.mode)}</div>
                    </div>
                    <button type="button" class="ex-btn primary big" data-action="start-exam" ${preview.actualCount === 0 ? 'disabled' : ''}>
                        Start <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </main>
        `;
    }

    // ------------------------------------------------------------------------
    // VIEW 2: Examination Workspace (On-Screen, OMR Sheet, All-in-One Scroll)
    // ------------------------------------------------------------------------
    renderRunViewHtml() {
        const r = this.run;
        const total = r.questions.length;
        const answeredCount = r.questions.filter(q => q.userAnswer !== null).length;
        const markedCount = r.questions.filter(q => q.markedForReview).length;
        const unansweredCount = total - answeredCount;
        const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

        const nowMs = Date.now();
        const remSec = r.unlimited
            ? Math.floor(((r.pausedElapsedMs || 0) + (r.paused ? 0 : (nowMs - r.lastActiveStartMs))) / 1000)
            : Math.ceil((r.paused ? (r.pausedRemainingMs || 0) : Math.max(0, (r.endTimeMs || nowMs) - nowMs)) / 1000);

        const isInstant = this.isPracticeInstantMode(r.config);
        const isFs = document.fullscreenElement === this.root;

        const topBarHtml = `
            <div class="ex-run-bar">
                <div class="ex-run-wrap" style="padding-bottom:0;">
                    <div class="ex-run-bar-row">
                        <div style="min-width:0; flex:1 1 220px;">
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <b style="font-size:1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:340px;">${esc(r.title)}</b>
                                <span id="ex-answered-badge" class="ex-tag ex-num">Answered ${answeredCount}/${total}</span>
                                <span id="ex-tab-switch-badge" class="ex-tag" style="color:var(--ex-red); border-color:var(--ex-red); display:${r.tabSwitches > 0 ? 'inline-flex' : 'none'};">${r.tabSwitches} tab switch${r.tabSwitches === 1 ? '' : 'es'}</span>
                            </div>
                        </div>

                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <span id="ex-live-clock" class="ex-clock ex-num ${(!r.unlimited && remSec <= 60) ? 'low' : ''} ${r.timerHidden ? 'hidden-timer' : ''}" title="${r.unlimited ? 'Elapsed Time' : 'Time Remaining'}">
                                ${formatClock(remSec)}
                            </span>
                            ${!r.unlimited ? `
                                <button type="button" class="ex-btn sm" data-action="toggle-timer-visibility" title="${r.timerHidden ? 'Show Timer' : 'Hide Timer'}">
                                    <i class="fas ${r.timerHidden ? 'fa-eye' : 'fa-eye-slash'}"></i>
                                </button>
                            ` : ''}
                            <button type="button" class="ex-btn sm" data-action="toggle-pause" title="${r.paused ? 'Resume' : 'Pause'}">
                                <i class="fas ${r.paused ? 'fa-play' : 'fa-pause'}"></i>
                            </button>
                            <button type="button" class="ex-btn sm" data-action="toggle-fullscreen" title="Fullscreen">
                                <i class="fas ${isFs ? 'fa-compress' : 'fa-expand'}"></i>
                            </button>
                            ${r.config.showPalette !== false && r.config.layout !== 'omr' ? `
                                <button type="button" class="ex-btn sm" data-action="toggle-palette" title="Toggle Question Palette">
                                    <i class="fas fa-th"></i> Palette
                                </button>
                            ` : ''}
                            <button type="button" class="ex-btn primary sm" data-action="request-submit">
                                <i class="fas fa-paper-plane"></i> Submit
                            </button>
                        </div>
                    </div>
                    <div class="ex-progress-track">
                        <div id="ex-progress-fill" class="ex-progress-fill" style="width:${progressPct}%;"></div>
                    </div>
                </div>
            </div>
        `;

        let workspaceBody = '';
        if (r.config.layout === 'omr') {
            workspaceBody = this.renderOmrWorkspaceHtml(isInstant);
        } else if (r.config.layout === 'scroll') {
            workspaceBody = this.renderScrollWorkspaceHtml(isInstant, answeredCount, unansweredCount, markedCount);
        } else {
            workspaceBody = this.renderScreenWorkspaceHtml(isInstant, answeredCount, unansweredCount, markedCount);
        }

        const pauseVeilHtml = r.paused ? `
            <div class="ex-veil">
                <div class="ex-dlg" style="text-align:center; align-items:center;">
                    <i class="fas fa-pause-circle" style="font-size:2.5rem; color:var(--ex-accent);"></i>
                    <h3 style="margin:0; font-size:1.25rem; font-weight:800;">Examination Paused</h3>
                    <p style="margin:0; font-size:0.9rem; color:var(--ex-muted);">
                        Timer frozen cleanly. ${answeredCount} of ${total} questions answered.
                    </p>
                    <div class="ex-row" style="width:100%; justify-content:center; margin-top:6px;">
                        <button type="button" class="ex-btn primary big" data-action="resume-exam"><i class="fas fa-play"></i> Resume Exam</button>
                        <button type="button" class="ex-btn" data-action="exit-save-draft">Save &amp; Exit</button>
                    </div>
                </div>
            </div>
        ` : '';

        const submitDlgHtml = this.submitDialogOpen ? `
            <div class="ex-veil">
                <div class="ex-dlg">
                    <h3 style="margin:0; font-size:1.2rem; font-weight:800;">Submit Examination?</h3>
                    <ul class="ex-rules">
                        <li><span class="rk"><i class="fas fa-check-circle"></i> Answered</span><span class="rv ex-num">${answeredCount} / ${total}</span></li>
                        <li><span class="rk"><i class="fas fa-minus-circle"></i> Unanswered</span><span class="rv ex-num" style="color:${unansweredCount > 0 ? 'var(--ex-amber)' : 'inherit'};">${unansweredCount}</span></li>
                        <li><span class="rk"><i class="fas fa-flag"></i> Marked for Review</span><span class="rv ex-num">${markedCount}</span></li>
                        <li><span class="rk"><i class="fas fa-clock"></i> ${r.unlimited ? 'Elapsed Time' : 'Time Remaining'}</span><span class="rv ex-num">${formatClock(remSec)}</span></li>
                    </ul>
                    ${unansweredCount > 0 ? `
                        <div class="ex-callout warn" style="margin:0;">
                            <span style="font-size:0.83rem;">You still have <b>${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}</b>. You can return to finish them or submit now.</span>
                        </div>
                    ` : ''}
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:4px;">
                        <button type="button" class="ex-btn" data-action="cancel-submit">Return to Exam</button>
                        <button type="button" class="ex-btn primary" data-action="confirm-submit"><i class="fas fa-check"></i> Confirm Submit</button>
                    </div>
                </div>
            </div>
        ` : '';

        return `${topBarHtml}<div class="ex-run-wrap">${workspaceBody}</div>${pauseVeilHtml}${submitDlgHtml}`;
    }

    renderQuestionCardHtml(q, qIdx, isInstant, showNavButtons = true) {
        const total = this.run.questions.length;
        const isLocked = (this.run.config.lockAnswer && q.userAnswer !== null) || (isInstant && q.userAnswer !== null);
        const isBookmarked = this.bookmarks.has(q.uid);

        const optionsHtml = (q.options || []).map((opt, oIdx) => {
            const label = getLocalizedOptionLabel(oIdx, q.question, q.options);
            const isPicked = (typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0)
                ? (oIdx === q.userAnswerIndex)
                : (q.userAnswer !== null && q.userAnswer === opt);
            const isRight = isOptionCorrect(q, oIdx, opt);

            let cls = 'ex-opt-btn';
            if (isInstant && q.userAnswer !== null) {
                if (isRight) cls += ' right';
                else if (isPicked) cls += ' wrong';
            } else if (isPicked) {
                cls += ' picked';
            }

            return `
                <button type="button" class="${cls}" data-pick-q="${qIdx}" data-pick-opt="${esc(opt)}" data-pick-idx="${oIdx}" ${isLocked ? 'disabled' : ''}>
                    <span class="ex-opt-bubble">${esc(label)}</span>
                    <span style="flex:1; min-width:0; word-break:break-word;">${renderMcqFieldHtml(q, 'option', oIdx)}</span>
                    ${oIdx < 4 ? `<span class="ex-kbd-hint">${oIdx + 1}</span>` : ''}
                </button>
            `;
        }).join('');

        const feedbackHtml = isInstant ? this.renderQuestionFeedbackHtml(q) : '';

        const navHtml = showNavButtons ? `
            <div class="ex-q-nav">
                <div class="ex-row">
                    <button type="button" class="ex-btn" data-go-q="${qIdx - 1}" ${(!this.run.config.allowNavigation || qIdx === 0) ? 'disabled' : ''}>
                        <i class="fas fa-arrow-left"></i> Previous
                    </button>
                    ${(!isInstant && !this.run.config.lockAnswer && q.userAnswer !== null) ? `
                        <button type="button" class="ex-btn sm" data-clear-q="${qIdx}">Clear</button>
                    ` : ''}
                </div>
                <div class="ex-row">
                    ${qIdx < total - 1 ? `
                        <button type="button" class="ex-btn" data-go-q="${qIdx + 1}">Skip / Next <i class="fas fa-arrow-right"></i></button>
                    ` : `
                        <button type="button" class="ex-btn primary" data-action="request-submit"><i class="fas fa-check"></i> Finish &amp; Submit</button>
                    `}
                </div>
            </div>
        ` : '';

        return `
            <article class="ex-qcard" data-scroll-q="${qIdx}">
                <div class="ex-q-head">
                    <div class="ex-q-tags">
                        <span class="ex-q-num ex-num">Question ${qIdx + 1} / ${total}</span>
                        <span class="ex-tag">${esc(q.subject || 'General')}</span>
                        ${q.topic ? `<span class="ex-tag">${esc(q.topic)}</span>` : ''}
                    </div>
                    <div class="ex-row">
                        ${this.canEditActiveQuestion(q) ? `
                            <button type="button" class="ex-btn sm" data-edit-q="${qIdx}" title="Edit Question (E)">
                                <i class="fas fa-pen"></i>
                            </button>
                        ` : ''}
                        <button type="button" class="ex-btn sm" data-bookmark-uid="${esc(q.uid)}" title="Bookmark Question (B)" style="${isBookmarked ? 'border-color:var(--ex-indigo); color:var(--ex-indigo); background:var(--ex-indigo-soft);' : ''}">
                            <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                        </button>
                        ${this.run.config.allowMarkForReview ? `
                            <button type="button" class="ex-btn sm" data-mark-q="${qIdx}" title="Mark for Review (M)" style="${q.markedForReview ? 'border-color:var(--ex-amber); color:var(--ex-amber); background:var(--ex-amber-soft);' : ''}">
                                <i class="fas fa-flag"></i> ${q.markedForReview ? 'Marked' : 'Mark'}
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="ex-q-text">${renderMcqFieldHtml(q, 'question')}</div>
                <div class="ex-options">${optionsHtml}</div>
                <div data-feedback-slot="${qIdx}">${feedbackHtml}</div>
                ${navHtml}
            </article>
        `;
    }

    renderPaletteSidebarHtml(isInstant, answeredCount, unansweredCount, markedCount) {
        if (this.run.config.showPalette === false || !this.run.paletteOpen) return '';
        const r = this.run;
        return `
            <aside class="ex-palette-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <b style="font-size:0.9rem;">Question Palette</b>
                    <span id="ex-pal-answered-count" class="ex-num" style="font-size:0.78rem; color:var(--ex-muted);">${answeredCount}/${r.questions.length}</span>
                </div>
                <div class="ex-pal-legend">
                    ${isInstant ? `
                        <span id="ex-leg-ok"><i class="ex-pal-dot ok"></i> Correct (${r.questions.filter(q => q.isCorrect === true).length})</span>
                        <span id="ex-leg-no"><i class="ex-pal-dot no"></i> Wrong (${r.questions.filter(q => q.userAnswer !== null && q.isCorrect === false).length})</span>
                    ` : `
                        <span id="ex-leg-ans"><i class="ex-pal-dot ans"></i> Answered (${answeredCount})</span>
                    `}
                    <span id="ex-leg-unans"><i class="ex-pal-dot"></i> Unanswered (${unansweredCount})</span>
                    <span id="ex-leg-marked"><i class="ex-pal-dot fl"></i> Marked (${markedCount})</span>
                </div>
                <div class="ex-pal-grid">
                    ${r.questions.map((q, idx) => {
                        let cls = 'ex-pal-btn';
                        if (idx === r.currentIndex) cls += ' cur';
                        if (q.markedForReview) cls += ' fl';
                        if (q.userAnswer !== null) {
                            if (isInstant) cls += (q.isCorrect === true ? ' ok' : ' no');
                            else cls += ' ans';
                        }
                        const lockedOut = !r.config.allowNavigation && idx < r.currentIndex;
                        return `<button type="button" class="${cls}" data-go-q="${idx}" ${lockedOut ? 'disabled' : ''}>${idx + 1}</button>`;
                    }).join('')}
                </div>
            </aside>
        `;
    }

    renderScreenWorkspaceHtml(isInstant, answeredCount, unansweredCount, markedCount) {
        const q = this.run.questions[this.run.currentIndex];
        const paletteHtml = this.renderPaletteSidebarHtml(isInstant, answeredCount, unansweredCount, markedCount);
        const gridStyle = paletteHtml ? '' : 'grid-template-columns:minmax(0,1fr); max-width:860px; margin:0 auto;';
        return `
            <div class="ex-run-grid" style="${gridStyle}">
                ${this.renderQuestionCardHtml(q, this.run.currentIndex, isInstant, true)}
                ${paletteHtml}
            </div>
        `;
    }

    renderScrollWorkspaceHtml(isInstant, answeredCount, unansweredCount, markedCount) {
        const paletteHtml = this.renderPaletteSidebarHtml(isInstant, answeredCount, unansweredCount, markedCount);
        const gridStyle = paletteHtml ? '' : 'grid-template-columns:minmax(0,1fr); max-width:860px; margin:0 auto;';
        const cardsHtml = this.run.questions.map((q, idx) => this.renderQuestionCardHtml(q, idx, isInstant, false)).join('');
        return `
            <div class="ex-run-grid" style="${gridStyle}">
                <div style="display:flex; flex-direction:column; gap:14px;">
                    ${cardsHtml}
                    <div style="display:flex; justify-content:center; padding:12px 0;">
                        <button type="button" class="ex-btn primary big" data-action="request-submit"><i class="fas fa-check"></i> Submit Examination</button>
                    </div>
                </div>
                ${paletteHtml}
            </div>
        `;
    }

    renderOmrWorkspaceHtml(isInstant) {
        const r = this.run;
        const bookletHtml = r.questions.map((q, idx) => {
            const isLocked = (r.config.lockAnswer && q.userAnswer !== null) || (isInstant && q.userAnswer !== null);
            return `
                <div class="ex-bk-q ${idx === r.currentIndex ? 'cur' : ''}" data-scroll-q="${idx}" data-focus-q="${idx}">
                    <b class="ex-num" style="color:var(--ex-muted);">${idx + 1}.</b>
                    <div style="min-width:0;">
                        <div class="ex-bk-q-head">
                            <div style="font-weight:600; font-size:0.98rem; line-height:1.5; min-width:0; flex:1;">${renderMcqFieldHtml(q, 'question')}</div>
                            ${this.canEditActiveQuestion(q) ? `
                                <button type="button" class="ex-btn sm ex-bk-edit-btn" data-edit-q="${idx}" title="Edit Question">
                                    <i class="fas fa-pen"></i>
                                </button>
                            ` : ''}
                        </div>
                        <div class="ex-bk-opts">
                            ${(q.options || []).map((opt, oIdx) => {
                                const lbl = getLocalizedOptionLabel(oIdx, q.question, q.options);
                                const isPicked = (typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0)
                                    ? (oIdx === q.userAnswerIndex)
                                    : (q.userAnswer !== null && q.userAnswer === opt);
                                const isRight = isOptionCorrect(q, oIdx, opt);
                                let cls = 'ex-bk-opt';
                                if (isInstant && q.userAnswer !== null) {
                                    if (isRight) cls += ' right';
                                    else if (isPicked) cls += ' wrong';
                                } else if (isPicked) cls += ' picked';
                                return `
                                    <div class="${cls}" ${isLocked ? '' : `data-pick-q="${idx}" data-pick-opt="${esc(opt)}" data-pick-idx="${oIdx}"`}>
                                        <span>(${esc(lbl)})</span>
                                        <span style="min-width:0;">${renderMcqFieldHtml(q, 'option', oIdx)}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div data-bk-feedback-slot="${idx}">${isInstant ? this.renderBookletFeedbackHtml(q) : ''}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Group OMR rows into columns of 25
        const chunkSize = 25;
        const cols = [];
        for (let i = 0; i < r.questions.length; i += chunkSize) {
            cols.push(r.questions.slice(i, i + chunkSize));
        }

        const omrColsHtml = cols.map((colQs, cIdx) => `
            <div class="ex-omr-col">
                ${colQs.map((q, localIdx) => {
                    const globalIdx = cIdx * chunkSize + localIdx;
                    const isLocked = (r.config.lockAnswer && q.userAnswer !== null) || (isInstant && q.userAnswer !== null);
                    return `
                        <div class="ex-omr-row ${globalIdx === r.currentIndex ? 'cur' : ''}" data-omr-q="${globalIdx}">
                            <button type="button" class="ex-omr-rno ex-num" data-go-q="${globalIdx}">${globalIdx + 1}</button>
                            ${(q.options || []).map((opt, oIdx) => {
                                const lbl = getLocalizedOptionLabel(oIdx, q.question, q.options);
                                const isPicked = (typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0)
                                    ? (oIdx === q.userAnswerIndex)
                                    : (q.userAnswer !== null && q.userAnswer === opt);
                                const isRight = isOptionCorrect(q, oIdx, opt);
                                let cls = 'ex-ob';
                                if (isInstant && q.userAnswer !== null) {
                                    if (isRight) cls += ' ok';
                                    else if (isPicked) cls += ' no';
                                } else if (isPicked) {
                                    cls += ' on';
                                }
                                return `<button type="button" class="${cls}" data-pick-q="${globalIdx}" data-pick-opt="${esc(opt)}" data-pick-idx="${oIdx}" ${isLocked ? 'disabled' : ''}>${esc(lbl)}</button>`;
                            }).join('')}
                        </div>
                    `;
                }).join('')}
            </div>
        `).join('');

        return `
            <div class="ex-seg ex-omr-tabs">
                <button type="button" class="${this.omrMobileTab === 'paper' ? 'on' : ''}" data-omr-tab="paper">Question Paper</button>
                <button type="button" class="${this.omrMobileTab === 'sheet' ? 'on' : ''}" data-omr-tab="sheet">OMR Bubble Sheet</button>
            </div>
            <div class="ex-omr-wrap" data-tab="${this.omrMobileTab}">
                <div class="ex-booklet">${bookletHtml}</div>
                <div class="ex-omr-pane">
                    <div class="ex-omr-header">
                        <b style="font-size:1rem;">OMR ANSWER SHEET</b>
                        <div style="font-size:0.75rem;">${esc(r.title)} · ${r.questions.length} Questions</div>
                    </div>
                    <div class="ex-omr-cols">${omrColsHtml}</div>
                </div>
            </div>
        `;
    }

    // ------------------------------------------------------------------------
    // VIEW 3: Result Dashboard & Question-by-Question Review
    // ------------------------------------------------------------------------
    renderResultViewHtml() {
        const res = this.activeResult;
        const weakTopics = (res.topicBreakdown || []).filter(t => t.accuracy < 60 && t.total > 0).sort((a, b) => a.accuracy - b.accuracy);

        const saveBadgeHtml = this.saveStatus?.saving
            ? `<span class="ex-tag"><i class="fas fa-spinner fa-spin"></i> Saving result...</span>`
            : (this.saveStatus?.savedRemote
                ? `<span class="ex-tag" style="color:var(--ex-good); border-color:var(--ex-good);"><i class="fas fa-cloud-check"></i> Saved to Cloud</span>`
                : `<span class="ex-tag" title="Saved locally in this browser">${this.saveStatus?.reason === 'guest' ? 'Saved Locally (Guest Mode)' : 'Saved Locally'}</span>`);

        // Filter review questions
        const subjectsInRes = Array.from(new Set(res.questions.map(q => q.subject || 'General')));
        const qSearchLower = (this.resultSearch || '').trim().toLowerCase();
        const filteredQuestions = res.questions.filter(q => {
            if (this.resultFilter === 'correct' && q.isCorrect !== true) return false;
            if (this.resultFilter === 'wrong' && !(q.userAnswer !== null && q.isCorrect === false)) return false;
            if (this.resultFilter === 'skip' && q.userAnswer !== null) return false;
            if (this.resultFilter === 'marked' && !q.markedForReview) return false;
            if (this.resultSubjectFilter !== 'all' && (q.subject || 'General') !== this.resultSubjectFilter) return false;
            if (qSearchLower && !htmlToPlainText(q.questionHtml || q.question || '').toLowerCase().includes(qSearchLower)) return false;
            return true;
        });

        return `
            <main class="ex-main" style="display:flex; flex-direction:column; gap:18px;">
                <!-- Summary Hero -->
                <div class="ex-card">
                    <div class="ex-rs-hero">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                                <span class="ex-tag">${esc(res.mode.toUpperCase())}</span>
                                <span class="ex-tag">${esc(formatDateTime(res.timestampMs))}</span>
                                ${res.autoSubmitted ? `<span class="ex-tag" style="color:var(--ex-amber);">Auto-submitted</span>` : ''}
                                ${saveBadgeHtml}
                            </div>
                            <h2 style="margin:0; font-size:1.35rem; font-weight:800;">${esc(res.title)}</h2>
                            <div style="font-size:0.84rem; color:var(--ex-muted); margin-top:4px;">
                                Formula: (${res.correctCount} × +${res.positiveMark}) − (${res.wrongCount} × ${res.negativeMark}) + (${res.unansweredCount} × ${res.unansweredMark}) = <b>${res.netScore}</b>
                            </div>
                        </div>

                        <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
                            <div class="ex-rs-score-big">
                                <b style="color:${res.passed ? 'var(--ex-good)' : 'var(--ex-red)'};">${res.netScore} <small style="font-size:1.1rem; color:var(--ex-muted); font-weight:600;">/ ${res.maxScore}</small></b>
                                <span style="font-size:0.85rem; color:var(--ex-muted);">Percentage: <b class="ex-num">${res.percentage}%</b></span>
                            </div>
                            <div class="ex-pass-pill ${res.passed ? 'pass' : 'fail'}">
                                <i class="fas ${res.passed ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                <div>
                                    <div>${res.passed ? 'PASSED' : 'NEEDS REVIEW'}</div>
                                    <div style="font-size:0.74rem; font-weight:500;">Pass Mark ≥ ${res.passThresholdMarks} (${res.passPercent}%)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="ex-kpi-grid">
                        <div class="ex-kpi"><small>Correct</small><b style="color:var(--ex-good);">${res.correctCount} / ${res.totalQuestions}</b></div>
                        <div class="ex-kpi"><small>Incorrect</small><b style="color:var(--ex-red);">${res.wrongCount}</b></div>
                        <div class="ex-kpi"><small>Unanswered</small><b>${res.unansweredCount}</b></div>
                        <div class="ex-kpi"><small>Accuracy</small><b>${res.accuracy}%</b></div>
                        <div class="ex-kpi"><small>Total Marks</small><b>${res.maxScore}</b></div>
                        <div class="ex-kpi"><small>Net Obtained</small><b>${res.netScore}</b></div>
                        <div class="ex-kpi"><small>Time Taken</small><b>${formatClock(res.timeTakenSec)} <small style="font-size:0.76rem; color:var(--ex-muted);">(${res.avgTimePerQSec}s/Q)</small></b></div>
                        <div class="ex-kpi"><small>Tab Switches</small><b>${res.tabSwitches || 0}</b></div>
                    </div>

                    <div class="ex-row" style="margin-top:16px; padding-top:14px; border-top:1px solid var(--ex-line);">
                        <button type="button" class="ex-btn primary" data-action="retry-same"><i class="fas fa-redo"></i> Retry Same Exam</button>
                        ${(res.wrongCount + res.unansweredCount) > 0 ? `
                            <button type="button" class="ex-btn indigo" data-action="practice-wrong"><i class="fas fa-dumbbell"></i> Practice Incorrect &amp; Skipped (${res.wrongCount + res.unansweredCount})</button>
                        ` : ''}
                        <button type="button" class="ex-btn" data-action="print-result"><i class="fas fa-print"></i> Print Answer Script</button>
                        <button type="button" class="ex-btn" data-action="nav-config"><i class="fas fa-sliders-h"></i> New Exam</button>
                        <button type="button" class="ex-btn ghost" data-action="close-new-ui">Return to Study Plan</button>
                    </div>
                </div>

                <!-- Weak Topics Alert -->
                ${weakTopics.length > 0 ? `
                    <div class="ex-callout warn" style="margin-bottom:0;">
                        <div>
                            <b style="font-size:0.92rem;"><i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>Weak Areas Identified</b>
                            <div style="font-size:0.84rem; margin-top:2px;">
                                ${weakTopics.slice(0, 4).map(t => `${esc(t.subject)} (${esc(t.topic)}: ${t.accuracy}% accuracy)`).join(' · ')}
                            </div>
                        </div>
                        <button type="button" class="ex-btn sm" data-action="practice-wrong">Drill Mistakes Now</button>
                    </div>
                ` : ''}

                <!-- Subject & Topic Breakdown -->
                <div class="ex-card" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                    <div>
                        <h3 style="margin:0 0 10px; font-size:0.98rem; font-weight:700;">Subject-wise Performance</h3>
                        <div class="ex-table-wrap">
                            <table class="ex-tbl">
                                <thead>
                                    <tr><th>Subject</th><th class="num">Qs</th><th class="num">✓</th><th class="num">✗</th><th class="num">Net</th><th class="num">Acc.</th></tr>
                                </thead>
                                <tbody>
                                    ${res.subjectBreakdown.map(sb => `
                                        <tr>
                                            <td><b>${esc(sb.name)}</b></td>
                                            <td class="num">${sb.total}</td>
                                            <td class="num" style="color:var(--ex-good); font-weight:700;">${sb.correct}</td>
                                            <td class="num" style="color:var(--ex-red);">${sb.wrong}</td>
                                            <td class="num"><b>${Number(sb.netMarks.toFixed(2))}</b></td>
                                            <td class="num">
                                                <span class="ex-bar-mini"><i style="width:${sb.accuracy}%; background:${sb.accuracy >= 70 ? 'var(--ex-good)' : (sb.accuracy >= 45 ? 'var(--ex-amber)' : 'var(--ex-red)')};"></i></span>
                                                <span style="margin-left:5px;">${sb.accuracy}%</span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h3 style="margin:0 0 10px; font-size:0.98rem; font-weight:700;">Topic-wise Breakdown</h3>
                        <div class="ex-table-wrap" style="max-height:260px; overflow-y:auto;">
                            <table class="ex-tbl">
                                <thead>
                                    <tr><th>Topic</th><th class="num">✓/Total</th><th class="num">Acc.</th><th>Level</th></tr>
                                </thead>
                                <tbody>
                                    ${res.topicBreakdown.map(tb => {
                                        const levelLabel = tb.accuracy >= 75 ? 'Strong' : (tb.accuracy >= 50 ? 'Moderate' : 'Weak');
                                        const levelColor = tb.accuracy >= 75 ? 'var(--ex-good)' : (tb.accuracy >= 50 ? 'var(--ex-amber)' : 'var(--ex-red)');
                                        return `
                                            <tr>
                                                <td><b>${esc(tb.topic)}</b><div style="font-size:0.72rem; color:var(--ex-muted);">${esc(tb.subject)}</div></td>
                                                <td class="num">${tb.correct}/${tb.total}</td>
                                                <td class="num">${tb.accuracy}%</td>
                                                <td><span class="ex-tag" style="color:${levelColor}; border-color:currentColor;">${levelLabel}</span></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Detailed Question-by-Question Review -->
                <div class="ex-card" style="display:flex; flex-direction:column; gap:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <h3 style="margin:0; font-size:1.05rem; font-weight:800;">Question-wise Detailed Analysis (${filteredQuestions.length})</h3>
                        <div class="ex-row">
                            <div class="ex-seg">
                                <button type="button" class="${this.resultFilter === 'all' ? 'on' : ''}" data-rv-filter="all">All (${res.totalQuestions})</button>
                                <button type="button" class="${this.resultFilter === 'correct' ? 'on' : ''}" data-rv-filter="correct">Correct (${res.correctCount})</button>
                                <button type="button" class="${this.resultFilter === 'wrong' ? 'on' : ''}" data-rv-filter="wrong">Wrong (${res.wrongCount})</button>
                                <button type="button" class="${this.resultFilter === 'skip' ? 'on' : ''}" data-rv-filter="skip">Unanswered (${res.unansweredCount})</button>
                                <button type="button" class="${this.resultFilter === 'marked' ? 'on' : ''}" data-rv-filter="marked">Marked (${res.markedCount})</button>
                            </div>
                            ${subjectsInRes.length > 1 ? `
                                <select id="ex-rv-subject-filter" class="ex-select">
                                    <option value="all">All Subjects</option>
                                    ${subjectsInRes.map(sub => `<option value="${esc(sub)}" ${this.resultSubjectFilter === sub ? 'selected' : ''}>${esc(sub)}</option>`).join('')}
                                </select>
                            ` : ''}
                            <input type="text" id="ex-rv-search" class="ex-input" placeholder="Search questions..." value="${esc(this.resultSearch)}">
                        </div>
                    </div>

                    <div class="ex-rv-list">
                        ${filteredQuestions.length === 0 ? `<div style="padding:24px; text-align:center; color:var(--ex-muted);">No questions match this review filter.</div>` : filteredQuestions.map(q => {
                            const statusCls = q.isCorrect === true ? 'right' : (q.userAnswer !== null ? 'wrong' : 'skip');
                            const statusText = q.isCorrect === true ? 'Correct' : (q.userAnswer !== null ? 'Incorrect' : 'Unanswered');
                            const isBookmarked = this.bookmarks.has(q.uid);
                            return `
                                <div class="ex-rv-card ${statusCls}">
                                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                                        <div class="ex-row">
                                            <b class="ex-num">Q${(q.examIndex ?? 0) + 1}</b>
                                            <span class="ex-tag">${esc(q.subject || 'General')}</span>
                                            ${q.markedForReview ? `<span class="ex-tag" style="color:var(--ex-amber);">Marked</span>` : ''}
                                        </div>
                                        <div class="ex-row">
                                            <button type="button" class="ex-btn sm" data-bookmark-uid="${esc(q.uid)}">
                                                <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i> ${isBookmarked ? 'Saved' : 'Bookmark'}
                                            </button>
                                            <span class="ex-tag ex-num" style="font-weight:700; color:${statusCls === 'right' ? 'var(--ex-good)' : (statusCls === 'wrong' ? 'var(--ex-red)' : 'var(--ex-muted)')};">
                                                ${statusText} (${q.markDelta >= 0 ? '+' : ''}${q.markDelta})
                                            </span>
                                        </div>
                                    </div>
                                    <div style="font-weight:600; font-size:1.03rem; line-height:1.5;">${renderMcqFieldHtml(q, 'question')}</div>
                                    <div class="ex-rv-opts">
                                        ${(q.options || []).map((opt, oIdx) => {
                                            const lbl = getLocalizedOptionLabel(oIdx, q.question, q.options);
                                            const isRight = isOptionCorrect(q, oIdx, opt);
                                            const isMine = (typeof q.userAnswerIndex === 'number' && q.userAnswerIndex >= 0)
                                                ? (oIdx === q.userAnswerIndex)
                                                : (q.userAnswer !== null && opt === q.userAnswer);
                                            const oCls = isRight ? 'right' : (isMine ? 'wrong' : '');
                                            return `
                                                <div class="ex-rv-opt ${oCls}">
                                                    <b>${esc(lbl)}.</b>
                                                    <span style="flex:1; min-width:0;">${renderMcqFieldHtml(q, 'option', oIdx)}</span>
                                                    ${isRight ? '<i class="fas fa-check"></i>' : (isMine ? '<i class="fas fa-times"></i>' : '')}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                    ${(q.explanationHtml || q.explanation || q.noteHtml || q.note) ? `
                                        <div style="font-size:0.86rem; background:var(--ex-sunk); padding:9px 12px; border-radius:4px; border-left:3px solid var(--ex-accent);">
                                            <b>Explanation:</b> ${renderMcqFieldHtml(q, (q.explanationHtml || q.explanation) ? 'explanation' : 'note')}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </main>
        `;
    }

    // ------------------------------------------------------------------------
    // VIEW 4: Examination History
    // ------------------------------------------------------------------------
    renderHistoryViewHtml() {
        const searchLower = (this.historySearch || '').trim().toLowerCase();
        const subjects = Array.from(new Set(this.history.map(h => h.subjectSummary || 'General')));
        const items = this.history.filter(h => {
            if (this.historySubjectFilter !== 'all' && (h.subjectSummary || 'General') !== this.historySubjectFilter) return false;
            if (searchLower && !String(h.title || '').toLowerCase().includes(searchLower) && !String(h.subjectSummary || '').toLowerCase().includes(searchLower)) return false;
            return true;
        });

        return `
            <main class="ex-main">
                <div class="ex-card" style="display:flex; flex-direction:column; gap:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div>
                            <h2 style="margin:0; font-size:1.25rem; font-weight:800;">Examination History</h2>
                            <p style="margin:2px 0 0; font-size:0.84rem; color:var(--ex-muted);">Detailed logs, scores, and question-by-question reviews from your exams.</p>
                        </div>
                        <div class="ex-row">
                            <input type="text" id="ex-hist-search" class="ex-input" placeholder="Search history..." value="${esc(this.historySearch)}">
                            <select id="ex-hist-subject" class="ex-select">
                                <option value="all">All Subjects</option>
                                ${subjects.map(sub => `<option value="${esc(sub)}" ${this.historySubjectFilter === sub ? 'selected' : ''}>${esc(sub)}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    ${items.length === 0 ? `
                        <div style="text-align:center; padding:42px 16px; color:var(--ex-muted);">
                            <i class="fas fa-clipboard-list" style="font-size:2rem; margin-bottom:10px; opacity:0.5;"></i>
                            <div style="font-weight:700;">No Examination Attempts Yet</div>
                            <p style="font-size:0.86rem;">Complete an examination in the New UI to view rich analytics and review scripts here.</p>
                        </div>
                    ` : `
                        <div class="ex-table-wrap">
                            <table class="ex-tbl">
                                <thead>
                                    <tr>
                                        <th>Examination</th>
                                        <th>Mode</th>
                                        <th class="num">Correct / Wrong / Skip</th>
                                        <th class="num">Score</th>
                                        <th class="num">Duration</th>
                                        <th>Status</th>
                                        <th class="num">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map(h => `
                                        <tr>
                                            <td>
                                                <div style="font-weight:700;">${esc(h.title)}</div>
                                                <div style="font-size:0.75rem; color:var(--ex-muted);">${esc(h.subjectSummary || 'General')} · ${esc(formatDateTime(h.timestampMs))}</div>
                                            </td>
                                            <td><span class="ex-tag">${esc(h.mode || 'exam')}</span></td>
                                            <td class="num ex-num">
                                                <span style="color:var(--ex-good); font-weight:700;">${h.correctCount}</span> /
                                                <span style="color:var(--ex-red);">${h.wrongCount}</span> /
                                                <span>${h.unansweredCount}</span>
                                            </td>
                                            <td class="num ex-num"><b>${h.netScore}</b> / ${h.maxScore} (${h.percentage}%)</td>
                                            <td class="num ex-num">${formatClock(h.timeTakenSec)}</td>
                                            <td><span class="ex-tag" style="color:${h.passed ? 'var(--ex-good)' : 'var(--ex-red)'}; border-color:currentColor;">${h.passed ? 'PASS' : 'FAIL'}</span></td>
                                            <td class="num">
                                                <div class="ex-row" style="justify-content:flex-end;">
                                                    <button type="button" class="ex-btn sm primary" data-open-history="${esc(h.attemptId || h.id)}">Review</button>
                                                    <button type="button" class="ex-btn sm" data-retake-history="${esc(h.attemptId || h.id)}">Retake</button>
                                                    <button type="button" class="ex-btn sm danger-soft" data-delete-history="${esc(h.attemptId || h.id)}" title="Delete Record"><i class="fas fa-trash"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </main>
        `;
    }

    // ------------------------------------------------------------------------
    // DOM Event Binding
    // ------------------------------------------------------------------------
    bindViewEvents() {
        if (!this.root) return;

        // Top nav actions
        this.root.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const act = btn.dataset.action;
                if (act === 'close-new-ui') this.close();
                else if (act === 'nav-config') { this.view = 'config'; this.render(); }
                else if (act === 'nav-history') {
                    this.view = 'history';
                    this.render();
                    this.history = await fetchExamHistory(this.getBridge());
                    if (this.view === 'history') this.render();
                } else if (act === 'resume-draft') this.resumeFromDraft();
                else if (act === 'discard-draft') this.discardDraft();
                else if (act === 'toggle-section-b') {
                    this.config.sectionBExpanded = !this.config.sectionBExpanded;
                    this.render();
                } else if (act === 'subjects-select-all') {
                    this.config.scopeMode = 'subject';
                    this.config.selectedSubjectKeys = this.repo.subjects.map(s => s.key);
                    this.config.selectedSubjectKey = this.config.selectedSubjectKeys[0] || '';
                    this.config.selectedTopicKeys = this.repo.allTopics.map(t => t.topicKey);
                    this.render();
                } else if (act === 'subjects-clear') {
                    this.config.scopeMode = 'subject';
                    this.config.selectedSubjectKeys = [];
                    this.config.selectedSubjectKey = '';
                    this.config.selectedTopicKeys = [];
                    this.render();
                } else if (act === 'topics-select-all') {
                    const subjectKeys = Array.isArray(this.config.selectedSubjectKeys)
                        ? this.config.selectedSubjectKeys
                        : (this.config.selectedSubjectKey ? [this.config.selectedSubjectKey] : []);
                    const subjectSet = new Set(subjectKeys);
                    const baseList = this.config.scopeMode === 'subject'
                        ? this.repo.subjects.filter(s => subjectSet.has(s.key)).flatMap(s => s.topics)
                        : this.repo.allTopics;
                    const searchLower = (this.config.topicSearch || '').trim().toLowerCase();
                    const visibleList = searchLower
                        ? baseList.filter(t => t.title.toLowerCase().includes(searchLower) || t.subject.toLowerCase().includes(searchLower) || t.subtitle.toLowerCase().includes(searchLower))
                        : baseList;
                    const merged = new Set(this.config.selectedTopicKeys || []);
                    visibleList.forEach(t => merged.add(t.topicKey));
                    this.config.selectedTopicKeys = Array.from(merged);
                    this.render();
                } else if (act === 'topics-clear') {
                    this.config.selectedTopicKeys = [];
                    this.render();
                } else if (act === 'reset-settings') {
                    this.config.settings = resetExamSettings();
                    this.showToast('Examination settings reset to defaults.');
                    this.render();
                } else if (act === 'start-exam') {
                    this.startExamination();
                } else if (act === 'toggle-timer-visibility') {
                    this.run.timerHidden = !this.run.timerHidden;
                    this.persistActiveDraft();
                    this.render();
                } else if (act === 'toggle-pause') {
                    if (this.run.paused) this.resumeExam();
                    else this.pauseExam();
                } else if (act === 'resume-exam') {
                    this.resumeExam();
                } else if (act === 'exit-save-draft') {
                    this.persistActiveDraft();
                    this.close();
                } else if (act === 'toggle-fullscreen') {
                    if (document.fullscreenElement) document.exitFullscreen?.();
                    else this.root.requestFullscreen?.().catch(() => {});
                    setTimeout(() => this.render(), 150);
                } else if (act === 'toggle-palette') {
                    this.run.paletteOpen = !this.run.paletteOpen;
                    this.render();
                } else if (act === 'request-submit') {
                    this.requestSubmit();
                } else if (act === 'cancel-submit') {
                    this.submitDialogOpen = false;
                    this.render();
                } else if (act === 'confirm-submit') {
                    this.finalizeAndSubmitExam(false);
                } else if (act === 'retry-same') {
                    this.retrySameExam(this.activeResult, false);
                } else if (act === 'practice-wrong') {
                    this.retrySameExam(this.activeResult, true);
                } else if (act === 'print-result') {
                    this.printAnswerScript(this.activeResult);
                }
            });
        });

        // Presets
        this.root.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = EXAM_PRESETS.find(p => p.id === btn.dataset.preset);
                if (!preset) return;
                this.config.settings.presetId = preset.id;
                this.config.settings.questionRangeStart = '';
                this.config.settings.questionRangeEnd = '';
                preset.apply(this.config, this.repo);
                saveExamSettings(this.config.settings);
                this.render();
            });
        });

        // Scope mode
        this.root.querySelectorAll('[data-scope]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.scopeMode = btn.dataset.scope;
                if (this.config.scopeMode === 'subject') {
                    const currentKeys = Array.isArray(this.config.selectedSubjectKeys) ? this.config.selectedSubjectKeys : [];
                    const allSelected = currentKeys.length === this.repo.subjects.length && this.repo.subjects.length > 1;
                    if (currentKeys.length === 0 || allSelected) {
                        const firstKey = this.config.selectedSubjectKey || this.repo.subjects[0]?.key || '';
                        this.config.selectedSubjectKeys = firstKey ? [firstKey] : [];
                    }
                    this.config.selectedSubjectKey = this.config.selectedSubjectKeys[0] || '';
                    const subjSet = new Set(this.config.selectedSubjectKeys);
                    this.config.selectedTopicKeys = this.repo.allTopics
                        .filter(t => subjSet.has(t.subjectKey))
                        .map(t => t.topicKey);
                } else if (this.config.scopeMode === 'all') {
                    this.config.selectedSubjectKeys = this.repo.subjects.map(s => s.key);
                    this.config.selectedSubjectKey = this.config.selectedSubjectKeys[0] || '';
                    this.config.selectedTopicKeys = this.repo.allTopics.map(t => t.topicKey);
                }
                this.render();
            });
        });

        // Multi-subject toggle picker
        this.root.querySelectorAll('[data-subject-key]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.subjectKey;
                const subjSet = new Set(Array.isArray(this.config.selectedSubjectKeys) ? this.config.selectedSubjectKeys : []);
                const topicSet = new Set(this.config.selectedTopicKeys || []);
                const subj = this.repo.subjects.find(s => s.key === key);

                if (subjSet.has(key)) {
                    subjSet.delete(key);
                    if (subj) subj.topics.forEach(t => topicSet.delete(t.topicKey));
                } else {
                    subjSet.add(key);
                    if (subj) subj.topics.forEach(t => topicSet.add(t.topicKey));
                }

                this.config.selectedSubjectKeys = Array.from(subjSet);
                this.config.selectedSubjectKey = this.config.selectedSubjectKeys[0] || '';
                this.config.selectedTopicKeys = Array.from(topicSet);
                this.render();
            });
        });

        // Topic checkboxes
        this.root.querySelectorAll('[data-topic-key]').forEach(chk => {
            chk.addEventListener('change', () => {
                const key = chk.dataset.topicKey;
                const set = new Set(this.config.selectedTopicKeys || []);
                if (chk.checked) set.add(key);
                else set.delete(key);
                this.config.selectedTopicKeys = Array.from(set);
                this.render();
            });
        });

        // Topic search
        const topicSearchEl = this.root.querySelector('#ex-topic-search-input');
        if (topicSearchEl) {
            topicSearchEl.addEventListener('input', (e) => {
                this.config.topicSearch = e.target.value;
                this.render();
                const ref = this.root.querySelector('#ex-topic-search-input');
                if (ref) {
                    ref.focus();
                    ref.setSelectionRange(ref.value.length, ref.value.length);
                }
            });
        }

        // Question count presets & custom input
        this.root.querySelectorAll('[data-qcount]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.settings.questionCount = parseInt(btn.dataset.qcount, 10) || 25;
                this.config.settings.questionRangeStart = '';
                this.config.settings.questionRangeEnd = '';
                saveExamSettings(this.config.settings);
                this.render();
            });
        });
        const customQCount = this.root.querySelector('#ex-custom-qcount');
        if (customQCount) {
            customQCount.addEventListener('change', (e) => {
                this.config.settings.questionCount = Math.max(1, parseInt(e.target.value, 10) || 1);
                this.config.settings.questionRangeStart = '';
                this.config.settings.questionRangeEnd = '';
                saveExamSettings(this.config.settings);
                this.render();
            });
        }

        const applyQuestionRange = this.root.querySelector('[data-action="apply-question-range"]');
        if (applyQuestionRange) {
            applyQuestionRange.addEventListener('click', () => {
                const startInput = this.root.querySelector('#ex-question-range-start');
                const endInput = this.root.querySelector('#ex-question-range-end');
                const start = Number(startInput?.value);
                const end = Number(endInput?.value);
                if (!Number.isInteger(start) || start < 1 || !Number.isInteger(end) || end < start) {
                    this.showToast('Enter a valid range, for example 51 to 100.');
                    (startInput?.value ? endInput : startInput)?.focus();
                    return;
                }
                this.config.settings.questionRangeStart = start;
                this.config.settings.questionRangeEnd = end;
                this.config.settings.questionCount = end - start + 1;
                saveExamSettings(this.config.settings);
                this.render();
            });
        }

        const clearQuestionRange = this.root.querySelector('[data-action="clear-question-range"]');
        if (clearQuestionRange) {
            clearQuestionRange.addEventListener('click', () => {
                this.config.settings.questionRangeStart = '';
                this.config.settings.questionRangeEnd = '';
                saveExamSettings(this.config.settings);
                this.render();
            });
        }

        // Order, Mode, Layout, Timing
        this.root.querySelectorAll('[data-order]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.settings.questionOrder = btn.dataset.order;
                if (btn.dataset.order === 'serial') this.config.settings.shuffleQuestions = false;
                saveExamSettings(this.config.settings);
                this.render();
            });
        });

        this.root.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                const nextMode = btn.dataset.mode;
                this.config.settings.mode = nextMode;
                if (nextMode === 'exam' || nextMode === 'practice') {
                    this.config.settings.timingType = 'whole';
                    this.config.settings.secondsPerQuestion = 36;
                    this.config.settings.customTimeOverride = false;
                    const preview = this.getCurrentSelectionPreview();
                    if (preview.actualCount > 0) {
                        this.config.settings.totalMinutes = Number(((preview.actualCount * 36) / 60).toFixed(2));
                    }
                } else if (nextMode === 'untimed-practice') {
                    this.config.settings.timingType = 'unlimited';
                } else if (nextMode === 'timed-practice' && this.config.settings.timingType === 'unlimited') {
                    this.config.settings.timingType = 'whole';
                }
                saveExamSettings(this.config.settings);
                this.render();
            });
        });

        this.root.querySelectorAll('[data-layout]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.settings.layout = btn.dataset.layout;
                saveExamSettings(this.config.settings);
                this.render();
            });
        });

        this.root.querySelectorAll('[data-timing]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.settings.timingType = btn.dataset.timing;
                if (btn.dataset.timing !== 'unlimited' && this.config.settings.mode === 'untimed-practice') {
                    this.config.settings.mode = 'timed-practice';
                }
                if (btn.dataset.timing === 'whole' && (this.config.settings.mode === 'exam' || this.config.settings.mode === 'practice')) {
                    this.config.settings.customTimeOverride = false;
                } else {
                    this.config.settings.customTimeOverride = true;
                }
                saveExamSettings(this.config.settings);
                this.render();
            });
        });

        this.root.querySelectorAll('[data-minutes]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.settings.totalMinutes = parseFloat(btn.dataset.minutes) || 15;
                this.config.settings.customTimeOverride = true;
                saveExamSettings(this.config.settings);
                this.render();
            });
        });
        this.root.querySelector('#ex-custom-minutes')?.addEventListener('change', (e) => {
            this.config.settings.totalMinutes = Math.max(0.5, parseFloat(e.target.value) || 15);
            this.config.settings.customTimeOverride = true;
            saveExamSettings(this.config.settings);
            this.render();
        });

        this.root.querySelectorAll('[data-secperq]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.settings.secondsPerQuestion = parseInt(btn.dataset.secperq, 10) || 36;
                this.config.settings.customTimeOverride = true;
                saveExamSettings(this.config.settings);
                this.render();
            });
        });
        this.root.querySelector('#ex-custom-secperq')?.addEventListener('change', (e) => {
            this.config.settings.secondsPerQuestion = Math.max(5, parseInt(e.target.value, 10) || 36);
            this.config.settings.customTimeOverride = true;
            saveExamSettings(this.config.settings);
            this.render();
        });

        // Marking system
        this.root.querySelectorAll('[data-mark-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const mp = btn.dataset.markPreset;
                this.config.settings.positiveMark = 1;
                this.config.settings.unansweredMark = 0;
                this.config.settings.negativeMark = mp === 'bcs' ? 0.5 : (mp === 'classic' ? 0.25 : 0);
                saveExamSettings(this.config.settings);
                this.render();
            });
        });
        this.root.querySelector('#ex-mark-pos')?.addEventListener('change', (e) => {
            this.config.settings.positiveMark = Math.max(0.25, parseFloat(e.target.value) || 1);
            saveExamSettings(this.config.settings);
            this.render();
        });
        this.root.querySelector('#ex-mark-neg')?.addEventListener('change', (e) => {
            this.config.settings.negativeMark = Math.max(0, parseFloat(e.target.value) || 0);
            saveExamSettings(this.config.settings);
            this.render();
        });
        this.root.querySelector('#ex-mark-unans')?.addEventListener('change', (e) => {
            this.config.settings.unansweredMark = parseFloat(e.target.value) || 0;
            saveExamSettings(this.config.settings);
            this.render();
        });
        this.root.querySelector('#ex-pass-range')?.addEventListener('input', (e) => {
            this.config.settings.passPercent = parseInt(e.target.value, 10) || 50;
            saveExamSettings(this.config.settings);
            this.render();
        });

        // Settings checkboxes
        this.root.querySelectorAll('[data-setting]').forEach(chk => {
            chk.addEventListener('change', () => {
                this.config.settings[chk.dataset.setting] = chk.checked;
                saveExamSettings(this.config.settings);
                this.render();
            });
        });

        // Runtime controls
        this.bindQuestionContainerEvents(this.root);
        this.root.querySelectorAll('[data-omr-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.omrMobileTab = btn.dataset.omrTab;
                this.render();
            });
        });

        // Result review filters
        this.root.querySelectorAll('[data-rv-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.resultFilter = btn.dataset.rvFilter;
                this.render();
            });
        });
        this.root.querySelector('#ex-rv-subject-filter')?.addEventListener('change', (e) => {
            this.resultSubjectFilter = e.target.value;
            this.render();
        });
        const rvSearch = this.root.querySelector('#ex-rv-search');
        if (rvSearch) {
            rvSearch.addEventListener('input', (e) => {
                this.resultSearch = e.target.value;
                this.render();
                const ref = this.root.querySelector('#ex-rv-search');
                if (ref) { ref.focus(); ref.setSelectionRange(ref.value.length, ref.value.length); }
            });
        }

        // History interactions
        this.root.querySelectorAll('[data-open-history]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.openHistory;
                const item = this.history.find(h => (h.attemptId || h.id) === key);
                if (!item) return;
                this.activeResult = item;
                this.saveStatus = { saving: false, savedRemote: Boolean(item.id), reason: '' };
                this.resultFilter = 'all';
                this.resultSubjectFilter = 'all';
                this.resultSearch = '';
                this.view = 'result';
                this.render();
            });
        });
        this.root.querySelectorAll('[data-retake-history]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.retakeHistory;
                const item = this.history.find(h => (h.attemptId || h.id) === key);
                if (item) this.retrySameExam(item, false);
            });
        });
        this.root.querySelectorAll('[data-delete-history]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const key = btn.dataset.deleteHistory;
                const item = this.history.find(h => (h.attemptId || h.id) === key);
                if (!item) return;
                await removeExamHistoryEntry(this.getBridge(), item);
                this.history = this.history.filter(h => (h.attemptId || h.id) !== key);
                this.showToast('Examination history record deleted.');
                this.render();
            });
        });
        const histSearch = this.root.querySelector('#ex-hist-search');
        if (histSearch) {
            histSearch.addEventListener('input', (e) => {
                this.historySearch = e.target.value;
                this.render();
                const ref = this.root.querySelector('#ex-hist-search');
                if (ref) { ref.focus(); ref.setSelectionRange(ref.value.length, ref.value.length); }
            });
        }
        this.root.querySelector('#ex-hist-subject')?.addEventListener('change', (e) => {
            this.historySubjectFilter = e.target.value;
            this.render();
        });
    }

    bindQuestionContainerEvents(container) {
        if (!container) return;
        container.querySelectorAll('[data-pick-q]').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.pickQ, 10);
                const opt = el.dataset.pickOpt;
                const optIdxRaw = el.dataset.pickIdx;
                const optIdx = optIdxRaw !== undefined ? parseInt(optIdxRaw, 10) : null;
                this.run.currentIndex = idx;
                this.handleAnswerSelect(idx, opt, Number.isNaN(optIdx) ? null : optIdx);
            });
        });
        container.querySelectorAll('[data-go-q]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.goToQuestion(parseInt(btn.dataset.goQ, 10));
            });
        });
        container.querySelectorAll('[data-clear-q]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.clearAnswer(parseInt(btn.dataset.clearQ, 10));
            });
        });
        container.querySelectorAll('[data-mark-q]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleMarkForReview(parseInt(btn.dataset.markQ, 10));
            });
        });
        container.querySelectorAll('[data-bookmark-uid]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleBookmark(btn.dataset.bookmarkUid);
            });
        });
        container.querySelectorAll('[data-edit-q]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.editQ, 10);
                if (!Number.isNaN(idx)) {
                    this.openEditQuestionModal(idx);
                }
            });
        });
        if (container !== this.root) {
            container.querySelectorAll('[data-action="request-submit"]').forEach(btn => {
                btn.addEventListener('click', () => this.requestSubmit());
            });
        }
    }
}

const examController = new NewExamSystemController();
window.__NewExamController = examController;

document.addEventListener('click', (e) => {
    const launchBtn = e.target.closest('#launch-new-exam-ui-btn');
    if (launchBtn) {
        e.preventDefault();
        examController.openFromQuizModal();
    }
});
