/* =====================================================================
   Study Modals v2 — UI layer for:
     • MCQ Repository   (renderMcqRepository)
     • Vocabulary List  (renderVocabList)
     • Quiz Results     (buildResultsView + initResultsInteractivity)
   Pure rendering + interaction. All Firestore / app logic stays in app.js.
   ===================================================================== */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stateMap = new WeakMap();

export function skeletonHtml(rows = 5) {
    return `<div class="c2-skel">${'<span></span>'.repeat(rows)}</div>`;
}

export function emptyHtml(icon, title, text = '') {
    return `<div class="c2-empty"><i class="fas ${icon}"></i><b>${esc(title)}</b>${esc(text)}</div>`;
}

/* ============================ MCQ REPOSITORY ============================ */

/**
 * months: [{ monthId, monthName, count, weeks: [{ weekId, label, count,
 *            days: [{ dayNumber, total, subjects: [{ name, count }] }] }] }]
 * Buttons keep the data-action="open-study" contract used by app.js.
 */
export function renderMcqRepository(container, months) {
    let st = stateMap.get(container);
    if (!st) {
        st = { q: '', subject: '', open: new Set(), touched: false, wired: false };
        stateMap.set(container, st);
    }
    // Newest month first
    st.months = [...months].sort((a, b) => String(b.monthId).localeCompare(String(a.monthId)));

    if (!st.months.length) {
        container.innerHTML = emptyHtml('fa-layer-group', 'No MCQs yet', 'Add MCQs to your study plan rows and they will appear here.');
        st.shell = false;
        return;
    }
    if (!st.touched && st.open.size === 0) st.open.add(st.months[0].monthId);

    if (!st.shell || !container.querySelector('[data-mq="list"]')) {
        container.innerHTML = `
            <div class="c2-stats" data-mq="stats"></div>
            <button type="button" class="mq-hero" data-action="open-study" data-scope="all" data-mq="hero"></button>
            <div class="c2-toolbar">
                <div class="c2-search"><i class="fas fa-search"></i>
                    <input type="search" data-mq="search" placeholder="Search month, week, day or subject…" autocomplete="off" value="${esc(st.q)}">
                </div>
                <button type="button" class="c2-btn sm" data-mq="expand"><i class="fas fa-angle-double-down"></i> Expand all</button>
                <button type="button" class="c2-btn sm" data-mq="collapse"><i class="fas fa-angle-double-up"></i> Collapse all</button>
            </div>
            <div class="c2-chips" data-mq="chips"></div>
            <div data-mq="list"></div>`;
        st.shell = true;
    }
    if (!st.wired) {
        st.wired = true;
        container.addEventListener('input', (e) => {
            if (e.target.matches('[data-mq="search"]')) { st.q = e.target.value; mcqList(container, st); }
        });
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="open-study"]')) return; // handled by app.js
            const chip = e.target.closest('[data-mq-subject]');
            if (chip) { st.subject = chip.dataset.mqSubject; mcqChips(container, st); mcqList(container, st); return; }
            if (e.target.closest('[data-mq="expand"]')) { st.touched = true; st.months.forEach((m) => st.open.add(m.monthId)); mcqList(container, st); return; }
            if (e.target.closest('[data-mq="collapse"]')) { st.touched = true; st.open.clear(); mcqList(container, st); return; }
            const head = e.target.closest('[data-mq-toggle]');
            if (head) {
                st.touched = true;
                const id = head.dataset.mqToggle;
                st.open.has(id) ? st.open.delete(id) : st.open.add(id);
                mcqList(container, st);
            }
        });
    }
    mcqStats(container, st);
    mcqChips(container, st);
    mcqList(container, st);
}

function mcqTotals(st) {
    const subjects = {};
    let total = 0, weeks = 0;
    st.months.forEach((m) => {
        total += m.count;
        weeks += m.weeks.length;
        m.weeks.forEach((w) => w.days.forEach((d) => d.subjects.forEach((s) => { subjects[s.name] = (subjects[s.name] || 0) + s.count; })));
    });
    return { total, weeks, subjects };
}

