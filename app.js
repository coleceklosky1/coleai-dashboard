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
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const isoToday = new Date().toISOString().slice(0,10);

function getYesterday() {
  const d = new Date(isoToday + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0,10);
}

// Called once at startup: carry any unchecked items from yesterday into today's rollover list.
function computeRollovers() {
  const yesterday = getYesterday();
  const rollovers  = LS.get('agendaRollovers') || {};
  if (rollovers[isoToday] !== undefined) return; // already computed today

  const scheduled  = WEEKLY_AGENDA[yesterday]?.tasks || [];
  const rolled     = rollovers[yesterday] || [];
  const allYest    = [...rolled, ...scheduled];
  const doneSet    = new Set((LS.get('agendaChecks') || {})[yesterday] || []);

  rollovers[isoToday] = allYest
    .filter(t => !doneSet.has(t.task))
    .map(t => ({ ...t, rolledFrom: t.rolledFrom || yesterday }));

  LS.set('agendaRollovers', rollovers);
}

function getTodaysAgendaItems() {
  const rollovers = LS.get('agendaRollovers') || {};
  const rolled    = (rollovers[isoToday] || []).map(t => ({ ...t, isRollover: true }));
  const scheduled = (WEEKLY_AGENDA[isoToday]?.tasks || []).map(t => ({ ...t, isRollover: false }));
  return [...rolled, ...scheduled];
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

// Returns {wo, woIdx, isFri} for today
function getTodaysWorkout() {
  if (isFriday()) return { wo: WORKOUT_ROTATION[4], woIdx: 4, isFri: true };
  const idx = (LS.get('workoutIdx') || 0) % 4;
  return { wo: WORKOUT_ROTATION[idx], woIdx: idx, isFri: false };
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
    'Markets':'badge-green','Science':'badge-purple','World':'badge-amber',
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
    const titles = {today:'Today',tasks:'Tasks',fitness:'Fitness',companies:'Career',network:'Network',briefings:'Briefings'};
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
      companies:App.renderCompanies, network:App.renderContacts, briefings:App.renderBriefings}[p] || (()=>{}))();
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
    const isFri = isFriday();

    // Welcome card
    const wg = $('welcome-greeting');
    const wd = $('welcome-date');
    const wt = $('welcome-theme');
    if (wg) wg.textContent = `${greet}, Cole.`;
    if (wd) wd.textContent = fd.full;

    const agenda = WEEKLY_AGENDA[isoToday];
    if (wt) wt.textContent = agenda ? `📌 Today: ${agenda.theme}` : isFri ? '🏃 Friday — run day' : '📋 No scheduled theme today';

    // Stats
    const todayTasks = (WEEKLY_AGENDA[isoToday]?.tasks || []).length;
    const habits = LS.get('habits')[isoToday] || {};
    const habitsForToday = getHabitsForDate(isoToday);
    const doneCt = habitsForToday.filter(h => habits[h.id] === 'done').length;
    const wLog = LS.get('weightLog') || [];
    const lastW = wLog.length ? wLog[wLog.length - 1].weight : 176;
    const { wo } = getTodaysWorkout();

    $('stat-streak').textContent = App.calcStreak();
    $('stat-tasks-today').textContent = todayTasks;
    $('stat-workout').textContent = wo.name;
    $('stat-workout-day').textContent = isFri ? 'Every Friday' : `Day ${((LS.get('workoutIdx')||0)%4)+1} of 4`;
    $('stat-weight').textContent = lastW;
    const sw = $('sidebar-weight'); if (sw) sw.textContent = `${lastW} lbs`;
    const dw = $('drawer-weight'); if (dw) dw.textContent = `${lastW} lbs`;

    App.renderHabits();

    // Agenda tasks
    const agEl    = $('today-agenda-tasks');
    const agTitle = $('today-agenda-title');
    if (agTitle) agTitle.textContent = agenda ? `Today's Agenda · ${agenda.theme}` : "Today's Agenda";

    const agItems  = getTodaysAgendaItems();
    const doneSet  = new Set((LS.get('agendaChecks') || {})[isoToday] || []);

    if (agItems.length) {
      agEl.innerHTML = agItems.map(t => {
        const done    = doneSet.has(t.task);
        const escaped = t.task.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
        const rollBadge = t.isRollover
          ? `<span class="badge-rollover">↩ ${fmtDate(t.rolledFrom).short}</span>`
          : '';
        return `
        <div class="agenda-item ${done ? 'completed-row' : ''}" data-task="${escaped}" onclick="App.toggleAgendaCheck(this.dataset.task)">
          <div class="agenda-check ${done ? 'checked' : ''}">${done ? '✓' : ''}</div>
          <div style="flex:1">
            <div class="agenda-task">${t.task}${rollBadge}</div>
            <div class="agenda-meta"><span class="${catColor(t.category)}">${t.category}</span> · ${t.deadline}</div>
          </div>
          <div class="agenda-hrs">${t.hours}h</div>
        </div>`;
      }).join('');
    } else {
      agEl.innerHTML = `<div style="color:var(--text-dim);font-size:13px;padding:20px 0;text-align:center">No agenda for today</div>`;
    }

    // Workout preview
    const wTitle = $('today-workout-title');
    const wPrev = $('today-workout-preview');
    if (wTitle) wTitle.textContent = `${wo.icon} ${wo.name}`;
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
  },

  calcStreak() {
    const habits = LS.get('habits') || {};
    let streak = 0;
    const d = new Date();
    while (streak < 365) {
      const key = d.toISOString().slice(0, 10);
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
    t.status = t.status === 'Completed' ? 'Not started' : 'Completed';
    LS.set('tasks', tasks);
    App.renderTasks();
    App.renderToday();
  },

  // ─── FITNESS ───────────────────────────────────────────────────────────────
  renderFitness() {
    const { woIdx } = getTodaysWorkout();
    App.renderWorkout(isFriday() ? 4 : woIdx);
    App.renderWeightChart();
    App.renderWeightLog();
    App.renderWorkoutHistory();
    const wLog = LS.get('weightLog') || [];
    const lastW = wLog.length ? wLog[wLog.length - 1].weight : 176;
    const fw = $('fitness-weight'); if (fw) fw.textContent = lastW;
    const sw = $('sidebar-weight'); if (sw) sw.textContent = `${lastW} lbs`;
    const dw = $('drawer-weight'); if (dw) dw.textContent = `${lastW} lbs`;
    $('stat-weight').textContent = lastW;

    // Friday indicator
    const fridayEl = $('friday-indicator');
    if (fridayEl) fridayEl.style.display = isFriday() ? 'inline-flex' : 'none';
  },

  renderWorkout(displayIdx) {
    const wo = WORKOUT_ROTATION[displayIdx % WORKOUT_ROTATION.length];
    const done = LS.get('exerciseDone') || {};
    const key = String(displayIdx);
    const exDone = done[key] || {};

    const titleEl = $('current-workout-title');
    if (titleEl) titleEl.innerHTML = `<span style="margin-right:8px">${wo.icon}</span>${wo.name}`;

    // Dots — show all 5 (index 4 = Friday run)
    const dotsEl = $('workout-dots');
    if (dotsEl) {
      const activeIdx = isFriday() ? 4 : (LS.get('workoutIdx') || 0) % 4;
      dotsEl.innerHTML = WORKOUT_ROTATION.map((w, i) => `
        <div class="wd-dot ${i===displayIdx%WORKOUT_ROTATION.length?'active':''}" onclick="App.previewWorkout(${i})" title="${w.name}">
          <span>${w.icon}</span>
          <span class="wd-dot-label">${w.short}</span>
        </div>`).join('');
    }

    // Exercises
    const exEl = $('current-workout-exercises');
    if (exEl) {
      exEl.innerHTML = wo.exercises.map((e, i) => `
        <div class="ex-row ${exDone[i] ? 'done-row' : ''}">
          <div class="ex-left">
            <div class="ex-name">${e.name}</div>
            ${e.note ? `<div class="ex-note">${e.note}</div>` : ''}
          </div>
          <span class="ex-sets">${e.sets} sets · failure</span>
          <div class="ex-check ${exDone[i] ? 'done' : ''}" onclick="App.toggleExercise(${i}, ${displayIdx})">${exDone[i] ? '✓' : ''}</div>
        </div>`).join('');
    }
  },

  _previewIdx: null,
  previewWorkout(i) {
    App._previewIdx = i;
    App.renderWorkout(i);
  },
  prevWorkout() {
    const cur = App._previewIdx !== null ? App._previewIdx : (isFriday() ? 4 : (LS.get('workoutIdx')||0)%4);
    App._previewIdx = (cur - 1 + WORKOUT_ROTATION.length) % WORKOUT_ROTATION.length;
    App.renderWorkout(App._previewIdx);
  },
  nextWorkout() {
    const cur = App._previewIdx !== null ? App._previewIdx : (isFriday() ? 4 : (LS.get('workoutIdx')||0)%4);
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
    const isFri = isFriday();
    const { woIdx } = getTodaysWorkout();
    const displayIdx = isFri ? 4 : woIdx;
    const wo = WORKOUT_ROTATION[displayIdx];
    const log = LS.get('workoutLog') || [];
    log.push({ date: isoToday, workout: wo.name, icon: wo.icon, isFriday: isFri });
    LS.set('workoutLog', log);

    // Only advance the rotation index on non-Friday days
    if (!isFri) {
      LS.set('workoutIdx', (LS.get('workoutIdx') || 0) + 1);
    }
    // Clear done state for logged workout
    const done = LS.get('exerciseDone') || {};
    delete done[String(displayIdx)];
    LS.set('exerciseDone', done);
    App._previewIdx = null;

    App.renderFitness();
    App.renderToday();
    const btn = $('log-workout-btn');
    if (btn) { btn.textContent = '✓ Logged!'; btn.style.background='var(--green)'; btn.style.color='#fff'; setTimeout(() => { btn.textContent='Log Workout Complete ✓'; btn.style.background=''; btn.style.color=''; }, 1800); }
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
    const bt = $('co-filter-biotech')?.value || '';
    const st = $('co-filter-status')?.value || '';
    const coStatus = LS.get('coStatus') || {};

    const filtered = COMPANIES.filter(c => {
      if (ind && c.industry !== ind) return false;
      if (bt && c.biotech !== bt) return false;
      const cs = coStatus[c.id] || {};
      if (st === 'interested' && !cs.interested) return false;
      if (st === 'applied' && !cs.applied) return false;
      if (q && !`${c.company} ${c.industry} ${c.roles} ${c.hubs} ${c.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });

    const interested = Object.values(coStatus).filter(s => s.interested).length;
    const applied = Object.values(coStatus).filter(s => s.applied).length;
    const ciEl = $('co-interested'); if (ciEl) ciEl.textContent = interested;
    const caEl = $('co-applied'); if (caEl) caEl.textContent = applied;

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
          <td><span class="badge ${biotechBadge(c.biotech)}">${c.biotech}</span></td>
          <td>
            <div class="action-btns">
              <button class="btn btn-xs btn-ghost" onclick="App.toggleCo(${c.id},'applied')">${cs.applied?'✓ Applied':'Apply'}</button>
              <button class="btn btn-xs btn-ghost" onclick="App.openCoNotes(${c.id})">📝</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    if (!filtered.length) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-dim);padding:40px">No companies match filters</td></tr>';
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
  deleteBriefing(id) {
    LS.set('briefings', (LS.get('briefings')||[]).filter(b=>b.id!==id));
    App.renderBriefings();
    App.renderToday();
  },
};

// ─── MODAL HELPERS ────────────────────────────────────────────────────────────
function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id); });

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initState();
  computeRollovers();
  Sync.init();
  document.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', () => App.navigate(el.dataset.page)));
  $('br-date') && ($('br-date').value = isoToday);
  App.navigate('today');
});
