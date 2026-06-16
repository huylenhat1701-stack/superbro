const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/init');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const CATEGORIES = ['Heritage', 'Nature', 'Adventure', 'Beach', 'City', 'Mountain', 'Food', 'Culture', 'Other'];

// GET /api/places  — search/list places
router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDB();
    const { q = '', category = '', page = 1, limit = 12, guide_id = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = ['1=1'];
    const params = [];
    if (q) { conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.location LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (category) { conditions.push('p.category = ?'); params.push(category); }
    if (guide_id) { conditions.push('p.guide_id = ?'); params.push(guide_id); }

    const where = conditions.join(' AND ');

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM places p WHERE ${where}`).get(...params);
    const total = countRow ? countRow.total : 0;

    const places = db.prepare(`
      SELECT p.*, u.username as guide_name,
             (SELECT filename FROM images WHERE place_id = p.id ORDER BY uploaded_at LIMIT 1) as thumbnail
      FROM places p JOIN users u ON p.guide_id = u.id
      WHERE ${where}
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({ success: true, data: { places, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) || 1 } } });
  } catch (err) {
    console.error('Get places error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/places/categories
router.get('/categories', (req, res) => {
  res.json({ success: true, data: { categories: CATEGORIES } });
});

// GET /api/places/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const db = getDB();
    const place = db.prepare(`
      SELECT p.*, u.username as guide_name, u.email as guide_email
      FROM places p JOIN users u ON p.guide_id = u.id WHERE p.id = ?
    `).get(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });

    const images = db.prepare('SELECT * FROM images WHERE place_id = ? ORDER BY uploaded_at ASC').all(req.params.id);
    const comments = db.prepare(`
      SELECT c.*, u.username, u.role FROM comments c
      JOIN users u ON c.user_id = u.id WHERE c.place_id = ? ORDER BY c.created_at DESC
    `).all(req.params.id);

    res.json({ success: true, data: { place, images, comments } });
  } catch (err) {
    console.error('Get place error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/places
router.post('/', authenticate, requireRole('guide'), (req, res) => {
  try {
    const db = getDB();
    const { name, description, location, category } = req.body;
    if (!name || !location || !category) return res.status(400).json({ success: false, message: 'name, location, category required' });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ success: false, message: `Invalid category` });

    const id = uuidv4();
    db.prepare('INSERT INTO places (id,name,description,location,category,guide_id) VALUES (?,?,?,?,?,?)').run(id, name, description || '', location, category, req.user.id);
    const place = db.prepare('SELECT * FROM places WHERE id = ?').get(id);
    res.status(201).json({ success: true, message: 'Place created', data: { place } });
  } catch (err) {
    console.error('Create place error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/places/:id
router.put('/:id', authenticate, requireRole('guide'), (req, res) => {
  try {
    const db = getDB();
    const place = db.prepare('SELECT * FROM places WHERE id = ?').get(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    if (place.guide_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });

    const { name, description, location, category } = req.body;
    if (category && !CATEGORIES.includes(category)) return res.status(400).json({ success: false, message: 'Invalid category' });

    db.prepare('UPDATE places SET name=?,description=?,location=?,category=?,updated_at=datetime(\'now\') WHERE id=?')
      .run(name || place.name, description !== undefined ? description : place.description, location || place.location, category || place.category, req.params.id);

    const updated = db.prepare('SELECT * FROM places WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Place updated', data: { place: updated } });
  } catch (err) {
    console.error('Update place error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/places/:id
router.delete('/:id', authenticate, requireRole('guide'), (req, res) => {
  try {
    const db = getDB();
    const place = db.prepare('SELECT * FROM places WHERE id = ?').get(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    if (place.guide_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });

    const images = db.prepare('SELECT filename FROM images WHERE place_id = ?').all(req.params.id);
    images.forEach(img => {
      const fp = path.join(UPLOADS_DIR, img.filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    });

    db.prepare('DELETE FROM comments WHERE place_id = ?').run(req.params.id);
    db.prepare('DELETE FROM images WHERE place_id = ?').run(req.params.id);
    db.prepare('DELETE FROM places WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Place deleted' });
  } catch (err) {
    console.error('Delete place error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/places/:id/images
router.post('/:id/images', authenticate, requireRole('guide'), upload.array('images', 10), (req, res) => {
  try {
    const db = getDB();
    const place = db.prepare('SELECT * FROM places WHERE id = ?').get(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    if (place.guide_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (!req.files || !req.files.length) return res.status(400).json({ success: false, message: 'No images uploaded' });

    const inserted = [];
    for (const file of req.files) {
      const imgId = uuidv4();
      db.prepare('INSERT INTO images (id,place_id,filename,caption) VALUES (?,?,?,?)').run(imgId, req.params.id, file.filename, '');
      inserted.push({ id: imgId, place_id: req.params.id, filename: file.filename });
    }

    res.status(201).json({ success: true, message: `${inserted.length} image(s) uploaded`, data: { images: inserted } });
  } catch (err) {
    console.error('Upload image error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/places/:id/images/:imgId
router.delete('/:id/images/:imgId', authenticate, requireRole('guide'), (req, res) => {
  try {
    const db = getDB();
    const place = db.prepare('SELECT * FROM places WHERE id = ?').get(req.params.id);
    if (!place || place.guide_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });

    const image = db.prepare('SELECT * FROM images WHERE id = ? AND place_id = ?').get(req.params.imgId, req.params.id);
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

    const fp = path.join(UPLOADS_DIR, image.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    db.prepare('DELETE FROM images WHERE id = ?').run(req.params.imgId);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