function mcqStats(container, st) {
    const t = mcqTotals(st);
    const subjCount = Object.keys(t.subjects).length;
    container.querySelector('[data-mq="stats"]').innerHTML = `
        <div class="c2-stat"><div class="c2-stat-ico"><i class="fas fa-list-check"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${t.total}</div><div class="c2-stat-lbl">Total MCQs</div></div></div>
        <div class="c2-stat"><div class="c2-stat-ico green"><i class="fas fa-calendar-alt"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${st.months.length}</div><div class="c2-stat-lbl">Months</div></div></div>
        <div class="c2-stat"><div class="c2-stat-ico amber"><i class="fas fa-calendar-week"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${t.weeks}</div><div class="c2-stat-lbl">Weeks</div></div></div>
        <div class="c2-stat"><div class="c2-stat-ico red"><i class="fas fa-tags"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${subjCount}</div><div class="c2-stat-lbl">Subjects</div></div></div>`;
    container.querySelector('[data-mq="hero"]').innerHTML = `
        <span><b><i class="fas fa-globe-asia" style="margin-right:8px"></i>Study all lifetime MCQs</b><small>${t.total} questions across ${st.months.length} month${st.months.length === 1 ? '' : 's'}</small></span>
        <span class="go"><i class="fas fa-arrow-right"></i></span>`;
}

function mcqChips(container, st) {
    const t = mcqTotals(st);
    const entries = Object.entries(t.subjects).sort((a, b) => b[1] - a[1]);
    container.querySelector('[data-mq="chips"]').innerHTML =
        `<button type="button" class="c2-chip ${st.subject ? '' : 'active'}" data-mq-subject="">All subjects <span class="n">${t.total}</span></button>` +
        entries.map(([name, n]) => `<button type="button" class="c2-chip ${st.subject === name ? 'active' : ''}" data-mq-subject="${esc(name)}">${esc(name)} <span class="n">${n}</span></button>`).join('');
}

function mcqList(container, st) {
    const tokens = st.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtering = tokens.length > 0 || !!st.subject;
    let html = '';
    let shownMonths = 0;

    for (const m of st.months) {
        let monthShown = 0;
        let weeksHtml = '';
        for (const w of m.weeks) {
            let weekShown = 0;
            let daysHtml = '';
            for (const d of w.days) {
                const subs = d.subjects.filter((s) => {
                    if (st.subject && s.name !== st.subject) return false;
                    const hay = `${m.monthName} ${m.monthId} ${w.label} ${w.weekId} day ${d.dayNumber} ${s.name}`.toLowerCase();
                    return tokens.every((tk) => hay.includes(tk));
                });
                if (!subs.length) continue;
                weekShown += subs.reduce((a, s) => a + s.count, 0);
                daysHtml += `
                    <div class="mq-day">
                        <div class="mq-day-n">Day ${esc(d.dayNumber)}</div>
                        <div class="mq-subs">${subs.map((s) => `
                            <button type="button" class="mq-sub" data-action="open-study" data-scope="subject"
                                data-month-id="${esc(m.monthId)}" data-week-id="${esc(w.weekId)}" data-day-num="${esc(d.dayNumber)}" data-subject="${esc(s.name)}">
                                ${esc(s.name)} <span class="n">${s.count}</span>
                            </button>`).join('')}
                        </div>
                    </div>`;
            }
            if (!weekShown) continue;
            monthShown += weekShown;
            weeksHtml += `
                <div class="mq-week">
                    <div class="mq-week-head">
                        <span class="mq-week-title">${esc(w.label)}</span>
                        <span class="mq-pill">${weekShown}</span>
                        ${filtering ? '' : `<button type="button" class="c2-btn sm" data-action="open-study" data-scope="week" data-month-id="${esc(m.monthId)}" data-week-id="${esc(w.weekId)}"><i class="fas fa-book-open"></i> Study week</button>`}
                    </div>
                    <div class="mq-days">${daysHtml}</div>
                </div>`;
        }
        if (!monthShown) continue;
        shownMonths++;
        const open = filtering || st.open.has(m.monthId);
        html += `
            <div class="mq-month ${open ? 'open' : ''}">
                <div class="mq-month-head" data-mq-toggle="${esc(m.monthId)}">
                    <span class="mq-chev"><i class="fas fa-chevron-right"></i></span>
                    <span class="mq-month-name">${esc(m.monthName)}<small>${m.weeks.length} week${m.weeks.length === 1 ? '' : 's'}${filtering ? ' · filtered view' : ''}</small></span>
                    <span class="mq-pill">${monthShown} MCQs</span>
                    ${filtering ? '' : `<button type="button" class="c2-btn sm primary" data-action="open-study" data-scope="month" data-month-id="${esc(m.monthId)}"><i class="fas fa-play"></i> Study month</button>`}
                </div>
                <div class="mq-month-body">${weeksHtml}</div>
            </div>`;
    }
    container.querySelector('[data-mq="list"]').innerHTML = shownMonths
        ? html
        : emptyHtml('fa-search', 'Nothing matches', 'Try a different word or clear the subject filter.');
}

