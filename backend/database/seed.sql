-- ============================================================
-- SEED DATA - CÔNG TY BK
-- Chạy SAU migration: mysql -u root -p warehouse_db < seed.sql
-- ============================================================
USE warehouse_db;

-- ============================================================
-- 1. USERS
-- admin@congty.com / 1
-- ============================================================
INSERT INTO users (full_name, email, phone, password, role) VALUES
  ('Quản Trị Viên', 'admin@congty.com', '0901234567',
   '$2a$10$Ba0nXEHinl6KlKIdwUdRH.liT98KEnWtTRULHoI9lG2z.sYvIR.Yu', 'admin'),
  ('Nguyễn Văn An', 'an@congty.com', '0912345678',
   '$2a$10$Ba0nXEHinl6KlKIdwUdRH.liT98KEnWtTRULHoI9lG2z.sYvIR.Yu', 'customer'),
  ('Trần Thị Bình', 'binh@email.com', '0923456789',
   '$2a$10$Ba0nXEHinl6KlKIdwUdRH.liT98KEnWtTRULHoI9lG2z.sYvIR.Yu', 'customer')
ON DUPLICATE KEY UPDATE password = VALUES(password);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
INSERT INTO categories (name) VALUES
  ('Giấy In'), ('Giấy Ảnh'), ('Giấy Bìa'), ('Vải Vụn'), ('Lõi Ống'), ('Khác')
ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- 3. PRODUCTS (10 sản phẩm)
-- ============================================================
INSERT INTO products (code, name, category_id, unit, price, min_stock, is_visible) VALUES
  ('GIN-A4-80',  'Giấy In A4 80gsm',        1, 'ream',  85000,  50, 1),
  ('GIN-A3-80',  'Giấy In A3 80gsm',        1, 'ream', 160000,  30, 1),
  ('GIN-A0-90',  'Giấy Cuộn A0 90gsm',      1, 'cuộn', 320000,  20, 1),
  ('GAN-BONG',   'Giấy Ảnh Bóng A4 200gsm', 2, 'ream', 145000,  20, 1),
  ('GAN-MO',     'Giấy Ảnh Mờ A4 200gsm',   2, 'ream', 138000,  20, 1),
  ('GBI-300',    'Giấy Bìa Cứng 300gsm',    3, 'kg',    35000, 100, 1),
  ('GBI-250',    'Giấy Bìa Mỏng 250gsm',    3, 'kg',    28000, 100, 1),
  ('VAI-COTTON', 'Vải Vụn Cotton',           4, 'kg',    15000, 200, 1),
  ('VAI-POLY',   'Vải Vụn Polyester',        4, 'kg',    12000, 200, 1),
  ('LOI-3IN',    'Lõi Ống Giấy 3 Inch',     5, 'cuộn',   8000, 100, 1)
ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- 4. INVENTORY (tồn kho ban đầu)
-- ============================================================
INSERT INTO inventory (product_id, quantity)
SELECT id, CASE code
  WHEN 'GIN-A4-80'  THEN 350
  WHEN 'GIN-A3-80'  THEN 180
  WHEN 'GIN-A0-90'  THEN 45
  WHEN 'GAN-BONG'   THEN 120
  WHEN 'GAN-MO'     THEN 95
  WHEN 'GBI-300'    THEN 680
  WHEN 'GBI-250'    THEN 420
  WHEN 'VAI-COTTON' THEN 850
  WHEN 'VAI-POLY'   THEN 620
  WHEN 'LOI-3IN'    THEN 280
  ELSE 0
