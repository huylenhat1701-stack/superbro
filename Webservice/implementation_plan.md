# Travel Suite — Implementation Plan v2.0

## Tổng quan

Project hiện tại đã có nền tảng hoàn chỉnh: Express REST API + SQLite + JWT Auth + SPA frontend.
Plan này tập trung vào **nâng cấp chất lượng và tính năng** dựa trên codebase đang hoạt động.

---

## Trạng thái hiện tại (Baseline)

| Layer | Trạng thái | Ghi chú |
|-------|-----------|---------|
| REST API | ✅ Hoàn chỉnh | 14 endpoints, JWT, Multer |
| Database | ✅ Hoạt động | SQLite qua sql.js, 5 tables |
| Frontend SPA | ✅ Hoạt động | 4 pages: Home, Search, Detail, Dashboard |
| API Docs | ✅ Mới tạo | `/api-docs` + `swagger.yaml` |
| Auth flow | ✅ Đầy đủ | Register, Login, Logout, Me |
| CRUD Places | ✅ Đầy đủ | Guide-only, owner check |
| Comments | ✅ Đầy đủ | Traveller-only, auto avg_rating |
| Image upload | ✅ Đầy đủ | Multer, disk, drag&drop |

---

## Các vấn đề cần giải quyết

> [!WARNING]
> **URL không shareable** — SPA dùng routing thuần JS. Refresh trang mất trạng thái, không thể share link địa điểm cụ thể.

> [!IMPORTANT]
> **Không có profile người dùng** — Không có trang cá nhân, không upload avatar, không đổi mật khẩu.

> [!NOTE]
> **Tìm kiếm thiếu autocomplete / debounce** — UX kém khi gõ từ khoá, không có gợi ý.

> [!NOTE]
> **Dashboard chỉ dành cho Guide** — Traveller không có trang để xem lịch sử bình luận.

---

## Open Questions

> [!IMPORTANT]
> **Q1**: Có muốn thêm **"Yêu thích" (Favorites/Bookmarks)** cho Traveller không? Cần thêm bảng `favorites` vào DB.

> [!IMPORTANT]
> **Q2**: Có muốn URL routing kiểu `#/places/:id` (hash-based) để link shareable, hay giữ nguyên?

> [!NOTE]
> **Q3**: Có muốn thêm **Dark/Light mode toggle** không? CSS hiện tại hoàn toàn dark mode.

> [!NOTE]
> **Q4**: Giới hạn rate limit auth: **10 lần/phút** có phù hợp không?

---

## Đề xuất thay đổi

---

### 🔧 Component 1: Server — API Enhancements

#### [MODIFY] [server.js](file:///c:/Webservice/server/server.js)
- Thêm `express-rate-limit` cho auth routes (chống brute force)
- Thêm `helmet` cho security headers
- Thêm `compression` (gzip) cho response

#### [MODIFY] [routes/auth.js](file:///c:/Webservice/server/routes/auth.js)
- **[NEW]** `PUT /api/auth/profile` — Cập nhật username, đổi mật khẩu
- **[NEW]** `POST /api/auth/avatar` — Upload avatar (lưu `uploads/avatars/`)

#### [MODIFY] [routes/places.js](file:///c:/Webservice/server/routes/places.js)
- **[NEW]** `GET /api/places/search/suggestions?q=` — Autocomplete top 5
- Thêm `sort` param: `newest` | `highest_rated` | `most_reviewed`
- Thêm `min_rating` filter

#### [NEW] server/routes/favorites.js
- `GET /api/favorites` — Danh sách yêu thích của user
- `POST /api/favorites/:placeId` — Thêm yêu thích
- `DELETE /api/favorites/:placeId` — Bỏ yêu thích

#### [NEW] server/middleware/rateLimit.js
- Rate limit 10 req/min cho auth, 100 req/min cho API chung

#### [MODIFY] [db/init.js](file:///c:/Webservice/server/db/init.js)
- Thêm bảng `favorites` (user_id, place_id, created_at)
- Thêm index cho `places.category`, `comments.place_id`

#### [MODIFY] [server/package.json](file:///c:/Webservice/server/package.json)
```json
"express-rate-limit": "^7.0.0",
"helmet": "^7.0.0",
"compression": "^1.7.4"
```

---