/* ============================ VOCAB LIST ============================ */

const KNOWN_KEY = 'cc_vocab_known_v1';
function loadKnown() {
    try { return new Set(JSON.parse(localStorage.getItem(KNOWN_KEY) || '[]')); } catch (_) { return new Set(); }
}
function saveKnown(set) {
    try { localStorage.setItem(KNOWN_KEY, JSON.stringify([...set])); } catch (_) { /* storage unavailable */ }
}
const vkey = (v) => String(v.word || '').trim().toLowerCase();

/**
 * items: [{ word, meaning, antonym, monthId, monthName, weekId, weekLabel }]
 */
export function renderVocabList(container, items) {
    let st = stateMap.get(container);
    if (!st) {
        st = { q: '', month: '', sort: 'default', hide: false, unknown: false, mode: 'list', order: [], pos: 0, known: loadKnown(), wired: false, shell: false };
        stateMap.set(container, st);
    }
    st.items = items.map((v, i) => ({ ...v, i }));

    if (!st.items.length) {
        container.innerHTML = emptyHtml('fa-book-open', 'No vocabulary yet', 'Vocabulary rows you add to your study plan will be collected here.');
        st.shell = false;
        return;
    }
    // A background refresh can change the word count while flashcards are open; drop a stale deck.
    if (st.mode === 'cards' && st.order.some((ix) => ix >= st.items.length)) { st.mode = 'list'; st.order = []; st.pos = 0; }
    if (!st.shell || !container.querySelector('[data-vb="list"]')) {
        container.innerHTML = `
            <div data-vb="listview">
                <div class="c2-stats" data-vb="stats"></div>
                <div class="c2-toolbar">
                    <div class="c2-search"><i class="fas fa-search"></i>
                        <input type="search" data-vb="search" placeholder="Search a word or its meaning…" autocomplete="off" value="${esc(st.q)}">
                    </div>
                    <select class="c2-select" data-vb="month"></select>
                    <select class="c2-select" data-vb="sort">
                        <option value="default">Plan order</option>
                        <option value="az">A → Z</option>
                        <option value="za">Z → A</option>
                    </select>
                </div>
                <div class="c2-toolbar">
                    <label class="c2-switch"><input type="checkbox" data-vb="hide"><span class="track"></span> Hide meanings</label>
                    <label class="c2-switch"><input type="checkbox" data-vb="unknown"><span class="track"></span> Not known yet</label>
                    <span style="flex:1"></span>
                    <button type="button" class="c2-btn sm primary" data-vb-act="cards"><i class="fas fa-clone"></i> Flashcards</button>
                    <button type="button" class="c2-btn sm" data-vb-act="csv"><i class="fas fa-file-csv"></i> CSV</button>
                    <button type="button" class="c2-btn sm" data-vb-act="copy"><i class="fas fa-copy"></i> Copy</button>
                </div>
                <div data-vb="list"></div>
            </div>
            <div data-vb="cardview" hidden></div>`;
        container.querySelector('[data-vb="sort"]').value = st.sort;
        container.querySelector('[data-vb="hide"]').checked = st.hide;
        container.querySelector('[data-vb="unknown"]').checked = st.unknown;
        st.shell = true;
    }
    if (!st.wired) { st.wired = true; vocabWire(container, st); }
    vocabMonthOptions(container, st);
    vocabRefresh(container, st);
    if (st.mode === 'cards') vocabCards(container, st); else vocabShowMode(container, st);
}

