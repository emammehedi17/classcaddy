// ============================================================================
// Class Caddy — New Examination Module: Question Bank Aggregator & Filter Engine
// ============================================================================

import {
    normalizeMcqItem,
    getCanonicalCorrectIndex,
    htmlToPlainText,
    isOptionCorrect
} from '../mcq-engine/schema.js';

const BANGLA_REGEX = /[\u0980-\u09FF]/;
const PREVIOUS_PAPER_KEYWORDS = [
    'bcs', 'previous', 'past paper', 'question bank', 'model test', 'preliminary',
    'বিগত', 'বিসিএস', 'প্রশ্ন', 'প্রশ্নব্যাংক', 'মডেল'
];

export function isBanglaText(text) {
    return BANGLA_REGEX.test(htmlToPlainText(String(text || '')));
}

export function getLocalizedOptionLabel(index, questionText = '', options = []) {
    const plainOpts = Array.isArray(options) ? options.map(o => htmlToPlainText(o)).join(' ') : '';
    const sample = `${htmlToPlainText(String(questionText || ''))} ${plainOpts}`;
    if (isBanglaText(sample)) {
        return ['ক', 'খ', 'গ', 'ঘ', 'ঙ'][index] || String(index + 1);
    }
    return ['A', 'B', 'C', 'D', 'E'][index] || String(index + 1);
}

export function computeQuestionUid(qText, correctAnswer) {
    const cleanQ = htmlToPlainText(String(qText || '')).trim().toLowerCase();
    const cleanA = htmlToPlainText(String(correctAnswer || '')).trim().toLowerCase();
    const raw = `${cleanQ}||${cleanA}`;
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) {
        hash ^= raw.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return 'q_' + (hash >>> 0).toString(36);
}

