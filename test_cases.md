# Test Cases - Travel Suite API

Tài liệu này định nghĩa các kịch bản kiểm thử (Test Cases) dành cho dự án **Travel Suite API** dựa trên Swagger specification.

---

## 1. Health Check
| Test Case ID | Tên Test Case | Môi trường / API | Mô tả (Các bước thực hiện) | Kết quả mong đợi (Expected Result) |
|---|---|---|---|---|
| **TC_HEALTH_01** | Kiểm tra trạng thái server | `GET /health` | Gửi request lấy trạng thái server không cần xác thực. | Trả về `200 OK`, `success: true`, message: "Travel Suite API running" và timestamp. |

---

## 2. Authentication (Xác thực)
| Test Case ID | Tên Test Case | Môi trường / API | Mô tả (Các bước thực hiện) | Kết quả mong đợi (Expected Result) |
|---|---|---|---|---|
| **TC_AUTH_01** | Đăng ký thành công | `POST /auth/register` | Gửi đầy đủ thông tin: `username`, `email`, `password` (>=6 ký tự), `role` (guide/traveller). | Trả về `201 Created`, chứa JWT token và thông tin user. |
| **TC_AUTH_02** | Đăng ký thiếu trường | `POST /auth/register` | Gửi request thiếu một trong các trường bắt buộc (ví dụ: không có email). | Trả về `400 Bad Request`, message báo lỗi thiếu trường. |
| **TC_AUTH_03** | Đăng ký sai role | `POST /auth/register` | Gửi role không nằm trong `guide` hoặc `traveller` (ví dụ: `admin`). | Trả về `400 Bad Request`, message: "Role must be 'guide' or 'traveller'". |
| **TC_AUTH_04** | Đăng ký email trùng lặp | `POST /auth/register` | Gửi request với email đã được sử dụng. | Trả về `409 Conflict`, message: "Email or username already registered". |
| **TC_AUTH_05** | Đăng nhập thành công | `POST /auth/login` | Gửi `email` và `password` chính xác. | Trả về `200 OK`, chứa thông tin user và JWT token (thời hạn 7 ngày). |
| **TC_AUTH_06** | Đăng nhập sai mật khẩu | `POST /auth/login` | Gửi đúng email nhưng sai `password`. | Trả về `401 Unauthorized`, message: "Invalid email or password". |
| **TC_AUTH_07** | Lấy thông tin tài khoản | `GET /auth/me` | Gửi request kèm theo Bearer Token hợp lệ trên header. | Trả về `200 OK`, danh sách dữ liệu chi tiết của user hiện tại. |
| **TC_AUTH_08** | Lấy thông tin user (Hết hạn/Sai token) | `GET /auth/me` | Gửi request kèm Bearer Token không hợp lệ hoặc đã hết hạn. | Trả về `401 Unauthorized`. |
| **TC_AUTH_09** | Đăng xuất thành công | `POST /auth/logout` | Gửi request kèm Bearer Token đang hoạt động. | Trả về `200 OK`, message "Logged out successfully", token bị đưa vào blacklist. |

---

