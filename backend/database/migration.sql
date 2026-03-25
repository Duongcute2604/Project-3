-- ============================================================
-- HỆ THỐNG QUẢN LÝ KHO - CÔNG TY BK
-- MySQL Migration v2
-- Chạy: mysql -u root -p < migration.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS warehouse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE warehouse_db;

-- ============================================================
-- 1. USERS (tài khoản đăng nhập)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  full_name   VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  phone       VARCHAR(15),
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. CUSTOMERS (khách hàng — quản lý riêng, không cần tài khoản)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  full_name     VARCHAR(150) NOT NULL,
  phone         VARCHAR(15)  NOT NULL,
  email         VARCHAR(150),
  address       TEXT,
  company       VARCHAR(200),
  order_count   INT          NOT NULL DEFAULT 0,
  total_spent   DECIMAL(18,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 3. CATEGORIES (danh mục sản phẩm)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 4. PRODUCTS (sản phẩm)
-- unit dùng VARCHAR thay vì ENUM để nhập tự do từ Excel
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  code        VARCHAR(50)   NOT NULL UNIQUE,
  name        VARCHAR(200)  NOT NULL,
  category_id INT,
  description TEXT,
  unit        VARCHAR(20)   NOT NULL DEFAULT 'kg',
  price       DECIMAL(18,2) NOT NULL DEFAULT 0,
  is_visible  TINYINT(1)    NOT NULL DEFAULT 1,
  min_stock   DECIMAL(15,3) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 5. PRODUCT IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  product_id  INT          NOT NULL,
  file_path   VARCHAR(500) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 6. INVENTORY (tồn kho — 1 dòng / sản phẩm)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  product_id  INT            NOT NULL UNIQUE,
  quantity    DECIMAL(15,3)  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 7. SUPPLIERS (nhà cung cấp)
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  code            VARCHAR(20)  NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL,
  contact_person  VARCHAR(100),
  phone           VARCHAR(15)  NOT NULL,
  email           VARCHAR(150),
  address         TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 8. WAREHOUSE RECEIPTS (phiếu nhập kho)
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse_receipts (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  code          VARCHAR(30)    NOT NULL UNIQUE,
  supplier_id   INT,
  product_id    INT            NOT NULL,
  quantity      DECIMAL(15,3)  NOT NULL,
  unit          VARCHAR(20)    NOT NULL DEFAULT 'kg',
  unit_price    DECIMAL(18,2)  NOT NULL DEFAULT 0,
  total_price   DECIMAL(18,2)  GENERATED ALWAYS AS (quantity * unit_price) STORED,
  receipt_date  DATE           NOT NULL,
  note          TEXT,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id)  REFERENCES products(id),
  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 9. WAREHOUSE ISSUES (phiếu xuất kho)
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse_issues (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  code          VARCHAR(30)    NOT NULL UNIQUE,
  product_id    INT            NOT NULL,
  quantity      DECIMAL(15,3)  NOT NULL,
  unit          VARCHAR(20)    NOT NULL DEFAULT 'kg',
  unit_price    DECIMAL(18,2)  NOT NULL DEFAULT 0,
  total_price   DECIMAL(18,2)  GENERATED ALWAYS AS (quantity * unit_price) STORED,
  reason        VARCHAR(200)   NOT NULL,
  issue_date    DATE           NOT NULL,
  note          TEXT,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 10. STOCKTAKES (phiếu kiểm kê)
-- ============================================================
CREATE TABLE IF NOT EXISTS stocktakes (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  code          VARCHAR(30) NOT NULL UNIQUE,
  note          TEXT,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at  TIMESTAMP   NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stocktake_items (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  stocktake_id     INT            NOT NULL,
  product_id       INT            NOT NULL,
  system_quantity  DECIMAL(15,3)  NOT NULL DEFAULT 0,
  actual_quantity  DECIMAL(15,3)  NOT NULL DEFAULT 0,
  difference       DECIMAL(15,3)  GENERATED ALWAYS AS (actual_quantity - system_quantity) STORED,
  reason           TEXT,
  FOREIGN KEY (stocktake_id) REFERENCES stocktakes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)   REFERENCES products(id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. ORDERS (đơn hàng)
-- Lưu thêm customer_name/phone để không phụ thuộc bảng customers
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  code              VARCHAR(30)    NOT NULL UNIQUE,
  customer_id       INT,
  customer_name     VARCHAR(150)   NOT NULL,
  customer_phone    VARCHAR(15),
  shipping_address  TEXT,
  shipping_fee      DECIMAL(18,2)  NOT NULL DEFAULT 0,
  subtotal          DECIMAL(18,2)  NOT NULL DEFAULT 0,
  vat_amount        DECIMAL(18,2)  NOT NULL DEFAULT 0,
  total_amount      DECIMAL(18,2)  NOT NULL DEFAULT 0,
  payment_method    ENUM('cash', 'transfer') NOT NULL DEFAULT 'transfer',
  payment_status    ENUM('unpaid', 'partial', 'paid') NOT NULL DEFAULT 'unpaid',
  order_status      ENUM('pending', 'approved', 'shipping', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  note              TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 12. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  order_id      INT            NOT NULL,
  product_id    INT,
  product_name  VARCHAR(200)   NOT NULL,
  unit          VARCHAR(20)    NOT NULL,
  quantity      DECIMAL(15,3)  NOT NULL,
  unit_price    DECIMAL(18,2)  NOT NULL,
  total_price   DECIMAL(18,2)  GENERATED ALWAYS AS (quantity * unit_price) STORED,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 13. PAYMENTS (thanh toán)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  order_id      INT            NOT NULL,
  amount        DECIMAL(18,2)  NOT NULL,
  method        ENUM('cash', 'transfer') NOT NULL DEFAULT 'transfer',
  payment_date  DATE           NOT NULL,
  confirmed_by  INT,
  note          TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)     REFERENCES orders(id),
  FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 14. EXPENSES (chi phí vận hành)
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  type          ENUM('labor', 'shipping') NOT NULL,
  amount        DECIMAL(18,2) NOT NULL,
  expense_date  DATE          NOT NULL,
  description   TEXT,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 15. ORDER STATUS LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_status_logs (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  order_id    INT         NOT NULL,
  old_status  VARCHAR(20),
  new_status  VARCHAR(20) NOT NULL,
  changed_by  INT,
  changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 16. CART ITEMS (giỏ hàng)
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT            NOT NULL,
  product_id  INT            NOT NULL,
  quantity    DECIMAL(15,3)  NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 17. VIEW: stock_summary (dùng cho API /api/reports/stock-summary)
-- Tổng hợp N-X-T theo tháng từ phiếu nhập/xuất thực tế
-- ============================================================
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
  p.id          AS product_id,
  p.code,
  p.name,
  p.unit,
  COALESCE(i.quantity, 0) AS current_qty
FROM products p
LEFT JOIN inventory i ON i.product_id = p.id;

-- ============================================================
-- 18. VIEW: orders với thông tin đầy đủ (dùng cho API /api/orders)
-- ============================================================
CREATE OR REPLACE VIEW v_orders AS
SELECT
  o.*,
  COALESCE(SUM(pay.amount), 0) AS paid_amount
FROM orders o
LEFT JOIN payments pay ON pay.order_id = o.id
GROUP BY o.id;
