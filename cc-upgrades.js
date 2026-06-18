/**
 * ============================================================
 *  CLASS CADDY — FEATURE UPGRADES  (cc-upgrades.js)
 * ============================================================
 *  Drop this file into your project folder and add ONE line
 *  at the bottom of study_plan.html, before </body>:
 *
 *    <script type="module" src="cc-upgrades.js"></script>
 *
 *  Also add ONE line in <head> (after study-plan-styles.css):
 *
 *    <link rel="stylesheet" href="cc-upgrades.css">
 *
 *  Features implemented:
 *   1. Dark Mode toggle (persisted in localStorage)
 *   2. Daily Study Streak + Goal counter
 *   3. Browser Notification reminders (opt-in)
 *   4. Pomodoro Mode on top of the existing timer
 *   5. Task checkboxes with per-day mini progress bar
 *   6. Subject color coding (auto, 8 pastel colours)
 *   7. Quiz history mini-chart in Results modal
 *   8. PWA support (manifest + service worker registration)
 * ============================================================
 */

/* ──────────────────────────────────────────────────────────
   0.  WAIT FOR DOM  ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

/* ──────────────────────────────────────────────────────────
   1.  DARK MODE  ─────────────────────────────────────────── */
(function initDarkMode() {
  const KEY = 'cc_dark_mode';

  // Create toggle button and inject into the header user-info bar
  const btn = document.createElement('button');
  btn.id = 'cc-dark-toggle';
  btn.title = 'Toggle Dark Mode';
  btn.innerHTML = '<i class="fas fa-moon"></i>';
  btn.style.cssText = `
    background: none; border: 1px solid #d1d5db; border-radius: 50%;
    width: 32px; height: 32px; cursor: pointer; color: #6b7280;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; transition: all .2s; flex-shrink: 0;
  `;

  // Place it in the user-info bar (next to logout)
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn && logoutBtn.parentElement) {
    logoutBtn.parentElement.insertBefore(btn, logoutBtn);
  } else {
    // Fallback: floating button
    btn.style.position = 'fixed';
    btn.style.bottom = '80px';
    btn.style.right = '16px';
    btn.style.zIndex = '9999';
    btn.style.background = '#fff';
    document.body.appendChild(btn);
  }

  function applyDark(on) {
    document.documentElement.classList.toggle('cc-dark', on);
    btn.innerHTML = on ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    btn.style.color = on ? '#fbbf24' : '#6b7280';
    localStorage.setItem(KEY, on ? '1' : '0');
  }

  btn.addEventListener('click', () => {
    applyDark(!document.documentElement.classList.contains('cc-dark'));
  });

  // Restore preference
  const saved = localStorage.getItem(KEY);
  if (saved === '1') applyDark(true);
  else if (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches) applyDark(true);
})();


/* ──────────────────────────────────────────────────────────
   2.  DAILY STREAK + GOAL COUNTER  ──────────────────────── */