export function shuffleArrayCopy(arr) {
    const copy = Array.isArray(arr) ? arr.slice() : [];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function processOptionBundle(q, shouldAllowShuffle = true) {
    const rawOptions = Array.isArray(q?.options) ? q.options.slice() : [];
    const rawOptionsHtml = Array.isArray(q?.optionsHtml) ? q.optionsHtml.slice() : [];
    const origCorrectIdx = getCanonicalCorrectIndex(q);

    if (!shouldAllowShuffle || rawOptions.length <= 1) {
        return {
            options: rawOptions,
            optionsHtml: rawOptionsHtml.length ? rawOptionsHtml : rawOptions.slice(),
            correctIndex: origCorrectIdx
        };
    }

    const restrictedPhrases = [
        'both', 'all of the above', 'none of the above', 'a & b', 'b and c', 'c and d', 'none', 'all',
        'উভয়', 'উভয়ই', 'দুটিই', 'উপরের সব', 'উপরের সবগুলো', 'সবগুলো',
        'কোনোটিই নয়', 'কোনোটিই না', 'কোনোটি নয়', 'কোনোটি না',
        'ক ও খ', 'খ ও গ', 'ক ও গ'
    ];

    const hasRestricted = rawOptions.some(opt => {
        const lower = htmlToPlainText(String(opt || '')).toLowerCase();
        return restrictedPhrases.some(phrase => lower.includes(phrase.toLowerCase()));
    });

    const indices = rawOptions.map((_, i) => i);
    const ordered = hasRestricted ? indices : shuffleArrayCopy(indices);

    const options = ordered.map(i => rawOptions[i]);
    const optionsHtml = ordered.map(i =>
        (rawOptionsHtml[i] !== undefined && rawOptionsHtml[i] !== null && rawOptionsHtml[i] !== '')
            ? rawOptionsHtml[i]
            : rawOptions[i]
    );

    let newCorrectIndex = -1;
    if (origCorrectIdx !== -1) {
        newCorrectIndex = ordered.indexOf(origCorrectIdx);
    } else if (q?.correctAnswer) {
        newCorrectIndex = options.findIndex((o, idx) => isOptionCorrect({ ...q, options, optionsHtml }, idx, o));
    }

    return { options, optionsHtml, correctIndex: newCorrectIndex };
}

export function processOptionsOrder(originalOptions, shouldAllowShuffle = true) {
    return processOptionBundle({ options: originalOptions }, shouldAllowShuffle).options;
}

export function formatMonthTitle(monthId, monthName) {
    if (monthName) return monthName;
    return String(monthId || 'Plan');
}

/**
 * Fetches & normalizes all Study Plan MCQs and Vocab rows across all months, weeks, days, and rows.
 * Preserves existing categorization cleanly without duplicating or mixing subjects.
 */
export async function buildStudyPlanRepository(bridge) {
    const rawPlans = await bridge.fetchAllStudyPlanData();
    const launchContext = bridge.getLaunchContext ? bridge.getLaunchContext() : null;

    // Fetch attempt & wrong history for metadata enrichment
    const [classicResults, newResults, reviewQuestions] = await Promise.all([
        bridge.fetchClassicQuizResults().catch(() => []),
        bridge.fetchNewExamResults().catch(() => []),
        bridge.fetchReviewQuestions().catch(() => [])
    ]);

    const attemptedQSet = new Set();
    const recentlyAttemptedQSet = new Set();
    const wrongQSet = new Set();

    // Index reviewQuestions (known mistakes)
    reviewQuestions.forEach(item => {
        const uid = computeQuestionUid(item.question, item.correctAnswer);
        wrongQSet.add(uid);
    });

    // Combine classic & new results sorted newest first
    const combinedAttempts = [
        ...newResults.map(r => ({ ts: r.timestampMs || 0, questions: r.questions || [] })),
        ...classicResults.map(r => ({
            ts: r.saveTimestamp?.toMillis ? r.saveTimestamp.toMillis() : (r.saveTimestamp?.seconds ? r.saveTimestamp.seconds * 1000 : 0),
            questions: r.questions || []
        }))
    ].sort((a, b) => b.ts - a.ts);

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();

    combinedAttempts.forEach((attempt, idx) => {
        const isRecent = (idx < 8) || (attempt.ts > 0 && (nowMs - attempt.ts) <= sevenDaysMs);
        (attempt.questions || []).forEach(q => {
            const uid = computeQuestionUid(q.question, q.correctAnswer);
            if (q.userAnswer !== null && q.userAnswer !== undefined) {
                attemptedQSet.add(uid);
                if (isRecent) recentlyAttemptedQSet.add(uid);
            }
            if (q.isCorrect === false) {
                wrongQSet.add(uid);
            }
        });
    });

    // Build global vocab pool across all plans for clean distractor generation
    const globalVocabPool = {
        allWords: [],
        allBanglaMeanings: [],
        allSynonyms: [],
        allAntonyms: []
    };

    const subjectsMap = new Map(); // normalizedSubject -> { key, name, topics: [] }
    const allTopics = [];
    const allQuestions = [];
    const seenMcqInTopic = new Set();

    const getOrCreateSubject = (displayName) => {
        const clean = String(displayName || 'General').trim() || 'General';
        const normKey = clean.toLowerCase();
        if (!subjectsMap.has(normKey)) {
            subjectsMap.set(normKey, {
                key: normKey,
                name: clean,
                topics: [],
                questionCount: 0,
                mcqCount: 0,
                vocabCount: 0
            });
        }
        return subjectsMap.get(normKey);
    };

    // First pass: gather global vocab pool
    rawPlans.forEach(monthObj => {
        (monthObj.weeks || []).forEach(weekObj => {
            (weekObj.days || []).forEach(dayData => {
                (dayData.rows || []).forEach(rowData => {
                    if (rowData.subject?.toLowerCase() === 'vocabulary' && Array.isArray(rowData.vocabData)) {
                        const processed = bridge.preProcessVocab(rowData.vocabData);
                        processed.forEach(v => {
                            if (v.word) globalVocabPool.allWords.push(v.word);
                            if (v.banglaMeaning) globalVocabPool.allBanglaMeanings.push(v.banglaMeaning);
                            if (v.synonym) globalVocabPool.allSynonyms.push(v.synonym);
                            if (v.antonym) globalVocabPool.allAntonyms.push(v.antonym);
                        });
                    }
                });
            });
        });
    });

    // Second pass: index every MCQ and Vocab row faithfully by Month -> Week -> Day -> Row
    let serialOrderCounter = 0;
    rawPlans.forEach(monthObj => {
        const monthLabel = formatMonthTitle(monthObj.monthId, monthObj.monthName);

        (monthObj.weeks || []).forEach(weekObj => {
            const weekNum = weekObj.weekId.replace('week', '');
            const weekLabel = `Week ${weekNum}`;

            (weekObj.days || []).forEach((dayData, dayIndex) => {
                const dayNumber = dayData.dayNumber ?? (dayIndex + 1);

                (dayData.rows || []).forEach((rowData, rowIndex) => {
                    const subjectName = String(rowData.subject || 'General').trim() || 'General';
                    const subjectEntry = getOrCreateSubject(subjectName);
                    const isVocabRow = subjectName.toLowerCase() === 'vocabulary';

                    const hasMcqs = Array.isArray(rowData.mcqData) && rowData.mcqData.length > 0;
                    const hasVocab = isVocabRow && Array.isArray(rowData.vocabData) && rowData.vocabData.length >= 4;

                    if (!hasMcqs && !hasVocab) return;

                    // 1) Index Custom MCQs on this row
                    if (hasMcqs) {
                        const rawTopic = String(rowData.topic || '').trim();
                        const topicTitle = rawTopic || `${subjectName} — Day ${dayNumber}`;
                        const topicKey = `mcq::${monthObj.monthId}::${weekObj.weekId}::${dayIndex}::${rowIndex}`;
                        const isPreviousPaper = PREVIOUS_PAPER_KEYWORDS.some(kw =>
                            topicTitle.toLowerCase().includes(kw) || subjectName.toLowerCase().includes(kw)
                        );

                        const topicQuestions = [];
                        rowData.mcqData.forEach((mcq, qIdx) => {
                            if (!mcq || (!mcq.question && !mcq.questionHtml)) return;
                            const norm = normalizeMcqItem(mcq, qIdx);
                            const uid = computeQuestionUid(norm.question, norm.correctAnswer);
                            const dedupKey = `${topicKey}::${uid}::${qIdx}`;
                            if (seenMcqInTopic.has(dedupKey)) return;
                            seenMcqInTopic.add(dedupKey);

                            const normalizedQ = {
                                version: norm.version,
                                uid,
                                kind: 'mcq',
                                serialIndex: serialOrderCounter++,
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
                                hasMedia: norm.hasMedia,
                                tags: norm.tags,
                                sourceFormat: norm.sourceFormat,
                                subjectKey: subjectEntry.key,
                                subject: subjectEntry.name,
                                topicKey,
                                topic: topicTitle,
                                monthId: monthObj.monthId,
                                monthName: monthLabel,
                                weekId: weekObj.weekId,
                                weekLabel,
                                dayIndex,
                                dayNumber,
                                rowIndex,
                                isPreviousPaper,
                                isAttempted: attemptedQSet.has(uid),
                                isRecent: recentlyAttemptedQSet.has(uid),
                                isWrongHistory: wrongQSet.has(uid)
                            };
                            topicQuestions.push(normalizedQ);
                            allQuestions.push(normalizedQ);
                        });

                        if (topicQuestions.length > 0) {
                            const topicObj = {
                                topicKey,
                                kind: 'mcq',
                                subjectKey: subjectEntry.key,
                                subject: subjectEntry.name,
                                title: topicTitle,
                                subtitle: `${monthLabel} · ${weekLabel} · Day ${dayNumber}`,
                                monthId: monthObj.monthId,
                                monthName: monthLabel,
                                weekId: weekObj.weekId,
                                weekLabel,
                                dayIndex,
                                dayNumber,
                                rowIndex,
                                isPreviousPaper,
                                questionCount: topicQuestions.length,
                                questions: topicQuestions
                            };
                            subjectEntry.topics.push(topicObj);
                            subjectEntry.mcqCount += topicQuestions.length;
                            subjectEntry.questionCount += topicQuestions.length;
                            allTopics.push(topicObj);
                        }
                    }

                    // 2) Index Vocab Quiz items on Vocab rows
                    if (hasVocab) {
                        const topicTitle = `Vocab (${rowData.vocabData.length} words) — Day ${dayNumber}`;
                        const topicKey = `vocab::${monthObj.monthId}::${weekObj.weekId}::${dayIndex}::${rowIndex}`;
                        const processedVocab = bridge.preProcessVocab(rowData.vocabData);
                        const generatedVocabQs = bridge.generateQuizData(processedVocab, globalVocabPool) || [];

                        const topicQuestions = generatedVocabQs.map((vq, qIdx) => {
                            const uid = computeQuestionUid(vq.question, vq.correctAnswer);
                            const normalizedQ = {
                                uid,
                                kind: 'vocab',
                                serialIndex: serialOrderCounter++,
                                question: String(vq.question),
                                options: Array.isArray(vq.options) ? vq.options.slice() : [],
                                correctAnswer: vq.correctAnswer || '',
                                explanation: null,
                                note: null,
                                subjectKey: subjectEntry.key,
                                subject: subjectEntry.name,
                                topicKey,
                                topic: topicTitle,
                                monthId: monthObj.monthId,
                                monthName: monthLabel,
                                weekId: weekObj.weekId,
                                weekLabel,
                                dayIndex,
                                dayNumber,
                                rowIndex,
                                rawVocabItem: processedVocab[qIdx % processedVocab.length] || null,
                                isPreviousPaper: false,
                                isAttempted: attemptedQSet.has(uid),
                                isRecent: recentlyAttemptedQSet.has(uid),
                                isWrongHistory: wrongQSet.has(uid)
                            };
                            allQuestions.push(normalizedQ);
                            return normalizedQ;
                        });

                        if (topicQuestions.length > 0) {
                            const topicObj = {
                                topicKey,
                                kind: 'vocab',
                                subjectKey: subjectEntry.key,
                                subject: subjectEntry.name,
                                title: topicTitle,
                                subtitle: `${monthLabel} · ${weekLabel} · Day ${dayNumber}`,
                                monthId: monthObj.monthId,
                                monthName: monthLabel,
                                weekId: weekObj.weekId,
                                weekLabel,
                                dayIndex,
                                dayNumber,
                                rowIndex,
                                isPreviousPaper: false,
                                questionCount: topicQuestions.length,
                                questions: topicQuestions
                            };
                            subjectEntry.topics.push(topicObj);
                            subjectEntry.vocabCount += topicQuestions.length;
                            subjectEntry.questionCount += topicQuestions.length;
                            allTopics.push(topicObj);
                        }
                    }
                });
            });
        });
    });

    // If launched from a modal/selection whose questions don't directly match a single row
    // (e.g. Study View custom selection, View MCQ Modal, Weekly Quiz Center, Day Aggregated, Weakness Test)
    let inheritedCollection = null;
    if (launchContext && Array.isArray(launchContext.questions) && launchContext.questions.length > 0) {
        const inheritedSubjectName = launchContext.subjectName || 'Selected Quiz';
        const inheritedQuestions = launchContext.questions.map((q, idx) => {
            const norm = normalizeMcqItem(q, idx);
            const uid = computeQuestionUid(norm.question, norm.correctAnswer);
            return {
                version: norm.version,
                uid,
                kind: launchContext.quizKind || 'mcq',
                serialIndex: idx,
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
                hasMedia: norm.hasMedia,
                tags: norm.tags,
                sourceFormat: norm.sourceFormat,
                subjectKey: inheritedSubjectName.toLowerCase(),
                subject: inheritedSubjectName,
                topicKey: 'inherited::current',
                topic: launchContext.topicDetail || 'Inherited Collection',
                monthId: launchContext.monthId || null,
                weekId: launchContext.weekId || null,
                dayIndex: launchContext.dayIndex ?? null,
                rowIndex: launchContext.rowIndex ?? null,
                isPreviousPaper: false,
                isAttempted: attemptedQSet.has(uid),
                isRecent: recentlyAttemptedQSet.has(uid),
                isWrongHistory: wrongQSet.has(uid)
            };
        });

        inheritedCollection = {
            title: launchContext.topicDetail || launchContext.title || 'Selected Questions',
            subjectName: inheritedSubjectName,
            quizKind: launchContext.quizKind || 'mcq',
            monthId: launchContext.monthId || null,
            weekId: launchContext.weekId || null,
            dayIndex: launchContext.dayIndex ?? null,
            rowIndex: launchContext.rowIndex ?? null,
            quizType: launchContext.quizType || null,
            questions: inheritedQuestions
        };
    }

    const subjects = Array.from(subjectsMap.values()).sort((a, b) => b.questionCount - a.questionCount);

    // Build extra review-only questions not currently in study plan rows (orphaned/deleted rows still in reviewQuestions)
    const planUidSet = new Set(allQuestions.map(q => q.uid));
    const orphanedWrongQuestions = [];
    reviewQuestions.forEach((rq, idx) => {
        if (!rq || (!rq.question && !rq.questionHtml)) return;
        const norm = normalizeMcqItem(rq, idx);
        const uid = computeQuestionUid(norm.question, norm.correctAnswer);
        if (planUidSet.has(uid)) return;
        planUidSet.add(uid);
        orphanedWrongQuestions.push({
            version: norm.version,
            uid,
            kind: 'mcq',
            serialIndex: 100000 + idx,
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
            hasMedia: norm.hasMedia,
            subjectKey: String(rq.subject || 'Review Mistakes').toLowerCase(),
            subject: rq.subject || 'Review Mistakes',
            topicKey: 'review::saved',
            topic: rq.title || 'Saved Wrong Questions',
            isPreviousPaper: false,
            isAttempted: true,
            isRecent: true,
            isWrongHistory: true
        });
    });

    const previousPaperTopics = allTopics.filter(t => t.isPreviousPaper);

    return {
        subjects,
        allTopics,
        allQuestions,
        orphanedWrongQuestions,
        previousPaperTopics,
        inheritedCollection,
        attemptedCount: attemptedQSet.size,
        recentAttemptedCount: recentlyAttemptedQSet.size,
        wrongHistoryCount: wrongQSet.size
    };
}

/**
 * Determines which initial subject/topic scope should be preselected from the Study Plan context.
 */
export function resolveInitialScopeFromContext(repo) {
    const ctx = repo.inheritedCollection;
    if (!ctx) {
        return {
            scopeMode: 'all', // 'inherited' | 'all' | 'subject'
            selectedSubjectKey: repo.subjects[0]?.key || '',
            selectedTopicKeys: repo.allTopics.map(t => t.topicKey)
        };
    }

    // 1. Exact row match
    if (ctx.monthId && ctx.weekId && ctx.dayIndex !== null && ctx.rowIndex !== null) {
        const expectedPrefix = ctx.quizKind === 'vocab' ? 'vocab' : 'mcq';
        const exactKey = `${expectedPrefix}::${ctx.monthId}::${ctx.weekId}::${ctx.dayIndex}::${ctx.rowIndex}`;
        const exactTopic = repo.allTopics.find(t => t.topicKey === exactKey);
        if (exactTopic) {
            return {
                scopeMode: 'subject',
                selectedSubjectKey: exactTopic.subjectKey,
                selectedTopicKeys: [exactTopic.topicKey]
            };
        }
    }

    // 2. Day / Week / Month aggregated match
    if (ctx.monthId) {
        const matchingTopics = repo.allTopics.filter(t => {
            if (t.monthId !== ctx.monthId) return false;
            if (ctx.weekId && t.weekId !== ctx.weekId) return false;
            if (ctx.dayIndex !== null && ctx.dayIndex !== undefined && t.dayIndex !== Number(ctx.dayIndex)) return false;
            if (ctx.quizKind === 'vocab' && t.kind !== 'vocab') return false;
            return true;
        });

        if (matchingTopics.length > 0) {
            const uniqueSubjects = new Set(matchingTopics.map(t => t.subjectKey));
            if (uniqueSubjects.size === 1) {
                return {
                    scopeMode: 'subject',
                    selectedSubjectKey: matchingTopics[0].subjectKey,
                    selectedTopicKeys: matchingTopics.map(t => t.topicKey)
                };
            }
            return {
                scopeMode: 'all',
                selectedSubjectKey: '',
                selectedTopicKeys: matchingTopics.map(t => t.topicKey)
            };
        }
    }

    // 3. Fallback: Inherited custom collection (Study View / View MCQ / Weakness)
    return {
        scopeMode: 'inherited',
        selectedSubjectKey: ctx.subjectName?.toLowerCase() || '',
        selectedTopicKeys: []
    };
}

/**
 * Computes the eligible question pool and final selected exam questions given configuration state.
 */
export function selectQuestionsForExam(repo, configState, bookmarkSet) {
    let basePool = [];

    if (configState.scopeMode === 'inherited' && repo.inheritedCollection) {
        basePool = repo.inheritedCollection.questions.slice();
    } else if (configState.scopeMode === 'subject') {
        const chosenKeys = new Set(configState.selectedTopicKeys || []);
        const subj = repo.subjects.find(s => s.key === configState.selectedSubjectKey);
        if (subj) {
            subj.topics.forEach(t => {
                if (chosenKeys.size === 0 || chosenKeys.has(t.topicKey)) {
                    basePool.push(...t.questions);
                }
            });
        }
    } else {
        // 'all' subjects mode (filter by selectedTopicKeys if non-empty, or allTopics)
        const chosenKeys = new Set(configState.selectedTopicKeys || []);
        if (chosenKeys.size > 0) {
            repo.allTopics.forEach(t => {
                if (chosenKeys.has(t.topicKey)) {
                    basePool.push(...t.questions);
                }
            });
        } else {
            basePool = repo.allQuestions.slice();
        }
    }

    // Deduplicate identical UIDs only if coming from multiple identical sources, preserving first seen
    const dedupMap = new Map();
    basePool.forEach(q => {
        if (!dedupMap.has(q.uid)) {
            dedupMap.set(q.uid, q);
        }
    });

    // If wrongOnly is enabled and basePool is global ('all'), also include orphanedWrongQuestions if matching
    if (configState.settings.wrongOnly && configState.scopeMode === 'all' && (configState.selectedTopicKeys || []).length === repo.allTopics.length) {
        repo.orphanedWrongQuestions.forEach(q => {
            if (!dedupMap.has(q.uid)) dedupMap.set(q.uid, q);
        });
    }

    let pool = Array.from(dedupMap.values());

    // Apply selection filters
    if (!configState.settings.includeAttempted) {
        pool = pool.filter(q => !q.isAttempted);
    }

    if (configState.settings.wrongOnly) {
        pool = pool.filter(q => q.isWrongHistory);
    }

    if (configState.settings.bookmarkedOnly) {
        pool = pool.filter(q => bookmarkSet && bookmarkSet.has(q.uid));
    }

    let avoidedRecentFallbackUsed = false;
    if (configState.settings.avoidRecent) {
        const nonRecent = pool.filter(q => !q.isRecent);
        if (nonRecent.length > 0) {
            pool = nonRecent;
        } else if (pool.length > 0) {
            // Keep pool but flag notice if every question was recently attempted
            avoidedRecentFallbackUsed = true;
        }
    }

    const totalEligible = pool.length;

    // Sort / Shuffle questions
    let ordered = pool.slice();
    if (configState.settings.questionOrder === 'serial') {
        ordered.sort((a, b) => (a.serialIndex || 0) - (b.serialIndex || 0));
    } else if (configState.settings.shuffleQuestions) {
        ordered = shuffleArrayCopy(ordered);
    } else {
        ordered = shuffleArrayCopy(ordered);
    }

    const requestedCount = Math.max(1, parseInt(configState.settings.questionCount, 10) || 25);
    const actualCount = Math.min(requestedCount, ordered.length);
    const chosen = ordered.slice(0, actualCount).map((q, index) => {
        const bundle = processOptionBundle(q, configState.settings.shuffleOptions !== false);
        return {
            ...q,
            examIndex: index,
            options: bundle.options,
            optionsHtml: bundle.optionsHtml,
            correctIndex: bundle.correctIndex,
            correctAnswer: bundle.correctIndex !== -1 ? bundle.options[bundle.correctIndex] : q.correctAnswer,
            correctAnswerHtml: bundle.correctIndex !== -1 ? bundle.optionsHtml[bundle.correctIndex] : q.correctAnswerHtml,
            userAnswer: null,
            userAnswerIndex: null,
            isCorrect: null,
            markedForReview: false,
            answeredAtMs: null
        };
    });

    return {
        totalEligible,
        requestedCount,
        actualCount,
        avoidedRecentFallbackUsed,
        questions: chosen
    };
}
