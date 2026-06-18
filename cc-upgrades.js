/**
 * ============================================================
 *  CLASS CADDY — FEATURE UPGRADES  (cc-upgrades.js)
 * ============================================================
 */

// Since this script loads after window.load, DOMContentLoaded
// has already fired — run everything immediately.
(function() {

/* ──────────────────────────────────────────────────────────
   1.  DARK MODE
────────────────────────────────────────────────────────── */
(function initDarkMode() {
  const KEY = 'cc_dark_mode';

  const btn = document.createElement('button');
  btn.id = 'cc-dark-toggle';
  btn.title = 'Toggle Dark Mode';
  btn.innerHTML = '<i class="fas fa-moon"></i>';
  btn.style.cssText = [
    'background:none', 'border:1px solid #d1d5db', 'border-radius:50%',
    'width:32px', 'height:32px', 'cursor:pointer', 'color:#6b7280',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font-size:14px', 'transition:all .2s', 'flex-shrink:0'
  ].join(';');

  // Try to place it next to the logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn && logoutBtn.parentElement) {
    logoutBtn.parentElement.insertBefore(btn, logoutBtn);
  } else {
    // Fallback: fixed floating button (always visible)
    btn.style.cssText += ';position:fixed;bottom:130px;right:16px;z-index:9999;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2)';
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

  const saved = localStorage.getItem(KEY);
  if (saved === '1') applyDark(true);
  else if (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches) applyDark(true);

  // Re-check placement after auth state changes (login shows user-info bar)
  const observer = new MutationObserver(() => {
    if (document.getElementById('cc-dark-toggle')) return; // already placed
    const lb = document.getElementById('logout-btn');
    if (lb && lb.parentElement && !document.getElementById('cc-dark-toggle')) {
      lb.parentElement.insertBefore(btn, lb);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();


/* ──────────────────────────────────────────────────────────
   2.  DAILY STREAK + GOAL COUNTER
────────────────────────────────────────────────────────── */
(function initStreak() {
  const STREAK_KEY = 'cc_streak';
  const LAST_KEY   = 'cc_last_study_date';
  const GOAL_KEY   = 'cc_daily_goal';
  const TODAY_KEY  = 'cc_today_mins';

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth()+1).padStart(2,'0') + '-' +
      String(d.getDate()).padStart(2,'0');
  }

  function getStreak()    { return parseInt(localStorage.getItem(STREAK_KEY) || '0'); }
  function getGoal()      { return parseInt(localStorage.getItem(GOAL_KEY)   || '60'); }
  function getTodayMins() { return parseInt(localStorage.getItem(TODAY_KEY)  || '0'); }

  window.ccRecordStudyMinutes = function(mins) {
    const today = todayStr();
    const last  = localStorage.getItem(LAST_KEY);
    let streak  = getStreak();
    if (last !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.getFullYear() + '-' +
        String(yesterday.getMonth()+1).padStart(2,'0') + '-' +
        String(yesterday.getDate()).padStart(2,'0');
      streak = (last === yStr) ? streak + 1 : 1;
      localStorage.setItem(STREAK_KEY, streak);
      localStorage.setItem(LAST_KEY, today);
      localStorage.setItem(TODAY_KEY, '0');
    }
    const prev = getTodayMins();
    const newTotal = prev + Math.round(mins);
    localStorage.setItem(TODAY_KEY, newTotal);
    renderStreak();
    if (prev < getGoal() && newTotal >= getGoal()) showStreakCelebration(streak);
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
      const authSection = document.getElementById('auth-section');
      if (authSection && authSection.nextSibling) {
        authSection.parentNode.insertBefore(widget, authSection.nextSibling);
      } else if (authSection) {
        authSection.parentNode.appendChild(widget);
      } else {
        document.body.prepend(widget);
      }
    }

    widget.innerHTML =
      '<div class="cc-streak-bar">' +
        '<div class="cc-streak-item" title="Study streak">' +
          '<span class="cc-streak-icon">🔥</span>' +
          '<strong>' + streak + '</strong>' +
          '<span class="cc-streak-label">' + (streak === 1 ? 'day' : 'days') + ' streak</span>' +
        '</div>' +
        '<div class="cc-streak-divider"></div>' +
        '<div class="cc-streak-item cc-goal-area">' +
          '<span class="cc-streak-label">Today:</span>' +
          '<div class="cc-goal-bar-wrap" title="' + done + '/' + goal + ' min">' +
            '<div class="cc-goal-bar-fill" style="width:' + pct + '%"></div>' +
          '</div>' +
          '<span class="cc-streak-label">' + done + '/' + goal + ' min</span>' +
          '<button class="cc-goal-edit-btn" id="cc-goal-edit-btn" title="Set daily goal">' +
            '<i class="fas fa-pencil-alt"></i>' +
          '</button>' +
        '</div>' +
      '</div>';

    const editBtn = document.getElementById('cc-goal-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', function() {
        const val = prompt('Set your daily study goal (minutes):', goal);
        if (val && !isNaN(parseInt(val))) {
          localStorage.setItem(GOAL_KEY, parseInt(val));
          renderStreak();
        }
      });
    }
  }

  function showStreakCelebration(streak) {
    const toast = document.createElement('div');
    toast.className = 'cc-celebration-toast';
    toast.textContent = '🎉 Daily goal reached! ' + (streak > 1 ? streak + '-day streak!' : 'Great start!') + ' 🎉';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
  }

  // Hook timer buttons to record study time
  function hookTimerButtons() {
    var ids = ['fullscreen-timer-startpause-btn','mini-timer-startpause-btn',
               'fullscreen-timer-reset-btn','mini-timer-reset-btn'];
    var startTs = null;
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el || el.dataset.ccHooked) return;
      el.dataset.ccHooked = '1';
      el.addEventListener('click', function() {
        if (startTs) {
          var mins = (Date.now() - startTs) / 60000;
          if (mins >= 0.5) window.ccRecordStudyMinutes(mins);
          startTs = null;
        } else {
          startTs = Date.now();
        }
      });
    });
  }

  hookTimerButtons();
  setTimeout(hookTimerButtons, 2000);
  setTimeout(hookTimerButtons, 5000);

  // Check for broken streak on page load
  const last = localStorage.getItem(LAST_KEY);
  if (last) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.getFullYear() + '-' +
      String(yesterday.getMonth()+1).padStart(2,'0') + '-' +
      String(yesterday.getDate()).padStart(2,'0');
    if (last !== todayStr() && last !== yStr) {
      localStorage.setItem(STREAK_KEY, '0');
    }
  }

  renderStreak();
})();