function vocabMonthOptions(container, st) {
    const seen = new Map();
    st.items.forEach((v) => { if (!seen.has(v.monthId)) seen.set(v.monthId, v.monthName); });
    const sel = container.querySelector('[data-vb="month"]');
    if (st.month && !seen.has(st.month)) st.month = '';
    sel.innerHTML = `<option value="">All months</option>` + [...seen.entries()].map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join('');
    sel.value = st.month;
}

function vocabVisible(st) {
    const q = st.q.trim().toLowerCase();
    let list = st.items.filter((v) => {
        if (st.month && v.monthId !== st.month) return false;
        if (st.unknown && st.known.has(vkey(v))) return false;
        if (q && !(`${v.word} ${v.meaning} ${v.antonym || ''}`.toLowerCase().includes(q))) return false;
        return true;
    });
    if (st.sort === 'az') list = [...list].sort((a, b) => vkey(a).localeCompare(vkey(b)));
    if (st.sort === 'za') list = [...list].sort((a, b) => vkey(b).localeCompare(vkey(a)));
    return list;
}

function vocabRefresh(container, st) {
    const total = st.items.length;
    const known = st.items.filter((v) => st.known.has(vkey(v))).length;
    const weeks = new Set(st.items.map((v) => `${v.monthId}|${v.weekId}`)).size;
    const vis = vocabVisible(st);
    const pct = total ? Math.round((known / total) * 100) : 0;
    container.querySelector('[data-vb="stats"]').innerHTML = `
        <div class="c2-stat"><div class="c2-stat-ico"><i class="fas fa-book"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${total}</div><div class="c2-stat-lbl">Total words</div></div></div>
        <div class="c2-stat"><div class="c2-stat-ico amber"><i class="fas fa-filter"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${vis.length}</div><div class="c2-stat-lbl">Showing</div></div></div>
        <div class="c2-stat"><div class="c2-stat-ico green"><i class="fas fa-calendar-week"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${weeks}</div><div class="c2-stat-lbl">Weeks</div></div></div>
        <div class="c2-stat" style="display:block"><div style="display:flex;justify-content:space-between;align-items:baseline"><div class="c2-stat-lbl" style="margin:0">Known</div><div class="c2-stat-val" style="font-size:1rem">${known}/${total}</div></div><div class="vb-progress"><i style="width:${pct}%"></i></div></div>`;

    const box = container.querySelector('[data-vb="list"]');
    if (!vis.length) {
        box.innerHTML = emptyHtml('fa-search', 'No words match', st.unknown ? 'You know every word in this view — great job!' : 'Try a different search or month.');
        return;
    }
    const itemHtml = (v, n) => {
        const k = st.known.has(vkey(v));
        return `
            <div class="vb-item ${k ? 'known' : ''}">
                <div class="vb-idx">${n}</div>
                <div class="vb-main">
                    <div class="vb-word">${esc(v.word)}</div>
                    <div class="vb-meaning ${st.hide ? 'hidden-m' : ''}" data-vb-reveal>${esc(v.meaning)}</div>
                    ${v.antonym ? `<span class="vb-anto">Antonym: ${esc(v.antonym)}</span>` : ''}
                </div>
                <div class="vb-actions">
                    <button type="button" class="vb-mini" data-vb-speak="${v.i}" title="Pronounce"><i class="fas fa-volume-up"></i></button>
                    <button type="button" class="vb-mini ${k ? 'ok' : ''}" data-vb-known="${v.i}" title="${k ? 'Mark as not known' : 'Mark as known'}"><i class="fas fa-check"></i></button>
                </div>
            </div>`;
    };
    if (st.sort === 'default' && !st.q.trim()) {
        const groups = [];
        let cur = null;
        vis.forEach((v) => {
            const g = `${v.weekLabel} · ${v.monthName}`;
            if (!cur || cur.g !== g) { cur = { g, rows: [] }; groups.push(cur); }
            cur.rows.push(v);
        });
        box.innerHTML = groups.map((g) => `<div class="vb-group-title">${esc(g.g)}</div><div class="vb-grid">${g.rows.map((v, n) => itemHtml(v, n + 1)).join('')}</div>`).join('');
    } else {
        box.innerHTML = `<div class="vb-grid">${vis.map((v, n) => itemHtml(v, n + 1)).join('')}</div>`;
    }
}

