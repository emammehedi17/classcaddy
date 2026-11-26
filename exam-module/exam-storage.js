// ============================================================================
// Class Caddy — New Examination Module: Storage, Settings, Drafts & Audio
// ============================================================================

export const DEFAULT_EXAM_SETTINGS = {
    presetId: 'custom',
    mode: 'exam', // 'exam' | 'practice' | 'timed-practice' | 'untimed-practice'
    layout: 'screen', // 'screen' | 'omr' | 'scroll'
    questionOrder: 'random', // 'random' | 'serial'
    shuffleQuestions: true,
    shuffleOptions: true,
    avoidRecent: false,
    includeAttempted: true,
    wrongOnly: false,
    bookmarkedOnly: false,
    questionCount: 25,
    questionRangeStart: '',
    questionRangeEnd: '',
    timingType: 'whole', // 'whole' | 'per-question' | 'unlimited'
    totalMinutes: 15,
    secondsPerQuestion: 36,
    customTimeOverride: false,
    positiveMark: 1,
    negativeMark: 0.5,
    unansweredMark: 0,
    passPercent: 50,
    allowNavigation: true,
    allowMarkForReview: true,
    lockAnswer: false,
    confirmSubmit: true,
    autoSubmitOnTimeout: true,
    autoAdvance: false,
    showPalette: true,
    soundEffects: false,
    trackTabSwitches: true
};

const SETTINGS_STORAGE_KEY = 'cc_new_exam_settings_v1';

export function loadExamSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_EXAM_SETTINGS };
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_EXAM_SETTINGS, ...parsed };
    } catch (e) {
        console.warn('[ExamStorage] Could not load settings:', e);
        return { ...DEFAULT_EXAM_SETTINGS };
    }
}

export function saveExamSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('[ExamStorage] Could not save settings:', e);
    }
}

export function resetExamSettings() {
    const fresh = { ...DEFAULT_EXAM_SETTINGS };
    saveExamSettings(fresh);
    return fresh;
}

// --- Unfinished Exam Draft Persistence (Autosave & Refresh Recovery) ---
function getDraftKey(userId) {
    return `cc_new_exam_draft_v1_${userId || 'guest'}`;
}

export function saveExamDraft(userId, draftObj) {
    try {
        if (!draftObj) return;
        const savedDraft = {
            ...draftObj,
            updatedAt: Date.now()
        };
        localStorage.setItem(getDraftKey(userId), JSON.stringify(savedDraft));
        return savedDraft;
    } catch (e) {
        console.warn('[ExamStorage] Failed to save draft:', e);
    }
}

export function loadExamDraft(userId) {
    try {
        const raw = localStorage.getItem(getDraftKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
            return null;
        }
        return parsed;
    } catch (e) {
        console.warn('[ExamStorage] Failed to read draft:', e);
        return null;
    }
}

export function clearExamDraft(userId) {
    try {
        localStorage.removeItem(getDraftKey(userId));
    } catch (e) {
        console.warn('[ExamStorage] Failed to clear draft:', e);
    }
}

// --- Bookmarks Storage (Local + Firestore Sync) ---
function getBookmarksKey(userId) {
    return `cc_new_exam_bookmarks_v1_${userId || 'guest'}`;
}

