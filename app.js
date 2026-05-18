// ─── STATE ────────────────────────────────────────────────────────────────────
const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => {
    localStorage.setItem(k, JSON.stringify(v));
    if (typeof Sync !== 'undefined') Sync.schedulePush();
  },
};

function initState() {
  if (!LS.get('tasks'))       LS.set('tasks', TASKS_DATA);
  if (!LS.get('habits'))      LS.set('habits', {});
  if (!LS.get('contacts'))    LS.set('contacts', []);
  if (!LS.get('briefings'))   LS.set('briefings', INITIAL_BRIEFINGS);
  if (!LS.get('workoutIdx'))  LS.set('workoutIdx', 0);   // cycles 0-3 only (not run)
  if (!LS.get('exerciseDone'))LS.set('exerciseDone', {});
  if (!LS.get('workoutLog'))  LS.set('workoutLog', []);
  if (!LS.get('weightLog'))   LS.set('weightLog', [{date:'2026-05-16', weight:176}]);
  if (!LS.get('coStatus'))    LS.set('coStatus', {});
  if (!LS.get('taskHistory')) LS.set('taskHistory', []);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
function getLocalIsoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const isoToday = getLocalIsoDate();

function scheduleMidnightRefresh() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  setTimeout(() => location.reload(), midnight - now);
}

function getYesterday() {
  const d = new Date(isoToday + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0,10);
}

function computeRollovers() { /* no-op — agenda now driven by task list */ }

// Called once per day: archive completed check-offs and reset completed ongoing tasks.
function computeTaskResets() {
  if (LS.get('taskResetDate') === isoToday) return;
  const tasks   = LS.get('tasks') || TASKS_DATA;
  const history = LS.get('taskHistory') || [];
  let changed   = false;
  const remaining = [];
  for (const t of tasks) {
    const isCheckoff = t.when !== 'Ongoing';
    const wasCompletedPreviously = t.status === 'Completed' && t.completedOn && t.completedOn < isoToday;
    if (isCheckoff && wasCompletedPreviously) {
      history.push({ ...t, archivedOn: t.completedOn });
      changed = true;
    } else {
      if (!isCheckoff && wasCompletedPreviously) {
        t.status = 'Not started';
        delete t.completedOn;
        changed = true;
      }
      remaining.push(t);
    }
  }
  if (changed) {
    LS.set('tasks', remaining);
    LS.set('taskHistory', history);
  }
  LS.set('taskResetDate', isoToday);
}

// Parse any deadline string to a sortable YYYY-MM-DD
function parseDateStr(d) {
  if (!d || d === 'Ongoing') return '9999-12-31';
  if (/^\d{4}-\d{2}/.test(String(d))) return String(d);
  const mp = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
  const pts = String(d).trim().split(/\s+/);
  if (pts.length >= 2 && mp[pts[0]]) return `2026-${mp[pts[0]]}-${String(pts[1]).padStart(2,'0')}`;
  return '9999-12-31';
}

// Today's agenda: pick ~5h of tasks based on deadline urgency, priority, and effort.
// Tasks completed today are always shown. Defaults to 1h if effort is missing.
function getTodaysAgendaItems() {
  const tasks    = LS.get('tasks') || [];
  const TARGET   = 5;
  const effortOf = t => (t.effort != null && t.effort > 0) ? t.effort : 1;

  const completedToday = tasks.filter(t => t.when !== 'Ongoing' && t.status === 'Completed' && t.completedOn === isoToday);
  const candidates     = tasks.filter(t => t.when !== 'Ongoing' && t.status !== 'Completed');

  const priRank = {'High':0,'Medium':1,'Low':2};
  candidates.sort((a, b) => {
    const aDl = parseDateStr(a.deadline), bDl = parseDateStr(b.deadline);
    const aOver = aDl < isoToday,         bOver = bDl < isoToday;
    if (aOver !== bOver) return aOver ? -1 : 1;
    const pDiff = (priRank[a.priority]??1) - (priRank[b.priority]??1);
    if (pDiff !== 0) return pDiff;
    return aDl.localeCompare(bDl);
  });

  const selected = [];
  let hours = completedToday.reduce((s, t) => s + effortOf(t), 0);
  for (const t of candidates) {
    if (hours >= TARGET) break;
    selected.push(t);
    hours += effortOf(t);
  }

  return [...completedToday, ...selected];
}

function fmtDate(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dt = new Date(d + 'T12:00:00');
  return {
    full:  `${days[dt.getDay()]}, ${months[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`,
    short: `${months[dt.getMonth()]} ${dt.getDate()}`,
    day:   days[dt.getDay()],
  };
}

function isFriday() { return new Date().getDay() === 5; }

// Returns {wo, woIdx, isFri} for any date string (YYYY-MM-DD).
// Rotation anchored: May 16 2026 = index 0 (Shoulders/Back). Friday always = Run.
function getWorkoutForDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  if (date.getDay() === 5) return { wo: WORKOUT_ROTATION[4], woIdx: 4, isFri: true };
  const ANCHOR = new Date('2026-05-16T12:00:00');
  const days   = Math.round((date - ANCHOR) / 86400000);
  const idx    = ((days % 4) + 4) % 4;
  return { wo: WORKOUT_ROTATION[idx], woIdx: idx, isFri: false };
}
function getTodaysWorkout() { return getWorkoutForDate(isoToday); }

// Rotation position based on logged lifting sessions, so skipped days don't advance the rotation.
function getEffectiveWorkoutIdx() {
  const log = LS.get('workoutLog') || [];
  const liftSessions = log.filter(e => e.workout !== 'Weekly Run' && e.workout !== 'Friday Run');
  return liftSessions.length % 4;
}