/* ──────────────────────────────────────────────────────────
   3.  BROWSER NOTIFICATION REMINDERS
────────────────────────────────────────────────────────── */
(function initNotifications() {
  if (!('Notification' in window)) return;

  const NOTIF_KEY = 'cc_notif_time';
  const NOTIF_ON  = 'cc_notif_on';
  var notifTimeout = null;

  function scheduleCheck() {
    if (!localStorage.getItem(NOTIF_ON)) return;
    clearTimeout(notifTimeout);
    var targetTime = localStorage.getItem(NOTIF_KEY) || '20:00';
    var parts = targetTime.split(':');
    var h = parseInt(parts[0]), m = parseInt(parts[1]);
    var now = new Date();
    var target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    var ms = target - now;
    notifTimeout = setTimeout(function() {
      if (Notification.permission === 'granted' && localStorage.getItem(NOTIF_ON)) {
        new Notification('📚 Class Caddy', {
          body: 'Time to study! Keep that streak alive. 🔥',
          icon: 'images/cc-icon-full.png'
        });
      }
      scheduleCheck();
    }, ms);
  }

  function createNotifWidget() {
    if (document.getElementById('cc-notif-widget')) return;
    var isOn = !!localStorage.getItem(NOTIF_ON);
    var time = localStorage.getItem(NOTIF_KEY) || '20:00';
    var widget = document.createElement('div');
    widget.id = 'cc-notif-widget';
    widget.innerHTML =
      '<div class="cc-notif-bar">' +
        '<span class="cc-notif-icon"><i class="fas fa-bell"></i></span>' +
        '<span class="cc-notif-label">Study Reminder</span>' +
        '<input type="time" id="cc-notif-time" value="' + time + '" class="cc-notif-time-input">' +
        '<label class="cc-toggle-switch">' +
          '<input type="checkbox" id="cc-notif-toggle"' + (isOn ? ' checked' : '') + '>' +
          '<span class="cc-toggle-slider"></span>' +
        '</label>' +
      '</div>';

    var streakWidget = document.getElementById('cc-streak-widget');
    if (streakWidget && streakWidget.nextSibling) {
      streakWidget.parentNode.insertBefore(widget, streakWidget.nextSibling);
    } else if (streakWidget) {
      streakWidget.parentNode.appendChild(widget);
    }

    document.getElementById('cc-notif-toggle').addEventListener('change', function(e) {
      if (e.target.checked) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().then(function(perm) {
            if (perm !== 'granted') {
              e.target.checked = false;
              alert('Please allow notifications in your browser settings.');
              return;
            }
            var t = document.getElementById('cc-notif-time').value;
            localStorage.setItem(NOTIF_ON, '1');
            localStorage.setItem(NOTIF_KEY, t);
            scheduleCheck();
            new Notification('📚 Class Caddy', { body: 'Reminder set for ' + t + ' daily!', icon: 'images/cc-icon-full.png' });
          });
        } else if (Notification.permission === 'denied') {
          e.target.checked = false;
          alert('Notifications are blocked. Please enable them in browser settings.');
        } else {
          var t = document.getElementById('cc-notif-time').value;
          localStorage.setItem(NOTIF_ON, '1');
          localStorage.setItem(NOTIF_KEY, t);
          scheduleCheck();
        }
      } else {
        localStorage.removeItem(NOTIF_ON);
        clearTimeout(notifTimeout);
      }
    });

    document.getElementById('cc-notif-time').addEventListener('change', function(e) {
      localStorage.setItem(NOTIF_KEY, e.target.value);
    });
  }

  // Wait for login before showing the notification widget
  var notifObserver = new MutationObserver(function() {
    var userInfo = document.getElementById('user-info');
    if (userInfo && !userInfo.classList.contains('hidden')) {
      createNotifWidget();
      scheduleCheck();
    }
  });
  notifObserver.observe(document.body, { childList: true, subtree: true, attributes: true });

  // Try immediately in case already logged in
  var userInfo = document.getElementById('user-info');
  if (userInfo && !userInfo.classList.contains('hidden')) {
    createNotifWidget();
    scheduleCheck();
  }
})();