(function initStreak() {
  const STREAK_KEY = 'cc_streak';
  const LAST_KEY   = 'cc_last_study_date';
  const GOAL_KEY   = 'cc_daily_goal';   // minutes
  const TODAY_KEY  = 'cc_today_mins';

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function getStreak() { return parseInt(localStorage.getItem(STREAK_KEY) || '0'); }
  function getGoal()   { return parseInt(localStorage.getItem(GOAL_KEY)   || '60'); }
  function getTodayMins() { return parseInt(localStorage.getItem(TODAY_KEY) || '0'); }

  // Called whenever a timer session ends — pass minutes studied
  window.ccRecordStudyMinutes = function(mins) {
    const today = todayStr();
    const last  = localStorage.getItem(LAST_KEY);
    let streak  = getStreak();

    if (last === today) {
      // Same day — accumulate
    } else {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
      streak = (last === yStr) ? streak + 1 : 1;
      localStorage.setItem(STREAK_KEY, streak);
      localStorage.setItem(LAST_KEY, today);
      localStorage.setItem(TODAY_KEY, '0'); // reset
    }

    const prev = getTodayMins();
    const newTotal = prev + Math.round(mins);
    localStorage.setItem(TODAY_KEY, newTotal);
    renderStreak();

    if (prev < getGoal() && newTotal >= getGoal()) {
      showStreakCelebration(streak);
    }
  };

  function renderStreak() {
    const streak = getStreak();
    const goal   = getGoal();
    const done   = getTodayMins();
    const pct    = Math.min(100, Math.round((done / goal) * 100));

    let widget = document.getElementById('cc-streak-widget');
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'cc-streak-widget';
      // Insert after auth-section
      const authSection = document.getElementById('auth-section');
      if (authSection && authSection.nextSibling) {
        authSection.parentNode.insertBefore(widget, authSection.nextSibling);
      } else if (authSection) {
        authSection.parentNode.appendChild(widget);
      } else {
        document.body.prepend(widget);
      }
    }

    widget.innerHTML = `
      <div class="cc-streak-bar">
        <div class="cc-streak-item" title="Study streak">
          <span class="cc-streak-icon">🔥</span>
          <strong>${streak}</strong>
          <span class="cc-streak-label">${streak === 1 ? 'day' : 'days'} streak</span>
        </div>
        <div class="cc-streak-divider"></div>
        <div class="cc-streak-item cc-goal-area">
          <span class="cc-streak-label">Today:</span>
          <div class="cc-goal-bar-wrap" title="${done}/${goal} min">
            <div class="cc-goal-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="cc-streak-label">${done}/${goal} min</span>
          <button class="cc-goal-edit-btn" id="cc-goal-edit-btn" title="Set daily goal">
            <i class="fas fa-pencil-alt"></i>
          </button>
        </div>
      </div>
    `;

    document.getElementById('cc-goal-edit-btn')?.addEventListener('click', () => {
      const val = prompt('Set your daily study goal (minutes):', goal);
      if (val && !isNaN(parseInt(val))) {
        localStorage.setItem(GOAL_KEY, parseInt(val));
        renderStreak();
      }
    });
  }

  function showStreakCelebration(streak) {
    const toast = document.createElement('div');
    toast.className = 'cc-celebration-toast';
    toast.innerHTML = `🎉 Daily goal reached! ${streak > 1 ? `${streak}-day streak!` : 'Great start!'} 🎉`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Wire into existing timer stop events
  // We monkey-patch the stopTimer / session end to record minutes
  const _origClearInterval = clearInterval;
  let _timerStartMs = null;

  // Hook: intercept when the fullscreen / mini timer STOPS
  // We detect this by observing button clicks on stop/reset buttons
  function hookTimerButtons() {
    const ids = ['fullscreen-timer-startpause-btn', 'mini-timer-startpause-btn',
                 'fullscreen-timer-reset-btn', 'mini-timer-reset-btn'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el || el.dataset.ccHooked) return;
      el.dataset.ccHooked = '1';
      el.addEventListener('click', () => {
        // If pausing/resetting and a start time was recorded, log it
        if (_timerStartMs) {
          const mins = (Date.now() - _timerStartMs) / 60000;
          if (mins >= 0.5) window.ccRecordStudyMinutes(mins);
          _timerStartMs = null;
        } else {
          // Starting: record start time
          _timerStartMs = Date.now();
        }
      });
    });
  }

  // Try immediately and again after short delay (in case timer modals render late)
  hookTimerButtons();
  setTimeout(hookTimerButtons, 2000);
  setTimeout(hookTimerButtons, 5000);

  // Render streak on load
  renderStreak();
  // Also check if today is a new day since last visit → keep streak accurate
  const last = localStorage.getItem(LAST_KEY);
  if (last) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
    if (last !== todayStr() && last !== yStr) {
      // Streak broken
      localStorage.setItem(STREAK_KEY, '0');
      renderStreak();
    }
  }
})();


/* ──────────────────────────────────────────────────────────
   3.  BROWSER NOTIFICATION REMINDERS  ────────────────────── */
