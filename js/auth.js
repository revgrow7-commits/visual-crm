// ===== AUTH MODULE — JWT Simulation =====
const Auth = {
  USERS: [
    { id:1, name:'Carlos Mendes',  email:'carlos@visualcrm.com',  password:'crm2026',   role:'Vendedor',          region:'sp',  initials:'CM' },
    { id:2, name:'Ana Lima',       email:'ana@visualcrm.com',     password:'crm2026',   role:'Gerente Comercial', region:'sp',  initials:'AL' },
    { id:3, name:'Roberto Santos', email:'roberto@visualcrm.com', password:'crm2026',   role:'Vendedor',          region:'poa', initials:'RS' },
    { id:4, name:'Administrador',  email:'admin@visualcrm.com',   password:'admin2026', role:'Administrador',     region:'sp',  initials:'AD' }
  ],

  _b64(o)  { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); },
  _b64d(s) { try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch { return null; } },

  _createToken(user) {
    const header  = this._b64({ alg:'HS256', typ:'JWT' });
    const payload = this._b64({
      sub:user.id, name:user.name, email:user.email,
      role:user.role, region:user.region, initials:user.initials,
      iat:Date.now(), exp:Date.now() + 8 * 3600000
    });
    const sig = btoa(user.id + user.email + 'vcrm2026sk');
    return `${header}.${payload}.${sig}`;
  },

  _decode(token) {
    if (!token) return null;
    const p = token.split('.');
    return p.length === 3 ? this._b64d(p[1]) : null;
  },

  login(email, password) {
    const user = this.USERS.find(u =>
      u.email === email.trim().toLowerCase() && u.password === password
    );
    if (!user) return { ok:false, error:'E-mail ou senha incorretos.' };
    localStorage.setItem('crm_jwt', this._createToken(user));
    return { ok:true, user };
  },

  logout() {
    localStorage.removeItem('crm_jwt');
    location.reload();
  },

  getUser() {
    const payload = this._decode(localStorage.getItem('crm_jwt'));
    if (!payload || Date.now() > payload.exp) {
      localStorage.removeItem('crm_jwt');
      return null;
    }
    return payload;
  },

  isAuthenticated() { return !!this.getUser(); }
};

// ===== DARK MODE =====
const Theme = {
  get()    { return localStorage.getItem('crm_theme') || 'light'; },
  apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('darkModeToggle');
    if (!btn) return;
    btn.innerHTML = t === 'dark'
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.title = t === 'dark' ? 'Modo claro' : 'Modo escuro';
  },
  toggle() {
    const t = this.get() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('crm_theme', t);
    this.apply(t);
  }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme immediately (before any render)
  Theme.apply(Theme.get());

  const overlay = document.getElementById('loginOverlay');
  const user    = Auth.getUser();

  if (user) {
    if (overlay) overlay.style.display = 'none';
    _applyUser(user);
    const regionSel = document.getElementById('regionSelect');
    if (regionSel && user.region) regionSel.value = user.region;
  } else {
    _bindLoginForm();
    // Block app interaction while login is showing
    const app = document.getElementById('app');
    if (app) app.style.pointerEvents = 'none';
  }

  document.getElementById('darkModeToggle')
    ?.addEventListener('click', () => Theme.toggle());

  document.getElementById('btnLogout')
    ?.addEventListener('click', () => Auth.logout());

  document.querySelector('.sidebar-user')
    ?.addEventListener('click', () => {
      if (Auth.isAuthenticated() && confirm('Deseja sair do sistema?')) Auth.logout();
    });
});

function _bindLoginForm() {
  const form  = document.getElementById('loginForm');
  const errEl = document.getElementById('loginError');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn    = form.querySelector('button[type=submit]');
    const result = Auth.login(
      document.getElementById('loginEmail').value,
      document.getElementById('loginPassword').value
    );

    if (result.ok) {
      btn.textContent  = '✓ Bem-vindo!';
      btn.style.background = '#10b981';
      setTimeout(() => location.reload(), 500);
    } else {
      errEl.textContent    = result.error;
      errEl.style.display  = 'block';
      document.getElementById('loginPassword').value = '';
      document.querySelector('.login-card').classList.add('shake');
      setTimeout(() => document.querySelector('.login-card').classList.remove('shake'), 500);
    }
  });

  document.querySelectorAll('.demo-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('loginEmail').value    = btn.dataset.email;
      document.getElementById('loginPassword').value = btn.dataset.pass;
      form.requestSubmit();
    });
  });
}

function _applyUser(user) {
  document.querySelectorAll('.sidebar-avatar').forEach(el => el.textContent = user.initials);
  document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = user.name);
  document.querySelectorAll('.sidebar-user-role').forEach(el => el.textContent = user.role);
  const topbarAvatar = document.querySelector('.user-info > div');
  if (topbarAvatar) topbarAvatar.textContent = user.initials;
  const topbarName = document.querySelector('.user-name');
  if (topbarName) topbarName.textContent = user.name.split(' ')[0];
}