/* ──────────────────────────────────────────────────────────
   4.  POMODORO TIMER
────────────────────────────────────────────────────────── */
(function initPomodoro() {
  // Floating launcher button
  var launchBtn = document.createElement('button');
  launchBtn.id = 'cc-pomo-launcher';
  launchBtn.innerHTML = '🍅';
  launchBtn.title = 'Open Pomodoro Timer';
  launchBtn.style.cssText = [
    'position:fixed', 'bottom:72px', 'right:16px', 'z-index:9990',
    'width:44px', 'height:44px', 'border-radius:50%', 'border:none',
    'background:#ef4444', 'color:#fff', 'font-size:20px',
    'cursor:pointer', 'box-shadow:0 2px 8px rgba(0,0,0,.25)',
    'display:flex', 'align-items:center', 'justify-content:center'
  ].join(';');
  document.body.appendChild(launchBtn);

  // Panel
  var panel = document.createElement('div');
  panel.id = 'cc-pomodoro-panel';
  panel.className = 'cc-pomodoro-panel hidden';
  panel.innerHTML =
    '<div class="cc-pomo-header">' +
      '<span>🍅 Pomodoro</span>' +
      '<button id="cc-pomo-close" class="cc-pomo-close-btn"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div class="cc-pomo-display" id="cc-pomo-display">25:00</div>' +
    '<div class="cc-pomo-phase" id="cc-pomo-phase">Focus</div>' +
    '<div class="cc-pomo-controls">' +
      '<button id="cc-pomo-start" class="cc-pomo-btn cc-pomo-start-btn"><i class="fas fa-play"></i> Start</button>' +
      '<button id="cc-pomo-reset" class="cc-pomo-btn cc-pomo-reset-btn"><i class="fas fa-undo"></i></button>' +
    '</div>' +
    '<div class="cc-pomo-settings">' +
      '<label>Focus <input type="number" id="cc-pomo-work" value="25" min="1" max="90" style="width:45px">m</label>' +
      '<label>Break <input type="number" id="cc-pomo-break" value="5" min="1" max="30" style="width:40px">m</label>' +
    '</div>' +
    '<div class="cc-pomo-cycles" id="cc-pomo-cycles"></div>';
  document.body.appendChild(panel);

  var pomoPhase = 'focus', pomoCycles = 0;
  var pomoSecs = 25 * 60, pomoInterval = null, pomoRunning = false;

  function fmt(s) {
    return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  }

  function renderDisplay() {
    var d = document.getElementById('cc-pomo-display');
    if (d) {
      d.textContent = fmt(pomoSecs);
      d.style.color = (pomoSecs < 10 && pomoRunning) ? '#ef4444' : '';
    }
  }

  function beep(freq) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq || 440;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1);
    } catch(e) {}
  }

  function tick() {
    if (pomoSecs > 0) {
      pomoSecs--;
      renderDisplay();
    } else {
      clearInterval(pomoInterval);
      pomoInterval = null;
      pomoRunning = false;
      var startBtn = document.getElementById('cc-pomo-start');
      if (startBtn) startBtn.innerHTML = '<i class="fas fa-play"></i> Start';

      if (pomoPhase === 'focus') {
        var mins = parseInt((document.getElementById('cc-pomo-work') || {}).value || '25');
        if (typeof window.ccRecordStudyMinutes === 'function') window.ccRecordStudyMinutes(mins);
        pomoCycles++;
        var cyclesEl = document.getElementById('cc-pomo-cycles');
        if (cyclesEl) cyclesEl.textContent = '🍅'.repeat(pomoCycles);
        pomoPhase = 'break';
        pomoSecs = parseInt((document.getElementById('cc-pomo-break') || {}).value || '5') * 60;
        var phaseEl = document.getElementById('cc-pomo-phase');
        if (phaseEl) { phaseEl.textContent = '☕ Break Time'; phaseEl.style.color = '#059669'; }
        beep(660);
      } else {
        pomoPhase = 'focus';
        pomoSecs = parseInt((document.getElementById('cc-pomo-work') || {}).value || '25') * 60;
        var phaseEl = document.getElementById('cc-pomo-phase');
        if (phaseEl) { phaseEl.textContent = 'Focus'; phaseEl.style.color = ''; }
        beep(440);
      }
      renderDisplay();
    }
  }

  document.getElementById('cc-pomo-start').addEventListener('click', function() {
    if (pomoRunning) {
      clearInterval(pomoInterval); pomoInterval = null; pomoRunning = false;
      this.innerHTML = '<i class="fas fa-play"></i> Resume';
    } else {
      pomoInterval = setInterval(tick, 1000); pomoRunning = true;
      this.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
  });

  document.getElementById('cc-pomo-reset').addEventListener('click', function() {
    clearInterval(pomoInterval); pomoInterval = null; pomoRunning = false;
    pomoPhase = 'focus';
    pomoSecs = parseInt((document.getElementById('cc-pomo-work') || {}).value || '25') * 60;
    var phaseEl = document.getElementById('cc-pomo-phase');
    if (phaseEl) { phaseEl.textContent = 'Focus'; phaseEl.style.color = ''; }
    var startBtn = document.getElementById('cc-pomo-start');
    if (startBtn) startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    renderDisplay();
  });

  document.getElementById('cc-pomo-work').addEventListener('change', function() {
    if (!pomoRunning) { pomoSecs = (parseInt(this.value)||25)*60; renderDisplay(); }
  });

  launchBtn.addEventListener('click', function() {
    panel.classList.toggle('hidden');
  });

  document.getElementById('cc-pomo-close').addEventListener('click', function() {
    panel.classList.add('hidden');
  });

  renderDisplay();
})();


