const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/init');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const db = getDB();
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields required: username, email, password, role' });
    }
    if (!['guide', 'traveller'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be "guide" or "traveller"' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or username already registered' });
    }

    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 12);
    db.prepare('INSERT INTO users (id,username,email,password_hash,role) VALUES (?,?,?,?,?)').run(id, username, email, password_hash, role);

    const token = jwt.sign({ id, username, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, message: 'Registration successful', data: { token, user: { id, username, email, role } } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/login', (req, res) => {
  try {
    const db = getDB();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'Login successful', data: { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/logout', authenticate, (req, res) => {
  try {
    const db = getDB();
    db.prepare('INSERT OR IGNORE INTO blacklisted_tokens (token) VALUES (?)').run(req.token);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/me', authenticate, (req, res) => {
  try {
    const db = getDB();
    const user = db.prepare('SELECT id,username,email,role,avatar,created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
