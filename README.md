# 🌊 AquaGuard — Hệ thống quản lý hỗ trợ cứu hộ lũ lụt thông minh

> Nền tảng hỗ trợ cứu hộ lũ lụt thông minh — Gửi SOS khẩn cấp, điều phối đội cứu hộ và theo dõi vị trí realtime.

---

## 📋 Yêu cầu hệ thống

| Công cụ         | Phiên bản |
| --------------- | --------- |
| Node.js         | v18+      |
| npm             | v9+       |
| Angular CLI     | v21+      |
| MySQL           | v8.0+     |
| MySQL Workbench | 8.0+      |
| Git             | Mới nhất  |

---

## 🚀 Cài đặt & Chạy project

### Bước 1 — Clone repository

```bash
git clone -b dev https://github.com/AnhKhoa06/aquaguard.git
cd aquaguard
```

---

### Bước 2 — Cài đặt Backend

```bash
cd aquaguard-backend
npm install
```

Tạo file `.env` từ file mẫu:

```bash
copy .env.example .env
```

Mở file `.env` và điền thông tin:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=aquaguard
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
RESPONDER_SECRET=RESCUE2026
```

---

### Bước 3 — Tạo database

Mở **MySQL Workbench**, kết nối vào MySQL server, sau đó:

1. Vào menu **File** → **Open SQL Script**
2. Chọn file `aquaguard-backend/src/database/seed.sql`
3. Nhấn **Execute** (Ctrl + Shift + Enter)

> File `seed.sql` sẽ tự động tạo database, tạo toàn bộ bảng và thêm dữ liệu mẫu.

---

### Bước 4 — Chạy Backend

```bash
cd aquaguard-backend
npm run dev
```

Backend sẽ chạy tại: `http://localhost:3000`

Kiểm tra bằng cách mở trình duyệt vào `http://localhost:3000` — nếu thấy:

```json
{ "message": "AquaGuard API is running!" }
```

là thành công ✅

---

### Bước 5 — Cài đặt Frontend

Mở terminal mới:

```bash
cd aquaguard-frontend
npm install
```

---

### Bước 6 — Chạy Frontend

```bash
ng serve
```

Hoặc:

```bash
npm start
```

Frontend sẽ chạy tại: `http://localhost:4200`

---

## 🔑 Tài khoản mặc định

| Vai trò                    | Số điện thoại | Mật khẩu |
| -------------------------- | ------------- | -------- |
| Admin                      | 0123456789    | 123456   |
| Cứu hộ (Cứu hộ miền trung) | 0123456787    | 123456   |
| Công dân (Anh Khoa)        | 0987654321    | 123456   |

> **Mã đăng ký tài khoản cứu hộ:** `RESCUE2026`

---

## 📁 Cấu trúc project

```
aquaguard/
├── aquaguard-backend/          # Backend Express.js
│   ├── src/
│   │   ├── config/             # Cấu hình DB, JWT, env
│   │   ├── controllers/        # Xử lý logic API
│   │   ├── middlewares/        # Auth, role, error middleware
│   │   ├── models/             # Truy vấn database
│   │   ├── routes/             # Định nghĩa routes
│   │   ├── utils/              # Helper functions
│   │   └── database/
│   │       ├── migrations.sql  # Tạo bảng
│   │       └── seed.sql        # Dữ liệu mẫu
│   ├── uploads/                # Hình ảnh upload
│   ├── .env.example            # Mẫu file .env
│   └── index.js                # Entry point
│
└── aquaguard-frontend/         # Frontend Angular
    ├── src/
    │   ├── app/
    │   │   ├── core/           # Guards, interceptors, services
    │   │   ├── pages/          # Các trang (auth, admin, citizen, responder)
    │   │   ├── shared/         # Components dùng chung
    │   │   └── models/         # TypeScript interfaces
    │   └── environments/       # Cấu hình môi trường
    └── public/                 # Assets (logo, favicon)
```

---

## 🛠️ API Endpoints

### Auth

| Method | Endpoint             | Mô tả              |
| ------ | -------------------- | ------------------ |
| POST   | `/api/auth/register` | Đăng ký tài khoản  |
| POST   | `/api/auth/login`    | Đăng nhập          |
| POST   | `/api/auth/refresh`  | Làm mới token      |
| POST   | `/api/auth/logout`   | Đăng xuất          |
| GET    | `/api/auth/me`       | Lấy thông tin user |

### SOS

| Method | Endpoint              | Mô tả                            |
| ------ | --------------------- | -------------------------------- |
| POST   | `/api/sos`            | Gửi yêu cầu SOS                  |
| GET    | `/api/sos/my`         | Xem SOS của mình                 |
| PATCH  | `/api/sos/:id/cancel` | Huỷ SOS                          |
| PATCH  | `/api/sos/:id/accept` | Nhận nhiệm vụ (responder)        |
| GET    | `/api/sos`            | Xem tất cả SOS (admin/responder) |
| PATCH  | `/api/sos/:id/assign` | Phân công cứu hộ (admin)         |
| PATCH  | `/api/sos/:id/status` | Cập nhật trạng thái              |

### Khác

| Method | Endpoint               | Mô tả                   |
| ------ | ---------------------- | ----------------------- |
| GET    | `/api/alerts`          | Danh sách cảnh báo      |
| GET    | `/api/alerts/weather`  | Thời tiết từ Open-Meteo |
| GET    | `/api/shelters`        | Danh sách điểm sơ tán   |
| GET    | `/api/notifications`   | Thông báo của user      |
| GET    | `/api/family`          | Danh sách gia đình      |
| GET    | `/api/admin/dashboard` | Thống kê tổng quan      |

---

## 🧰 Công nghệ sử dụng

**Backend:**

- Express.js
- MySQL + mysql2
- JWT (jsonwebtoken)
- bcryptjs
- Multer (upload ảnh)
- Axios (Open-Meteo API)

**Frontend:**

- Angular 21
- Angular Material
- ngx-toastr
- Leaflet.js (bản đồ)

---

## 👥 Nhóm phát triển

| Thành viên        | Vai trò                                     |
| ----------------- | ------------------------------------------- |
| Lê Anh Khoa       | Trưởng nhóm, Backend Lead, FE Admin & Core  |
| Huỳnh Ngọc Khương | Backend Shelter/Notification, FE Đội cứu hộ |
| Huy               | FE Công dân                                 |
| Lịch              | FE Hỗ trợ                                   |

---

## 📝 Ghi chú

- Đảm bảo MySQL đang chạy trước khi khởi động backend
- Backend chạy ở port `3000`, Frontend chạy ở port `4200`
- File `.env` không được commit lên Git — tự tạo từ `.env.example`
- Hình ảnh upload được lưu trong thư mục `uploads/` của backend
