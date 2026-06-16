/**
 * seed-images.js
 * Gán ảnh đã copy vào uploads/ cho 4 địa điểm trong CSDL
 * Chạy: node seed-images.js
 */

const { initDB, getDB } = require('./db/init');

const IMAGE_MAP = [
  { placeName: 'Hội An Ancient Town', filename: 'hoian.png',    caption: 'Đêm đèn lồng Hội An' },
  { placeName: 'Ha Long Bay',         filename: 'halong.png',   caption: 'Vịnh Hạ Long nhìn từ trên cao' },
  { placeName: 'Sapa Rice Terraces',  filename: 'sapa.png',     caption: 'Ruộng bậc thang Sapa' },
  { placeName: 'Phong Nha Cave',      filename: 'phongnha.png', caption: 'Hang Phong Nha huyền bí' },
];

async function run() {
  await initDB();
  const db = getDB();

  for (const item of IMAGE_MAP) {
    // Tìm place theo tên
    const place = db.prepare(`SELECT id FROM places WHERE name = ?`).get(item.placeName);

    if (!place) {
      console.log(`⚠️  Không tìm thấy địa điểm: "${item.placeName}"`);
      continue;
    }

    // Kiểm tra ảnh đã tồn tại chưa
    const existing = db.prepare(`SELECT id FROM images WHERE place_id = ? AND filename = ?`).get(place.id, item.filename);
    if (existing) {
      console.log(`⏩  Bỏ qua (đã có): ${item.filename}`);
      continue;
    }

    // Insert ảnh vào bảng images
    db.prepare(`
      INSERT INTO images (id, place_id, filename, caption, uploaded_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(require('crypto').randomUUID(), place.id, item.filename, item.caption);

    console.log(`✅  Đã gán "${item.filename}" → "${item.placeName}" (id=${place.id})`);
  }

  console.log('\n🎉 Seed ảnh hoàn tất!');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
