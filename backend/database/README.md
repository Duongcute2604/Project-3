# Database Setup

## Yêu cầu
- MySQL 8.0+

## Các bước

### 1. Tạo database và chạy migration
```bash
mysql -u root -p < backend/database/migration.sql
```

### 2. Chạy seed data (tùy chọn, để test)
```bash
mysql -u root -p warehouse_db < backend/database/seed.sql
```

### 3. Tạo file .env trong thư mục backend/
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=warehouse_db
DB_USER=root
DB_PASS=your_password
JWT_SECRET=your_jwt_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
PORT=3000
```

## Tài khoản mẫu (sau khi chạy seed)
| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@warehouse.com | Admin@123 |
| Khách hàng | customer@example.com | Customer@123 |

## Lưu ý
- File `migration.sql` tạo toàn bộ 15 bảng
- File `seed.sql` chèn dữ liệu mẫu để test (chạy sau migration)
- Chạy lại migration sẽ báo lỗi nếu database đã tồn tại (an toàn, không ghi đè)
