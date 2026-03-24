# Tài Liệu Thiết Kế Kỹ Thuật
# Hệ Thống Quản Lý Kho Giấy

---

## 1. Tổng Quan Kiến Trúc

### 1.1 Kiến Trúc Tổng Thể

Hệ thống theo mô hình **Client-Server** với kiến trúc **REST API**:

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│     HTML + JSX (Babel CDN) + Axios CDN + Recharts CDN    │
│         Không cần build step, chạy trực tiếp             │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / REST API
                       │ JWT Authorization Header
┌──────────────────────▼──────────────────────────────────┐
│         BACKEND (Node.js + Express)                      │
│         Serve static files từ frontend/                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Auth      │ │Product   │ │Warehouse │ │Order      │  │
│  │Service   │ │Service   │ │Service   │ │Service    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Partner   │ │Report    │ │Upload    │ │PDF/Email  │  │
│  │Service   │ │Service   │ │Service   │ │Service    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   DATABASE (MySQL/PostgreSQL)             │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Tech Stack

| Tầng       | Công nghệ                                                        |
|------------|------------------------------------------------------------------|
| Frontend   | HTML + JSX (Babel Standalone CDN), Axios CDN, Recharts CDN       |
| Routing    | Điều hướng thủ công bằng hash (`#/admin/dashboard`) hoặc history API |
| Backend    | Node.js, Express.js (serve static + REST API)                    |
| Database   | MySQL hoặc PostgreSQL                                            |
| Auth       | JWT (jsonwebtoken), bcrypt                                       |
| Upload     | multer, sharp (nén ảnh + thumbnail)                              |
| PDF        | pdfkit hoặc puppeteer                                            |
| Email      | nodemailer                                                       |
| Charts     | Recharts (load qua CDN)                                          |

**Cách hoạt động Frontend:**
- Backend Express serve thư mục `frontend/` dưới dạng static files
- Mỗi trang là một file `.html` riêng (hoặc dùng SPA với `index.html` duy nhất)
- File JSX được load qua `<script type="text/babel">` với Babel Standalone CDN
- Không cần npm install, không cần build step cho frontend
- Token JWT lưu trong `localStorage`, đính kèm vào mọi request Axios


### 1.3 Luồng Xác Thực (Auth Flow)

```
Client                          Server
  │                               │
  │── POST /api/auth/login ───────►│
  │   { email, password }         │ 1. Tìm user theo email
  │                               │ 2. So sánh bcrypt hash
  │                               │ 3. Tạo JWT (24h, payload: {id, role})
  │◄── { token, user } ───────────│
  │                               │
  │── GET /api/products ──────────►│
  │   Authorization: Bearer <jwt> │ 4. Middleware verifyToken
  │                               │ 5. Decode JWT → req.user
  │                               │ 6. Middleware checkRole (nếu cần)
  │◄── { data } ──────────────────│
```

### 1.4 Luồng Đặt Hàng (Order Flow)

```
1. Khách hàng thêm sản phẩm vào giỏ hàng (lưu DB)
2. Khách hàng vào trang checkout
3. Nhập địa chỉ, SĐT, phương thức thanh toán, yêu cầu VAT
4. POST /api/orders → tạo đơn hàng trạng thái "chờ duyệt"
5. Xóa giỏ hàng
6. Gửi email xác nhận (async, không block response)
7. Admin duyệt → "đã duyệt" → "đang giao" → "hoàn thành"
```

### 1.5 Luồng Nhập/Xuất Kho (Warehouse Flow)

```
Nhập kho:
  POST /api/warehouse/receipts
  → Lưu phiếu nhập
  → UPDATE inventory SET quantity = quantity + :amount WHERE product_id = :id

Xuất kho:
  POST /api/warehouse/issues
  → Kiểm tra tồn kho >= số lượng xuất
  → Lưu phiếu xuất
  → UPDATE inventory SET quantity = quantity - :amount WHERE product_id = :id

Kiểm kê:
  POST /api/warehouse/stocktakes
  → So sánh thực tế vs hệ thống
  → Tạo phiếu điều chỉnh
  → UPDATE inventory SET quantity = :actual WHERE product_id = :id
```

