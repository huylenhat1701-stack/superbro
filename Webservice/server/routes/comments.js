const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/init');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// GET /api/places/:id/comments
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const place = db.prepare('SELECT id FROM places WHERE id = ?').get(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });

    const comments = db.prepare(`
      SELECT c.*, u.username, u.role FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.place_id = ? ORDER BY c.created_at DESC
    `).all(req.params.id);

    const statsRow = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM comments WHERE place_id = ?').get(req.params.id);
    res.json({ success: true, data: { comments, stats: statsRow } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/places/:id/comments  (traveller only)
router.post('/', authenticate, requireRole('traveller'), (req, res) => {
  try {
    const db = getDB();
    const { rating, comment } = req.body;

    if (!rating || !comment) return res.status(400).json({ success: false, message: 'Rating and comment required' });
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ success: false, message: 'Rating must be 1–5' });
    if (comment.trim().length < 5) return res.status(400).json({ success: false, message: 'Comment must be at least 5 characters' });

    const place = db.prepare('SELECT id FROM places WHERE id = ?').get(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });

    const id = uuidv4();
    db.prepare('INSERT INTO comments (id,place_id,user_id,rating,comment) VALUES (?,?,?,?,?)').run(id, req.params.id, req.user.id, ratingNum, comment.trim());

    // Recalculate avg
    const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count FROM comments WHERE place_id = ?').get(req.params.id);
    const avg = Math.round((stats.avg_rating || 0) * 10) / 10;
    db.prepare('UPDATE places SET avg_rating=?,rating_count=? WHERE id=?').run(avg, stats.rating_count, req.params.id);

    const newComment = db.prepare(`
      SELECT c.*, u.username, u.role FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
    `).get(id);

    res.status(201).json({ success: true, message: 'Comment added', data: { comment: newComment, avg_rating: avg } });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/places/:id/comments/:commentId
router.delete('/:commentId', authenticate, (req, res) => {
  try {
    const db = getDB();
    const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND place_id = ?').get(req.params.commentId, req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId);

    const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count FROM comments WHERE place_id = ?').get(req.params.id);
    db.prepare('UPDATE places SET avg_rating=?,rating_count=? WHERE id=?').run(stats.avg_rating || 0, stats.rating_count, req.params.id);

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
