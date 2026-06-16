// ═══════════════════════════════════════════════════════════════
// Places Module — Search, View, CRUD, Image Upload
// ═══════════════════════════════════════════════════════════════

const Places = {
  _categories: [],
  _currentPage: 1,
  _currentQuery: '',
  _currentCategory: '',
  _currentPlaceId: null,
  _editingPlaceId: null,

  categoryEmoji: {
    'Heritage': '🏛️', 'Nature': '🌿', 'Adventure': '🧗',
    'Beach': '🏖️', 'City': '🏙️', 'Mountain': '⛰️',
    'Food': '🍜', 'Culture': '🎭', 'Other': '🌍'
  },

  categoryIcon: {
    'Heritage': 'ph-bank', 'Nature': 'ph-leaf', 'Adventure': 'ph-mountains',
    'Beach': 'ph-waves', 'City': 'ph-buildings', 'Mountain': 'ph-terrain',
    'Food': 'ph-fork-knife', 'Culture': 'ph-mask-happy', 'Other': 'ph-globe'
  },

  async loadCategories() {
    const res = await Api.places.categories();
    if (res.success) this._categories = res.data.categories;
  },

  // ─── Home Page: Featured Places ─────────────────────────────
  async loadFeatured() {
    const container = document.getElementById('featured-places');
    if (!container) return;

    container.innerHTML = '<div class="spinner"></div>';
    const res = await Api.places.list({ limit: 6 });

    if (!res.success || !res.data.places.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌏</div><div class="empty-state-title">No places yet</div><div class="empty-state-text">Be the first guide to add a destination!</div></div>`;
      return;
    }

    container.innerHTML = res.data.places.map((p, i) => this.renderCard(p, i, true)).join('');
    this.bindCardClicks(container);
    this.updateStats(res.data.pagination.total);
  },

  updateStats(total) {
    const el = document.getElementById('stat-places');
    if (el) el.textContent = total + '+';
  },

  // ─── Search Page ─────────────────────────────────────────────
  async loadSearchPage(query = '', category = '', page = 1) {
    this._currentQuery = query;
    this._currentCategory = category;
    this._currentPage = page;

    const container = document.getElementById('search-results');
    if (!container) return;
    container.innerHTML = '<div class="spinner"></div>';

    const res = await Api.places.list({ q: query, category, page, limit: 12 });

    if (!res.success) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error loading places</div></div>`;
      return;
    }

    const { places, pagination } = res.data;

    // Update result count
    const countEl = document.getElementById('result-count');
    if (countEl) countEl.textContent = `${pagination.total} place${pagination.total !== 1 ? 's' : ''} found`;

    if (!places.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">No places found</div><div class="empty-state-text">Try different keywords or browse all categories</div></div>`;
      document.getElementById('search-pagination').innerHTML = '';
      return;
    }

    container.innerHTML = places.map((p, i) => this.renderCard(p, i)).join('');
    this.bindCardClicks(container);
    this.renderPagination(pagination);
  },

  renderPagination(pagination) {
    const container = document.getElementById('search-pagination');
    if (!container) return;
    const { page, pages } = pagination;

    let html = '';
    if (pages <= 1) { container.innerHTML = ''; return; }

    html += `<button class="page-btn" onclick="Places.loadSearchPage('${this._currentQuery}','${this._currentCategory}',${page-1})" ${page===1?'disabled':''}>←</button>`;
    for (let i = 1; i <= pages; i++) {
      html += `<button class="page-btn ${i===page?'active':''}" onclick="Places.loadSearchPage('${this._currentQuery}','${this._currentCategory}',${i})">${i}</button>`;
    }
    html += `<button class="page-btn" onclick="Places.loadSearchPage('${this._currentQuery}','${this._currentCategory}',${page+1})" ${page===pages?'disabled':''}>→</button>`;

    container.innerHTML = `<div class="pagination">${html}</div>`;
  },

  renderCard(place, index = 0, isBento = false) {
    const stars = this.renderStars(place.avg_rating);
    const emoji = this.categoryEmoji[place.category] || '🌍';
    const fallbacks = [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRo6toZ9m01NtuAimGQwo0_7IZjIgi-1LaFRNUSIMglKTdBl8EhLO3Mkag&s=10',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBqHo-wNpmoKAVWDyJFsAOqXzDSO48VIZZc4FktFaUybQrDFtJFODp40-D&s=10',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRC-bR-1CN0n05HPVBfoFHPFyf4NWkn8FmmoZi_gQ3kM2tbl7hBErtLkWwG&s=10',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgFGEXUrgiDUT1EAMNwHOdJooWAfyiyrJk3dcz3fBSxMh7Wwbc_fiMhAKs&s=10',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHhl8nbH4ZJIiLs-OaoXwNm0V5W2IfPb3gKFesLqLQOKcZPThvMs0hxA0&s=10',
      'https://phongnhacavestour.com/wp-content/uploads/2016/11/Phong-Nha-Cave-2.jpg'
    ];
    const fallbackImg = fallbacks[index % fallbacks.length];
    
    const imgHtml = place.thumbnail
      ? `<img src="/uploads/${place.thumbnail}" alt="${place.name}" loading="lazy">`
      : `<img src="${fallbackImg}" alt="${place.name}" loading="lazy">`;

    // Asymmetrical classes for the bento grid pattern
    let bentoClass = 'bento-card';
    if (isBento) {
      if (index % 7 === 0) bentoClass += ' large';
      else if (index % 7 === 3) bentoClass += ' wide';
      else if (index % 7 === 5) bentoClass += ' tall';
    }

    return `
      <article class="${bentoClass} bezel spotlight reveal-up" data-id="${place.id}" role="button" tabindex="0">
        <div class="bezel-core place-card">
          <div class="place-card-img">
            ${imgHtml}
            <span class="place-card-category">${emoji} ${place.category}</span>
          </div>
          <div class="place-card-body">
            <h3 class="place-card-name">${this.esc(place.name)}</h3>
            <div class="place-card-location"><i class="ph ph-map-pin"></i> ${this.esc(place.location)}</div>
            <p class="place-card-desc">${this.esc(place.description || 'No description available.')}</p>
            <div class="place-card-footer">
              <div class="place-rating">
                <span class="stars">${stars}</span>
                <span class="rating-num">${place.avg_rating ? place.avg_rating.toFixed(1) : 'New'}</span>
              </div>
              <div class="place-guide">by <strong>${this.esc(place.guide_name)}</strong></div>
            </div>
          </div>
        </div>
      </article>`;
  },

  bindCardClicks(container) {
    container.querySelectorAll('.place-card').forEach(card => {
      const id = card.closest('article').dataset.id;
      const navigate = () => App.navigate('detail', { id });
      card.addEventListener('click', navigate);
      card.addEventListener('keydown', e => e.key === 'Enter' && navigate());
    });
  },

  renderStars(rating) {
    const full = Math.round(rating || 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  },

  // ─── Place Detail Page ───────────────────────────────────────
  async loadDetail(id) {
    this._currentPlaceId = id;
    const page = document.getElementById('page-detail');
    if (!page) return;

    page.innerHTML = '<div class="spinner" style="margin-top:120px"></div>';
    const res = await Api.places.get(id);

    if (!res.success) {
      page.innerHTML = `<div class="empty-state" style="padding-top:150px"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Place not found</div><a href="#" onclick="App.navigate('search')" class="btn btn-ghost" style="margin-top:20px">← Back to Search</a></div>`;
      return;
    }

    const { place, images, comments } = res.data;
    const isOwner = Auth.isLoggedIn() && Auth.getUser().id === place.guide_id;
    const emoji = this.categoryEmoji[place.category] || '🌍';
    const coverImg = images.length ? `/uploads/${images[0].filename}` : 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80';

    page.innerHTML = `
      <div class="detail-hero">
        <img class="detail-hero-img" src="${coverImg}" alt="${this.esc(place.name)}">
        <div class="detail-hero-overlay"></div>
        <div class="detail-hero-content container">
          <div class="detail-category">${emoji} ${this.esc(place.category)}</div>
          <h1 class="detail-title">${this.esc(place.name)}</h1>
          <div class="detail-meta">
            <span class="detail-meta-item">📍 ${this.esc(place.location)}</span>
            <span class="detail-meta-item">⭐ ${place.avg_rating ? place.avg_rating.toFixed(1) : 'No ratings yet'} (${place.rating_count} review${place.rating_count !== 1 ? 's' : ''})</span>
            <span class="detail-meta-item">👤 ${this.esc(place.guide_name)}</span>
          </div>
        </div>
      </div>

      <div class="container" style="padding-top:48px; padding-bottom:80px">
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:40px" class="detail-grid">
          <div>
            <!-- Back button -->
            <button class="btn btn-ghost btn-sm" style="margin-bottom:28px" onclick="App.navigate('search')">← Back to Places</button>

            <!-- Description -->
            <section style="margin-bottom:48px">
              <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
                About this place
                ${isOwner ? `<div style="display:flex;gap:10px">
                  <button class="btn btn-ghost btn-sm" onclick="Places.openEditModal('${place.id}')">✏️ Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="Places.deletePlace('${place.id}')">🗑️ Delete</button>
                </div>` : ''}
              </h2>
              <p style="color:var(--text-muted);line-height:1.8">${this.esc(place.description || 'No description provided.')}</p>
            </section>

            <!-- Gallery -->
            <section style="margin-bottom:48px">
              <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
                Photo Gallery
                <span style="color:var(--text-muted);font-size:0.85rem;font-weight:400">${images.length} photo${images.length !== 1 ? 's' : ''}</span>
              </h2>
              ${isOwner ? `
                <div style="margin-bottom:16px">
                  <button class="btn btn-accent btn-sm" onclick="Places.openUploadModal('${place.id}')">📸 Upload Photos</button>
                </div>` : ''}
              ${images.length ? `
                <div class="gallery-grid" id="gallery-${place.id}">
                  ${images.map(img => `
                    <div class="gallery-item">
                      <img src="/uploads/${img.filename}" alt="${this.esc(img.caption || place.name)}" onclick="UI.openLightbox('/uploads/${img.filename}')">
                      ${isOwner ? `<button class="gallery-item-delete" onclick="Places.deleteImage('${place.id}','${img.id}')" title="Delete image">×</button>` : ''}
                    </div>
                  `).join('')}
                </div>` :
                `<div class="empty-state" style="padding:40px 0">
                  <div class="empty-state-icon">📷</div>
                  <div class="empty-state-title">No photos yet</div>
                  ${isOwner ? '<div class="empty-state-text">Upload photos to attract travelers</div>' : ''}
                </div>`}
            </section>

            <!-- Comments -->
            <section id="comments-section">
              <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:20px">
                Reviews & Ratings
                <span style="color:var(--text-muted);font-size:0.85rem;font-weight:400;margin-left:10px">${comments.length} review${comments.length !== 1 ? 's' : ''}</span>
              </h2>

              ${Auth.isTraveller() ? `
              <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:28px">
                <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px">Leave a Review</h3>
                <form id="form-comment" onsubmit="Places.submitComment(event, '${place.id}')">
                  <div class="form-group">
                    <label class="form-label">Your Rating</label>
                    <div class="rating-input" id="star-rating">
                      <input type="radio" name="rating" id="star5" value="5"><label for="star5" title="5 stars">★</label>
                      <input type="radio" name="rating" id="star4" value="4"><label for="star4" title="4 stars">★</label>
                      <input type="radio" name="rating" id="star3" value="3" checked><label for="star3" title="3 stars">★</label>
                      <input type="radio" name="rating" id="star2" value="2"><label for="star2" title="2 stars">★</label>
                      <input type="radio" name="rating" id="star1" value="1"><label for="star1" title="1 star">★</label>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="comment-text">Your Comment</label>
                    <textarea class="form-input" id="comment-text" rows="3" placeholder="Share your experience about this place..." required></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary" id="btn-comment">Submit Review</button>
                </form>
              </div>` : Auth.isLoggedIn() ? '' : `
              <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:var(--radius-md);padding:20px;margin-bottom:24px;text-align:center">
                <p style="color:var(--text-muted);margin-bottom:12px">Sign in as a Traveller to leave a review</p>
                <button class="btn btn-primary btn-sm" onclick="UI.openModal('modal-auth')">Login / Register</button>
              </div>`}

              <div id="comments-list">
                ${comments.length ? comments.map(c => this.renderComment(c)).join('') :
                  `<div class="empty-state" style="padding:40px 0">
                    <div class="empty-state-icon">💬</div>
                    <div class="empty-state-title">No reviews yet</div>
                    <div class="empty-state-text">Be the first to review this place!</div>
                  </div>`}
              </div>
            </section>
          </div>

          <!-- Sidebar -->
          <div>
            <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;position:sticky;top:80px">
              <h3 style="font-weight:700;margin-bottom:20px">Place Info</h3>
              <div style="display:flex;flex-direction:column;gap:16px">
                <div>
                  <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px">Location</div>
                  <div style="font-weight:500">📍 ${this.esc(place.location)}</div>
                </div>
                <div>
                  <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px">Category</div>
                  <div style="font-weight:500">${emoji} ${this.esc(place.category)}</div>
                </div>
                <div>
                  <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px">Guide</div>
                  <div style="font-weight:500">👤 ${this.esc(place.guide_name)}</div>
                </div>
                <div>
                  <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px">Rating</div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:1.5rem;font-weight:800;color:var(--accent)">${place.avg_rating ? place.avg_rating.toFixed(1) : '—'}</span>
                    <div>
                      <div style="color:var(--accent);font-size:1.1rem">${this.renderStars(place.avg_rating)}</div>
                      <div style="font-size:0.75rem;color:var(--text-dim)">${place.rating_count} review${place.rating_count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px">Photos</div>
                  <div style="font-weight:500">📷 ${images.length} photo${images.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Fix responsive grid on mobile
    const detailGrid = page.querySelector('.detail-grid');
    if (window.innerWidth < 768) {
      detailGrid.style.gridTemplateColumns = '1fr';
    }
  },

  renderComment(c) {
    const isOwner = Auth.isLoggedIn() && Auth.getUser().id === c.user_id;
    const date = new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return `
      <div class="comment-card" style="margin-bottom:12px" id="comment-${c.id}">
        <div class="comment-header">
          <div class="comment-user">
            <div class="comment-avatar">${c.username.charAt(0)}</div>
            <div>
              <div class="comment-username">${this.esc(c.username)}</div>
              <div class="comment-date">${date}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="comment-stars">${this.renderStars(c.rating)} <span style="color:var(--text-muted);font-size:0.8rem">${c.rating}/5</span></div>
            ${isOwner ? `<button class="btn btn-danger btn-sm" style="padding:4px 10px;font-size:0.75rem" onclick="Places.deleteComment('${this._currentPlaceId}','${c.id}')">Delete</button>` : ''}
          </div>
        </div>
        <p class="comment-text">${this.esc(c.comment)}</p>
      </div>`;
  },

  async submitComment(e, placeId) {
    e.preventDefault();
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const comment = document.getElementById('comment-text').value.trim();
    const btn = document.getElementById('btn-comment');

    if (!rating) { UI.showToast('Please select a rating', 'error'); return; }
    if (!comment || comment.length < 5) { UI.showToast('Comment must be at least 5 characters', 'error'); return; }

    UI.setLoading(btn, true);
    const res = await Api.comments.add(placeId, { rating: parseInt(rating), comment });
    UI.setLoading(btn, false);

    if (!res.success) { UI.showToast(res.message, 'error'); return; }

    UI.showToast('Review submitted! Thank you 🌟', 'success');
    document.getElementById('comment-text').value = '';

    // Prepend new comment
    const list = document.getElementById('comments-list');
    const empty = list.querySelector('.empty-state');
    if (empty) empty.remove();
    list.insertAdjacentHTML('afterbegin', this.renderComment(res.data.comment));
  },

  async deleteComment(placeId, commentId) {
    if (!confirm('Delete this review?')) return;
    const res = await Api.comments.delete(placeId, commentId);
    if (!res.success) { UI.showToast(res.message, 'error'); return; }
    document.getElementById(`comment-${commentId}`)?.remove();
    UI.showToast('Review deleted', 'info');
  },

  // ─── Guide Dashboard ─────────────────────────────────────────
  async loadDashboard() {
    if (!Auth.isLoggedIn()) { App.navigate('home'); return; }
    const user = Auth.getUser();

    // Stats
    const res = await Api.places.list({ guide_id: user.id, limit: 100 });
    const places = res.success ? res.data.places : [];
    const totalRatings = places.reduce((s, p) => s + (p.rating_count || 0), 0);
    const avgRating = places.length ? (places.reduce((s, p) => s + (p.avg_rating || 0), 0) / places.length).toFixed(1) : '0.0';

    const dStat = document.getElementById('dash-stat-places');
    const rStat = document.getElementById('dash-stat-reviews');
    const avgStat = document.getElementById('dash-stat-avg');
    if (dStat) dStat.textContent = places.length;
    if (rStat) rStat.textContent = totalRatings;
    if (avgStat) avgStat.textContent = avgRating;

    // Place list
    const list = document.getElementById('my-places-list');
    if (!list) return;

    if (!places.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🗺️</div><div class="empty-state-title">No places yet</div><div class="empty-state-text">Add your first destination to get started!</div></div>`;
      return;
    }

    list.innerHTML = places.map(p => {
      const emoji = this.categoryEmoji[p.category] || '🌍';
      const thumb = p.thumbnail ? `<img src="/uploads/${p.thumbnail}" alt="${this.esc(p.name)}" style="width:56px;height:56px;object-fit:cover;border-radius:10px">` : `<div style="width:56px;height:56px;border-radius:10px;background:linear-gradient(135deg,#1e1b4b,#312e81);display:flex;align-items:center;justify-content:center;font-size:1.5rem">${emoji}</div>`;
      return `
        <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:12px;transition:var(--transition)" class="place-list-item">
          ${thumb}
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this.esc(p.name)}</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">📍 ${this.esc(p.location)} · ${emoji} ${p.category}</div>
            <div style="font-size:0.8rem;color:var(--text-dim);margin-top:2px">⭐ ${p.avg_rating ? p.avg_rating.toFixed(1) : 'No ratings'} · ${p.rating_count || 0} reviews</div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('detail',{id:'${p.id}'})">View</button>
            <button class="btn btn-ghost btn-sm" onclick="Places.openEditModal('${p.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="Places.deletePlace('${p.id}')">Delete</button>
          </div>
        </div>`;
    }).join('');
  },

  // ─── Add / Edit Place Modal ──────────────────────────────────
  openAddModal() {
    if (!Auth.isGuide()) { UI.showToast('Only guides can add places', 'error'); return; }
    this._editingPlaceId = null;
    this.populatePlaceForm();
    UI.openModal('modal-place');
  },

  async openEditModal(placeId) {
    this._editingPlaceId = placeId;
    const res = await Api.places.get(placeId);
    if (!res.success) { UI.showToast('Could not load place data', 'error'); return; }
    this.populatePlaceForm(res.data.place);
    UI.openModal('modal-place');
  },

  populatePlaceForm(place = null) {
    document.getElementById('modal-place-title').textContent = place ? 'Edit Place' : 'Add New Place';
    document.getElementById('place-name').value = place?.name || '';
    document.getElementById('place-location').value = place?.location || '';
    document.getElementById('place-description').value = place?.description || '';

    const catSelect = document.getElementById('place-category');
    catSelect.innerHTML = this._categories.map(c => `<option value="${c}" ${place?.category===c?'selected':''}>${c}</option>`).join('');
  },

  async submitPlaceForm(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-place');
    const data = {
      name:        document.getElementById('place-name').value.trim(),
      location:    document.getElementById('place-location').value.trim(),
      description: document.getElementById('place-description').value.trim(),
      category:    document.getElementById('place-category').value,
    };

    if (!data.name || !data.location) { UI.showToast('Name and location are required', 'error'); return; }

    UI.setLoading(btn, true);
    const res = this._editingPlaceId
      ? await Api.places.update(this._editingPlaceId, data)
      : await Api.places.create(data);
    UI.setLoading(btn, false);

    if (!res.success) { UI.showToast(res.message, 'error'); return; }

    UI.showToast(this._editingPlaceId ? 'Place updated! ✏️' : 'Place created! 🎉', 'success');
    UI.closeModal('modal-place');
    this.loadDashboard();
  },

  async deletePlace(placeId) {
    if (!confirm('Delete this place? This will also delete all images and reviews.')) return;
    const res = await Api.places.delete(placeId);
    if (!res.success) { UI.showToast(res.message, 'error'); return; }
    UI.showToast('Place deleted', 'info');
    if (App.currentPage === 'dashboard') this.loadDashboard();
    else App.navigate('search');
  },

  // ─── Image Upload Modal ──────────────────────────────────────
  _uploadFiles: [],
  _uploadPlaceId: null,

  openUploadModal(placeId) {
    this._uploadPlaceId = placeId;
    this._uploadFiles = [];
    document.getElementById('upload-preview').innerHTML = '';
    document.getElementById('upload-input').value = '';
    UI.openModal('modal-upload');
  },

  handleFileSelect(input) {
    const files = Array.from(input.files);
    this._uploadFiles = [...this._uploadFiles, ...files].slice(0, 10);
    this.renderUploadPreview();
  },

  renderUploadPreview() {
    const preview = document.getElementById('upload-preview');
    preview.innerHTML = this._uploadFiles.map((f, i) => `
      <div class="upload-preview-item">
        <img src="${URL.createObjectURL(f)}" alt="preview">
        <button class="upload-preview-remove" onclick="Places.removeUploadFile(${i})">×</button>
      </div>`).join('');
  },

  removeUploadFile(idx) {
    this._uploadFiles.splice(idx, 1);
    this.renderUploadPreview();
  },

  async submitUpload() {
    if (!this._uploadFiles.length) { UI.showToast('Please select at least one image', 'error'); return; }
    const btn = document.getElementById('btn-upload');
    const form = new FormData();
    this._uploadFiles.forEach(f => form.append('images', f));

    UI.setLoading(btn, true);
    const res = await Api.places.uploadImages(this._uploadPlaceId, form);
    UI.setLoading(btn, false);

    if (!res.success) { UI.showToast(res.message, 'error'); return; }

    UI.showToast(`${res.data.images.length} photo(s) uploaded! 📸`, 'success');
    UI.closeModal('modal-upload');
    this.loadDetail(this._uploadPlaceId);
  },

  async deleteImage(placeId, imgId) {
    if (!confirm('Delete this image?')) return;
    const res = await Api.places.deleteImage(placeId, imgId);
    if (!res.success) { UI.showToast(res.message, 'error'); return; }
    UI.showToast('Image deleted', 'info');
    this.loadDetail(placeId);
  },

  esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};

window.Places = Places;