function vocabShowMode(container, st) {
    container.querySelector('[data-vb="listview"]').hidden = st.mode !== 'list';
    container.querySelector('[data-vb="cardview"]').hidden = st.mode !== 'cards';
}

function vocabSpeak(text) {
    try {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang = 'en-US';
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
    } catch (_) { /* speech not available */ }
}

function vocabCards(container, st) {
    const view = container.querySelector('[data-vb="cardview"]');
    st.mode = 'cards';
    vocabShowMode(container, st);
    if (!st.order.length) {
        view.innerHTML = `<div class="vb-fc-wrap"><div class="vb-fc-top"><button type="button" class="c2-btn sm" data-vb-act="exit"><i class="fas fa-arrow-left"></i> Back to list</button></div>${emptyHtml('fa-clone', 'No cards to show', 'Adjust the search or filters and try again.')}</div>`;
        return;
    }
    if (st.pos >= st.order.length) {
        view.innerHTML = `
            <div class="vb-fc-wrap"><div class="vb-fc-top"><button type="button" class="c2-btn sm" data-vb-act="exit"><i class="fas fa-arrow-left"></i> Back to list</button></div>
            ${emptyHtml('fa-trophy', 'Deck finished!', `You went through ${st.order.length} cards.`)}
            <div class="vb-fc-controls"><button type="button" class="c2-btn primary" data-vb-act="restart"><i class="fas fa-redo"></i> Start again</button></div></div>`;
        return;
    }
    const v = st.items[st.order[st.pos]];
    const k = st.known.has(vkey(v));
    view.innerHTML = `
        <div class="vb-fc-wrap">
            <div class="vb-fc-top">
                <button type="button" class="c2-btn sm" data-vb-act="exit"><i class="fas fa-arrow-left"></i> Back to list</button>
                <span>${st.pos + 1} / ${st.order.length}${k ? ' · known' : ''}</span>
            </div>
            <div class="vb-progress" style="margin:0 0 14px"><i style="width:${Math.round(((st.pos + 1) / st.order.length) * 100)}%"></i></div>
            <div class="vb-fc" data-vb-act="flip" tabindex="0">
                <div class="vb-fc-inner">
                    <div class="vb-fc-face front"><div class="vb-fc-word">${esc(v.word)}</div><div class="vb-fc-hint">Tap the card (or press Space) to reveal the meaning</div></div>
                    <div class="vb-fc-face back"><div class="vb-fc-mean">${esc(v.meaning)}</div>${v.antonym ? `<span class="vb-anto" style="margin-top:12px">Antonym: ${esc(v.antonym)}</span>` : ''}</div>
                </div>
            </div>
            <div class="vb-fc-controls">
                <button type="button" class="c2-btn" data-vb-act="prev" ${st.pos === 0 ? 'disabled style="opacity:.45"' : ''}><i class="fas fa-arrow-left"></i></button>
                <button type="button" class="c2-btn" data-vb-speak="${v.i}"><i class="fas fa-volume-up"></i> Listen</button>
                <button type="button" class="c2-btn" data-vb-act="shuffle"><i class="fas fa-random"></i> Shuffle</button>
                <button type="button" class="c2-btn" data-vb-act="next"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="vb-fc-controls">
                <button type="button" class="c2-btn" data-vb-act="learn"><i class="fas fa-redo"></i> Still learning</button>
                <button type="button" class="c2-btn primary" data-vb-act="know"><i class="fas fa-check"></i> I know it</button>
            </div>
        </div>`;
}

