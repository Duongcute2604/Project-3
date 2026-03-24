-- ============================================================
-- SEED DATA - Dữ liệu mẫu để test
-- Chạy SAU migration: mysql -u root -p warehouse_db < seed.sql
-- ============================================================
USE warehouse_db;

-- Admin account (password: Admin@123)
-- bcrypt hash của "Admin@123"
INSERT INTO users (full_name, email, phone, password, role) VALUES
  ('Quản Trị Viên', 'admin@warehouse.com', '0901234567',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Customer account (password: Customer@123)
INSERT INTO users (full_name, email, phone, password, role) VALUES
  ('Nguyễn Văn A', 'customer@example.com', '0912345678',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer');

-- Sản phẩm mẫu
INSERT INTO products (code, name, category_id, description, unit, price, is_visible, min_stock) VALUES
  ('SP001', 'Giấy In A4 80gsm', 1, 'Giấy in văn phòng khổ A4, định lượng 80gsm, 500 tờ/ream', 'ream', 85000, 1, 50),
  ('SP002', 'Giấy In A3 80gsm', 1, 'Giấy in văn phòng khổ A3, định lượng 80gsm, 250 tờ/ream', 'ream', 160000, 1, 30),
  ('SP003', 'Giấy Ảnh Bóng A4', 2, 'Giấy ảnh bóng cao cấp, 200gsm, 20 tờ/gói', 'ream', 45000, 1, 20),
  ('SP004', 'Giấy Bìa Cứng 300gsm', 3, 'Giấy bìa cứng màu trắng, 300gsm', 'kg', 35000, 1, 100),
  ('SP005', 'Vải Vụn Tổng Hợp', 4, 'Vải vụn tổng hợp các loại, đóng gói theo kg', 'kg', 15000, 1, 200),
  ('SP006', 'Lõi Ống Giấy 3 inch', 5, 'Lõi ống giấy đường kính 3 inch, dài 30cm', 'cuộn', 8000, 1, 100);

-- Tồn kho ban đầu
INSERT INTO inventory (product_id, quantity) VALUES
  (1, 200),
  (2, 100),
  (3, 80),
  (4, 500),
  (5, 1000),
  (6, 300);

-- Nhà cung cấp mẫu
INSERT INTO suppliers (code, name, contact_person, phone, email, address) VALUES
  ('NCC001', 'Công Ty Giấy Bãi Bằng', 'Trần Văn B', '0243456789', 'contact@baibang.com', 'Phú Thọ, Việt Nam'),
  ('NCC002', 'Công Ty TNHH Giấy Sài Gòn', 'Lê Thị C', '0283456789', 'info@giaysaigon.com', 'TP. Hồ Chí Minh');
