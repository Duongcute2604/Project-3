-- ============================================================
-- HỆ THỐNG QUẢN LÝ KHO GIẤY - MySQL Migration
-- Chạy lệnh: mysql -u root -p warehouse_db < migration.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS warehouse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE warehouse_db;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  full_name   VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  phone       VARCHAR(11)   NOT NULL,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO categories (name) VALUES
  ('Giấy In'),
  ('Giấy Ảnh'),
  ('Giấy Bìa'),
  ('Vải Vụn'),
  ('Lõi Ống');

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE products (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  code        VARCHAR(20)   NOT NULL UNIQUE,
  name        VARCHAR(200)  NOT NULL,
  category_id INT           NOT NULL,
  description TEXT,
  unit        ENUM('tấn', 'kg', 'ream', 'cuộn') NOT NULL,
  price       DECIMAL(15,2) NOT NULL,
  is_visible  TINYINT(1)    NOT NULL DEFAULT 1,
  min_stock   DECIMAL(15,3) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. PRODUCT IMAGES
-- ============================================================
CREATE TABLE product_images (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  product_id  INT          NOT NULL,
  file_path   VARCHAR(500) NOT NULL,
  thumb_path  VARCHAR(500) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 5. INVENTORY (tồn kho - 1 dòng / sản phẩm)
-- ============================================================
CREATE TABLE inventory (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  product_id  INT            NOT NULL UNIQUE,
  quantity    DECIMAL(15,3)  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. SUPPLIERS (Nhà Cung Cấp)
-- ============================================================
CREATE TABLE suppliers (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  code            VARCHAR(20)  NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL UNIQUE,
  contact_person  VARCHAR(100),
  phone           VARCHAR(11)  NOT NULL,
  email           VARCHAR(150),
  address         TEXT,
  category_ids    JSON,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 7. WAREHOUSE RECEIPTS (Phiếu Nhập Kho)
-- ============================================================
CREATE TABLE warehouse_receipts (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  code          VARCHAR(20)    NOT NULL UNIQUE,
  supplier_id   INT            NOT NULL,
  product_id    INT            NOT NULL,
  quantity      DECIMAL(15,3)  NOT NULL,
  unit          ENUM('tấn', 'kg', 'ream', 'cuộn') NOT NULL,
  unit_price    DECIMAL(15,2)  NOT NULL,
  total_price   DECIMAL(15,2)  AS (quantity * unit_price) STORED,
  receipt_date  DATE           NOT NULL,
  note          TEXT,
  created_by    INT            NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (product_id)  REFERENCES products(id),
  FOREIGN KEY (created_by)  REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 8. WAREHOUSE ISSUES (Phiếu Xuất Kho)
-- ============================================================
CREATE TABLE warehouse_issues (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  code          VARCHAR(20)    NOT NULL UNIQUE,
  product_id    INT            NOT NULL,
  quantity      DECIMAL(15,3)  NOT NULL,
  unit          ENUM('tấn', 'kg', 'ream', 'cuộn') NOT NULL,
  reason        VARCHAR(200)   NOT NULL,
  issue_date    DATE           NOT NULL,
  note          TEXT,
  created_by    INT            NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 9. STOCKTAKES (Phiếu Kiểm Kê)
-- ============================================================
CREATE TABLE stocktakes (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  code          VARCHAR(20) NOT NULL UNIQUE,
  note          TEXT,
  created_by    INT         NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at  TIMESTAMP   NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE stocktake_items (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  stocktake_id     INT            NOT NULL,
  product_id       INT            NOT NULL,
  system_quantity  DECIMAL(15,3)  NOT NULL,
  actual_quantity  DECIMAL(15,3)  NOT NULL DEFAULT 0,
  difference       DECIMAL(15,3)  AS (actual_quantity - system_quantity) STORED,
  reason           TEXT,
  FOREIGN KEY (stocktake_id) REFERENCES stocktakes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)   REFERENCES products(id)
) ENGINE=InnoDB;

-- ============================================================
-- 10. CART ITEMS (Giỏ Hàng)
-- ============================================================
CREATE TABLE cart_items (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT            NOT NULL,
  product_id  INT            NOT NULL,
  quantity    DECIMAL(15,3)  NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. ORDERS (Đơn Hàng)
-- ============================================================
CREATE TABLE orders (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  code              VARCHAR(20)    NOT NULL UNIQUE,
  user_id           INT            NOT NULL,
  shipping_address  TEXT           NOT NULL,
  shipping_phone    VARCHAR(11)    NOT NULL,
  shipping_fee      DECIMAL(15,2)  NOT NULL DEFAULT 0,
  subtotal          DECIMAL(15,2)  NOT NULL,
  vat_amount        DECIMAL(15,2)  NOT NULL DEFAULT 0,
  total_amount      DECIMAL(15,2)  NOT NULL,
  payment_method    ENUM('cash', 'transfer') NOT NULL,
  payment_status    ENUM('unpaid', 'partial', 'paid') NOT NULL DEFAULT 'unpaid',
  order_status      ENUM('pending', 'approved', 'shipping', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  vat_company_name  VARCHAR(200)   NULL,
  vat_tax_code      VARCHAR(20)    NULL,
  vat_company_addr  TEXT           NULL,
  note              TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 12. ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  order_id      INT            NOT NULL,
  product_id    INT            NOT NULL,
  product_name  VARCHAR(200)   NOT NULL,
  unit          VARCHAR(20)    NOT NULL,
  quantity      DECIMAL(15,3)  NOT NULL,
  unit_price    DECIMAL(15,2)  NOT NULL,
  total_price   DECIMAL(15,2)  AS (quantity * unit_price) STORED,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- ============================================================
-- 13. ORDER STATUS LOGS
-- ============================================================
CREATE TABLE order_status_logs (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  order_id    INT         NOT NULL,
  old_status  VARCHAR(20),
  new_status  VARCHAR(20) NOT NULL,
  changed_by  INT         NOT NULL,
  changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 14. PAYMENTS (Thanh Toán)
-- ============================================================
CREATE TABLE payments (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  order_id      INT            NOT NULL,
  amount        DECIMAL(15,2)  NOT NULL,
  method        ENUM('cash', 'transfer') NOT NULL,
  payment_date  DATE           NOT NULL,
  confirmed_by  INT            NOT NULL,
  note          TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)     REFERENCES orders(id),
  FOREIGN KEY (confirmed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 15. EXPENSES (Chi Phí Vận Hành)
-- ============================================================
CREATE TABLE expenses (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  type          ENUM('labor', 'shipping') NOT NULL,
  amount        DECIMAL(15,2) NOT NULL,
  expense_date  DATE          NOT NULL,
  description   TEXT,
  order_id      INT           NULL,
  receipt_id    INT           NULL,
  created_by    INT           NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES orders(id),
  FOREIGN KEY (receipt_id) REFERENCES warehouse_receipts(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;
