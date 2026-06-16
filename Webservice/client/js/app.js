// ═══════════════════════════════════════════════════════════════
// App — SPA Router, UI Helpers, and Main Entry Point
// ═══════════════════════════════════════════════════════════════

// ─── UI Helpers ──────────────────────────────────────────────
const UI = {
  showToast(msg, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span><span class="toast-msg">${msg}</span>`;
    document.getElementById('toast-container').prepend(toast);
    setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 400); }, 4000);
  },

  openModal(id) {
    document.getElementById(id)?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
    document.body.style.overflow = '';
  },

  setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn._origText = btn.innerHTML;
      btn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px"></span>Loading...';
    } else {
      btn.innerHTML = btn._origText || btn.innerHTML;
    }
  },

  openLightbox(src) {
    const lb = document.getElementById('lightbox');
    lb.querySelector('img').src = src;
    lb.classList.add('open');
  },

  updateNavbar() {
    const user = Auth.getUser();
    const navAuth = document.getElementById('nav-auth');
    const navUser = document.getElementById('nav-user');
    const navDash  = document.getElementById('nav-dashboard');

    if (Auth.isLoggedIn()) {
      navAuth.style.display = 'none';
      navUser.style.display = 'flex';
      navDash.style.display = Auth.isGuide() ? 'inline-flex' : 'none';

      document.getElementById('nav-avatar').textContent = user.username.charAt(0);
      document.getElementById('nav-username').textContent = user.username;
      const badge = document.getElementById('nav-role-badge');
      badge.textContent = user.role;
      badge.className = `nav-role-badge ${user.role}`;
    } else {
      navAuth.style.display = 'flex';
      navUser.style.display = 'none';
      navDash.style.display = 'none';
    }
  }
};

// ─── Motion Helpers ──────────────────────────────────────────
const Motion = {
  reveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Staggered reveal based on index if multiple items enter at once
          setTimeout(() => {
            entry.target.classList.add('active');
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { 
      threshold: 0.1, 
      rootMargin: '0px 0px -100px 0px' 
    });

    document.querySelectorAll('.reveal-up').forEach(el => {
      observer.observe(el);
    });
  },

  trackSpotlights() {
    // Smoother spotlight tracking using requestAnimationFrame logic if needed, 
    // but standard mousemove with CSS vars is usually GPU-fast enough.
    document.addEventListener('mousemove', e => {
      const spotlights = document.querySelectorAll('.spotlight');
      if (spotlights.length === 0) return;
      
      spotlights.forEach(el => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  },

  init() {
    this.reveal();
    this.trackSpotlights();
  }
};

// ─── SPA Router ──────────────────────────────────────────────
const App = {
  currentPage: 'home',

  pages: {
    home:      document.getElementById('page-home'),
    search:    document.getElementById('page-search'),
    detail:    document.getElementById('page-detail'),
    dashboard: document.getElementById('page-dashboard'),
  },

  navigate(page, params = {}) {
    // Hide all pages
    Object.values(this.pages).forEach(p => p && p.classList.remove('active'));

    // Show target page
    const target = this.pages[page];
    if (!target) { this.navigate('home'); return; }

    // Auth guard for dashboard
    if (page === 'dashboard' && !Auth.isLoggedIn()) {
      UI.showToast('Please login to access your dashboard', 'error');
      UI.openModal('modal-auth');
      this.navigate('home');
      return;
    }

    target.classList.add('active');
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update nav active state
    document.querySelectorAll('.nav-links [data-page]').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });

    // Page-specific init
    if (page === 'home') {
      Places.loadFeatured();
    } else if (page === 'search') {
      const q = params.q || '';
      const cat = params.category || '';
      if (q) document.getElementById('search-input').value = q;
      Places.loadSearchPage(q, cat);
    } else if (page === 'detail') {
      Places.loadDetail(params.id);
    } else if (page === 'dashboard') {
      const user = Auth.getUser();
      document.getElementById('dash-welcome').textContent = `Welcome back, ${user.username}!`;
      document.getElementById('dash-role').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1) + ' Account';
      Places.loadDashboard();
    }

    // Refresh motion animations for dynamic content
    setTimeout(() => Motion.reveal(), 500);
  },

  async init() {
    Auth.init();
    await Places.loadCategories();
    UI.updateNavbar();
    Motion.init();
    this.bindEvents();
    this.navigate('home');
  },

  bindEvents() {
    // ─── Navbar clicks ───────────────────────────────────────
    document.getElementById('nav-home')?.addEventListener('click', e => { e.preventDefault(); this.navigate('home'); });
    document.getElementById('nav-search')?.addEventListener('click', e => { e.preventDefault(); this.navigate('search'); });
    document.getElementById('nav-dashboard')?.addEventListener('click', e => { e.preventDefault(); this.navigate('dashboard'); });
    document.getElementById('nav-logout')?.addEventListener('click', () => Auth.doLogout());
    document.getElementById('nav-login')?.addEventListener('click', () => { UI.openModal('modal-auth'); document.getElementById('tab-login').click(); });
    document.getElementById('nav-register')?.addEventListener('click', () => { UI.openModal('modal-auth'); document.getElementById('tab-register').click(); });

    // ─── Modal close ─────────────────────────────────────────
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) UI.closeModal(overlay.id); });
    });
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => UI.closeModal(btn.closest('.modal-overlay').id));
    });

    // ─── Auth tabs ───────────────────────────────────────────
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        btn.closest('.tabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        btn.closest('.modal').querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        document.getElementById(`content-${target}`).classList.add('active');
      });
    });

    // ─── Auth Forms ──────────────────────────────────────────
    bindAuthForms();

    // ─── Hero Search ─────────────────────────────────────────
    document.getElementById('btn-hero-search')?.addEventListener('click', () => {
      const q = document.getElementById('hero-search-input').value.trim();
      const cat = document.getElementById('hero-category-select').value;
      this.navigate('search', { q, category: cat });
    });
    document.getElementById('hero-search-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-hero-search').click();
    });

    // ─── Search Page ─────────────────────────────────────────
    document.getElementById('btn-search')?.addEventListener('click', () => {
      const q = document.getElementById('search-input').value.trim();
      const cat = document.getElementById('cat-filter').value;
      Places.loadSearchPage(q, cat, 1);
    });
    document.getElementById('search-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-search').click();
    });

    // Category filter buttons
    document.getElementById('cat-buttons')?.addEventListener('click', e => {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.category;
      document.getElementById('cat-filter').value = cat;
      const q = document.getElementById('search-input').value.trim();
      Places.loadSearchPage(q, cat, 1);
    });

    // Populate category buttons
    const catBtns = document.getElementById('cat-buttons');
    if (catBtns) {
      catBtns.innerHTML = `<button class="cat-btn active" data-category="">All</button>` +
        Places._categories.map(c => `<button class="cat-btn" data-category="${c}">${Places.categoryEmoji[c] || ''} ${c}</button>`).join('');
    }

    // ─── Place Form ──────────────────────────────────────────
    document.getElementById('btn-add-place')?.addEventListener('click', () => Places.openAddModal());
    document.getElementById('form-place')?.addEventListener('submit', e => Places.submitPlaceForm(e));

    // ─── Upload Modal ────────────────────────────────────────
    document.getElementById('upload-input')?.addEventListener('change', e => Places.handleFileSelect(e.target));
    document.getElementById('btn-upload')?.addEventListener('click', () => Places.submitUpload());

    // Upload drag & drop
    const zone = document.getElementById('upload-zone');
    if (zone) {
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const input = document.getElementById('upload-input');
        const dt = new DataTransfer();
        Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).forEach(f => dt.items.add(f));
        input.files = dt.files;
        Places.handleFileSelect(input);
      });
    }

    // ─── Lightbox ────────────────────────────────────────────
    document.getElementById('lightbox-close')?.addEventListener('click', () => {
      document.getElementById('lightbox').classList.remove('open');
    });
    document.getElementById('lightbox')?.addEventListener('click', e => {
      if (e.target.id === 'lightbox') document.getElementById('lightbox').classList.remove('open');
    });
  }
};

// ─── Bootstrap ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());

window.UI = UI;
window.App = App;