(function initNotifications() {
  const NOTIF_KEY  = 'cc_notif_time'; // e.g. "20:00"
  const NOTIF_ON   = 'cc_notif_on';

  function scheduleCheck() {
    if (!localStorage.getItem(NOTIF_ON)) return;
    const targetTime = localStorage.getItem(NOTIF_KEY) || '20:00';
    const [h, m] = targetTime.split(':').map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const ms = target - now;
    setTimeout(() => {
      if (Notification.permission === 'granted' && localStorage.getItem(NOTIF_ON)) {
        new Notification('📚 Class Caddy', {
          body: "Time to study! Open your plan and keep that streak alive. 🔥",
          icon: 'images/cc-icon-full.png'
        });
      }
      scheduleCheck(); // reschedule for next day
    }, ms);
  }

  function createNotifWidget() {
    let existing = document.getElementById('cc-notif-widget');
    if (existing) return;

    const widget = document.createElement('div');
    widget.id = 'cc-notif-widget';
    const isOn = !!localStorage.getItem(NOTIF_ON);
    const time  = localStorage.getItem(NOTIF_KEY) || '20:00';

    widget.innerHTML = `
      <div class="cc-notif-bar">
        <span class="cc-notif-icon"><i class="fas fa-bell"></i></span>
        <span class="cc-notif-label">Study Reminder</span>
        <input type="time" id="cc-notif-time" value="${time}" class="cc-notif-time-input">
        <label class="cc-toggle-switch">
          <input type="checkbox" id="cc-notif-toggle" ${isOn ? 'checked' : ''}>
          <span class="cc-toggle-slider"></span>
        </label>
      </div>
    `;

    // Insert after streak widget if it exists
    const streakWidget = document.getElementById('cc-streak-widget');
    if (streakWidget && streakWidget.nextSibling) {
      streakWidget.parentNode.insertBefore(widget, streakWidget.nextSibling);
    } else if (streakWidget) {
      streakWidget.parentNode.appendChild(widget);
    }

    document.getElementById('cc-notif-toggle').addEventListener('change', async (e) => {
      if (e.target.checked) {
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            e.target.checked = false;
            alert('Please allow notifications in your browser settings.');
            return;
          }
        } else if (Notification.permission === 'denied') {
          e.target.checked = false;
          alert('Notifications are blocked. Please enable them in browser settings.');
          return;
        }
        const t = document.getElementById('cc-notif-time').value;
        localStorage.setItem(NOTIF_ON, '1');
        localStorage.setItem(NOTIF_KEY, t);
        scheduleCheck();
        new Notification('📚 Class Caddy', { body: `Reminder set for ${t} daily!`, icon: 'images/cc-icon-full.png' });
      } else {
        localStorage.removeItem(NOTIF_ON);
      }
    });

    document.getElementById('cc-notif-time').addEventListener('change', (e) => {
      localStorage.setItem(NOTIF_KEY, e.target.value);
    });
  }

  // Only create if Notification API is supported
  if ('Notification' in window) {
    // Wait for user info to be visible (logged in)
    const observer = new MutationObserver(() => {
      const userInfo = document.getElementById('user-info');
      if (userInfo && !userInfo.classList.contains('hidden')) {
        createNotifWidget();
        scheduleCheck();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    // Also try immediately
    const userInfo = document.getElementById('user-info');
    if (userInfo && !userInfo.classList.contains('hidden')) {
      createNotifWidget();
      scheduleCheck();
    }
  }
})();


/* ──────────────────────────────────────────────────────────
   4.  POMODORO MODE  ─────────────────────────────────────── */
(function initPomodoro() {
  // Inject Pomodoro panel HTML
  const panel = document.createElement('div');
  panel.id = 'cc-pomodoro-panel';
  panel.className = 'cc-pomodoro-panel hidden';
  panel.innerHTML = `
    <div class="cc-pomo-header">
      <span>🍅 Pomodoro</span>
      <button id="cc-pomo-close" class="cc-pomo-close-btn"><i class="fas fa-times"></i></button>
    </div>
    <div class="cc-pomo-display" id="cc-pomo-display">25:00</div>
    <div class="cc-pomo-phase" id="cc-pomo-phase">Focus</div>
    <div class="cc-pomo-controls">
      <button id="cc-pomo-start" class="cc-pomo-btn cc-pomo-start-btn">
        <i class="fas fa-play"></i> Start
      </button>
      <button id="cc-pomo-reset" class="cc-pomo-btn cc-pomo-reset-btn">
        <i class="fas fa-undo"></i>
      </button>
    </div>
    <div class="cc-pomo-settings">
      <label>Focus <input type="number" id="cc-pomo-work" value="25" min="1" max="90" style="width:45px">m</label>
      <label>Break <input type="number" id="cc-pomo-break" value="5" min="1" max="30" style="width:40px">m</label>
    </div>
    <div class="cc-pomo-cycles" id="cc-pomo-cycles">🍅</div>
  `;
  document.body.appendChild(panel);

  // Inject launcher button (floating)
  const launchBtn = document.createElement('button');
  launchBtn.id = 'cc-pomo-launcher';
  launchBtn.innerHTML = '🍅';
  launchBtn.title = 'Open Pomodoro Timer';
  launchBtn.style.cssText = `
    position: fixed; bottom: 72px; right: 16px; z-index: 9990;
    width: 44px; height: 44px; border-radius: 50%; border: none;
    background: #ef4444; color: #fff; font-size: 20px;
    cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.25);
    display: flex; align-items: center; justify-content: center;
    transition: transform .15s;
  `;
  launchBtn.addEventListener('mouseenter', () => launchBtn.style.transform = 'scale(1.1)');
  launchBtn.addEventListener('mouseleave', () => launchBtn.style.transform = 'scale(1)');
  document.body.appendChild(launchBtn);

  // State
  let pomoWork  = 25, pomoBreak = 5;
  let pomoCycles = 0, pomoPhase = 'focus'; // 'focus' | 'break'
  let pomoSecs  = pomoWork * 60;
  let pomoInterval = null;
  let pomoRunning  = false;
  let pomoStartTs  = null;

  const display   = document.getElementById('cc-pomo-display');
  const phaseEl   = document.getElementById('cc-pomo-phase');
  const cyclesEl  = document.getElementById('cc-pomo-cycles');
  const startBtn  = document.getElementById('cc-pomo-start');
  const resetBtn  = document.getElementById('cc-pomo-reset');
  const workInput  = document.getElementById('cc-pomo-work');
  const breakInput = document.getElementById('cc-pomo-break');

  function fmt(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

  function renderDisplay() {
    display.textContent = fmt(pomoSecs);
    // Pulse red when < 10s
    display.style.color = (pomoSecs < 10 && pomoRunning) ? '#ef4444' : '';
  }

  function tick() {
    if (pomoSecs > 0) {
      pomoSecs--;
      renderDisplay();
    } else {
      clearInterval(pomoInterval);
      pomoRunning = false;
      startBtn.innerHTML = '<i class="fas fa-play"></i> Start';

      // Record study time if focus phase ended
      if (pomoPhase === 'focus') {
        const mins = parseInt(workInput.value) || 25;
        if (typeof window.ccRecordStudyMinutes === 'function') window.ccRecordStudyMinutes(mins);
        pomoCycles++;
        cyclesEl.textContent = '🍅'.repeat(pomoCycles);
        pomoPhase = 'break';
        pomoSecs  = (parseInt(breakInput.value) || 5) * 60;
        phaseEl.textContent = '☕ Break Time';
        phaseEl.style.color = '#059669';
      } else {
        pomoPhase = 'focus';
        pomoSecs  = (parseInt(workInput.value) || 25) * 60;
        phaseEl.textContent = 'Focus';
        phaseEl.style.color = '';
      }

      // Play a simple beep via AudioContext
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = pomoPhase === 'break' ? 660 : 440;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1);
      } catch(e) {}

      renderDisplay();
    }
  }

  startBtn.addEventListener('click', () => {
    if (pomoRunning) {
      clearInterval(pomoInterval);
      pomoRunning = false;
      startBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
    } else {
      pomoInterval = setInterval(tick, 1000);
      pomoRunning  = true;
      startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
      if (!pomoStartTs) pomoStartTs = Date.now();
    }
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(pomoInterval);
    pomoRunning   = false;
    pomoPhase     = 'focus';
    pomoSecs      = (parseInt(workInput.value) || 25) * 60;
    pomoStartTs   = null;
    phaseEl.textContent = 'Focus';
    phaseEl.style.color = '';
    startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    renderDisplay();
  });

  workInput.addEventListener('change',  () => { if (!pomoRunning) { pomoSecs = (parseInt(workInput.value)||25)*60; renderDisplay(); } });
  breakInput.addEventListener('change', () => {});

  launchBtn.addEventListener('click', () => {
    panel.classList.toggle('hidden');
  });
  document.getElementById('cc-pomo-close').addEventListener('click', () => {
    panel.classList.add('hidden');
  });

  renderDisplay();
})();