function vocabWire(container, st) {
    container.addEventListener('input', (e) => {
        if (e.target.matches('[data-vb="search"]')) { st.q = e.target.value; vocabRefresh(container, st); }
    });
    container.addEventListener('change', (e) => {
        const t = e.target;
        if (t.matches('[data-vb="month"]')) st.month = t.value;
        else if (t.matches('[data-vb="sort"]')) st.sort = t.value;
        else if (t.matches('[data-vb="hide"]')) st.hide = t.checked;
        else if (t.matches('[data-vb="unknown"]')) st.unknown = t.checked;
        else return;
        vocabRefresh(container, st);
    });
    container.addEventListener('click', (e) => {
        const speak = e.target.closest('[data-vb-speak]');
        if (speak) { const v = st.items[+speak.dataset.vbSpeak]; if (v) vocabSpeak(v.word); return; }
        const kn = e.target.closest('[data-vb-known]');
        if (kn) {
            const v = st.items[+kn.dataset.vbKnown];
            if (v) { const key = vkey(v); st.known.has(key) ? st.known.delete(key) : st.known.add(key); saveKnown(st.known); vocabRefresh(container, st); }
            return;
        }
        const rev = e.target.closest('.vb-meaning.hidden-m');
        if (rev) { rev.classList.remove('hidden-m'); return; }
        const actEl = e.target.closest('[data-vb-act]');
        if (!actEl) return;
        const act = actEl.dataset.vbAct;
        const curItem = () => st.items[st.order[st.pos]];
        if (act === 'cards') { st.order = vocabVisible(st).map((v) => v.i); st.pos = 0; vocabCards(container, st); }
        else if (act === 'exit') { st.mode = 'list'; vocabShowMode(container, st); vocabRefresh(container, st); }
        else if (act === 'flip') { actEl.classList.toggle('flipped'); }
        else if (act === 'next') { st.pos = Math.min(st.pos + 1, st.order.length); vocabCards(container, st); }
        else if (act === 'prev') { st.pos = Math.max(0, st.pos - 1); vocabCards(container, st); }
        else if (act === 'restart') { st.pos = 0; vocabCards(container, st); }
        else if (act === 'shuffle') {
            for (let i = st.order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [st.order[i], st.order[j]] = [st.order[j], st.order[i]]; }
            st.pos = 0; vocabCards(container, st);
        }
        else if (act === 'know') { const v = curItem(); if (v) { st.known.add(vkey(v)); saveKnown(st.known); } st.pos++; vocabCards(container, st); }
        else if (act === 'learn') { const v = curItem(); if (v) { st.known.delete(vkey(v)); saveKnown(st.known); } st.pos++; vocabCards(container, st); }
        else if (act === 'csv') vocabCsv(st);
        else if (act === 'copy') vocabCopy(st, actEl);
    });
    st.keyHandler = (e) => {
        if (st.mode !== 'cards' || !container.isConnected || container.offsetParent === null) return;
        if (/input|select|textarea/i.test(e.target.tagName)) return;
        const click = (a) => container.querySelector(`[data-vb-act="${a}"]`)?.click();
        if (e.key === 'ArrowRight') click('next');
        else if (e.key === 'ArrowLeft') click('prev');
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); click('flip'); }
        else return;
    };
    document.addEventListener('keydown', st.keyHandler);
}

function vocabCsv(st) {
    const rows = [['Month', 'Week', 'Word', 'Meaning', 'Antonym', 'Known']].concat(
        vocabVisible(st).map((v) => [v.monthName, v.weekLabel, v.word, v.meaning, v.antonym || '', st.known.has(vkey(v)) ? 'yes' : 'no'])
    );
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'class-caddy-vocabulary.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function vocabCopy(st, btn) {
    const text = vocabVisible(st).map((v) => `${v.word}\t${v.meaning}`).join('\n');
    const done = () => { const old = btn.innerHTML; btn.innerHTML = '<i class="fas fa-check"></i> Copied'; setTimeout(() => { btn.innerHTML = old; }, 1400); };
    try { navigator.clipboard.writeText(text).then(done, () => {}); } catch (_) { /* clipboard unavailable */ }
}

/* ============================ RESULTS ============================ */

function pctClass(p) { return p >= 70 ? 'good' : (p >= 50 ? 'mid' : 'bad'); }

