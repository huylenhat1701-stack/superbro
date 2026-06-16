require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDB } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'client')));

// Routes
const authRoutes     = require('./routes/auth');
const placesRoutes   = require('./routes/places');
const commentsRoutes = require('./routes/comments');

app.use('/api/auth',   authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/places/:id/comments', commentsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Travel Suite API running', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ── API Documentation ──────────────────────────────────
// Interactive HTML docs page
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'api-docs.html'));
});

// Serve OpenAPI YAML spec
app.get('/api/swagger.yaml', (req, res) => {
  const yamlPath = path.join(__dirname, 'swagger.yaml');
  if (!fs.existsSync(yamlPath)) return res.status(404).json({ success: false, message: 'swagger.yaml not found' });
  res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
  res.sendFile(yamlPath);
});

// Swagger UI (via CDN redirect helper)
app.get('/swagger-ui', (req, res) => {
  const specUrl = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/swagger.yaml`);
  res.redirect(`https://petstore.swagger.io/?url=${specUrl}`);
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Init DB then start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🌏 Travel Suite running on http://localhost:${PORT}`);
    console.log(`📡 API:       http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend:  http://localhost:${PORT}`);
    console.log(`📖 API Docs:  http://localhost:${PORT}/api-docs`);
    console.log(`⚡ Swagger:   http://localhost:${PORT}/swagger-ui\n`);
    console.log('Demo accounts:');
    console.log('  Guide:     guide@travel.com    / guide123');
    console.log('  Traveller: traveller@travel.com / traveller123\n');
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