/* ──────────────────────────────────────────────────────────
   5.  TASK CHECKBOXES + PER-DAY PROGRESS BAR  ─────────────
   We observe the DOM for day sections and inject a mini
   progress bar above each table that shows completed/total. */
(function initTaskProgress() {
  function updateDayProgress(daySection) {
    const rows = daySection.querySelectorAll('tbody tr');
    if (!rows.length) return;

    let completed = 0;
    rows.forEach(tr => {
      // Detect if the row's "Done" status — look for the done badge
      const doneBadge = tr.querySelector('.done-badge, [data-completed="true"]');
      // Also check the completion-percentage circle if it's 100
      const circle = tr.querySelector('.completion-circle');
      const pct = circle ? parseInt(circle.dataset.pct || '0') : 0;
      if (doneBadge || pct === 100) completed++;
    });

    const total = rows.length;
    const pct   = total > 0 ? Math.round((completed / total) * 100) : 0;

    let bar = daySection.querySelector('.cc-day-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'cc-day-progress';
      const table = daySection.querySelector('table, .table-responsive');
      if (table) daySection.insertBefore(bar, table);
      else daySection.prepend(bar);
    }

    bar.innerHTML = `
      <div class="cc-day-progress-label">
        <span>${completed}/${total} tasks</span>
        <span>${pct}%</span>
      </div>
      <div class="cc-day-progress-track">
        <div class="cc-day-progress-fill" style="width:${pct}%"></div>
      </div>
    `;
  }

  function scanDays() {
    document.querySelectorAll('.day-section').forEach(updateDayProgress);
  }

  // Observe for new day sections being added
  const obs = new MutationObserver(scanDays);
  obs.observe(document.body, { childList: true, subtree: true });

  // Initial scan
  setTimeout(scanDays, 1000);
})();