function getTomorrowDateStr() {
  const d = new Date(isoToday + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function catColor(cat) {
  const m = {
    'Career':'cat-career','Academics':'cat-academics','London Logistics':'cat-london',
    'Senior Year Prep':'cat-senior','Money & Admin':'cat-money','Extracurriculars':'cat-extra',
    'Learning':'cat-learning','Fitness':'cat-fitness','Books':'cat-books',
  };
  return m[cat] || 'cat-career';
}
function industryBadge(ind) {
  const m = {
    'Pharma / Biotech':'badge-navy','Specialty Chemicals':'badge-cyan',
    'Oil & Gas / Refining':'badge-amber','CPG / Consumer':'badge-pink',
    'Food & Beverage':'badge-orange','Energy / Battery':'badge-green',
    'Nuclear':'badge-purple','Climate Tech':'badge-cyan',
    'Semiconductors / Materials':'badge-dim','AgChem / Agriculture':'badge-green',
    'Industrial / Aerospace':'badge-dim','National Lab / Govt':'badge-gold',
  };
  return m[ind] || 'badge-dim';
}
function biotechBadge(b) {
  return b==='Yes'?'badge-green':b==='Tangential'?'badge-amber':'badge-dim';
}
function catBriefBadge(cat) {
  const m = {
    'Politics':'badge-red','Tech':'badge-navy','Chemical Engineering':'badge-cyan',
  };
  return m[cat] || 'badge-dim';
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const App = {
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('[data-page]').forEach(n => n.classList.remove('active'));
    $('page-' + page).classList.add('active');
    document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('active'));
    const titles = {today:'Today',tasks:'Tasks',fitness:'Fitness',companies:'Career',network:'Network',briefings:'Briefings',accomplishments:'Accomplishments',history:'History',schedule:'Schedule'};
    const mpt = $('mobile-page-title'); if (mpt) mpt.textContent = titles[page] || page;
    App.closeDrawer();
    App.renderPage(page);
  },

  openDrawer() {
    $('drawer')?.classList.add('open');
    $('drawer-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeDrawer() {
    $('drawer')?.classList.remove('open');
    $('drawer-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  },

  syncConnect() {
    const token = ($('sync-token-input')?.value || '').trim();
    if (!token) { alert('Paste your GitHub token first.'); return; }
    const btn = $('sync-connect-btn'); if (btn) { btn.textContent = 'Connecting…'; btn.disabled = true; }
    Sync.connect(token).then(() => {
      closeModal('modal-sync');
      if (btn) { btn.textContent = 'Connect & Sync'; btn.disabled = false; }
      App._updateSyncModal();
    });
  },

  syncDisconnect() {
    Sync.disconnect();
    App._updateSyncModal();
  },

  _updateSyncModal() {
    const on = Sync.isEnabled();
    const row = $('sync-status-row');
    const group = $('sync-token-group');
    const connBtn = $('sync-connect-btn');
    const discBtn = $('sync-disconnect-btn');
    if (row) row.innerHTML = on
      ? '<span style="color:#22c55e;font-weight:600">● Sync enabled</span> — changes on any device appear within 60 seconds.'
      : '<span style="color:var(--text-dim)">● Sync disabled</span>';
    if (group) group.style.display = on ? 'none' : '';
    if (connBtn) connBtn.style.display = on ? 'none' : '';
    if (discBtn) discBtn.style.display = on ? '' : 'none';
  },

  renderPage(p) {
    ({today:App.renderToday, tasks:App.renderTasks, fitness:App.renderFitness,
      companies:App.renderCompanies, network:App.renderContacts, briefings:App.renderBriefings,
      accomplishments:App.renderAccomplishments, history:App.renderHistory,
      schedule:App.renderSchedule}[p] || (()=>{}))();
  },

  goToFitness() { App.navigate('fitness'); },

  toggleAgendaCheck(taskText) {
    const checks   = LS.get('agendaChecks') || {};
    const todaySet = new Set(checks[isoToday] || []);
    todaySet.has(taskText) ? todaySet.delete(taskText) : todaySet.add(taskText);
    checks[isoToday] = [...todaySet];
    LS.set('agendaChecks', checks);
    App.renderToday();
  },

  // ─── TODAY ─────────────────────────────────────────────────────────────────
  renderToday() {
    const fd = fmtDate(isoToday);
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

    // Welcome card
    const wg = $('welcome-greeting');
    const wd = $('welcome-date');
    const wt = $('welcome-theme');
    if (wg) wg.textContent = `${greet}, Cole.`;
    if (wd) wd.textContent = fd.full;

    if (wt) wt.textContent = '📋 Tasks sorted by deadline';

    // Stats
    const todayTasks = getTodaysAgendaItems().length;
    const habits = LS.get('habits')[isoToday] || {};
    const habitsForToday = getHabitsForDate(isoToday);
    const doneCt = habitsForToday.filter(h => habits[h.id] === 'done').length;
    const wLog = LS.get('weightLog') || [];
    const lastW = wLog.length ? wLog[wLog.length - 1].weight : 176;
    const todayLogged = (LS.get('workoutLog') || []).some(e => e.date === isoToday);
    const woIdx = getEffectiveWorkoutIdx(); // accounts for today if already logged
    const wo = WORKOUT_ROTATION[woIdx % 4];
    const woLabel = todayLogged ? 'Tomorrow' : 'Today';

    $('stat-streak').textContent = App.calcStreak();
    $('stat-tasks-today').textContent = todayTasks;
    $('stat-workout').textContent = wo.name;
    $('stat-workout-day').textContent = woLabel;
    $('stat-weight').textContent = lastW;

    App.renderHabits();

    // Agenda tasks
    const agEl    = $('today-agenda-tasks');
    const agTitle = $('today-agenda-title');
    if (agTitle) agTitle.textContent = "Today's Agenda";

    const agItems = getTodaysAgendaItems();

    if (agItems.length) {
      const effortOf = t => (t.effort != null && t.effort > 0) ? t.effort : 1;
      const totalH = agItems.reduce((s, t) => s + effortOf(t), 0);
      if (agTitle) agTitle.textContent = `Today's Agenda · ${totalH % 1 === 0 ? totalH : totalH.toFixed(1)}h`;
      agEl.innerHTML = agItems.map(t => {
        const done   = t.status === 'Completed';
        const isOver = !done && parseDateStr(t.deadline) < isoToday;
        return `
        <div class="agenda-item ${done ? 'completed-row' : ''}" onclick="App.toggleTask(${t.id})">
          <div class="agenda-check ${done ? 'checked' : ''}">${done ? '✓' : ''}</div>
          <div style="flex:1">
            <div class="agenda-task">${t.task}</div>
            <div class="agenda-meta">
              <span class="${catColor(t.category)}">${t.category}</span>
              <span style="${isOver ? 'color:var(--red);font-weight:600' : ''}">· ${t.deadline}</span>
              ${t.priority ? `<span class="pri-${t.priority.toLowerCase()}">· ${t.priority}</span>` : ''}
            </div>
          </div>
          <div class="agenda-hrs">${effortOf(t)}h</div>
        </div>`;
      }).join('');
    } else {
      agEl.innerHTML = `<div style="color:var(--text-dim);font-size:13px;padding:20px 0;text-align:center">No tasks with deadlines — add some in Tasks</div>`;
    }

    // Workout preview
    const wTitle = $('today-workout-title');
    const wPrev = $('today-workout-preview');
    if (wTitle) wTitle.textContent = `${wo.icon} ${wo.name}${todayLogged ? ' · Tomorrow' : ''}`;
    if (wPrev) {
      const exList = wo.exercises.slice(0, 4).map(e => `
        <div class="agenda-item">
          <div style="flex:1"><div class="agenda-task">${e.name}</div><div class="agenda-meta">${e.note}</div></div>
          <div class="agenda-hrs" style="font-size:11px;color:var(--text-dim)">${e.sets} sets · failure</div>
        </div>`).join('');
      const more = wo.exercises.length > 4 ? `<div style="font-size:11px;color:var(--text-dim);padding:8px 0">+${wo.exercises.length-4} more</div>` : '';
      wPrev.innerHTML = exList + more;
    }

    // Latest briefings
    const briefs = (LS.get('briefings') || []).slice().reverse().slice(0, 3);
    const tbEl = $('today-briefings');
    if (tbEl) tbEl.innerHTML = briefs.map(b => `
      <div class="brief-item">
        <div class="brief-meta"><span class="badge ${catBriefBadge(b.category)}">${b.category}</span><span>${b.source}</span></div>
        <a class="brief-headline" href="${b.link}" target="_blank" rel="noopener">${b.headline}</a>
      </div>`).join('') || '<div style="color:var(--text-dim);font-size:13px;padding:12px 0">No briefings yet — add one →</div>';

    // Today's schedule preview
    const tsEl = $('today-schedule');
    if (tsEl) {
      GCal._load();
      if (!GCal.isConnected()) {
        tsEl.innerHTML = `<div style="color:var(--text-dim);font-size:13px;padding:12px 0;text-align:center">
          <a style="color:var(--accent);cursor:pointer" onclick="App.navigate('schedule')">Connect Google Calendar →</a>
        </div>`;
      } else if (GCal._todayCache === null) {
        tsEl.innerHTML = `<div style="color:var(--text-dim);font-size:13px;padding:8px 0">Loading…</div>`;
        GCal.fetchTodayEvents().then(() => App.renderToday());
      } else if (GCal._todayCache.length === 0) {
        tsEl.innerHTML = `<div style="color:var(--text-dim);font-size:13px;padding:8px 0">No events today</div>`;
      } else {
        const fmtT = s => new Date(s).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'});
        tsEl.innerHTML = GCal._todayCache.slice(0, 4).map(ev => {
          const allDay = !ev.start?.dateTime;
          const timeStr = allDay ? 'All day' : fmtT(ev.start.dateTime);
          return `<div class="brief-item">
            <div class="brief-meta"><span style="color:var(--accent);font-weight:600">${timeStr}</span></div>
            <div style="font-size:0.85rem;color:var(--text);font-weight:500">${ev.summary || '(no title)'}</div>
          </div>`;
        }).join('');
      }
    }
  },

  calcStreak() {
    const habits = LS.get('habits') || {};
    let streak = 0;
    const d = new Date();
    while (streak < 365) {
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const h = habits[key] || {};
      const hConfig = getHabitsForDate(key);
      const done = hConfig.filter(hc => h[hc.id] === 'done').length;
      if (done >= Math.ceil(hConfig.length / 2)) { streak++; d.setDate(d.getDate() - 1); }
      else if (key === isoToday) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  },

  // ─── HABITS ────────────────────────────────────────────────────────────────
  renderHabits() {
    const habits = LS.get('habits') || {};
    const today = habits[isoToday] || {};
    const habitsForToday = getHabitsForDate(isoToday);
    const el = $('habits-list');
    if (!el) return;
    el.innerHTML = habitsForToday.map(h => {
      const val = today[h.id] || '';
      return `
        <div class="habit-row">
          <div class="habit-left">
            <span class="habit-icon">${h.icon}</span>
            <div><div class="habit-name">${h.label}</div><div class="habit-duration">${h.duration}</div></div>
          </div>
          <div class="habit-toggle">
            <button class="habit-btn ${val==='done'?'done':''}" onclick="App.setHabit('${h.id}','done')">✓ Done</button>
            <button class="habit-btn ${val==='skip'?'skipped':''}" onclick="App.setHabit('${h.id}','skip')">Skip</button>
          </div>
        </div>`;
    }).join('');
    const doneCt = habitsForToday.filter(h => today[h.id] === 'done').length;
    const badge = $('habits-complete-badge');
    if (badge) {
      badge.textContent = `${doneCt}/${habitsForToday.length}`;
      badge.className = `badge ${doneCt >= habitsForToday.length ? 'badge-green' : doneCt > 0 ? 'badge-amber' : 'badge-dim'}`;
    }
    const totalHrs = isoToday <= '2026-05-22' ? 3.5 : 2.5;
    const hint = $('habits-time-hint');
    if (hint) hint.textContent = `${totalHrs} hrs/day`;
  },

  setHabit(id, val) {
    const habits = LS.get('habits') || {};
    if (!habits[isoToday]) habits[isoToday] = {};
    if (habits[isoToday][id] === val) delete habits[isoToday][id];
    else habits[isoToday][id] = val;
    LS.set('habits', habits);
    App.renderHabits();
    App.renderToday();
  },

  // ─── TASKS ─────────────────────────────────────────────────────────────────
  renderTasks() {
    const tasks = LS.get('tasks') || TASKS_DATA;
    const q = ($('task-search')?.value || '').toLowerCase();
    const cat = $('task-filter-category')?.value || '';
    const status = $('task-filter-status')?.value || '';
    const pri = $('task-filter-priority')?.value || '';

    const filtered = tasks.filter(t => {
      if (cat && t.category !== cat) return false;
      if (status && t.status !== status) return false;
      if (pri && t.priority !== pri) return false;
      if (q && !t.task.toLowerCase().includes(q) && !(t.notes||'').toLowerCase().includes(q)) return false;
      return true;
    });

    const dateSort = d => {
      if (!d || d === 'Ongoing') return '9999-12-31';
      if (/^\d{4}-\d{2}/.test(String(d))) return String(d);
      const mp = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
      const pts = String(d).split(' ');
      if (pts.length === 2) return `2026-${mp[pts[0]]||'01'}-${String(pts[1]).padStart(2,'0')}`;
      return '9999-12-31';
    };

    const fixed = filtered.filter(t => t.when !== 'Ongoing').sort((a, b) => {
      if (a.status==='Completed' && b.status!=='Completed') return 1;
      if (b.status==='Completed' && a.status!=='Completed') return -1;
      return dateSort(a.deadline).localeCompare(dateSort(b.deadline));
    });
    const ongoing = filtered.filter(t => t.when === 'Ongoing');

    const renderList = (arr, elId) => {
      const el = $(elId); if (!el) return;
      if (!arr.length) { el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:16px 0;text-align:center">No tasks match filters</div>'; return; }
      el.innerHTML = arr.map(t => {
        const isOver = t.deadline && t.deadline !== 'Ongoing' && dateSort(t.deadline) < isoToday && t.status !== 'Completed';
        return `
          <div class="task-item">
            <div class="task-check ${t.status==='Completed'?'done':''}" onclick="App.toggleTask(${t.id})">${t.status==='Completed'?'✓':''}</div>
            <div class="task-body">
              <div class="task-text ${t.status==='Completed'?'done':''}">${t.task}</div>
              <div class="task-meta">
                <span class="${catColor(t.category)}">${t.category}</span>
                ${t.deadline&&t.deadline!=='Ongoing'?`<span style="${isOver?'color:var(--red);font-weight:600':''}">📅 ${t.deadline}</span>`:'<span>Ongoing</span>'}
                ${t.effort?`<span>⏱ ${t.effort}h</span>`:''}
                ${t.priority?`<span class="pri-${t.priority.toLowerCase()}">${t.priority}</span>`:''}
              </div>
              ${t.notes?`<div class="task-notes">${t.notes}</div>`:''}
            </div>
          </div>`;
      }).join('');
    };
    renderList(fixed, 'tasks-checklist');
    renderList(ongoing, 'tasks-ongoing');
  },

  toggleTask(id) {
    const tasks = LS.get('tasks');
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    if (t.status === 'Completed') {
      t.status = 'Not started';
      delete t.completedOn;
    } else {
      t.status = 'Completed';
      t.completedOn = isoToday;
    }
    LS.set('tasks', tasks);
    App.renderTasks();
    App.renderToday();
  },

  // ─── ADD TASK ──────────────────────────────────────────────────────────────
  openAddTaskModal() {
    const el = $('at-task'); if (el) { el.value = ''; el.focus(); }
    if ($('at-category')) $('at-category').selectedIndex = 0;
    if ($('at-priority')) $('at-priority').value = '';
    if ($('at-type'))     $('at-type').value = 'ongoing';
    if ($('at-effort'))   $('at-effort').value = '';
    if ($('at-notes'))    $('at-notes').value = '';
    if ($('at-deadline')) $('at-deadline').value = '';
    App.toggleAddTaskDeadline();
    openModal('modal-add-task');
    setTimeout(() => $('at-task')?.focus(), 50);
  },

  toggleAddTaskDeadline() {
    const wrap = $('at-deadline-wrap');
    if (wrap) wrap.style.display = $('at-type')?.value === 'checkoff' ? '' : 'none';
  },

  saveNewTask() {
    const taskText = ($('at-task')?.value || '').trim();
    if (!taskText) { $('at-task')?.focus(); return; }
    const isOngoing = $('at-type')?.value !== 'checkoff';
    const deadline  = isOngoing ? 'Ongoing' : ($('at-deadline')?.value || isoToday);
    const tasks = LS.get('tasks') || [];
    const newId = Date.now();
    tasks.push({
      id:       newId,
      task:     taskText,
      category: $('at-category')?.value || 'Career',
      priority: $('at-priority')?.value || '',
      when:     isOngoing ? 'Ongoing' : deadline,
      deadline: isOngoing ? 'Ongoing' : deadline,
      status:   'Not started',
      effort:   parseFloat($('at-effort')?.value) || null,
      notes:    ($('at-notes')?.value || '').trim(),
    });
    LS.set('tasks', tasks);
    closeModal('modal-add-task');
    App.navigate('tasks');
  },

  // ─── ADD HABIT ─────────────────────────────────────────────────────────────
  openAddHabitModal() {
    if ($('ah-label'))    $('ah-label').value = '';
    if ($('ah-duration')) $('ah-duration').value = '0.5 hr';
    if ($('ah-icon'))     $('ah-icon').value = '📝';
    if ($('ah-start'))    $('ah-start').value = isoToday;
    if ($('ah-end'))      $('ah-end').value = '';
    openModal('modal-add-habit');
    setTimeout(() => $('ah-label')?.focus(), 50);
  },

  saveNewHabit() {
    const label = ($('ah-label')?.value || '').trim();
    if (!label) { $('ah-label')?.focus(); return; }
    const customs = LS.get('customHabits') || [];
    customs.push({
      id: 'ch_' + Date.now(),
      label,
      duration: ($('ah-duration')?.value || '0.5 hr').trim(),
      icon: ($('ah-icon')?.value || '📝').trim(),
      startDate: $('ah-start')?.value || isoToday,
      endDate: $('ah-end')?.value || null,
    });
    LS.set('customHabits', customs);
    closeModal('modal-add-habit');
    App.renderHabits();
    App.renderToday();
  },

  // ─── FITNESS ───────────────────────────────────────────────────────────────
  renderFitness() {
    const displayIdx = App._previewIdx !== null ? App._previewIdx : getEffectiveWorkoutIdx();
    App.renderWorkout(displayIdx);
    App.renderWeightChart();
    App.renderWeightLog();
    App.renderWorkoutHistory();
    const wLog = LS.get('weightLog') || [];
    const lastW = wLog.length ? wLog[wLog.length - 1].weight : 176;
    const fw = $('fitness-weight'); if (fw) fw.textContent = lastW;
    $('stat-weight').textContent = lastW;
  },

  renderWorkout(displayIdx) {
    const wo = WORKOUT_ROTATION[displayIdx % WORKOUT_ROTATION.length];
    const done = LS.get('exerciseDone') || {};
    const key = String(displayIdx);
    const exDone = done[key] || {};

    // Determine if today's workout has already been logged
    const todayLogEntry = (LS.get('workoutLog') || []).find(e => e.date === isoToday);
    const locked = !!(todayLogEntry && todayLogEntry.workout === wo.name);

    const titleEl = $('current-workout-title');
    if (titleEl) titleEl.innerHTML = `<span style="margin-right:8px">${wo.icon}</span>${wo.name}`;

    // Dots
    const dotsEl = $('workout-dots');
    if (dotsEl) {
      dotsEl.innerHTML = WORKOUT_ROTATION.map((w, i) => `
        <div class="wd-dot ${i===displayIdx%WORKOUT_ROTATION.length?'active':''}" onclick="App.previewWorkout(${i})" title="${w.name}">
          <span>${w.icon}</span>
          <span class="wd-dot-label">${w.short}</span>
        </div>`).join('');
    }

    // Exercises — if locked, show all as done and non-clickable
    const exEl = $('current-workout-exercises');
    if (exEl) {
      exEl.innerHTML = wo.exercises.map((e, i) => {
        const isDone = locked || !!exDone[i];
        const onclick = locked ? '' : `onclick="App.toggleExercise(${i}, ${displayIdx})"`;
        return `
          <div class="ex-row ${isDone ? 'done-row' : ''}">
            <div class="ex-left">
              <div class="ex-name">${e.name}</div>
              ${e.note ? `<div class="ex-note">${e.note}</div>` : ''}
            </div>
            <span class="ex-sets">${e.sets} sets · failure</span>
            <div class="ex-check ${isDone ? 'done' : ''}" ${onclick} style="${locked ? 'cursor:default' : ''}">${isDone ? '✓' : ''}</div>
          </div>`;
      }).join('');
    }

    // Log button — disable if already logged today
    const btn = $('log-workout-btn');
    if (btn) {
      if (locked) {
        btn.textContent = '✓ Logged today';
        btn.disabled = true;
        btn.style.background = 'var(--green)';
        btn.style.color = '#fff';
        btn.style.opacity = '0.7';
        btn.style.cursor = 'default';
      } else {
        btn.textContent = 'Log Workout Complete ✓';
        btn.disabled = false;
        btn.style.background = '';
        btn.style.color = '';
        btn.style.opacity = '';
        btn.style.cursor = '';
      }
    }
  },

  _previewIdx: null,
  previewWorkout(i) {
    App._previewIdx = i;
    App.renderWorkout(i);
  },
  prevWorkout() {
    const cur = App._previewIdx !== null ? App._previewIdx : getEffectiveWorkoutIdx();
    App._previewIdx = (cur - 1 + WORKOUT_ROTATION.length) % WORKOUT_ROTATION.length;
    App.renderWorkout(App._previewIdx);
  },
  nextWorkout() {
    const cur = App._previewIdx !== null ? App._previewIdx : getEffectiveWorkoutIdx();
    App._previewIdx = (cur + 1) % WORKOUT_ROTATION.length;
    App.renderWorkout(App._previewIdx);
  },

  toggleExercise(i, displayIdx) {
    const done = LS.get('exerciseDone') || {};
    const key = String(displayIdx);
    if (!done[key]) done[key] = {};
    done[key][i] = !done[key][i];
    LS.set('exerciseDone', done);
    App.renderWorkout(displayIdx);
  },

  logWorkout() {
    const displayIdx = App._previewIdx !== null ? App._previewIdx : getEffectiveWorkoutIdx();
    const log = LS.get('workoutLog') || [];
    if (log.some(e => e.date === isoToday)) return; // already logged today
    const wo = WORKOUT_ROTATION[displayIdx];
    log.push({ date: isoToday, workout: wo.name, icon: wo.icon });
    LS.set('workoutLog', log);

    // Clear done state for logged workout
    const done = LS.get('exerciseDone') || {};
    delete done[String(displayIdx)];
    LS.set('exerciseDone', done);
    App._previewIdx = null;

    App.renderFitness();
    App.renderToday();
  },

  logWeight() {
    const val = parseFloat($('weight-input').value);
    if (!val || val < 100 || val > 400) { $('weight-input').style.borderColor='var(--red)'; return; }
    $('weight-input').style.borderColor = '';
    const log = LS.get('weightLog') || [];
    log.push({ date: isoToday, weight: val });
    LS.set('weightLog', log);
    $('weight-input').value = '';
    App.renderFitness();
    App.renderToday();
  },

  _weightChart: null,
  renderWeightChart() {
    const log = (LS.get('weightLog') || []).slice(-30);
    const labels = log.map(e => fmtDate(e.date).short);
    const data = log.map(e => e.weight);
    const ctx = $('weight-chart'); if (!ctx) return;
    if (App._weightChart) { App._weightChart.destroy(); App._weightChart = null; }
    App._weightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label:'Weight (lbs)', data,
          borderColor:'#0C2340',
          backgroundColor:'rgba(12,35,64,0.06)',
          tension:0.3, fill:true,
          pointBackgroundColor:'#AE9142',
          pointBorderColor:'#AE9142',
          pointRadius:4, borderWidth:2,
        }]
      },
      options: {
        responsive:true,
        plugins:{ legend:{display:false} },
        scales:{
          x:{ grid:{color:'rgba(12,35,64,0.05)'}, ticks:{color:'#8A96AC',font:{size:10}} },
          y:{
            grid:{color:'rgba(12,35,64,0.05)'}, ticks:{color:'#8A96AC',font:{size:10}},
            min: data.length ? Math.min(...data)-3 : 170,
            max: data.length ? Math.max(...data)+3 : 190,
          }
        }
      }
    });
  },

  renderWeightLog() {
    const log = (LS.get('weightLog') || []).slice(-10).reverse();
    const el = $('weight-log-list'); if (!el) return;
    el.innerHTML = log.map((e, i) => {
      const prev = log[i + 1];
      const diff = prev ? (e.weight - prev.weight).toFixed(1) : null;
      const sign = diff > 0 ? '+' : '';
      const col = diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--text-dim)';
      return `<div class="wlog-item"><span>${fmtDate(e.date).short}</span><span style="font-weight:600;color:var(--nd-navy)">${e.weight} lbs</span>${diff!==null?`<span style="color:${col};font-size:11px">${sign}${diff}</span>`:''}</div>`;
    }).join('') || '<div style="color:var(--text-dim);font-size:12px;padding:8px 0">No weight logs yet</div>';
  },

  renderWorkoutHistory() {
    const log = (LS.get('workoutLog') || []).slice(-15).reverse();
    const el = $('workout-history'); if (!el) return;
    el.innerHTML = log.map(e => `
      <div class="wh-item">
        <span>${e.icon} <strong>${e.workout}</strong></span>
        <span style="font-size:11px;color:var(--text-dim)">${fmtDate(e.date).short} · ${fmtDate(e.date).day}</span>
      </div>`).join('') ||
      '<div class="empty-state"><div class="empty-state-icon">🏋️</div><div class="empty-state-title">No workouts logged yet</div><div class="empty-state-sub">Log your first session above</div></div>';
  },

  // ─── COMPANIES ─────────────────────────────────────────────────────────────
  renderCompanies() {
    const q = ($('co-search')?.value || '').toLowerCase();
    const ind = $('co-filter-industry')?.value || '';
    const sz = $('co-filter-size')?.value || '';
    const st = $('co-filter-status')?.value || '';
    const coStatus = LS.get('coStatus') || {};

    const sizeCategory = s => s.split(/[\s(]/)[0]; // "Mega-cap" from "Mega-cap (~$160B, PFE)"

    const filtered = COMPANIES.filter(c => {
      if (ind && c.industry !== ind) return false;
      if (sz && sizeCategory(c.size) !== sz) return false;
      const cs = coStatus[c.id] || {};
      if (st === 'interested' && !cs.interested) return false;
      if (st === 'applied' && !cs.applied) return false;
      if (q && !`${c.company} ${c.industry} ${c.roles} ${c.hubs} ${c.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });

    const interested = Object.values(coStatus).filter(s => s.interested).length;
    const applied = Object.values(coStatus).filter(s => s.applied).length;
    const largePlus = COMPANIES.filter(c => ['Mega-cap','Large-cap'].includes(sizeCategory(c.size))).length;
    const ciEl = $('co-interested'); if (ciEl) ciEl.textContent = interested;
    const caEl = $('co-applied'); if (caEl) caEl.textContent = applied;
    const lcEl = $('co-large-cap'); if (lcEl) lcEl.textContent = largePlus;

    const tbody = $('companies-tbody'); if (!tbody) return;
    tbody.innerHTML = filtered.map(c => {
      const cs = coStatus[c.id] || {};
      return `
        <tr>
          <td><button class="star-btn ${cs.interested?'on':''}" onclick="App.toggleCo(${c.id},'interested')">${cs.interested?'⭐':'☆'}</button></td>
          <td style="font-weight:600;color:var(--nd-navy);white-space:nowrap">
            <a href="${c.url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${c.company}</a>
            ${cs.applied?'<span class="badge badge-green" style="margin-left:6px;font-size:9px">Applied</span>':''}
          </td>
          <td><span class="badge ${industryBadge(c.industry)}">${c.industry}</span></td>
          <td style="font-size:11px;color:var(--text-dim)">${c.size.replace(/\s*\([^)]+\)/,'')}</td>
          <td style="max-width:200px;font-size:11.5px">${c.roles}</td>
          <td style="white-space:nowrap;font-size:12px;color:var(--amber);font-weight:600">${c.window}</td>
          <td style="max-width:160px;font-size:11px;color:var(--text-dim)">${c.hubs}</td>
          <td>
            <div class="action-btns">
              <button class="btn btn-xs btn-ghost" onclick="App.toggleCo(${c.id},'applied')">${cs.applied?'✓ Applied':'Apply'}</button>
              <button class="btn btn-xs btn-ghost" onclick="App.openCoNotes(${c.id})">📝</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    if (!filtered.length) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:40px">No companies match filters</td></tr>';
  },

  toggleCo(id, field) {
    const cs = LS.get('coStatus') || {};
    if (!cs[id]) cs[id] = {};
    cs[id][field] = !cs[id][field];
    LS.set('coStatus', cs);
    App.renderCompanies();
  },

  _coNotesId: null,
  openCoNotes(id) {
    const c = COMPANIES.find(x => x.id === id);
    App._coNotesId = id;
    $('modal-company-title').textContent = `Notes — ${c.company}`;
    const cs = LS.get('coStatus') || {};
    $('company-notes-input').value = cs[id]?.personalNotes || c.notes || '';
    openModal('modal-company');
  },
  saveCompanyNotes() {
    const cs = LS.get('coStatus') || {};
    if (!cs[App._coNotesId]) cs[App._coNotesId] = {};
    cs[App._coNotesId].personalNotes = $('company-notes-input').value;
    LS.set('coStatus', cs);
    closeModal('modal-company');
  },

  // ─── NETWORK ───────────────────────────────────────────────────────────────
  renderContacts() {
    const contacts = LS.get('contacts') || [];
    const q = ($('net-search')?.value || '').toLowerCase();
    const ind = $('net-filter-industry')?.value || '';

    const filtered = contacts.filter(c => {
      if (ind && c.industry !== ind) return false;
      if (q && !`${c.name} ${c.company} ${c.university} ${c.industry} ${c.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });

    $('net-total') && ($('net-total').textContent = contacts.length);
    $('net-reached') && ($('net-reached').textContent = contacts.filter(c=>c.reachedOut).length);
    $('net-responded') && ($('net-responded').textContent = contacts.filter(c=>c.responded).length);
    $('net-chatted') && ($('net-chatted').textContent = contacts.filter(c=>c.chatted).length);

    const tbody = $('contacts-tbody');
    const empty = $('contacts-empty');
    if (!contacts.length) { if(tbody)tbody.innerHTML=''; if(empty)empty.style.display='block'; return; }
    if (empty) empty.style.display = 'none';

    if (tbody) tbody.innerHTML = filtered.map(c => `
      <tr>
        <td style="font-weight:600;color:var(--nd-navy)">${c.name}</td>
        <td style="font-size:12px">${c.connection||'—'}</td>
        <td style="font-size:12px">${c.university||'—'}</td>
        <td style="font-size:12px">${c.gradYear||'—'}</td>
        <td><span class="badge ${industryBadge(c.industry)}">${c.industry||'—'}</span></td>
        <td style="font-size:12px;font-weight:500;color:var(--nd-navy)">${c.company||'—'}</td>
        <td style="font-size:11px">${c.contact?`<a href="${c.contact.includes('@')?'mailto:':''}${c.contact}" style="color:var(--nd-navy-l)">${c.contact.length>25?c.contact.slice(0,22)+'...':c.contact}</a>`:'—'}</td>
        <td><span class="status-dot" style="background:${c.reachedOut?'var(--green)':'var(--border)'}"></span>${c.reachedOut?'Yes':'No'}</td>
        <td><span class="status-dot" style="background:${c.responded?'var(--green)':'var(--border)'}"></span>${c.responded?'Yes':'No'}</td>
        <td><span class="status-dot" style="background:${c.chatted?'var(--green)':'var(--border)'}"></span>${c.chatted?'Yes':'No'}</td>
        <td class="notes-cell">${c.notes||'—'}</td>
        <td><div class="action-btns">
          <button class="btn btn-xs btn-ghost" onclick="App.editContact(${c.id})">Edit</button>
          <button class="btn btn-xs btn-danger" onclick="App.deleteContact(${c.id})">✕</button>
        </div></td>
      </tr>`).join('');

    if (!filtered.length && contacts.length) tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:var(--text-dim);padding:30px">No contacts match search</td></tr>';
  },

  _editContactId: null,
  openAddContact() {
    App._editContactId = null;
    ['nc-name','nc-connection','nc-university','nc-gradyear','nc-industry','nc-company','nc-contact','nc-notes'].forEach(id => { const el=$(id); if(el)el.value=''; });
    ['nc-ro','nc-resp','nc-chat'].forEach(id => { const el=$(id); if(el)el.checked=false; });
    $('modal-contact-title').textContent = 'Add Networking Contact';
    openModal('modal-contact');
  },
  editContact(id) {
    const c = (LS.get('contacts')||[]).find(x=>x.id===id); if (!c) return;
    App._editContactId = id;
    $('nc-name').value = c.name||''; $('nc-connection').value = c.connection||'';
    $('nc-university').value = c.university||''; $('nc-gradyear').value = c.gradYear||'';
    $('nc-industry').value = c.industry||''; $('nc-company').value = c.company||'';
    $('nc-contact').value = c.contact||'';
    $('nc-ro').checked = c.reachedOut||false; $('nc-resp').checked = c.responded||false; $('nc-chat').checked = c.chatted||false;
    $('nc-notes').value = c.notes||'';
    $('modal-contact-title').textContent = 'Edit Contact';
    openModal('modal-contact');
  },
  saveContact() {
    const name = $('nc-name').value.trim();
    if (!name) { $('nc-name').style.borderColor='var(--red)'; return; }
    $('nc-name').style.borderColor = '';
    const contacts = LS.get('contacts') || [];
    const obj = {
      id: App._editContactId || Date.now(), name,
      connection:$('nc-connection').value.trim(), university:$('nc-university').value.trim(),
      gradYear:$('nc-gradyear').value.trim(), industry:$('nc-industry').value.trim(),
      company:$('nc-company').value.trim(), contact:$('nc-contact').value.trim(),
      reachedOut:$('nc-ro')?.checked||false, responded:$('nc-resp')?.checked||false, chatted:$('nc-chat')?.checked||false,
      notes:$('nc-notes').value.trim(),
    };
    if (App._editContactId) { const i=contacts.findIndex(x=>x.id===App._editContactId); if(i>=0)contacts[i]=obj; }
    else contacts.push(obj);
    LS.set('contacts', contacts);
    closeModal('modal-contact');
    App.renderContacts();
  },
  deleteContact(id) {
    if (!confirm('Delete this contact?')) return;
    LS.set('contacts', (LS.get('contacts')||[]).filter(c=>c.id!==id));
    App.renderContacts();
  },

  // ─── BRIEFINGS ─────────────────────────────────────────────────────────────
  renderBriefings() {
    const briefs = (LS.get('briefings') || []).slice().reverse();
    const q = ($('brief-search')?.value || '').toLowerCase();
    const cat = $('brief-filter-cat')?.value || '';

    const filtered = briefs.filter(b => {
      if (cat && b.category !== cat) return false;
      if (q && !`${b.headline} ${b.source} ${b.whyItMatters} ${b.category}`.toLowerCase().includes(q)) return false;
      return true;
    });

    const el = $('briefings-list'); if (!el) return;
    el.innerHTML = filtered.map(b => `
      <div class="brief-item">
        <div class="brief-head">
          <div>
            <div class="brief-meta">
              <span class="badge ${catBriefBadge(b.category)}">${b.category}</span>
              <span>${b.date}</span>
              <span>· ${b.source}</span>
            </div>
            <a class="brief-headline" href="${b.link}" target="_blank" rel="noopener">${b.headline}</a>
          </div>
          <button class="btn btn-xs btn-danger" onclick="App.deleteBriefing('${b.id}')" style="flex-shrink:0">✕</button>
        </div>
        <div class="brief-why">${b.whyItMatters}</div>
      </div>`).join('') || '<div class="empty-state"><div class="empty-state-icon">📰</div><div class="empty-state-title">No briefings yet</div><div class="empty-state-sub">Add your daily news briefings</div></div>';
  },
  openAddBriefing() { $('br-date').value = isoToday; openModal('modal-briefing'); },
  saveBriefing() {
    const headline = $('br-headline').value.trim();
    if (!headline) { $('br-headline').style.borderColor='var(--red)'; return; }
    $('br-headline').style.borderColor = '';
    const briefs = LS.get('briefings') || [];
    briefs.push({ id:'b'+Date.now(), date:$('br-date').value, category:$('br-category').value, headline, source:$('br-source').value.trim(), link:$('br-link').value.trim(), whyItMatters:$('br-why').value.trim() });
    LS.set('briefings', briefs);
    closeModal('modal-briefing');
    ['br-headline','br-source','br-link','br-why'].forEach(id => { const el=$(id); if(el)el.value=''; });
    App.renderBriefings();
    App.renderToday();
  },
  renderHistory() {
    const history = (LS.get('taskHistory') || []).slice().reverse();
    const el = $('history-list'); if (!el) return;

    // Update count badge
    const badge = $('history-count'); if (badge) badge.textContent = history.length;

    if (!history.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">★</div>
        <div class="empty-state-title">No completed tasks yet</div>
        <div class="empty-state-sub">Check-off tasks you complete will appear here the next day</div>
      </div>`;
      return;
    }

    // Group by archivedOn date
    const groups = {};
    history.forEach(t => {
      const d = t.archivedOn || 'Unknown';
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });

    el.innerHTML = Object.entries(groups).map(([date, tasks]) => {
      const label = date === 'Unknown' ? 'Earlier' : fmtDate(date).full;
      const items = tasks.map(t => `
        <div class="history-item">
          <span class="history-check">✓</span>
          <div class="history-body">
            <div class="history-task">${t.task}</div>
            <div class="history-meta">
              <span class="${catColor(t.category)}">${t.category}</span>
              ${t.deadline && t.deadline !== 'Ongoing' ? `<span>· ${t.deadline}</span>` : ''}
              ${t.priority ? `<span class="pri-${t.priority.toLowerCase()}">· ${t.priority}</span>` : ''}
            </div>
          </div>
        </div>`).join('');
      return `<div class="history-group">
        <div class="history-date-header">${label}</div>
        ${items}
      </div>`;
    }).join('');
  },

  renderAccomplishments() {
    const fd = fmtDate(isoToday);
    const el = $('accomp-date'); if (el) el.textContent = fd.full;

    // ── Gather data ──
    const habitsForToday = getHabitsForDate(isoToday);
    const todayHabits    = LS.get('habits')?.[isoToday] || {};
    const doneHabits     = habitsForToday.filter(h => todayHabits[h.id] === 'done');
    const skippedHabits  = habitsForToday.filter(h => todayHabits[h.id] === 'skip');

    const checkedAgenda  = []; // agenda now unified with task list
    const completedTasks = (LS.get('tasks') || []).filter(t => t.status === 'Completed' && t.completedOn === isoToday);

    const workoutToday   = (LS.get('workoutLog') || []).filter(w => w.date === isoToday);

    const weightToday    = (LS.get('weightLog') || []).filter(w => w.date === isoToday);
    const lastWeight     = weightToday.length ? weightToday[weightToday.length - 1].weight : null;

    const totalChecked = checkedAgenda.length + completedTasks.length;
    const total = doneHabits.length + totalChecked + workoutToday.length + (lastWeight ? 1 : 0);

    // ── Banner message ──
    const messages = [
      { min:0,  title:"Day's still young, Cole.",         sub:"Nothing checked off yet — go get it." },
      { min:1,  title:"You're moving.",                   sub:"Every check is momentum. Keep stacking." },
      { min:3,  title:"Good progress today.",             sub:"You're building the habit of showing up — that's the whole game." },
      { min:5,  title:"Solid day, Cole.",                 sub:"This is exactly what consistent looks like. Notre Dame '28 energy." },
      { min:7,  title:"You locked in today.",             sub:"Days like this compound. Future Cole thanks you." },
      { min:9,  title:"Exceptional day.",                 sub:"This is what separates people. You showed up and delivered." },
    ];
    const msg = messages.slice().reverse().find(m => total >= m.min) || messages[0];

    const banner = $('accomp-banner');
    if (banner) banner.innerHTML = `
      <div class="accomp-title">${msg.title}</div>
      <div class="accomp-sub">${msg.sub}</div>
      <div class="accomp-score">
        <div class="accomp-score-item">
          <div class="accomp-score-num">${doneHabits.length}<span style="font-size:14px;color:rgba(255,255,255,0.35)">/${habitsForToday.length}</span></div>
          <div class="accomp-score-label">Habits</div>
        </div>
        <div class="accomp-score-item">
          <div class="accomp-score-num">${totalChecked}</div>
          <div class="accomp-score-label">Tasks done</div>
        </div>
        <div class="accomp-score-item">
          <div class="accomp-score-num">${workoutToday.length > 0 ? '✓' : '—'}</div>
          <div class="accomp-score-label">Workout</div>
        </div>
        ${lastWeight ? `<div class="accomp-score-item">
          <div class="accomp-score-num">${lastWeight}<span style="font-size:14px;color:rgba(255,255,255,0.35)"> lbs</span></div>
          <div class="accomp-score-label">Logged</div>
        </div>` : ''}
      </div>`;

    // ── Habits ──
    const hEl = $('accomp-habits');
    if (hEl) {
      if (!doneHabits.length && !skippedHabits.length) {
        hEl.innerHTML = `<div class="accomp-empty">No habits logged yet today</div>`;
      } else {
        hEl.innerHTML = [
          ...doneHabits.map(h => `<div class="accomp-item"><span class="accomp-check">✓</span><span>${h.icon} ${h.label} <span style="color:var(--text-dim);font-size:11px">${h.duration}</span></span></div>`),
          ...skippedHabits.map(h => `<div class="accomp-item" style="opacity:0.4"><span style="font-size:15px;flex-shrink:0">—</span><span>${h.icon} ${h.label} <span style="color:var(--text-dim);font-size:11px">skipped</span></span></div>`),
        ].join('');
      }
    }

    // ── Agenda ──
    const aEl = $('accomp-agenda');
    if (aEl) {
      if (!checkedAgenda.length && !completedTasks.length) {
        aEl.innerHTML = `<div class="accomp-empty">No tasks checked off yet</div>`;
      } else {
        aEl.innerHTML = [
          ...checkedAgenda.map(t =>
            `<div class="accomp-item"><span class="accomp-check">✓</span><span>${t}</span></div>`),
          ...completedTasks.map(t =>
            `<div class="accomp-item"><span class="accomp-check">✓</span><span>${t.task}<span style="color:var(--text-dim);font-size:11px;margin-left:6px">${t.category}</span></span></div>`),
        ].join('');
      }
    }

    // ── Workout ──
    const wEl = $('accomp-workout');
    if (wEl) {
      if (!workoutToday.length) {
        wEl.innerHTML = `<div class="accomp-empty">No workout logged today</div>`;
      } else {
        wEl.innerHTML = workoutToday.map(w =>
          `<div class="accomp-item"><span class="accomp-check">✓</span><span>${w.icon} ${w.workout}</span></div>`
        ).join('');
      }
    }

    // ── Weight ──
    const wtEl = $('accomp-weight');
    if (wtEl) {
      if (!lastWeight) {
        wtEl.innerHTML = `<div class="accomp-empty">No weight logged today</div>`;
      } else {
        const prev = (LS.get('weightLog') || []).filter(w => w.date < isoToday);
        const prevW = prev.length ? prev[prev.length - 1].weight : null;
        const diff  = prevW ? (lastWeight - prevW).toFixed(1) : null;
        const diffStr = diff ? `<span style="color:${diff > 0 ? '#22c55e' : '#ef4444'};font-size:11px;margin-left:4px">${diff > 0 ? '+' : ''}${diff} lbs</span>` : '';
        wtEl.innerHTML = `<div class="accomp-item"><span class="accomp-check">✓</span><span>${lastWeight} lbs${diffStr}</span></div>`;
      }
    }
  },

  deleteBriefing(id) {
    LS.set('briefings', (LS.get('briefings')||[]).filter(b=>b.id!==id));
    App.renderBriefings();
    App.renderToday();
  },

  async renderSchedule() {
    const content = $('sched-content');
    if (!content) return;
    GCal._load();

    if (!GCal.isConnected()) {
      const hasId = !!GCal._clientId;
      content.innerHTML = `
        <div style="text-align:center;padding:56px 16px">
          <div style="font-size:2.5rem;margin-bottom:12px">📅</div>
          <div style="font-size:1rem;font-weight:600;color:var(--text);margin-bottom:8px">Connect Google Calendar</div>
          <div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:20px;max-width:280px;margin-left:auto;margin-right:auto">
            ${hasId ? 'Your session expired. Click below to re-authorize.' : 'See your live weekly events right in the dashboard.'}
          </div>
          <button class="btn-primary" onclick="openModal('modal-gcal-connect');GCal._updateConnectModal()">
            ${hasId ? 'Reconnect Calendar' : 'Connect Calendar'}
          </button>
        </div>`;
      return;
    }

    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + GCal._weekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const fmt = d => d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
    const labelEl = $('sched-week-label');
    if (labelEl) labelEl.textContent = `${fmt(monday)} – ${fmt(sunday)}`;

    content.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-dim)">Loading…</div>';
    const events = await GCal._fetchEvents(monday.toISOString(), sunday.toISOString());

    if (events === null) {
      content.innerHTML = `<div style="text-align:center;padding:40px 16px;color:var(--text-dim)">
        <div style="margin-bottom:12px">Session expired.</div>
        <button class="btn-primary" onclick="GCal.reconnect()">Reconnect</button></div>`;
      return;
    }

    // Bucket events into days
    const days = Array.from({length:7}, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      return {date:d, allDay:[], timed:[]};
    });
    for (const ev of events) {
      const isAllDay = !ev.start?.dateTime;
      const raw = ev.start?.dateTime || ev.start?.date;
      if (!raw) continue;
      // Compare by local date string to avoid timezone/rounding issues
      const evLocalDate = isAllDay ? raw.slice(0, 10)
        : new Date(raw).toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
      const idx = days.findIndex(d => {
        const ds = d.date.getFullYear() + '-' +
          String(d.date.getMonth()+1).padStart(2,'0') + '-' +
          String(d.date.getDate()).padStart(2,'0');
        return ds === evLocalDate;
      });
      if (idx < 0) continue;
      isAllDay ? days[idx].allDay.push(ev) : days[idx].timed.push(ev);
    }

    // Dynamic hour range
    let startHour = 8, endHour = 18;
    for (const {timed} of days) {
      for (const ev of timed) {
        const sh = new Date(ev.start.dateTime).getHours();
        const em = new Date(ev.end.dateTime);
        const eh = em.getHours() + (em.getMinutes() > 0 ? 1 : 0);
        if (sh < startHour) startHour = sh;
        if (eh > endHour)   endHour   = eh;
      }
    }
    startHour = Math.max(0,  startHour - 1);
    endHour   = Math.min(24, endHour   + 1);

    const HOUR_H   = 56;
    const TIME_W   = 40;
    const totalH   = (endHour - startHour) * HOUR_H;
    const fmtTime  = s => new Date(s).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'});
    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    // Time labels
    const timeLabels = Array.from({length: endHour - startHour + 1}, (_, i) => {
      const h = startHour + i;
      const lbl = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h-12}p`;
      return `<div style="position:absolute;top:${i*HOUR_H - 7}px;right:4px;font-size:0.6rem;color:var(--text-dim);line-height:1">${lbl}</div>`;
    }).join('');

    // Grid lines
    const gridLines = Array.from({length: endHour - startHour}, (_, i) =>
      `<div style="position:absolute;top:${(i+1)*HOUR_H}px;left:0;right:0;border-top:1px solid #D8E0EF"></div>`
    ).join('');

    // Current time indicator
    let nowLine = '';
    if (GCal._weekOffset === 0) {
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const startMins = startHour * 60;
      if (nowMins >= startMins && now.getHours() < endHour) {
        const topPx = (nowMins - startMins) / 60 * HOUR_H;
        nowLine = `<div style="position:absolute;top:${topPx}px;left:0;right:0;display:flex;align-items:center;z-index:3;pointer-events:none">
          <div style="width:8px;height:8px;border-radius:50%;background:#ef4444;flex-shrink:0;margin-left:-4px"></div>
          <div style="flex:1;height:2px;background:#ef4444"></div>
        </div>`;
      }
    }

    // Day headers + all-day strip
    const hasAnyAllDay = days.some(d => d.allDay.length > 0);
    const headers = days.map(({date, allDay}, i) => {
      const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const isToday = ds === isoToday;
      const dayNum  = date.toLocaleDateString('en-US', {month:'short', day:'numeric'});
      const adHtml  = allDay.map(ev =>
        `<div style="font-size:0.65rem;background:#0C2340;color:#fff;border-radius:3px;padding:1px 4px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ev.summary||'(no title)'}</div>`
      ).join('');
      return `<div style="flex:1;min-width:0;text-align:center;padding:2px 2px 4px">
        <div style="display:inline-flex;flex-direction:column;align-items:center;padding:4px 8px;border-radius:8px;${isToday ? 'background:#0C2340' : ''}">
          <div style="font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:${isToday?'#fff':'#8A96AC'}">${dayNames[i]}</div>
          <div style="font-size:0.88rem;font-weight:600;color:${isToday?'#fff':'#0C2340'}">${dayNum}</div>
        </div>
        ${adHtml}
      </div>`;
    }).join('');

    // Timed event columns
    GCal._eventMap = {};
    const eventCols = days.map(({timed}) => {
      const blocks = timed.map(ev => {
        GCal._eventMap[ev.id] = ev;
        const sd  = new Date(ev.start.dateTime);
        const ed  = new Date(ev.end.dateTime);
        const top = ((sd.getHours() - startHour) * 60 + sd.getMinutes()) / 60 * HOUR_H;
        const h   = Math.max((ed - sd) / 3600000 * HOUR_H, 20);
        const showTime = h >= 28;
        return `<div style="position:absolute;top:${top}px;left:2px;right:2px;height:${h}px;background:#163556;border-radius:4px;padding:3px 6px;overflow:hidden;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.15)"
          onclick="GCal.openEventDetail('${ev.id.replace(/'/g,"\\'")}')"
          title="${(ev.summary||'').replace(/"/g,'&quot;')} · ${fmtTime(ev.start.dateTime)} – ${fmtTime(ev.end.dateTime)}">
          <div style="font-size:0.7rem;font-weight:600;color:#fff;line-height:1.25;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${ev.summary||'(no title)'}</div>
          ${showTime ? `<div style="font-size:0.62rem;color:rgba(255,255,255,0.75);margin-top:1px">${fmtTime(ev.start.dateTime)}</div>` : ''}
        </div>`;
      }).join('');
      return `<div style="flex:1;min-width:0;position:relative;height:${totalH}px;border-left:1px solid #D8E0EF">${blocks}</div>`;
    }).join('');

    content.innerHTML = `
      <div style="overflow-x:auto">
        <div style="min-width:480px">
          <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:2px;margin-left:${TIME_W}px">
            ${headers}
          </div>
          <div style="display:flex;overflow-y:auto;max-height:calc(100vh - 180px)">
            <div style="width:${TIME_W}px;flex-shrink:0;position:relative;height:${totalH}px">${timeLabels}</div>
            <div style="flex:1;position:relative;display:flex;height:${totalH}px">
              <div style="position:absolute;inset:0;pointer-events:none">${gridLines}${nowLine}</div>
              ${eventCols}
            </div>
          </div>
        </div>
      </div>`;
  },
};

// ─── GOOGLE CALENDAR ──────────────────────────────────────────────────────────
const GCal = {
  _workerUrl: null,
  _token: null,
  _tokenExpiry: 0,
  _weekOffset: 0,
  _todayCache: null,
  _eventMap: {},

  _load() {
    this._workerUrl   = localStorage.getItem('_gcal_worker_url') || null;
    this._token       = localStorage.getItem('_gcal_token') || null;
    this._tokenExpiry = parseInt(localStorage.getItem('_gcal_token_expiry') || '0');
  },

  // Connected = we have a refresh token AND a worker URL (access token may be expired)
  isConnected() {
    return !!(localStorage.getItem('_gcal_refresh_token') && this._workerUrl);
  },

  // Ensure we have a valid access token, refreshing silently if needed
  async _ensureToken() {
    if (this._token && Date.now() < this._tokenExpiry) return true;
    const refreshToken = localStorage.getItem('_gcal_refresh_token');
    if (!refreshToken || !this._workerUrl) return false;
    try {
      const res = await fetch(`${this._workerUrl}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await res.json();
      if (!data.access_token) return false;
      this._token = data.access_token;
      this._tokenExpiry = Date.now() + (parseInt(data.expires_in) - 60) * 1000;
      localStorage.setItem('_gcal_token', this._token);
      localStorage.setItem('_gcal_token_expiry', String(this._tokenExpiry));
      return true;
    } catch(e) { return false; }
  },

  openEventDetail(id) {
    const ev = this._eventMap?.[id];
    if (!ev) return;
    const fmtT = s => new Date(s).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'});
    const allDay = !ev.start?.dateTime;
    const timeStr = allDay ? 'All day' : `${fmtT(ev.start.dateTime)} – ${fmtT(ev.end.dateTime)}`;
    const dateStr = new Date(ev.start?.dateTime || ev.start?.date + 'T12:00:00')
      .toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});
    const el = $('event-detail-body');
    if (el) el.innerHTML = `
      <div style="font-size:1rem;font-weight:700;color:#0C2340;margin-bottom:6px">${ev.summary||'(no title)'}</div>
      <div style="font-size:0.85rem;color:#4A5870;margin-bottom:4px">${dateStr}</div>
      <div style="font-size:0.85rem;color:#4A5870;margin-bottom:${ev.description?'12px':'0'}">${timeStr}</div>
      ${ev.description ? `<div style="font-size:0.82rem;color:#4A5870;border-top:1px solid #D8E0EF;padding-top:10px;margin-top:4px">${ev.description}</div>` : ''}`;
    openModal('modal-event-detail');
  },

  connectFromModal() {
    const workerInput = $('gcal-worker-url-input');
    const url = (workerInput?.value || '').trim().replace(/\/$/, '');
    if (!url) { workerInput?.focus(); return; }
    this._workerUrl = url;
    localStorage.setItem('_gcal_worker_url', url);
    this._openPopup();
  },

  reconnect() { this._openPopup(); },

  _openPopup() {
    if (!this._workerUrl) return;
    const popup = window.open(`${this._workerUrl}/start`, 'gcal_auth',
      'width=500,height=650,left=200,top=100');
    const handler = e => {
      if (e.origin !== new URL(this._workerUrl).origin && !e.data?.type) return;
      if (e.data?.type !== 'gcal_tokens') return;
      window.removeEventListener('message', handler);
      if (popup && !popup.closed) popup.close();
      if (!e.data.access_token) { alert('Auth failed. Check your worker setup.'); return; }
      this._token = e.data.access_token;
      this._tokenExpiry = Date.now() + (parseInt(e.data.expires_in) - 60) * 1000;
      localStorage.setItem('_gcal_token', this._token);
      localStorage.setItem('_gcal_token_expiry', String(this._tokenExpiry));
      if (e.data.refresh_token) localStorage.setItem('_gcal_refresh_token', e.data.refresh_token);
      closeModal('modal-gcal-connect');
      this._todayCache = null;
      App.renderSchedule();
      GCal.fetchTodayEvents().then(() => App.renderToday());
    };
    window.addEventListener('message', handler);
  },

  disconnect() {
    this._token = null; this._tokenExpiry = 0; this._todayCache = null;
    ['_gcal_token','_gcal_token_expiry','_gcal_refresh_token'].forEach(k => localStorage.removeItem(k));
    closeModal('modal-gcal-connect');
    App.renderSchedule();
    App.renderToday();
  },

  prevWeek()  { this._weekOffset--; App.renderSchedule(); },
  nextWeek()  { this._weekOffset++; App.renderSchedule(); },
  thisWeek()  { this._weekOffset = 0; App.renderSchedule(); },

  _updateConnectModal() {
    this._load();
    const connected = this.isConnected();
    const cv = $('gcal-connected-view'), nv = $('gcal-connect-view');
    if (cv) cv.style.display = connected ? '' : 'none';
    if (nv) nv.style.display = connected ? 'none' : '';
    if (!connected && this._workerUrl) {
      const inp = $('gcal-worker-url-input');
      if (inp) inp.value = this._workerUrl;
    }
  },

  async _fetchEvents(timeMin, timeMax) {
    const ok = await this._ensureToken();
    if (!ok) return null;
    try {
      const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      url.searchParams.set('timeMin', timeMin);
      url.searchParams.set('timeMax', timeMax);
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('maxResults', '100');
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${this._token}` } });
      if (res.status === 401) { this._token = null; localStorage.removeItem('_gcal_token'); return null; }
      return (await res.json()).items || [];
    } catch(e) { console.warn('[GCal] fetch error', e); return null; }
  },

  async fetchTodayEvents() {
    this._load();
    if (!this.isConnected()) return;
    const start = new Date(isoToday + 'T00:00:00').toISOString();
    const end   = new Date(isoToday + 'T23:59:59').toISOString();
    const evs   = await this._fetchEvents(start, end);
    this._todayCache = evs || [];
  },

  openAddEventModal() {
    const d = $('ae-date'); if (d) d.value = isoToday;
    if ($('ae-start')) $('ae-start').value = '';
    if ($('ae-end'))   $('ae-end').value   = '';
    if ($('ae-title')) $('ae-title').value = '';
    if ($('ae-notes')) $('ae-notes').value = '';
    openModal('modal-add-event');
    setTimeout(() => $('ae-title')?.focus(), 50);
  },

  async saveNewEvent() {
    const title = ($('ae-title')?.value || '').trim();
    const date  = $('ae-date')?.value;
    const start = $('ae-start')?.value;
    const end   = $('ae-end')?.value;
    if (!title || !date || !start || !end) { alert('Title, date, start and end time are required.'); return; }
    if (start >= end) { alert('End time must be after start time.'); return; }
    const btn = $('ae-save-btn');
    if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
    const ok = await this._ensureToken();
    if (!ok) { alert('Not connected. Please reconnect your calendar.'); if (btn) { btn.textContent = 'Save'; btn.disabled = false; } return; }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this._token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: title,
          description: ($('ae-notes')?.value || '').trim(),
          start: { dateTime: new Date(`${date}T${start}`).toISOString(), timeZone: tz },
          end:   { dateTime: new Date(`${date}T${end}`).toISOString(),   timeZone: tz },
        }),
      });
      if (res.ok) {
        closeModal('modal-add-event');
        this._todayCache = null;
        App.renderSchedule();
        GCal.fetchTodayEvents().then(() => App.renderToday());
      } else {
        alert('Failed to save event. Please try again.');
      }
    } catch(e) { alert('Network error. Please try again.'); }
    if (btn) { btn.textContent = 'Save'; btn.disabled = false; }
  },
};

// ─── MODAL HELPERS ────────────────────────────────────────────────────────────
function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id); });

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initState();
  computeTaskResets();
  computeRollovers();
  scheduleMidnightRefresh();
  Sync.init();
  document.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', () => App.navigate(el.dataset.page)));
  $('br-date') && ($('br-date').value = isoToday);
  App.navigate('today');
  // Load briefings with timestamp — bypasses every cache layer (browser, CDN, SW)
  const bs = document.createElement('script');
  bs.src = './daily_briefings.js?_t=' + Date.now();
  bs.onerror = () => {};
  document.head.appendChild(bs);
  // Pre-fetch today's calendar events for Today tab preview
  GCal._load();
  if (GCal.isConnected()) GCal.fetchTodayEvents().then(() => App.renderToday());
});
