-- ============================================================
-- SEED DATA - CÔNG TY BK
-- Chạy SAU migration: mysql -u root -p warehouse_db < seed.sql
-- ============================================================
USE warehouse_db;

-- ============================================================
-- Tài khoản admin
-- Email: admin@congty.com | Mật khẩu: 1
-- Hash bcrypt của "1" (rounds=10)
-- ============================================================
INSERT INTO users (full_name, email, phone, password, role) VALUES
  ('Quản Trị Viên', 'admin@congty.com', '0900000000',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi6', 'admin')
ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- Danh mục mặc định (có thể thêm/sửa/xóa trong admin)
-- ============================================================
INSERT INTO categories (name) VALUES
  ('Giấy In'),
  ('Giấy Ảnh'),
  ('Giấy Bìa'),
  ('Vải Vụn'),
  ('Lõi Ống'),
  ('Khác')
ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- Không có sản phẩm mẫu — nhập qua Excel hoặc thêm thủ công
-- ============================================================
