# Hệ Thống Quản Lý Kho Giấy

## 1. Giới Thiệu

Hệ Thống Quản Lý Kho Giấy là một ứng dụng web thương mại điện tử giúp doanh nghiệp kinh doanh giấy quản lý toàn diện từ tồn kho sản phẩm đến hoạt động bán hàng trực tuyến.

Ứng dụng giúp chủ doanh nghiệp và nhân viên kiểm soát chính xác lượng hàng hóa xuất nhập, nắm rõ tình hình kinh doanh, đồng thời cung cấp trang chủ để khách hàng dễ dàng mua sắm online. Hệ thống hỗ trợ ghi nhận các giao dịch nhập xuất, quản lý đơn hàng, theo dõi chi phí và cung cấp các báo cáo thống kê trực quan.

Nhờ đó, doanh nghiệp có thể tối ưu hóa quy trình vận hành, hạn chế thất thoát hàng hóa, phục vụ khách hàng tốt hơn và quản lý kinh doanh hiệu quả.

---

## 2. Chức Năng Chính

### Quản lý tài khoản
- Đăng ký tài khoản (dành cho Khách Hàng)
- Đăng nhập hệ thống (Khách Hàng và Quản Trị Viên)

### Quản lý sản phẩm và danh mục
- Thêm, chỉnh sửa, ẩn/hiện và xóa sản phẩm
- Quản lý danh mục: Giấy In, Giấy Ảnh, Giấy Bìa, Vải Vụn, Lõi Ống
- Upload hình ảnh sản phẩm (tối đa 5 ảnh/sản phẩm)
- Tìm kiếm và lọc sản phẩm nâng cao (tên, danh mục, khoảng giá, tình trạng hàng)

### Quản lý kho hàng
- Tạo Phiếu Nhập Kho (nhập hàng từ nhà cung cấp)
- Tạo Phiếu Xuất Kho (xuất bán hoặc xuất khác)
- Theo dõi tồn kho theo đơn vị tính (tấn, kg, ream, cuộn)
- Kiểm kê kho định kỳ, đối chiếu số liệu thực tế
- Cảnh báo tồn kho thấp khi xuống dưới ngưỡng tối thiểu
- Xuất PDF phiếu nhập/xuất kho

### Quản lý đơn hàng bán ra
- Thêm sản phẩm vào Giỏ Hàng
- Tạo Đơn Hàng mới (kèm phí ship, hóa đơn VAT tùy chọn)
- Cập nhật trạng thái đơn hàng: chờ duyệt → đã duyệt → đang giao → hoàn thành
- Theo dõi thanh toán và công nợ khách hàng
- Xuất PDF hóa đơn VAT

### Quản lý chi phí và đối tác
- Quản lý danh sách Nhà Cung Cấp
- Ghi nhận chi phí vận hành (nhân công, vận chuyển)

### Thống kê và báo cáo
- Thống kê tồn kho thực tế theo danh mục
- Thống kê doanh thu theo ngày/tháng/năm
- Thống kê chi phí và lợi nhuận ròng
- Dashboard tổng quan với biểu đồ trực quan
- Xuất báo cáo CSV

---

## 3. Cách Hoạt Động Của Hệ Thống

1. Người dùng truy cập hệ thống — Khách Hàng vào Trang Chủ, Quản Trị Viên vào Trang Quản Trị.
2. Tùy thuộc vào vai trò, người dùng có thể đặt mua hàng hoặc nhập thông tin xuất/nhập kho.
3. Hệ thống kiểm tra quyền của người dùng trước khi cho phép thực hiện thao tác (chỉ Admin mới được duyệt đơn, quản lý kho...).
4. Dữ liệu đơn hàng, tồn kho và chi phí được lưu trữ trong cơ sở dữ liệu MySQL.
5. Hệ thống tự động tính toán tổng tồn kho, tổng tiền đơn hàng và doanh thu.
6. Kết quả được hiển thị dưới dạng bảng hoặc biểu đồ để quản lý dễ theo dõi.

