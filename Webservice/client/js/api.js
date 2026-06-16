// ═══════════════════════════════════════════════════════════════
// API Helper — Centralized fetch wrapper for all REST calls
// ═══════════════════════════════════════════════════════════════
const API_BASE = '/api';

const Api = {
  /**
   * Make an API request
   */
  async request(method, endpoint, body = null, isFormData = false) {
    const token = Auth.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && body) headers['Content-Type'] = 'application/json';

    const options = { method, headers };
    if (body) options.body = isFormData ? body : JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();

      if (res.status === 401) {
        // Token expired/invalid — auto logout
        Auth.clearSession();
        UI.showToast('Session expired. Please login again.', 'error');
        App.navigate('home');
        return { success: false, message: 'Unauthorized' };
      }

      return { ...data, status: res.status };
    } catch (err) {
      console.error('API error:', err);
      return { success: false, message: 'Network error. Please check connection.' };
    }
  },

  get:    (url)         => Api.request('GET', url),
  post:   (url, body)   => Api.request('POST', url, body),
  put:    (url, body)   => Api.request('PUT', url, body),
  delete: (url)         => Api.request('DELETE', url),
  upload: (url, form)   => Api.request('POST', url, form, true),

  // ─── Auth ───────────────────────────────────────────────────
  auth: {
    register: (d) => Api.post('/auth/register', d),
    login:    (d) => Api.post('/auth/login', d),
    logout:   ()  => Api.post('/auth/logout'),
    me:       ()  => Api.get('/auth/me'),
  },

  // ─── Places ─────────────────────────────────────────────────
  places: {
    list:       (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return Api.get(`/places${qs ? '?' + qs : ''}`);
    },
    get:        (id) => Api.get(`/places/${id}`),
    create:     (d)  => Api.post('/places', d),
    update:     (id, d) => Api.put(`/places/${id}`, d),
    delete:     (id) => Api.delete(`/places/${id}`),
    categories: ()   => Api.get('/places/categories'),
    uploadImages: (id, form) => Api.upload(`/places/${id}/images`, form),
    deleteImage:  (placeId, imgId) => Api.delete(`/places/${placeId}/images/${imgId}`),
  },

  // ─── Comments ───────────────────────────────────────────────
  comments: {
    list:   (placeId)       => Api.get(`/places/${placeId}/comments`),
    add:    (placeId, d)    => Api.post(`/places/${placeId}/comments`, d),
    delete: (placeId, cId)  => Api.delete(`/places/${placeId}/comments/${cId}`),
  },
};

window.Api = Api;