/* ──────────────────────────────────────────────────────────
   6.  SUBJECT COLOR CODING  ──────────────────────────────── */
(function initSubjectColors() {
  const PALETTE = [
    { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }, // blue
    { bg: '#fdf4ff', border: '#a855f7', text: '#6b21a8' }, // purple
    { bg: '#fff7ed', border: '#f97316', text: '#9a3412' }, // orange
    { bg: '#fefce8', border: '#eab308', text: '#854d0e' }, // yellow
    { bg: '#f0fdf4', border: '#22c55e', text: '#14532d' }, // green
    { bg: '#fff1f2', border: '#f43f5e', text: '#881337' }, // rose
    { bg: '#f0f9ff', border: '#0ea5e9', text: '#0c4a6e' }, // sky
    { bg: '#fafafa', border: '#6b7280', text: '#111827' }, // gray
  ];

  const subjectColorMap = {};
  let colorIndex = 0;

  function getColor(subject) {
    const key = (subject || '').toLowerCase().trim();
    if (!key || key === 'vocabulary') return null;
    if (!subjectColorMap[key]) {
      subjectColorMap[key] = PALETTE[colorIndex % PALETTE.length];
      colorIndex++;
    }
    return subjectColorMap[key];
  }

  function colorizeRows() {
    document.querySelectorAll('tbody tr').forEach(tr => {
      if (tr.dataset.ccColored) return;
      // Find subject cell (first td or td with subject class)
      const subjectCell = tr.querySelector('td[data-subject], td:first-child');
      if (!subjectCell) return;
      const subject = (subjectCell.dataset.subject || subjectCell.textContent || '').trim();
      if (!subject) return;

      const color = getColor(subject);
      if (!color) return;

      tr.style.borderLeft = `3px solid ${color.border}`;
      subjectCell.style.color = color.text;
      subjectCell.style.fontWeight = '600';
      tr.dataset.ccColored = '1';
    });

    // Also color the subject input cell in edit mode
    document.querySelectorAll('.subject-input, input[name="subject"], td.subject-cell').forEach(el => {
      const val = el.value || el.textContent || '';
      const color = getColor(val);
      if (color && el.tagName === 'INPUT') {
        el.style.borderLeft = `3px solid ${color.border}`;
        el.style.color = color.text;
      }
    });
  }

  // Legend chip for each unique subject
  function renderLegend() {
    if (Object.keys(subjectColorMap).length === 0) return;
    let legend = document.getElementById('cc-subject-legend');
    if (!legend) {
      legend = document.createElement('div');
      legend.id = 'cc-subject-legend';
      legend.className = 'cc-subject-legend';
      const display = document.getElementById('current-month-plan-display');
      if (display) display.prepend(legend);
    }
    legend.innerHTML = '<span class="cc-legend-label">Subjects: </span>' +
      Object.entries(subjectColorMap).map(([sub, color]) =>
        `<span class="cc-legend-chip" style="background:${color.bg};border-color:${color.border};color:${color.text}">${sub}</span>`
      ).join('');
  }

  const obs = new MutationObserver(() => { colorizeRows(); renderLegend(); });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => { colorizeRows(); renderLegend(); }, 1500);
})();


/* ──────────────────────────────────────────────────────────
   7.  QUIZ HISTORY MINI-CHART in Results Modal  ───────────
   Injects a sparkline chart above the By-Day results list */