/* ──────────────────────────────────────────────────────────
   5.  TASK PROGRESS BARS
────────────────────────────────────────────────────────── */
(function initTaskProgress() {
  function updateDayProgress(daySection) {
    var rows = daySection.querySelectorAll('tbody tr');
    if (!rows.length) return;
    var completed = 0;
    rows.forEach(function(tr) {
      var doneBadge = tr.querySelector('.done-badge,[data-completed="true"]');
      var circle = tr.querySelector('.completion-circle');
      var pct = circle ? parseInt(circle.dataset.pct || '0') : 0;
      if (doneBadge || pct >= 100) completed++;
    });
    var total = rows.length;
    var pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    var bar = daySection.querySelector('.cc-day-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'cc-day-progress';
      var table = daySection.querySelector('table,.table-responsive');
      if (table) daySection.insertBefore(bar, table);
      else daySection.prepend(bar);
    }
    bar.innerHTML =
      '<div class="cc-day-progress-label"><span>' + completed + '/' + total + ' tasks</span><span>' + pct + '%</span></div>' +
      '<div class="cc-day-progress-track"><div class="cc-day-progress-fill" style="width:' + pct + '%"></div></div>';
  }

  function scanDays() {
    document.querySelectorAll('.day-section').forEach(updateDayProgress);
  }

  new MutationObserver(scanDays).observe(document.body, { childList: true, subtree: true });
  setTimeout(scanDays, 1500);
})();


