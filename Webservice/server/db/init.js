const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'travel.db');

// Global db instance (synchronous-style wrapper around sql.js)
let _db = null;

/**
 * sql.js wrapper that mimics better-sqlite3 synchronous API
 * so all routes work without change.
 */
class DB {
  constructor(sqlJsDb) {
    this._db = sqlJsDb;
  }

  exec(sql) {
    this._db.run(sql);
    this._save();
  }

  pragma(str) {
    // sql.js doesn't need pragma calls, ignore silently
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        self._save();
        return { changes: 1 };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      }
    };
  }

  transaction(fn) {
    const self = this;
    return function(...args) {
      self._db.run('BEGIN');
      try {
        const result = fn(...args);
        self._db.run('COMMIT');
        self._save();
        return result;
      } catch (e) {
        self._db.run('ROLLBACK');
        throw e;
      }
    };
  }

  _save() {
    const data = this._db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

async function initDB() {
  const SQL = await initSqlJs();

  let sqlJsDb;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlJsDb = new SQL.Database(fileBuffer);
  } else {
    sqlJsDb = new SQL.Database();
  }

  _db = new DB(sqlJsDb);

  // Create tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      location TEXT NOT NULL,
      category TEXT NOT NULL,
      guide_id TEXT NOT NULL,
      avg_rating REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      cover_image TEXT DEFAULT NULL,
      thumbnail TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      place_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      caption TEXT DEFAULT '',
      uploaded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      place_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blacklisted_tokens (
      token TEXT PRIMARY KEY,
      blacklisted_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed demo data if users table is empty
  const existing = _db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existing.c === 0) {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const guideId = uuidv4();
    const travellerId = uuidv4();
    const guideHash = bcrypt.hashSync('guide123', 10);
    const travHash = bcrypt.hashSync('traveller123', 10);

    _db.prepare('INSERT INTO users (id,username,email,password_hash,role) VALUES (?,?,?,?,?)').run(guideId, 'guide_demo', 'guide@travel.com', guideHash, 'guide');
    _db.prepare('INSERT INTO users (id,username,email,password_hash,role) VALUES (?,?,?,?,?)').run(travellerId, 'traveller_demo', 'traveller@travel.com', travHash, 'traveller');

    const places = [
      { name: 'Hội An Ancient Town', desc: 'A beautifully preserved trading port with lantern-lit streets, ancient temples, and delicious cuisine. UNESCO World Heritage Site known for its charming yellow walls and Vietnamese-Chinese-Japanese architecture.', loc: 'Quảng Nam, Vietnam', cat: 'Heritage' },
      { name: 'Ha Long Bay', desc: 'Emerald waters dotted with thousands of limestone karsts and islets. A natural wonder perfect for cruising, kayaking, and discovering hidden caves in the Gulf of Tonkin.', loc: 'Quảng Ninh, Vietnam', cat: 'Nature' },
      { name: 'Sapa Rice Terraces', desc: 'Breathtaking stepped rice paddies carved into mountain slopes by the Hmong and Dao peoples. Incredible trekking, ethnic culture, and panoramic mountain views.', loc: 'Lào Cai, Vietnam', cat: 'Nature' },
      { name: 'Phong Nha Cave', desc: "One of the world's largest caves with an underground river, stalactite chambers, and bioluminescent formations. A bucket-list adventure in Vietnam.", loc: 'Quảng Bình, Vietnam', cat: 'Adventure' },
    ];
    for (const p of places) {
      _db.prepare('INSERT INTO places (id,name,description,location,category,guide_id) VALUES (?,?,?,?,?,?)')
        .run(uuidv4(), p.name, p.desc, p.loc, p.cat, guideId);
    }

    console.log('✅ Database seeded with demo data');
  }

  console.log('✅ Database ready at', DB_PATH);
  return _db;
}

module.exports = { initDB, getDB: () => _db };