function sparkline(results) {
    const pts = results
        .map((r) => ({ t: r.saveTimestamp?.toDate ? r.saveTimestamp.toDate().getTime() : 0, p: Number(r.percentage) || 0 }))
        .sort((a, b) => a.t - b.t)
        .slice(-24);
    if (pts.length < 2) return `<div style="font-size:.8rem;color:var(--c2-muted);padding:8px 0">Take a couple more quizzes to see your trend.</div>`;
    const W = 200, H = 44, pad = 4;
    const x = (i) => pad + (i * (W - pad * 2)) / (pts.length - 1);
    const y = (p) => H - pad - (Math.max(0, Math.min(100, p)) / 100) * (H - pad * 2);
    const line = pts.map((pt, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(pt.p).toFixed(1)}`).join(' ');
    const area = `${line} L${x(pts.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
    const last = pts[pts.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <path d="${area}" style="fill:var(--c2-accent);opacity:.12"/>
        <path d="${line}" style="fill:none;stroke:var(--c2-accent);stroke-width:2;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round"/>
        <circle cx="${x(pts.length - 1).toFixed(1)}" cy="${y(last.p).toFixed(1)}" r="3.2" style="fill:var(--c2-accent)"/></svg>`;
}

export function buildResultsView(results, tableType, stats, helpers = {}) {
    const fmt = helpers.formatTime || ((s) => `${s}s`);
    if (!results.length) return emptyHtml('fa-clipboard-list', 'No results yet', 'Finish a quiz and your scores will show up here.');

    const pcts = results.map((r) => Number(r.percentage) || 0);
    const best = Math.max(...pcts);
    const pass = Math.round((pcts.filter((p) => p >= 50).length / pcts.length) * 100);
    const avg = Number(stats.overallPercentage) || 0;
    const chartType = tableType === 'by-day' ? 'all' : 'subject';

    const rows = results.map((res, index) => {
        const d = res.saveTimestamp?.toDate ? res.saveTimestamp.toDate() : null;
        const ts = d ? d.getTime() : 0;
        const dateLabel = d ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
        const topic = tableType === 'by-day' ? res.topicName : res.topicDetail;
        const pct = Number(res.percentage) || 0;
        const link = res.topicLink || '#';
        const linkType = res.topicLink?.startsWith('#day') ? 'day' : (res.topicLink ? 'modal' : 'none');
        return `
            <tr data-ts="${ts}" data-pct="${pct}" data-weak="${res.isWeakness ? 1 : 0}" data-time="${Number(res.timeTakenInSeconds) || 0}" data-hay="${esc(String(topic || '').toLowerCase())}">
                <td class="rs-sl num" data-label="#">${index + 1}</td>
                <td class="rs-date" data-label="Date">${esc(dateLabel)}</td>
                <td class="rs-topic" data-label="Topic"><a href="${esc(link)}" class="topic-link" data-link="${esc(link)}" data-link-type="${linkType}">${esc(topic || '—')}</a></td>
                <td class="ctr" data-label="Weak point">${res.isWeakness ? '<span class="rs-weak">Weak</span>' : '<span style="color:var(--c2-line-strong)">—</span>'}</td>
                <td class="num" data-label="Score">${Number(res.finalScore || 0).toFixed(2)} <span style="color:var(--c2-muted)">/ ${esc(res.totalQuestions)}</span></td>
                <td class="num" data-label="Time">${esc(fmt(res.timeTakenInSeconds))}</td>
                <td class="num" data-label="Percent"><span class="rs-pill ${pctClass(pct)}">${pct}%</span></td>
                <td class="num" data-label="Summary"><button type="button" class="c2-btn sm view-saved-result-btn" data-result-id="${esc(res.id)}"><i class="fas fa-eye"></i> View</button></td>
            </tr>`;
    }).join('');

    return `
        <div class="rs-view" data-rs-total="${results.length}">
            <div class="rs-kpis">
                <div class="c2-stat"><div class="c2-stat-ico"><i class="fas fa-clipboard-check"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${results.length}</div><div class="c2-stat-lbl">Quizzes</div></div></div>
                <div class="c2-stat"><div class="c2-stat-ico green"><i class="fas fa-bullseye"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${avg.toFixed(1)}%</div><div class="c2-stat-lbl">Average</div></div></div>
                <div class="c2-stat"><div class="c2-stat-ico amber"><i class="fas fa-trophy"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${best}%</div><div class="c2-stat-lbl">Best score</div></div></div>
                <div class="c2-stat"><div class="c2-stat-ico red"><i class="fas fa-circle-check"></i></div><div class="c2-stat-body"><div class="c2-stat-val">${pass}%</div><div class="c2-stat-lbl">Pass rate</div></div></div>
                <div class="c2-stat"><div class="c2-stat-ico"><i class="fas fa-stopwatch"></i></div><div class="c2-stat-body"><div class="c2-stat-val" style="font-size:1rem">${esc(fmt(stats.totalTime))}</div><div class="c2-stat-lbl">Total time</div></div></div>
                <div class="rs-spark"><div class="rs-spark-top"><span>Score trend</span><span>${Math.min(24, results.length)} latest</span></div>${sparkline(results)}</div>
            </div>
            <div class="c2-toolbar">
                <div class="c2-search"><i class="fas fa-search"></i><input type="search" data-rs="q" placeholder="Search exam topic…" autocomplete="off"></div>
                <select class="c2-select" data-rs="period"><option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>
                <select class="c2-select" data-rs="status"><option value="all">All results</option><option value="pass">Passed (50%+)</option><option value="fail">Below 50%</option><option value="weak">Weak points</option></select>
                <select class="c2-select" data-rs="sort"><option value="new">Newest first</option><option value="old">Oldest first</option><option value="high">Highest score</option><option value="low">Lowest score</option><option value="time">Longest time</option></select>
                <button type="button" class="c2-btn sm progress-chart-btn" data-chart-type="${chartType}"><i class="fas fa-chart-line"></i> Your Progress</button>
                <span class="rs-count" data-rs="count"></span>
            </div>
            <div class="rs-table-wrap">
                <table class="rs-table">
                    <thead><tr><th class="num">#</th><th>Date</th><th>Exam topic</th><th class="ctr">Weak</th><th class="num">Score</th><th class="num">Time</th><th class="num">Percent</th><th class="num">Summary</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="rs-none" hidden>${emptyHtml('fa-search', 'No results match your filters', 'Change the search, period or status.')}</div>
            </div>
        </div>`;
}

export function applyResultFilters(view) {
    const val = (k) => view.querySelector(`[data-rs="${k}"]`)?.value ?? '';
    const q = val('q').trim().toLowerCase();
    const period = val('period');
    const status = val('status');
    const sort = val('sort') || 'new';
    const tbody = view.querySelector('tbody');
    const rows = [...tbody.rows];
    const cutoff = period === 'all' ? 0 : Date.now() - Number(period) * 86400000;

    rows.forEach((r) => {
        const d = r.dataset;
        let show = true;
        if (q && !d.hay.includes(q)) show = false;
        if (cutoff && Number(d.ts) < cutoff) show = false;
        const p = Number(d.pct);
        if (status === 'pass' && p < 50) show = false;
        if (status === 'fail' && p >= 50) show = false;
        if (status === 'weak' && d.weak !== '1') show = false;
        r.hidden = !show;
    });
    const by = {
        new: (a, b) => b.dataset.ts - a.dataset.ts,
        old: (a, b) => a.dataset.ts - b.dataset.ts,
        high: (a, b) => b.dataset.pct - a.dataset.pct,
        low: (a, b) => a.dataset.pct - b.dataset.pct,
        time: (a, b) => b.dataset.time - a.dataset.time,
    }[sort];
    rows.sort(by).forEach((r) => tbody.appendChild(r));
    let n = 0;
    rows.forEach((r) => { if (!r.hidden) { n++; const c = r.querySelector('.rs-sl'); if (c) c.textContent = n; } });
    const total = rows.length;
    const cnt = view.querySelector('[data-rs="count"]');
    if (cnt) cnt.textContent = n === total ? `${total} result${total === 1 ? '' : 's'}` : `Showing ${n} of ${total}`;
    const none = view.querySelector('.rs-none');
    if (none) none.hidden = n !== 0;
    view.querySelector('.rs-table').style.display = n === 0 ? 'none' : '';
}

/** Call once per results container; filters apply to whichever .rs-view fired the event. */
export function initResultsInteractivity(root) {
    if (!root || root.__rsWired) return;
    root.__rsWired = true;
    const handler = (e) => {
        if (!e.target.closest('[data-rs]')) return;
        const view = e.target.closest('.rs-view');
        if (view) applyResultFilters(view);
    };
    root.addEventListener('input', handler);
    root.addEventListener('change', handler);
}

/** Initialise counts/sorting right after the HTML is inserted. */
export function primeResultViews(root) {
    root.querySelectorAll('.rs-view').forEach((v) => applyResultFilters(v));
}