---

## 2. Database Schema

### 2.1 Bảng users

```sql
CREATE TABLE users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  full_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  phone       VARCHAR(11)  NOT NULL,
  password    VARCHAR(255) NOT NULL,  -- bcrypt hash
  role        ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 Bảng categories

```sql
CREATE TABLE categories (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dữ liệu mặc định
INSERT INTO categories (name) VALUES
  ('Giấy In'), ('Giấy Ảnh'), ('Giấy Bìa'), ('Vải Vụn'), ('Lõi Ống');
```

### 2.3 Bảng products

```sql
CREATE TABLE products (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  code          VARCHAR(20) NOT NULL UNIQUE,  -- mã sản phẩm duy nhất
  name          VARCHAR(200) NOT NULL,
  category_id   INT NOT NULL,
  description   TEXT,
  unit          ENUM('tấn', 'kg', 'ream', 'cuộn') NOT NULL,
  price         DECIMAL(15, 2) NOT NULL,
  is_visible    BOOLEAN NOT NULL DEFAULT TRUE,
  min_stock     INT NOT NULL DEFAULT 0,       -- ngưỡng tồn kho tối thiểu
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### 2.4 Bảng product_images

```sql
CREATE TABLE product_images (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  product_id  INT NOT NULL,
  file_path   VARCHAR(500) NOT NULL,
  thumb_path  VARCHAR(500) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

### 2.5 Bảng inventory

```sql
CREATE TABLE inventory (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  product_id  INT NOT NULL UNIQUE,
  quantity    DECIMAL(15, 3) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```


### 2.6 Bảng suppliers (Nhà Cung Cấp)

```sql
CREATE TABLE suppliers (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  code            VARCHAR(20) NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL UNIQUE,
  contact_person  VARCHAR(100),
  phone           VARCHAR(11) NOT NULL,
  email           VARCHAR(150),
  address         TEXT,
  category_ids    JSON,  -- danh mục sản phẩm cung cấp
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.7 Bảng warehouse_receipts (Phiếu Nhập Kho)

```sql
CREATE TABLE warehouse_receipts (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  code          VARCHAR(20) NOT NULL UNIQUE,
  supplier_id   INT NOT NULL,
  product_id    INT NOT NULL,
  quantity      DECIMAL(15, 3) NOT NULL,
  unit          ENUM('tấn', 'kg', 'ream', 'cuộn') NOT NULL,
  unit_price    DECIMAL(15, 2) NOT NULL,
  total_price   DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  receipt_date  DATE NOT NULL,
  note          TEXT,
  created_by    INT NOT NULL,  -- user_id của admin
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (product_id)  REFERENCES products(id),
  FOREIGN KEY (created_by)  REFERENCES users(id)
);
```

### 2.8 Bảng warehouse_issues (Phiếu Xuất Kho)

```sql
CREATE TABLE warehouse_issues (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  code          VARCHAR(20) NOT NULL UNIQUE,
  product_id    INT NOT NULL,
  quantity      DECIMAL(15, 3) NOT NULL,
  unit          ENUM('tấn', 'kg', 'ream', 'cuộn') NOT NULL,
  reason        VARCHAR(200) NOT NULL,
  issue_date    DATE NOT NULL,
  note          TEXT,
  created_by    INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id)  REFERENCES products(id),
  FOREIGN KEY (created_by)  REFERENCES users(id)
);
```

### 2.9 Bảng stocktakes (Kiểm Kê Kho)

```sql
CREATE TABLE stocktakes (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  code          VARCHAR(20) NOT NULL UNIQUE,
  note          TEXT,
  created_by    INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at  TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE stocktake_items (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  stocktake_id    INT NOT NULL,
  product_id      INT NOT NULL,
  system_quantity DECIMAL(15, 3) NOT NULL,
  actual_quantity DECIMAL(15, 3) NOT NULL,
  difference      DECIMAL(15, 3) GENERATED ALWAYS AS (actual_quantity - system_quantity) STORED,
  reason          TEXT,
  FOREIGN KEY (stocktake_id) REFERENCES stocktakes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)   REFERENCES products(id)
);
```

### 2.10 Bảng carts (Giỏ Hàng)

```sql
CREATE TABLE cart_items (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    DECIMAL(15, 3) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 2.11 Bảng orders (Đơn Hàng)

```sql
CREATE TABLE orders (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  code              VARCHAR(20) NOT NULL UNIQUE,
  user_id           INT NOT NULL,
  shipping_address  TEXT NOT NULL,
  shipping_phone    VARCHAR(11) NOT NULL,
  shipping_fee      DECIMAL(15, 2) NOT NULL DEFAULT 0,
  subtotal          DECIMAL(15, 2) NOT NULL,
  vat_amount        DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_amount      DECIMAL(15, 2) NOT NULL,
  payment_method    ENUM('cash', 'transfer') NOT NULL,
  payment_status    ENUM('unpaid', 'partial', 'paid') NOT NULL DEFAULT 'unpaid',
  order_status      ENUM('pending', 'approved', 'shipping', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  -- Thông tin VAT (nullable)
  vat_company_name  VARCHAR(200),
  vat_tax_code      VARCHAR(20),
  vat_company_addr  TEXT,
  note              TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.12 Bảng order_items

```sql
CREATE TABLE order_items (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,  -- snapshot tên tại thời điểm đặt
  unit        VARCHAR(20) NOT NULL,
  quantity    DECIMAL(15, 3) NOT NULL,
  unit_price  DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 2.13 Bảng order_status_logs

```sql
CREATE TABLE order_status_logs (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  order_id    INT NOT NULL,
  old_status  VARCHAR(20),
  new_status  VARCHAR(20) NOT NULL,
  changed_by  INT NOT NULL,
  changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
```

### 2.14 Bảng payments (Thanh Toán)

```sql
CREATE TABLE payments (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  order_id        INT NOT NULL,
  amount          DECIMAL(15, 2) NOT NULL,
  method          ENUM('cash', 'transfer') NOT NULL,
  payment_date    DATE NOT NULL,
  confirmed_by    INT NOT NULL,
  note            TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)      REFERENCES orders(id),
  FOREIGN KEY (confirmed_by)  REFERENCES users(id)
);
```

### 2.15 Bảng expenses (Chi Phí)

```sql
CREATE TABLE expenses (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  type          ENUM('labor', 'shipping') NOT NULL,
  amount        DECIMAL(15, 2) NOT NULL,
  expense_date  DATE NOT NULL,
  description   TEXT,
  order_id      INT,          -- liên kết tùy chọn
  receipt_id    INT,          -- liên kết tùy chọn
  created_by    INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES orders(id),
  FOREIGN KEY (receipt_id) REFERENCES warehouse_receipts(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```


---

## 3. Thiết Kế API (REST Endpoints)

### 3.1 Auth API

| Method | Endpoint                  | Mô tả                        | Auth     |
|--------|---------------------------|------------------------------|----------|
| POST   | /api/auth/register        | Đăng ký tài khoản            | Public   |
| POST   | /api/auth/login           | Đăng nhập, trả JWT           | Public   |
| GET    | /api/auth/me              | Lấy thông tin user hiện tại  | Required |

### 3.2 Categories API

| Method | Endpoint                  | Mô tả                        | Auth     |
|--------|---------------------------|------------------------------|----------|
| GET    | /api/categories           | Danh sách danh mục           | Public   |
| POST   | /api/categories           | Tạo danh mục mới             | Admin    |
| PUT    | /api/categories/:id       | Cập nhật danh mục            | Admin    |
| DELETE | /api/categories/:id       | Xóa danh mục                 | Admin    |

### 3.3 Products API

| Method | Endpoint                        | Mô tả                              | Auth     |
|--------|---------------------------------|------------------------------------|----------|
| GET    | /api/products                   | Danh sách sản phẩm (có filter/sort/page) | Public |
| GET    | /api/products/:id               | Chi tiết sản phẩm                  | Public   |
| POST   | /api/products                   | Tạo sản phẩm mới                   | Admin    |
| PUT    | /api/products/:id               | Cập nhật sản phẩm                  | Admin    |
| PATCH  | /api/products/:id/visibility    | Ẩn/hiện sản phẩm                   | Admin    |
| DELETE | /api/products/:id               | Xóa sản phẩm                       | Admin    |
| POST   | /api/products/:id/images        | Upload ảnh sản phẩm (multipart)    | Admin    |
| DELETE | /api/products/:id/images/:imgId | Xóa ảnh sản phẩm                   | Admin    |

Query params cho GET /api/products:
- `search` – tìm theo tên
- `category_id` – lọc theo danh mục
- `min_price`, `max_price` – khoảng giá
- `in_stock` – còn hàng (true/false)
- `sort` – price_asc | price_desc | name_asc | newest
- `page`, `limit` – phân trang (mặc định limit=20)
- `admin=true` – hiển thị cả sản phẩm ẩn (chỉ admin)

### 3.4 Warehouse API

| Method | Endpoint                          | Mô tả                          | Auth  |
|--------|-----------------------------------|--------------------------------|-------|
| GET    | /api/warehouse/inventory          | Tổng quan tồn kho              | Admin |
| GET    | /api/warehouse/inventory/export   | Xuất CSV tồn kho               | Admin |
| GET    | /api/warehouse/receipts           | Danh sách phiếu nhập kho       | Admin |
| POST   | /api/warehouse/receipts           | Tạo phiếu nhập kho             | Admin |
| GET    | /api/warehouse/receipts/:id       | Chi tiết phiếu nhập            | Admin |
| GET    | /api/warehouse/receipts/:id/pdf   | Xuất PDF phiếu nhập            | Admin |
| GET    | /api/warehouse/issues             | Danh sách phiếu xuất kho       | Admin |
| POST   | /api/warehouse/issues             | Tạo phiếu xuất kho             | Admin |
| GET    | /api/warehouse/issues/:id         | Chi tiết phiếu xuất            | Admin |
| GET    | /api/warehouse/issues/:id/pdf     | Xuất PDF phiếu xuất            | Admin |
| GET    | /api/warehouse/stocktakes         | Lịch sử kiểm kê                | Admin |
| POST   | /api/warehouse/stocktakes         | Tạo phiếu kiểm kê              | Admin |
| PUT    | /api/warehouse/stocktakes/:id/confirm | Xác nhận kiểm kê           | Admin |

### 3.5 Cart API

| Method | Endpoint                  | Mô tả                        | Auth     |
|--------|---------------------------|------------------------------|----------|
| GET    | /api/cart                 | Lấy giỏ hàng hiện tại        | Customer |
| POST   | /api/cart/items           | Thêm sản phẩm vào giỏ        | Customer |
| PUT    | /api/cart/items/:id       | Cập nhật số lượng            | Customer |
| DELETE | /api/cart/items/:id       | Xóa sản phẩm khỏi giỏ        | Customer |
| DELETE | /api/cart                 | Xóa toàn bộ giỏ hàng         | Customer |

### 3.6 Orders API

| Method | Endpoint                          | Mô tả                          | Auth     |
|--------|-----------------------------------|--------------------------------|----------|
| GET    | /api/orders                       | Danh sách đơn hàng (admin: tất cả, customer: của mình) | Required |
| POST   | /api/orders                       | Tạo đơn hàng từ giỏ hàng       | Customer |
| GET    | /api/orders/:id                   | Chi tiết đơn hàng              | Required |
| PATCH  | /api/orders/:id/status            | Cập nhật trạng thái đơn hàng   | Required |
| GET    | /api/orders/:id/pdf               | Xuất PDF hóa đơn VAT           | Admin    |
| POST   | /api/orders/:id/payments          | Ghi nhận thanh toán            | Admin    |
| GET    | /api/orders/unpaid                | Danh sách đơn chưa thanh toán  | Admin    |

### 3.7 Suppliers API

| Method | Endpoint                  | Mô tả                        | Auth  |
|--------|---------------------------|------------------------------|-------|
| GET    | /api/suppliers            | Danh sách nhà cung cấp       | Admin |
| POST   | /api/suppliers            | Tạo nhà cung cấp             | Admin |
| GET    | /api/suppliers/:id        | Chi tiết nhà cung cấp        | Admin |
| PUT    | /api/suppliers/:id        | Cập nhật nhà cung cấp        | Admin |
| DELETE | /api/suppliers/:id        | Xóa nhà cung cấp             | Admin |

### 3.8 Expenses API

| Method | Endpoint                  | Mô tả                        | Auth  |
|--------|---------------------------|------------------------------|-------|
| GET    | /api/expenses             | Danh sách chi phí            | Admin |
| POST   | /api/expenses             | Tạo bản ghi chi phí          | Admin |
| PUT    | /api/expenses/:id         | Cập nhật chi phí             | Admin |
| DELETE | /api/expenses/:id         | Xóa chi phí                  | Admin |

### 3.9 Reports API

| Method | Endpoint                          | Mô tả                          | Auth  |
|--------|-----------------------------------|--------------------------------|-------|
| GET    | /api/reports/dashboard            | Dữ liệu trang tổng quan        | Admin |
| GET    | /api/reports/inventory            | Báo cáo tồn kho                | Admin |
| GET    | /api/reports/inventory/export     | Xuất CSV báo cáo tồn kho       | Admin |
| GET    | /api/reports/revenue              | Báo cáo doanh thu              | Admin |
| GET    | /api/reports/revenue/export       | Xuất CSV doanh thu             | Admin |
| GET    | /api/reports/expenses             | Báo cáo chi phí                | Admin |
| GET    | /api/reports/expenses/export      | Xuất CSV chi phí               | Admin |

### 3.10 Customers API (Admin)

| Method | Endpoint                  | Mô tả                        | Auth  |
|--------|---------------------------|------------------------------|-------|
| GET    | /api/customers            | Danh sách khách hàng         | Admin |
| GET    | /api/customers/:id        | Hồ sơ + lịch sử mua hàng    | Admin |


---

## 4. Cấu Trúc Thư Mục

### 4.1 Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              # Kết nối database
│   │   └── multer.js          # Cấu hình upload
│   ├── middleware/
│   │   ├── auth.js            # verifyToken, checkRole
│   │   └── errorHandler.js    # Global error handler
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── category.routes.js
│   │   ├── product.routes.js
│   │   ├── warehouse.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   ├── supplier.routes.js
│   │   ├── expense.routes.js
│   │   ├── report.routes.js
│   │   └── customer.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   ├── product.controller.js
│   │   ├── warehouse.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   ├── supplier.controller.js
│   │   ├── expense.controller.js
│   │   ├── report.controller.js
│   │   └── customer.controller.js
│   ├── services/
│   │   ├── inventory.service.js   # Logic tồn kho
│   │   ├── email.service.js       # nodemailer
│   │   ├── pdf.service.js         # pdfkit/puppeteer
│   │   ├── image.service.js       # sharp compress/thumbnail
│   │   └── csv.service.js         # Xuất CSV
│   ├── utils/
│   │   ├── codeGenerator.js       # Tạo mã duy nhất (SP001, PN001...)
│   │   └── pagination.js          # Helper phân trang
│   └── app.js                     # Express app setup
├── uploads/                       # Thư mục lưu ảnh
│   ├── products/
│   └── thumbnails/
├── .env
└── package.json
```

### 4.2 Frontend

```
frontend/
├── index.html                 # Trang chủ / SPA entry point
├── login.html                 # Trang đăng nhập
├── register.html              # Trang đăng ký
├── css/
│   ├── main.css               # Style chung
│   ├── admin.css              # Style trang admin
│   └── customer.css           # Style trang khách hàng
├── js/
│   ├── api.js                 # Axios instance + interceptors (JWT)
│   ├── auth.js                # Hàm login, logout, getMe, kiểm tra token
│   └── utils.js               # Hàm tiện ích: format tiền, ngày, phân trang
├── admin/
│   ├── index.html             # Admin SPA shell (load app-admin.jsx)
│   ├── app-admin.jsx          # Toàn bộ React components admin (all-in-one)
│   └── (hoặc chia nhỏ theo module nếu cần)
└── customer/
    ├── index.html             # Customer SPA shell (load app-customer.jsx)
    └── app-customer.jsx       # Toàn bộ React components customer (all-in-one)
```

**Cấu trúc HTML shell mẫu:**
```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Quản Lý Kho Giấy</title>
  <link rel="stylesheet" href="/css/main.css">
  <!-- CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="https://unpkg.com/recharts/umd/Recharts.js"></script>
</head>
<body>
  <div id="root"></div>
  <script src="/js/api.js"></script>
  <script src="/js/auth.js"></script>
  <script type="text/babel" src="/admin/app-admin.jsx"></script>
</body>
</html>
```

---

## 5. Các Component và Interface Chính

### 5.1 Middleware Auth (Backend)

```js
// verifyToken: kiểm tra JWT header
// checkRole('admin'): kiểm tra role
// Sử dụng: router.get('/admin-only', verifyToken, checkRole('admin'), handler)
```

### 5.2 Inventory Service

```js
// Tăng tồn kho khi nhập
increaseStock(productId, quantity, trx)

// Giảm tồn kho khi xuất (có kiểm tra đủ hàng)
decreaseStock(productId, quantity, trx)

// Cập nhật tồn kho theo kiểm kê
adjustStock(productId, actualQuantity, trx)

// Lấy tồn kho hiện tại
getStock(productId)
```

### 5.3 Cảnh Báo Tồn Kho Thấp

Sau mỗi lần xuất kho hoặc xác nhận kiểm kê, hệ thống kiểm tra:
```
IF inventory.quantity < products.min_stock THEN
  → Gửi email cảnh báo (async, không block)
  → Ghi log nếu email thất bại
```

### 5.4 Tính Phí Vận Chuyển

Phí vận chuyển tính theo khu vực (đơn giản hóa):
```
Nội thành: 30,000 VNĐ
Ngoại thành: 50,000 VNĐ
Tỉnh khác: 100,000 VNĐ
```
Frontend gọi API để lấy phí trước khi xác nhận đơn.

---

## 6. Xử Lý Lỗi

### 6.1 HTTP Status Codes

| Code | Ý nghĩa                                      |
|------|----------------------------------------------|
| 200  | Thành công                                   |
| 201  | Tạo mới thành công                           |
| 400  | Dữ liệu đầu vào không hợp lệ                 |
| 401  | Chưa xác thực (thiếu/hết hạn JWT)            |
| 403  | Không có quyền truy cập                      |
| 404  | Không tìm thấy tài nguyên                    |
| 409  | Xung đột dữ liệu (email/tên đã tồn tại)      |
| 500  | Lỗi server nội bộ                            |

### 6.2 Cấu Trúc Response Lỗi

```json
{
  "success": false,
  "message": "Mô tả lỗi bằng tiếng Việt",
  "errors": [
    { "field": "email", "message": "Email đã được sử dụng" }
  ]
}
```

### 6.3 Xử Lý Lỗi Dịch Vụ Ngoài

- Email (nodemailer): Nếu thất bại → ghi log, KHÔNG rollback đơn hàng
- PDF: Nếu thất bại → trả 500 với thông báo lỗi rõ ràng
- Upload ảnh: Nếu thất bại → rollback, không lưu sản phẩm


---

## 7. Mô Hình Dữ Liệu (Data Models)

### 7.1 Sơ Đồ Quan Hệ (ERD tóm tắt)

```
users ──────────────────────────────────────────────────────────────────┐
  │ (created_by)                                                         │
  ├──► warehouse_receipts ──► suppliers                                  │
  │         └──► products ──► categories                                 │
  │                  └──► product_images                                 │
  │                  └──► inventory                                      │
  ├──► warehouse_issues ──► products                                     │
  ├──► stocktakes ──► stocktake_items ──► products                       │
  ├──► cart_items ──► products                                           │
  ├──► orders ──► order_items ──► products                               │
  │       └──► order_status_logs                                         │
  │       └──► payments                                                  │
  └──► expenses                                                          │
```

### 7.2 Quy Tắc Tính Tồn Kho

```sql
-- Tồn kho = tổng nhập - tổng xuất (được duy trì trong bảng inventory)
-- Mỗi khi nhập/xuất/kiểm kê → UPDATE inventory trực tiếp (trong transaction)
-- Không tính lại từ đầu mỗi lần query để đảm bảo hiệu năng
```

### 7.3 Quy Tắc Tính Doanh Thu

```sql
-- Chỉ tính từ orders có order_status = 'completed'
SELECT SUM(total_amount) FROM orders
WHERE order_status = 'completed'
  AND created_at BETWEEN :start AND :end;
```

### 7.4 Quy Tắc Tính Lợi Nhuận Ròng

```
Lợi nhuận ròng = Doanh thu (đơn hoàn thành) 
               - Chi phí nhân công (expenses.type = 'labor')
               - Chi phí vận chuyển (expenses.type = 'shipping')
               - Chi phí nhập kho (SUM warehouse_receipts.total_price)
```

---

## 8. Chiến Lược Kiểm Thử (Testing Strategy)

### 8.1 Unit Tests

Tập trung vào các logic nghiệp vụ quan trọng:
- Validation đầu vào (email, phone, password, số lượng)
- Tính toán tồn kho (tăng/giảm/điều chỉnh)
- Kiểm tra chuyển trạng thái đơn hàng hợp lệ
- Tính tổng tiền đơn hàng (subtotal + shipping + VAT)
- Tính lợi nhuận ròng

### 8.2 Property-Based Tests

Sử dụng thư viện **fast-check** (JavaScript/Node.js) cho backend.

Cấu hình: tối thiểu 100 iterations mỗi property test.

Tag format: `// Feature: warehouse-management-system, Property {N}: {mô tả}`


---

## 9. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Validation đầu vào đăng ký

*For any* chuỗi đầu vào đăng ký, hàm validate phải từ chối: email không có "@" hoặc tên miền, số điện thoại không phải 10-11 chữ số, mật khẩu dưới 8 ký tự, và cặp (password, confirmPassword) không bằng nhau.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

---

### Property 2: Mật khẩu được lưu dạng bcrypt hash

*For any* mật khẩu hợp lệ được đăng ký, giá trị lưu trong DB phải là bcrypt hash và `bcrypt.compare(password, hash)` phải trả về `true`.

**Validates: Requirements 1.7**

---

### Property 3: JWT token có thời hạn 24 giờ

*For any* user đăng nhập thành công, JWT token được tạo ra phải có `exp - iat = 86400` giây (24 giờ).

**Validates: Requirements 2.2**

---

### Property 4: Đăng nhập sai thông tin phải trả lỗi

*For any* cặp (email, password) không khớp với bất kỳ user nào trong DB, API đăng nhập phải trả về HTTP 401.

**Validates: Requirements 2.4**

---

### Property 5: Tên danh mục là duy nhất

*For any* tên danh mục đã tồn tại trong hệ thống, cố tạo danh mục mới với cùng tên phải trả về HTTP 409.

**Validates: Requirements 3.3**

---

### Property 6: Sản phẩm ẩn không xuất hiện trong danh sách khách hàng

*For any* sản phẩm có `is_visible = false`, kết quả trả về từ `GET /api/products` (không có admin flag) không được chứa sản phẩm đó.

**Validates: Requirements 4.5, 4.9**

---

### Property 7: Nhập kho tăng tồn kho đúng số lượng

*For any* phiếu nhập kho hợp lệ với số lượng `q`, tồn kho sau khi nhập phải bằng tồn kho trước cộng `q`.

**Validates: Requirements 5.2**

---

### Property 8: Số lượng nhập/xuất phải lớn hơn 0

*For any* yêu cầu tạo phiếu nhập hoặc xuất kho với số lượng `<= 0`, hệ thống phải trả về HTTP 400.

**Validates: Requirements 5.3, 6.4**

---

### Property 9: Xuất kho giảm tồn kho đúng số lượng

*For any* phiếu xuất kho hợp lệ với số lượng `q` (q <= tồn kho hiện tại), tồn kho sau khi xuất phải bằng tồn kho trước trừ `q`.

**Validates: Requirements 6.2**

---

### Property 10: Không thể xuất kho vượt tồn kho

*For any* yêu cầu xuất kho với số lượng `q > inventory.quantity`, hệ thống phải trả về HTTP 400.

**Validates: Requirements 6.3**

---

### Property 11: Tồn kho = tổng nhập - tổng xuất

*For any* sản phẩm, giá trị `inventory.quantity` phải bằng `SUM(receipts.quantity) - SUM(issues.quantity)` tính từ tất cả phiếu nhập/xuất của sản phẩm đó.

**Validates: Requirements 7.3**

---

### Property 12: Thêm sản phẩm đã có trong giỏ tăng số lượng

*For any* sản phẩm đã có trong giỏ hàng với số lượng `old`, thêm thêm `delta` đơn vị phải cho kết quả `old + delta`.

**Validates: Requirements 8.2**

---

### Property 13: Đơn hàng mới tạo có trạng thái "chờ duyệt" và mã duy nhất

*For any* đơn hàng được tạo thành công, `order_status` phải là `'pending'` và `code` phải là duy nhất trong toàn bộ bảng orders.

**Validates: Requirements 9.2**

---

### Property 14: Tạo đơn hàng xóa giỏ hàng

*For any* user có giỏ hàng không rỗng, sau khi tạo đơn hàng thành công, `GET /api/cart` phải trả về danh sách rỗng.

**Validates: Requirements 9.5**

---

### Property 15: State machine trạng thái đơn hàng

*For any* đơn hàng, chỉ các chuyển trạng thái hợp lệ mới được chấp nhận: `pending→approved`, `approved→shipping`, `shipping→completed`, `pending→cancelled`, `approved→cancelled`. Mọi chuyển trạng thái khác phải trả về HTTP 400.

**Validates: Requirements 10.1, 10.5, 10.6**

---

### Property 16: Doanh thu chỉ tính từ đơn hoàn thành

*For any* khoảng thời gian, tổng doanh thu trả về từ API báo cáo phải bằng `SUM(total_amount)` chỉ của các đơn hàng có `order_status = 'completed'` trong khoảng đó.

**Validates: Requirements 15.4**

---

### Property 17: Lợi nhuận ròng = doanh thu - chi phí

*For any* khoảng thời gian, lợi nhuận ròng trả về phải bằng tổng doanh thu (đơn hoàn thành) trừ tổng chi phí (expenses + chi phí nhập kho) trong cùng khoảng thời gian.

**Validates: Requirements 16.3**

---

### Property 18: Chênh lệch kiểm kê = thực tế - hệ thống

*For any* cặp (actual_quantity, system_quantity) trong phiếu kiểm kê, `difference` phải bằng `actual_quantity - system_quantity`.

**Validates: Requirements 18.2**

---

### Property 19: Thanh toán đủ tự động cập nhật trạng thái

*For any* đơn hàng, khi `SUM(payments.amount) >= orders.total_amount`, `payment_status` phải là `'paid'`.

**Validates: Requirements 20.3**

---

### Property 20: Phân trang không vượt quá giới hạn

*For any* API trả về danh sách có phân trang với `limit = L`, số lượng item trong một trang không được vượt quá `L`.

**Validates: Requirements 22.4, 23.1, 23.2, 23.3**

---

### Property 21: Upload ảnh vượt 5MB bị từ chối

*For any* file có kích thước `> 5MB`, yêu cầu upload phải bị từ chối với HTTP 400.

**Validates: Requirements 25.2**

