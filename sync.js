// Cole.ai cross-device sync via private GitHub Gist
// Token and Gist ID are stored only in localStorage — never in code or on GitHub.
const Sync = {
  _token:  null,
  _gistId: null,
  _timer:  null,
  _pushTimer: null,
  _skip: new Set(['_sync_token','_sync_gist_id','_sync_dirty','_gcal_token','_gcal_token_expiry','_gcal_refresh_token']),

  init() {
    this._token  = localStorage.getItem('_sync_token')  || null;
    this._gistId = localStorage.getItem('_sync_gist_id') || null;
    if (!this._token) { this._updateIndicator(); return; }

    const start = async () => {
      if (typeof computeTaskResets !== 'undefined') computeTaskResets();
      await this._loadBriefings();
      if (typeof App !== 'undefined') {
        const active = document.querySelector('.page.active');
        if (active) App.renderPage(active.id.replace('page-',''));
      }
      this._startPolling();
    };

    const dirty = localStorage.getItem('_sync_dirty');

    if (!this._gistId) {
      // No gist ID stored — find the existing one first
      this._findGist().then(id => {
        if (id) {
          this._gistId = id;
          localStorage.setItem('_sync_gist_id', id);
          if (dirty) {
            this._push().then(() => this.pull().then(start));
          } else {
            this.pull().then(start);
          }
        } else {
          // No gist exists yet — push to create one
          this._push().then(start);
        }
      });
    } else if (dirty) {
      // Local data is newer — push first, then pull
      this._push().then(() => this.pull().then(start));
    } else {
      this.pull().then(start);
    }

    this._updateIndicator();
  },

  // Search GitHub for an existing coleai-state.json gist
  async _findGist() {
    try {
      const res = await fetch('https://api.github.com/gists?per_page=100', {
        headers: { Authorization: `token ${this._token}`, Accept: 'application/vnd.github.v3+json' }
      });
      if (!res.ok) return null;
      const gists = await res.json();
      const found = gists.find(g => g.files && g.files['coleai-state.json']);
      return found ? found.id : null;
    } catch(e) { return null; }
  },

  async pull() {
    if (!this._token || !this._gistId) return;
    try {
      const res = await fetch(`https://api.github.com/gists/${this._gistId}`, {
        headers: { Authorization: `token ${this._token}`, Accept: 'application/vnd.github.v3+json' }
      });
      if (!res.ok) return;
      const gist = await res.json();
      const file = gist.files['coleai-state.json'];
      if (!file) return;
      const remote = JSON.parse(file.content);
      Object.entries(remote).forEach(([k, v]) => {
        if (!this._skip.has(k)) localStorage.setItem(k, JSON.stringify(v));
      });
    } catch(e) { console.warn('[Sync] pull failed', e); }
  },

  schedulePush() {
    if (!this._token) return;
    localStorage.setItem('_sync_dirty', '1');
    clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => this._push(), 500);
  },

  async _push() {
    if (!this._token) return;
    const state = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!this._skip.has(k)) {
        try { state[k] = JSON.parse(localStorage.getItem(k)); } catch {}
      }
    }
    const files = { 'coleai-state.json': { content: JSON.stringify(state, null, 2) } };
    try {
      if (!this._gistId) {
        const res = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: { Authorization: `token ${this._token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'Cole.ai dashboard sync', public: false, files })
        });
        const data = await res.json();
        this._gistId = data.id;
        localStorage.setItem('_sync_gist_id', this._gistId);
      } else {
        await fetch(`https://api.github.com/gists/${this._gistId}`, {
          method: 'PATCH',
          headers: { Authorization: `token ${this._token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ files })
        });
      }
      localStorage.removeItem('_sync_dirty');
      this._updateIndicator('synced');
    } catch(e) {
      console.warn('[Sync] push failed', e);
      this._updateIndicator('error');
    }
  },

  _loadBriefings() {
    return new Promise(resolve => {
      try {
        const s = document.createElement('script');
        s.src = './daily_briefings.js?_t=' + Date.now();
        s.onload = resolve;
        s.onerror = resolve;
        document.head.appendChild(s);
      } catch(e) { resolve(); }
    });
  },

  _startPolling() {
    clearInterval(this._timer);
    this._timer = setInterval(async () => {
      await this.pull();
      if (typeof computeTaskResets !== 'undefined') computeTaskResets();
      await this._loadBriefings();
      if (typeof App !== 'undefined') {
        const active = document.querySelector('.page.active');
        if (active) App.renderPage(active.id.replace('page-',''));
      }
    }, 60000);
  },

  async connect(token) {
    this._token = token;
    localStorage.setItem('_sync_token', token);
    // Find existing coleai gist so all devices share the same one
    const existingId = await this._findGist();
    if (existingId) {
      this._gistId = existingId;
      localStorage.setItem('_sync_gist_id', existingId);
      await this.pull();
    } else {
      this._gistId = null;
      localStorage.removeItem('_sync_gist_id');
      await this._push();
    }
    this._startPolling();
    this._updateIndicator('synced');
  },

  disconnect() {
    clearInterval(this._timer);
    this._token  = null;
    this._gistId = null;
    localStorage.removeItem('_sync_token');
    localStorage.removeItem('_sync_gist_id');
    localStorage.removeItem('_sync_dirty');
    this._updateIndicator();
  },

  isEnabled() { return !!this._token; },

  _updateIndicator(state) {
    const color = state === 'error' ? '#ef4444' : this._token ? '#22c55e' : 'rgba(255,255,255,0.2)';
    const title = state === 'synced' ? 'Synced' : state === 'error' ? 'Sync error' : this._token ? 'Sync on' : 'Sync off';
    ['sync-dot','sidebar-sync-dot'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.background = color; el.title = title; }
    });
  },
};