/* ──────────────────────────────────────────────────────────
   6.  SUBJECT COLOR CODING
────────────────────────────────────────────────────────── */
(function initSubjectColors() {
  var PALETTE = [
    { bg:'#eff6ff', border:'#3b82f6', text:'#1e40af' },
    { bg:'#fdf4ff', border:'#a855f7', text:'#6b21a8' },
    { bg:'#fff7ed', border:'#f97316', text:'#9a3412' },
    { bg:'#fefce8', border:'#eab308', text:'#854d0e' },
    { bg:'#f0fdf4', border:'#22c55e', text:'#14532d' },
    { bg:'#fff1f2', border:'#f43f5e', text:'#881337' },
    { bg:'#f0f9ff', border:'#0ea5e9', text:'#0c4a6e' },
    { bg:'#fafafa', border:'#6b7280', text:'#111827' }
  ];
  var subjectColorMap = {}, colorIndex = 0;

  function getColor(subject) {
    var key = (subject || '').toLowerCase().trim();
    if (!key || key === 'vocabulary') return null;
    if (!subjectColorMap[key]) { subjectColorMap[key] = PALETTE[colorIndex % PALETTE.length]; colorIndex++; }
    return subjectColorMap[key];
  }

  function colorizeRows() {
    document.querySelectorAll('tbody tr').forEach(function(tr) {
      if (tr.dataset.ccColored) return;
      var subjectCell = tr.querySelector('td[data-subject],td:first-child');
      if (!subjectCell) return;
      var subject = (subjectCell.dataset.subject || subjectCell.textContent || '').trim();
      if (!subject) return;
      var color = getColor(subject);
      if (!color) return;
      tr.style.borderLeft = '3px solid ' + color.border;
      subjectCell.style.color = color.text;
      subjectCell.style.fontWeight = '600';
      tr.dataset.ccColored = '1';
    });
  }

  function renderLegend() {
    if (!Object.keys(subjectColorMap).length) return;
    var legend = document.getElementById('cc-subject-legend');
    if (!legend) {
      legend = document.createElement('div');
      legend.id = 'cc-subject-legend';
      legend.className = 'cc-subject-legend';
      var display = document.getElementById('current-month-plan-display');
      if (display) display.prepend(legend);
    }
    legend.innerHTML = '<span class="cc-legend-label">Subjects: </span>' +
      Object.keys(subjectColorMap).map(function(sub) {
        var c = subjectColorMap[sub];
        return '<span class="cc-legend-chip" style="background:' + c.bg + ';border-color:' + c.border + ';color:' + c.text + '">' + sub + '</span>';
      }).join('');
  }

  new MutationObserver(function() { colorizeRows(); renderLegend(); })
    .observe(document.body, { childList: true, subtree: true });
  setTimeout(function() { colorizeRows(); renderLegend(); }, 2000);
})();