### 🎨 Component 2: Frontend — UX Improvements

#### [MODIFY] [client/index.html](file:///c:/Webservice/client/index.html)
- Thêm `<div id="page-profile">` — Trang profile người dùng
- Thêm hamburger menu cho mobile
- Thêm "Sort by" dropdown trên search page
- Thêm skeleton loading cards HTML

#### [MODIFY] [client/js/app.js](file:///c:/Webservice/client/js/app.js)
- **Hash-based routing**: `#/` | `#/explore` | `#/places/:id` | `#/dashboard` | `#/profile`
- `hashchange` event listener để URL shareable
- Fade page transition animation
- Thêm route `profile`

#### [MODIFY] [client/js/places.js](file:///c:/Webservice/client/js/places.js)
- Thêm **debounce** 300ms cho search input
- Thêm **autocomplete dropdown** dưới ô tìm kiếm
- Thêm **Sort selector** (Newest / Highest Rated / Most Reviewed)
- Thêm nút ❤️ **Yêu thích** trên place card và detail page
- **Skeleton loading** thay spinner đơn giản

#### [NEW] client/js/profile.js
- Trang cá nhân: avatar, username, email, role, join date
- Form đổi username / mật khẩu
- Guide: danh sách places compact
- Traveller: lịch sử bình luận + danh sách yêu thích
- Upload avatar

#### [MODIFY] [client/js/api.js](file:///c:/Webservice/client/js/api.js)
- Thêm `Api.auth.updateProfile(data)`
- Thêm `Api.auth.uploadAvatar(form)`
- Thêm `Api.places.suggestions(q)`
- Thêm `Api.favorites.*` (list, add, remove)

#### [MODIFY] [client/css/style.css](file:///c:/Webservice/client/css/style.css)
- Skeleton shimmer animation
- Hamburger mobile menu
- Autocomplete dropdown
- Profile page layout
- Favorite heart button animation
- Sort dropdown

---

## Danh sách Endpoints mới (8 endpoints)

| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| PUT | `/api/auth/profile` | Auth | Đổi username/password |
| POST | `/api/auth/avatar` | Auth | Upload avatar |
| GET | `/api/places/search/suggestions?q=` | Public | Autocomplete top 5 |
| GET | `/api/places?sort=highest_rated` | Public | Sort mới |
| GET | `/api/places?min_rating=4` | Public | Filter by rating |
| GET | `/api/favorites` | Auth | Danh sách yêu thích |
| POST | `/api/favorites/:placeId` | Auth | Thêm yêu thích |
| DELETE | `/api/favorites/:placeId` | Auth | Bỏ yêu thích |

---

## Thứ tự thực hiện

```
Phase 1 — Server enhancements
  ├── Cài dependencies mới
  ├── DB: thêm bảng favorites + indexes
  ├── PUT /api/auth/profile + POST /api/auth/avatar
  ├── GET /api/places/search/suggestions
  ├── Sort + min_rating params
  └── Favorites CRUD routes

Phase 2 — Frontend UX
  ├── Hash-based routing (app.js)
  ├── Skeleton loading (CSS + JS)
  ├── Debounce + autocomplete (places.js)
  └── Sort selector + Favorite button

Phase 3 — Profile page
  ├── page-profile HTML (index.html)
  ├── profile.js module
  └── Avatar upload UI

Phase 4 — Polish
  ├── Page transitions
  ├── Mobile hamburger menu
  └── Cập nhật swagger.yaml với endpoints mới
```

---

## Verification Plan

### Automated Tests
```bash
# Test new endpoints
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <token>" \
  -d '{"username":"new_name"}'

curl http://localhost:3000/api/places/search/suggestions?q=hoi

curl "http://localhost:3000/api/places?sort=highest_rated&min_rating=4"

curl -X POST http://localhost:3000/api/favorites/<placeId> \
  -H "Authorization: Bearer <token>"
```

### Manual Verification
1. ✅ Hash routing: navigate → refresh → URL giữ state
2. ✅ Autocomplete: gõ "ha" → 5 gợi ý sau 300ms
3. ✅ Sort: "Highest Rated" → đúng thứ tự
4. ✅ Favorite: click ❤️ → persist sau refresh
5. ✅ Profile: upload avatar → hiện trong navbar
6. ✅ Rate limit: 11 login/phút → 429