export function loadLocalBookmarks(userId) {
    try {
        const raw = localStorage.getItem(getBookmarksKey(userId));
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch {
        return new Set();
    }
}

export function saveLocalBookmarks(userId, bookmarkSet) {
    try {
        localStorage.setItem(getBookmarksKey(userId), JSON.stringify(Array.from(bookmarkSet)));
    } catch (e) {
        console.warn('[ExamStorage] Failed to save bookmarks locally:', e);
    }
}

// --- Guest / Local Exam History Fallback ---
function getLocalHistoryKey(userId) {
    return `cc_new_exam_history_v1_${userId || 'guest'}`;
}

export function loadLocalHistory(userId) {
    try {
        const raw = localStorage.getItem(getLocalHistoryKey(userId));
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function saveLocalHistoryItem(userId, item) {
    try {
        const existing = loadLocalHistory(userId).filter(x => x.attemptId !== item.attemptId);
        existing.unshift(item);
        // Keep last 40 local records to avoid hitting localStorage quota
        localStorage.setItem(getLocalHistoryKey(userId), JSON.stringify(existing.slice(0, 40)));
    } catch (e) {
        console.warn('[ExamStorage] Failed to save local history item:', e);
    }
}

export function deleteLocalHistoryItem(userId, attemptId) {
    try {
        const existing = loadLocalHistory(userId).filter(x => x.attemptId !== attemptId);
        localStorage.setItem(getLocalHistoryKey(userId), JSON.stringify(existing));
    } catch (e) {
        console.warn('[ExamStorage] Failed to delete local history item:', e);
    }
}

// --- Firestore Operations via Bridge ---
export async function fetchExamHistory(bridge) {
    const uid = bridge?.getUserId?.() || 'guest';
    const localItems = loadLocalHistory(uid);

    if (!bridge || bridge.isGuestMode?.() || !bridge.getDb?.() || !uid || uid === 'guest') {
        return localItems;
    }

    try {
        const remoteItems = await bridge.fetchNewExamResults();
        // Merge deduplicated by attemptId
        const map = new Map();
        remoteItems.forEach(item => {
            map.set(item.attemptId || item.id, item);
        });
        localItems.forEach(item => {
            const key = item.attemptId || item.id;
            if (!map.has(key)) map.set(key, item);
        });
        return Array.from(map.values()).sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
    } catch (e) {
        console.warn('[ExamStorage] Remote exam history fetch failed, using local cache:', e);
        return localItems;
    }
}

export async function persistExamResult(bridge, resultPayload) {
    const uid = bridge?.getUserId?.() || 'guest';
    saveLocalHistoryItem(uid, resultPayload);

    if (!bridge || bridge.isGuestMode?.() || !bridge.getDb?.() || !uid || uid === 'guest') {
        return { savedRemote: false, reason: 'guest' };
    }

    try {
        const docId = await bridge.saveNewExamResult(resultPayload);
        return { savedRemote: true, docId };
    } catch (e) {
        console.error('[ExamStorage] Failed to save exam result to Firestore:', e);
        return { savedRemote: false, reason: 'error', error: e };
    }
}

export async function removeExamHistoryEntry(bridge, item) {
    const uid = bridge?.getUserId?.() || 'guest';
    deleteLocalHistoryItem(uid, item.attemptId || item.id);

    if (bridge && !bridge.isGuestMode?.() && item.id) {
        try {
            await bridge.deleteNewExamResult(item.id);
        } catch (e) {
            console.warn('[ExamStorage] Remote delete failed:', e);
        }
    }
}

export async function syncBookmarksFromBridge(bridge) {
    const uid = bridge?.getUserId?.() || 'guest';
    const localSet = loadLocalBookmarks(uid);
    if (!bridge || bridge.isGuestMode?.() || !uid || uid === 'guest') {
        return localSet;
    }
    try {
        const remoteIds = await bridge.fetchExamBookmarks();
        remoteIds.forEach(id => localSet.add(id));
        saveLocalBookmarks(uid, localSet);
        return localSet;
    } catch {
        return localSet;
    }
}

export async function toggleBookmarkPersist(bridge, questionUid, isBookmarked) {
    const uid = bridge?.getUserId?.() || 'guest';
    const localSet = loadLocalBookmarks(uid);
    if (isBookmarked) {
        localSet.add(questionUid);
    } else {
        localSet.delete(questionUid);
    }
    saveLocalBookmarks(uid, localSet);

    if (bridge && !bridge.isGuestMode?.() && uid !== 'guest') {
        try {
            await bridge.saveExamBookmarks(Array.from(localSet));
        } catch (e) {
            console.warn('[ExamStorage] Bookmark remote sync failed:', e);
        }
    }
    return localSet;
}

// --- Subtle Web Audio Synthesizer (Zero External Assets) ---
let _audioCtx = null;

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!_audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) _audioCtx = new Ctx();
    }
    if (_audioCtx && _audioCtx.state === 'suspended') {
        _audioCtx.resume().catch(() => {});
    }
    return _audioCtx;
}

export function playExamSound(enabled, type) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'select') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (type === 'correct') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.setValueAtTime(880, now + 0.08);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.setValueAtTime(175, now + 0.09);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'submit') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.09);
            osc.frequency.setValueAtTime(783.99, now + 0.18);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    } catch {
        // Ignore audio errors on restricted devices
    }
}