/* ──────────────────────────────────────────────────────────
   7.  QUIZ HISTORY SPARKLINE CHART
────────────────────────────────────────────────────────── */
(function initQuizHistoryChart() {
  function buildChart() {
    var container = document.getElementById('by-day-results-list');
    if (!container || document.getElementById('cc-quiz-history-chart')) return;
    var rows = container.querySelectorAll('tbody tr');
    if (rows.length < 2) return;
    var labels = [], scores = [];
    rows.forEach(function(row) {
      var cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        labels.push((cells[0].textContent || '').trim().substring(0,10));
        var scoreText = cells[2].textContent || cells[1].textContent || '';
        var match = scoreText.match(/(\d+\.?\d*)\s*%/);
        if (match) scores.push(parseFloat(match[1]));
        else { var nm = scoreText.match(/(\d+\.?\d*)/); scores.push(nm ? parseFloat(nm[1]) : null); }
      }
    });
    if (scores.filter(Boolean).length < 2) return;
    var wrapper = document.createElement('div');
    wrapper.id = 'cc-quiz-history-chart';
    wrapper.className = 'cc-quiz-chart-wrapper';
    wrapper.innerHTML = '<canvas id="cc-quiz-spark" height="100"></canvas>';
    container.prepend(wrapper);
    if (window.Chart) {
      var ctx = document.getElementById('cc-quiz-spark').getContext('2d');
      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: labels.slice(0,20),
          datasets: [{ label:'Score %', data:scores.slice(0,20), borderColor:'#059669',
            backgroundColor:'rgba(5,150,105,0.1)', fill:true, tension:0.4, pointRadius:3, pointBackgroundColor:'#059669' }]
        },
        options: {
          responsive: true,
          plugins: { legend:{ display:false }, tooltip:{ mode:'index', intersect:false } },
          scales: {
            y:{ min:0, max:100, ticks:{ callback: function(v) { return v+'%'; } } },
            x:{ display:false }
          }
        }
      });
    }
  }

  new MutationObserver(function() {
    var modal = document.getElementById('result-sheet-modal');
    if (modal && modal.style.display !== 'none' && modal.style.display !== '') {
      setTimeout(buildChart, 600);
    }
  }).observe(document.body, { attributes: true, subtree: true });
})();


/* ──────────────────────────────────────────────────────────
   8.  PWA SUPPORT
────────────────────────────────────────────────────────── */
(function initPWA() {
  if (!document.querySelector('link[rel="manifest"]')) {
    var manifestData = {
      name:'Class Caddy', short_name:'ClassCaddy',
      description:'Your personal academic study planner',
      start_url:'/study_plan.html', display:'standalone',
      background_color:'#ffffff', theme_color:'#059669',
      icons:[
        { src:'images/cc-icon-full.png', sizes:'192x192', type:'image/png' },
        { src:'images/cc-icon-full.png', sizes:'512x512', type:'image/png' }
      ]
    };
    var blob = new Blob([JSON.stringify(manifestData)], { type:'application/json' });
    var link = document.createElement('link');
    link.rel = 'manifest'; link.href = URL.createObjectURL(blob);
    document.head.appendChild(link);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('cc-sw.js')
      .then(function(reg) { console.log('[CC PWA] SW registered:', reg.scope); })
      .catch(function(err) { console.log('[CC PWA] SW skipped:', err.message); });
  }

  var deferredPrompt;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    var banner = document.createElement('div');
    banner.id = 'cc-install-banner';
    banner.className = 'cc-install-banner';
    banner.innerHTML =
      '<span>📱 Add Class Caddy to your home screen!</span>' +
      '<button id="cc-install-btn" class="cc-install-btn">Install</button>' +
      '<button id="cc-install-dismiss" class="cc-install-dismiss"><i class="fas fa-times"></i></button>';
    document.body.appendChild(banner);
    document.getElementById('cc-install-btn').addEventListener('click', function() {
      banner.remove(); deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function() { deferredPrompt = null; });
    });
    document.getElementById('cc-install-dismiss').addEventListener('click', function() { banner.remove(); });
  });
})();

})(); // end IIFE
