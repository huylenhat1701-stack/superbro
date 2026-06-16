// ═══════════════════════════════════════════════════════════════
// Auth Module — Login, Register, Logout, Session management
// ═══════════════════════════════════════════════════════════════
const Auth = {
  _user: null,
  _token: null,

  init() {
    this._token = localStorage.getItem('tt_token');
    const userStr = localStorage.getItem('tt_user');
    if (userStr) {
      try { this._user = JSON.parse(userStr); } catch { this.clearSession(); }
    }
  },

  getToken()  { return this._token; },
  getUser()   { return this._user; },
  isLoggedIn(){ return !!this._token && !!this._user; },
  isGuide()   { return this._user?.role === 'guide'; },
  isTraveller(){ return this._user?.role === 'traveller'; },

  saveSession(token, user) {
    this._token = token;
    this._user = user;
    localStorage.setItem('tt_token', token);
    localStorage.setItem('tt_user', JSON.stringify(user));
  },

  clearSession() {
    this._token = null;
    this._user = null;
    localStorage.removeItem('tt_token');
    localStorage.removeItem('tt_user');
  },

  // ─── UI Logic ───────────────────────────────────────────────
  async doLogin(email, password) {
    const btn = document.getElementById('btn-login');
    UI.setLoading(btn, true);

    const res = await Api.auth.login({ email, password });
    UI.setLoading(btn, false);

    if (!res.success) {
      UI.showToast(res.message, 'error');
      return;
    }

    this.saveSession(res.data.token, res.data.user);
    UI.closeModal('modal-auth');
    UI.showToast(`Welcome back, ${res.data.user.username}! 🎉`, 'success');
    UI.updateNavbar();
    App.navigate('home');
  },

  async doRegister(username, email, password, role) {
    const btn = document.getElementById('btn-register');
    UI.setLoading(btn, true);

    const res = await Api.auth.register({ username, email, password, role });
    UI.setLoading(btn, false);

    if (!res.success) {
      UI.showToast(res.message, 'error');
      return;
    }

    this.saveSession(res.data.token, res.data.user);
    UI.closeModal('modal-auth');
    UI.showToast(`Welcome to TravelSuite, ${res.data.user.username}! ✈️`, 'success');
    UI.updateNavbar();
    App.navigate('home');
  },

  async doLogout() {
    if (!this.isLoggedIn()) return;
    await Api.auth.logout();
    this.clearSession();
    UI.showToast('Logged out successfully. Safe travels! 👋', 'info');
    UI.updateNavbar();
    App.navigate('home');
  }
};

// ─── Auth Form Handlers ───────────────────────────────────────
function bindAuthForms() {
  // Login form
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      if (!email || !password) { UI.showToast('Please fill all fields', 'error'); return; }
      await Auth.doLogin(email, password);
    });
  }

  // Register form
  const registerForm = document.getElementById('form-register');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const role     = document.getElementById('reg-role').value;
      if (!username || !email || !password || !role) { UI.showToast('Please fill all fields', 'error'); return; }
      if (password.length < 6) { UI.showToast('Password must be at least 6 characters', 'error'); return; }
      await Auth.doRegister(username, email, password, role);
    });
  }
}

window.Auth = Auth;
window.bindAuthForms = bindAuthForms;