(function initQuizHistoryChart() {
  function buildChart() {
    const container = document.getElementById('by-day-results-list');
    if (!container || document.getElementById('cc-quiz-history-chart')) return;

    // Collect score data from rendered result rows
    const rows = container.querySelectorAll('tr[data-score], .result-row, tbody tr');
    if (rows.length < 2) return;

    const labels = [];
    const scores = [];

    rows.forEach(row => {
      // Try to extract date and percentage from cells
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        labels.push(cells[0]?.textContent?.trim()?.substring(0,10) || '');
        const scoreText = cells[2]?.textContent || cells[1]?.textContent || '';
        const match = scoreText.match(/(\d+\.?\d*)\s*%/);
        if (match) scores.push(parseFloat(match[1]));
        else {
          const numMatch = scoreText.match(/(\d+\.?\d*)/);
          scores.push(numMatch ? parseFloat(numMatch[1]) : null);
        }
      }
    });

    if (scores.filter(Boolean).length < 2) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'cc-quiz-history-chart';
    wrapper.className = 'cc-quiz-chart-wrapper';
    wrapper.innerHTML = '<canvas id="cc-quiz-spark" height="100"></canvas>';
    container.prepend(wrapper);

    const ctx = document.getElementById('cc-quiz-spark').getContext('2d');
    if (window.Chart) {
      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: labels.slice(0,20),
          datasets: [{
            label: 'Score %',
            data: scores.slice(0,20),
            borderColor: '#059669',
            backgroundColor: 'rgba(5,150,105,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#059669',
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => v+'%' } },
            x: { display: false }
          }
        }
      });
    }
  }

  // Watch for the results modal to open
  const obs = new MutationObserver(() => {
    const modal = document.getElementById('result-sheet-modal');
    if (modal && modal.style.display !== 'none' && modal.style.display !== '') {
      setTimeout(buildChart, 500);
    }
  });
  obs.observe(document.body, { attributes: true, subtree: true });
})();


/* ──────────────────────────────────────────────────────────
   8.  PWA SUPPORT  ────────────────────────────────────────
   Injects a manifest link and registers the service worker */
(function initPWA() {
  // 8a. Inject web app manifest link if not present
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifestData = {
      name: 'Class Caddy',
      short_name: 'ClassCaddy',
      description: 'Your personal academic study planner',
      start_url: '/study_plan.html',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#059669',
      icons: [
        { src: 'images/cc-icon-full.png', sizes: '192x192', type: 'image/png' },
        { src: 'images/cc-icon-full.png', sizes: '512x512', type: 'image/png' }
      ]
    };

    const blob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('link');
    link.rel = 'manifest'; link.href = url;
    document.head.appendChild(link);
  }

  // 8b. Add meta theme-color
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color'; meta.content = '#059669';
    document.head.appendChild(meta);
  }

  // 8c. Add apple-mobile-web-app meta
  ['apple-mobile-web-app-capable', 'mobile-web-app-capable'].forEach(name => {
    if (!document.querySelector(`meta[name="${name}"]`)) {
      const m = document.createElement('meta');
      m.name = name; m.content = 'yes';
      document.head.appendChild(m);
    }
  });

  // 8d. Register service worker (sw.js must exist — see cc-sw.js output)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('cc-sw.js').then(reg => {
      console.log('[CC PWA] Service worker registered:', reg.scope);
    }).catch(err => {
      // SW file may not exist yet — silent fail
      console.log('[CC PWA] SW registration skipped (file may not exist):', err.message);
    });
  }

  // 8e. Install prompt — show a subtle banner
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const banner = document.createElement('div');
    banner.id = 'cc-install-banner';
    banner.className = 'cc-install-banner';
    banner.innerHTML = `
      <span>📱 Add Class Caddy to your home screen for offline access!</span>
      <button id="cc-install-btn" class="cc-install-btn">Install</button>
      <button id="cc-install-dismiss" class="cc-install-dismiss"><i class="fas fa-times"></i></button>
    `;
    document.body.appendChild(banner);

    document.getElementById('cc-install-btn').addEventListener('click', async () => {
      banner.remove();
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    });

    document.getElementById('cc-install-dismiss').addEventListener('click', () => banner.remove());
  });
})();


/* ──────────────────────────────────────────────────────────
   END OF FEATURE MODULE  ─────────────────────────────────── */
}); // end DOMContentLoaded