END
FROM products WHERE code IN ('GIN-A4-80','GIN-A3-80','GIN-A0-90','GAN-BONG','GAN-MO','GBI-300','GBI-250','VAI-COTTON','VAI-POLY','LOI-3IN')
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- ============================================================
-- 5. SUPPLIERS (5 nhà cung cấp)
-- ============================================================
INSERT INTO suppliers (code, name, contact_person, phone, email, address) VALUES
  ('NCC001', 'Công Ty Giấy Bãi Bằng',        'Trần Văn Bình',  '02433456789', 'contact@baibang.com',    'Phú Thọ'),
  ('NCC002', 'Công Ty TNHH Giấy Sài Gòn',    'Lê Thị Cúc',     '02833456789', 'info@giaysaigon.com',    'TP.HCM'),
  ('NCC003', 'Công Ty Vải Vụn Miền Bắc',      'Phạm Văn Dũng',  '02433567890', 'vaivun@mb.com',          'Hà Nội'),
  ('NCC004', 'Xưởng Lõi Ống Hà Nam',          'Nguyễn Thị Em',  '02263456789', 'loiong@hanam.com',       'Hà Nam'),
  ('NCC005', 'Công Ty Giấy Tân Mai',           'Hoàng Văn Phúc', '02513456789', 'contact@tanmai.com.vn',  'Đồng Nai')
ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- 6. CUSTOMERS (8 khách hàng)
-- ============================================================
INSERT INTO customers (full_name, phone, email, address, company) VALUES
  ('Nguyễn Văn An',    '0901111111', 'an@gmail.com',      'Hà Nội',    'Công Ty In Ấn Hà Nội'),
  ('Trần Thị Bình',    '0902222222', 'binh@gmail.com',    'TP.HCM',    'Xưởng In Sài Gòn'),
  ('Lê Văn Cường',     '0903333333', 'cuong@gmail.com',   'Đà Nẵng',   NULL),
  ('Phạm Thị Dung',    '0904444444', 'dung@gmail.com',    'Hải Phòng', 'Công Ty Bao Bì HP'),
  ('Hoàng Văn Em',     '0905555555', 'em@gmail.com',      'Cần Thơ',   NULL),
  ('Vũ Thị Phương',    '0906666666', 'phuong@gmail.com',  'Huế',       'Nhà In Miền Trung'),
  ('Đặng Văn Giang',   '0907777777', 'giang@gmail.com',   'Hà Nội',    'Công Ty Văn Phòng Phẩm'),
  ('Bùi Thị Hoa',      '0908888888', 'hoa@gmail.com',     'TP.HCM',    NULL)
ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- 7. WAREHOUSE RECEIPTS (phiếu nhập kho)
-- ============================================================
INSERT INTO warehouse_receipts (code, supplier_id, product_id, quantity, unit, unit_price, receipt_date, note, created_by) VALUES
  ('PN0001', 1, 1, 200, 'ream',  75000, '2026-01-05', 'Nhập đầu năm',        1),
  ('PN0002', 2, 4,  80, 'ream', 130000, '2026-01-10', NULL,                  1),
  ('PN0003', 1, 2, 100, 'ream', 145000, '2026-01-15', 'Nhập bổ sung A3',     1),
  ('PN0004', 3, 8, 500, 'kg',    13000, '2026-01-20', NULL,                  1),
  ('PN0005', 4, 10,150, 'cuộn',   7000, '2026-02-03', 'Nhập lõi ống tháng 2',1),
  ('PN0006', 5, 1, 150, 'ream',  76000, '2026-02-10', NULL,                  1),
  ('PN0007', 2, 5,  60, 'ream', 125000, '2026-02-15', NULL,                  1),
  ('PN0008', 1, 3,  30, 'cuộn', 295000, '2026-02-20', 'Giấy cuộn A0',        1),
  ('PN0009', 3, 9, 400, 'kg',    11000, '2026-03-01', NULL,                  1),
  ('PN0010', 1, 6, 300, 'kg',    32000, '2026-03-05', 'Giấy bìa cứng',       1)
ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- 8. WAREHOUSE ISSUES (phiếu xuất kho)
-- ============================================================
INSERT INTO warehouse_issues (code, product_id, quantity, unit, unit_price, reason, issue_date, note, created_by) VALUES
  ('PX0001', 1,  50, 'ream',  85000, 'Xuất bán đơn DH00001', '2026-01-12', NULL, 1),
  ('PX0002', 4,  20, 'ream', 145000, 'Xuất bán đơn DH00002', '2026-01-18', NULL, 1),
  ('PX0003', 8, 100, 'kg',    15000, 'Xuất bán đơn DH00003', '2026-01-25', NULL, 1),
  ('PX0004', 2,  30, 'ream', 160000, 'Xuất bán đơn DH00004', '2026-02-05', NULL, 1),
  ('PX0005', 1,  80, 'ream',  85000, 'Xuất bán đơn DH00005', '2026-02-12', NULL, 1),
  ('PX0006', 10, 50, 'cuộn',   8000, 'Xuất bán đơn DH00006', '2026-02-18', NULL, 1),
  ('PX0007', 5,  25, 'ream', 138000, 'Xuất bán đơn DH00007', '2026-03-02', NULL, 1),
  ('PX0008', 6, 120, 'kg',    35000, 'Xuất bán đơn DH00008', '2026-03-08', NULL, 1)
ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- 9. ORDERS (10 đơn hàng)
-- ============================================================
INSERT INTO orders (code, customer_id, customer_name, customer_phone, shipping_address, subtotal, total_amount, payment_method, payment_status, order_status, created_at) VALUES
  ('DH00001', 1, 'Nguyễn Văn An',  '0901111111', 'Hà Nội',    4250000,  4250000, 'transfer', 'paid',    'completed', '2026-01-12 09:00:00'),
  ('DH00002', 2, 'Trần Thị Bình',  '0902222222', 'TP.HCM',    2900000,  2900000, 'transfer', 'paid',    'completed', '2026-01-18 10:30:00'),
  ('DH00003', 3, 'Lê Văn Cường',   '0903333333', 'Đà Nẵng',   1500000,  1500000, 'cash',     'paid',    'completed', '2026-01-25 14:00:00'),
  ('DH00004', 4, 'Phạm Thị Dung',  '0904444444', 'Hải Phòng', 4800000,  4800000, 'transfer', 'paid',    'completed', '2026-02-05 08:30:00'),
  ('DH00005', 1, 'Nguyễn Văn An',  '0901111111', 'Hà Nội',    6800000,  6800000, 'transfer', 'partial', 'shipping',  '2026-02-12 11:00:00'),
  ('DH00006', 5, 'Hoàng Văn Em',   '0905555555', 'Cần Thơ',    400000,   400000, 'cash',     'paid',    'completed', '2026-02-18 15:30:00'),
  ('DH00007', 6, 'Vũ Thị Phương',  '0906666666', 'Huế',       3450000,  3450000, 'transfer', 'unpaid',  'approved',  '2026-03-02 09:00:00'),
  ('DH00008', 7, 'Đặng Văn Giang', '0907777777', 'Hà Nội',    4200000,  4200000, 'transfer', 'unpaid',  'pending',   '2026-03-08 10:00:00'),
  ('DH00009', 2, 'Trần Thị Bình',  '0902222222', 'TP.HCM',    2760000,  2760000, 'transfer', 'unpaid',  'pending',   '2026-03-15 14:00:00'),
  ('DH00010', 8, 'Bùi Thị Hoa',    '0908888888', 'TP.HCM',    1800000,  1800000, 'cash',     'paid',    'completed', '2026-03-20 16:00:00')
ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- 10. ORDER ITEMS
-- ============================================================
INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, unit_price)
SELECT o.id, p.id, p.name, p.unit, t.qty, t.price
FROM (
  SELECT 'DH00001' AS ocode, 'GIN-A4-80'  AS pcode,  50 AS qty,  85000 AS price UNION ALL
  SELECT 'DH00002',          'GAN-BONG',              20,         145000 UNION ALL
  SELECT 'DH00003',          'VAI-COTTON',            100,         15000 UNION ALL
  SELECT 'DH00004',          'GIN-A3-80',              30,        160000 UNION ALL
  SELECT 'DH00005',          'GIN-A4-80',              80,         85000 UNION ALL
  SELECT 'DH00006',          'LOI-3IN',                50,          8000 UNION ALL
  SELECT 'DH00007',          'GAN-MO',                 25,        138000 UNION ALL
  SELECT 'DH00008',          'GBI-300',               120,         35000 UNION ALL
  SELECT 'DH00009',          'GIN-A4-80',              20,         85000 UNION ALL
  SELECT 'DH00009',          'GAN-BONG',               10,        145000 UNION ALL
  SELECT 'DH00010',          'VAI-POLY',              150,         12000
) AS t
JOIN orders o ON o.code = t.ocode
JOIN products p ON p.code = t.pcode;