## 3. Places (Quản lý địa điểm)
| Test Case ID | Tên Test Case | Môi trường / API | Mô tả (Các bước thực hiện) | Kết quả mong đợi (Expected Result) |
|---|---|---|---|---|
| **TC_PLACE_01** | Lấy danh sách địa điểm | `GET /places` | Gửi request không kèm query parameters. | Trả về `200 OK`, mảng `places` (mặc định limit 12) và `pagination` details. |
| **TC_PLACE_02** | Tìm kiếm địa điểm | `GET /places?q=keyword` | Tìm địa điểm theo từ khóa (name, description, location). | Trả về `200 OK`, chỉ gồm các kết quả khớp từ khóa. |
| **TC_PLACE_03** | Lọc theo category | `GET /places?category=Beach`| Lọc địa điểm theo category hợp lệ. | Trả về `200 OK`, các địa điểm thuộc category tương ứng. |
| **TC_PLACE_04** | Xem chi tiết địa điểm | `GET /places/{id}` | Lấy chi tiết bằng UUID hợp lệ. | Trả về `200 OK`, gồm info địa điểm, `images`, `comments`, `guide_email`. |
| **TC_PLACE_05** | Tạo địa điểm (Thành công) | `POST /places` | Dùng token `guide`, gửi name, location, category hợp lệ. | Trả về `201 Created`, thông tin place mới tạo. |
| **TC_PLACE_06** | Tạo địa điểm (Sai Role) | `POST /places` | Dùng token `traveller`, gửi dữ liệu tạo địa điểm. | Trả về `403 Forbidden`, message "Access restricted to: guide". |
| **TC_PLACE_07** | Cập nhật địa điểm | `PUT /places/{id}` | Dùng token `guide` (chủ sở hữu), đổi tên và description. | Trả về `200 OK`, thông tin place đã được update. |
| **TC_PLACE_08** | Cập nhật sai người sở hữu | `PUT /places/{id}` | Dùng token của một `guide` khác không phải người tạo. | Trả về `403 Forbidden`. |
| **TC_PLACE_09** | Xóa địa điểm | `DELETE /places/{id}` | Dùng token `guide` (chủ sở hữu), xóa địa điểm. | Trả về `200 OK`, message "Place deleted", tất cả images và comments đi kèm bị xóa. |
| **TC_PLACE_10** | Lấy danh sách categories | `GET /places/categories` | Lấy danh sách toàn bộ các loại category. | Trả về `200 OK`, array gồm: Heritage, Nature, Adventure... |

---

## 4. Images (Hình ảnh)
| Test Case ID | Tên Test Case | Môi trường / API | Mô tả (Các bước thực hiện) | Kết quả mong đợi (Expected Result) |
|---|---|---|---|---|
| **TC_IMG_01** | Upload ảnh thành công | `POST /places/{id}/images` | Dùng token `guide` owner, form-data upload `< 10` file hình (jpg/png) `< 10MB`. | Trả về `201 Created`, array images trả về id và filename. |
| **TC_IMG_02** | Upload ảnh quá dung lượng | `POST /places/{id}/images`| Gửi file lớn hơn `10MB`. | Trả về `400 Bad Request`. |
| **TC_IMG_03** | Upload sai định dạng | `POST /places/{id}/images`| Gửi file không phải định dạng ảnh (pdf, txt). | Trả về `400 Bad Request`. |
| **TC_IMG_04** | Xóa ảnh | `DELETE /places/{id}/images/{imgId}` | Dùng token `guide` owner, truyền UUID của img hợp lệ. | Trả về `200 OK`, message "Image deleted". |

---

## 5. Comments & Đánh giá (Rating)
| Test Case ID | Tên Test Case | Môi trường / API | Mô tả (Các bước thực hiện) | Kết quả mong đợi (Expected Result) |
|---|---|---|---|---|
| **TC_CMT_01** | Xem comments của địa điểm| `GET /places/{id}/comments` | Truyền UUID của địa điểm (không cần token). | Trả về `200 OK`, kèm mảng comments và `stats` (avg_rating, total). |
| **TC_CMT_02** | Viết bình luận thành công | `POST /places/{id}/comments` | Dùng token `traveller`, body gửi `rating` (1-5) và `comment` (>=5 chars). | Trả về `201 Created`, comment mới và `avg_rating` của địa điểm tự động update. |
| **TC_CMT_03** | Viết bình luận (Bởi Guide) | `POST /places/{id}/comments` | Dùng token `guide`. | Trả về `403 Forbidden` (Chỉ traveller mới được đánh giá). |
| **TC_CMT_04** | Đánh giá sai Rating | `POST /places/{id}/comments` | Truyền rating là `6` hoặc `0`. | Trả về `400 Bad Request`, message "Rating must be 1-5". |
| **TC_CMT_05** | Xóa bình luận | `DELETE /places/{id}/comments/{commentId}`| Dùng token `traveller` của chính chủ bình luận đó để xóa. | Trả về `200 OK`, xóa comment, `avg_rating` của địa điểm được cập nhật lại. |
| **TC_CMT_06** | Xóa bình luận của người khác| `DELETE /places/{id}/comments/{commentId}`| Dùng token của một `traveller` khác hoặc của `guide`. | Trả về `403 Forbidden`. |
