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
   '$2a$10$Ba0nXEHinl6KlKIdwUdRH.liT98KEnWtTRULHoI9lG2z.sYvIR.Yu', 'admin')
ON DUPLICATE KEY UPDATE password = '$2a$10$Ba0nXEHinl6KlKIdwUdRH.liT98KEnWtTRULHoI9lG2z.sYvIR.Yu';

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