-- ============================================================
-- 11. PAYMENTS (thanh toán)
-- ============================================================
INSERT INTO payments (order_id, amount, method, payment_date, confirmed_by, note)
SELECT o.id, t.amount, t.method, t.pdate, 1, NULL
FROM (
  SELECT 'DH00001' AS ocode, 4250000 AS amount, 'transfer' AS method, '2026-01-13' AS pdate UNION ALL
  SELECT 'DH00002', 2900000, 'transfer', '2026-01-19' UNION ALL
  SELECT 'DH00003', 1500000, 'cash',     '2026-01-25' UNION ALL
  SELECT 'DH00004', 4800000, 'transfer', '2026-02-06' UNION ALL
  SELECT 'DH00005', 3000000, 'transfer', '2026-02-13' UNION ALL
  SELECT 'DH00006',  400000, 'cash',     '2026-02-18' UNION ALL
  SELECT 'DH00010', 1800000, 'cash',     '2026-03-20'
) AS t
JOIN orders o ON o.code = t.ocode;

-- ============================================================
-- 12. EXPENSES (chi phí)
-- ============================================================
INSERT INTO expenses (type, amount, expense_date, description, created_by) VALUES
  ('labor',    8000000, '2026-01-31', 'Lương nhân viên tháng 1',    1),
  ('shipping',  350000, '2026-01-15', 'Phí giao hàng đơn DH00001',  1),
  ('shipping',  280000, '2026-01-20', 'Phí giao hàng đơn DH00002',  1),
  ('labor',    8000000, '2026-02-28', 'Lương nhân viên tháng 2',    1),
  ('shipping',  420000, '2026-02-14', 'Phí giao hàng đơn DH00005',  1),
  ('labor',    8500000, '2026-03-31', 'Lương nhân viên tháng 3',    1),
  ('shipping',  310000, '2026-03-05', 'Phí giao hàng đơn DH00007',  1),
  ('shipping',  290000, '2026-03-10', 'Phí giao hàng đơn DH00008',  1);