```
Khách Hàng / Admin
       │
       ▼
  Trình duyệt (HTML + JSX)
       │  gọi REST API
       ▼
  Backend Node.js / Express
       │  truy vấn SQL
       ▼
  Database MySQL
```

---

## 4. Phân Quyền Người Dùng

### Quản Trị Viên (Admin)
Quản lý toàn bộ hoạt động kinh doanh trên Trang Quản Trị.

| Quyền hạn | Chi tiết |
|-----------|---------|
| Sản phẩm & Danh mục | Thêm, sửa, ẩn, xóa toàn bộ |
| Kho hàng | Lập phiếu nhập/xuất, kiểm kê, cập nhật tồn kho |
| Đơn hàng | Duyệt, cập nhật trạng thái, ghi nhận thanh toán |
| Nhà cung cấp | Thêm, sửa, xóa thông tin nhà cung cấp |
| Chi phí | Ghi nhận và theo dõi chi phí vận hành |
| Báo cáo | Xem toàn bộ thống kê doanh thu, chi phí, tồn kho |
| Khách hàng | Xem lịch sử mua hàng của tất cả khách hàng |

### Khách Hàng (Customer)
Người dùng truy cập Trang Chủ để mua sắm.

| Quyền hạn | Chi tiết |
|-----------|---------|
| Xem sản phẩm | Danh sách, chi tiết, giá, tình trạng hàng |
| Giỏ hàng | Thêm, sửa số lượng, xóa sản phẩm |
| Đặt hàng | Tạo đơn, chọn phương thức thanh toán, yêu cầu VAT |
| Đơn hàng cá nhân | Xem lịch sử, hủy đơn đang chờ duyệt |

Khách Hàng **không được phép** truy cập Trang Quản Trị, xem tồn kho, xem đơn hàng của người khác hoặc xem thông tin nhà cung cấp và chi phí.

---

## 5. Vai Trò Của Hệ Thống

Hệ thống đảm nhận các nhiệm vụ:

- **Xác thực & phân quyền** — Kiểm tra JWT token, phân biệt Admin và Khách Hàng trên mọi API
- **Lưu trữ dữ liệu** — Quản lý sản phẩm, kho bãi, đơn hàng, chi phí trong MySQL
- **Tự động tính toán** — Trừ lùi tồn kho khi xuất hàng, cộng tồn kho khi nhập, tính tổng tiền đơn hàng
- **Cảnh báo thông minh** — Phát hiện và thông báo sản phẩm sắp hết hàng
- **Báo cáo kinh doanh** — Tổng hợp doanh thu, chi phí, lợi nhuận ròng cho quản trị viên
- **Thông báo tự động** — Gửi email xác nhận đơn hàng cho khách, email cảnh báo tồn kho cho admin

Các thông tin được xử lý:
- Tổng số lượng tồn kho theo thời gian thực
- Tổng doanh thu bán hàng (chỉ tính đơn hoàn thành)
- Tổng chi phí hoạt động
- Trạng thái và tiến trình giao đơn hàng

---

## 6. Mục Tiêu Của Hệ Thống

- Giúp doanh nghiệp quản lý kho hàng hóa chính xác, nhanh chóng
- Tự động hóa quy trình bán hàng online và theo dõi đơn hàng rõ ràng
- Hạn chế thất thoát hàng hóa và sai sót trong kiểm kê
- Cung cấp số liệu chính xác để chủ doanh nghiệp ra quyết định kinh doanh hiệu quả

---

## Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| Frontend | HTML + JSX (Babel CDN), Axios CDN, Recharts CDN |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0+ |
| Auth | JWT, bcrypt |
| Upload | multer, sharp |
| PDF | pdfkit |
| Email | nodemailer |

## Cài Đặt Nhanh

```bash
# 1. Clone và cài dependencies backend
cd backend
npm install

# 2. Tạo database
mysql -u root -p < database/migration.sql
mysql -u root -p warehouse_db < database/seed.sql

# 3. Tạo file .env (xem backend/database/README.md)

# 4. Chạy server
node src/app.js
# Truy cập: http://localhost:3000
```

Xem chi tiết tại [`backend/database/README.md`](backend/database/README.md).
