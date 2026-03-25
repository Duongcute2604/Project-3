# 🗃️ Admin Panel — CÔNG TY BK

Trang quản trị kho hàng, chạy trực tiếp qua **Live Server** (không cần build).

---

## Đăng nhập demo
- Email: `admin@congty.com`
- Mật khẩu: `1`

---

## Cấu trúc file

| File | Chức năng |
|------|-----------|
| `app-admin.jsx` | Root app, menu, routing |
| `components/shared.jsx` | Alert, Modal, Pagination, utils dùng chung |
| `components/dashboard.jsx` | Tổng quan, thống kê nhanh |
| `components/warehouse.jsx` | Phiếu nhập/xuất kho, kiểm kê, **OCR ảnh phiếu** |
| `components/products.jsx` | Quản lý sản phẩm, danh mục |
| `components/orders.jsx` | Đơn hàng, khách hàng (import Excel + OCR) |
| `components/finance.jsx` | Nhà cung cấp (import Excel + OCR), chi phí, thanh toán |
| `components/stockledger.jsx` | **Tổng hợp N-X-T**, sổ chi tiết vật tư |
| `components/reports.jsx` | Báo cáo doanh thu, chi phí, tồn kho |

---

## Tính năng nổi bật

### 📷 OCR ảnh (Gemini AI)
Chụp ảnh phiếu nhập/xuất hoặc danh thiếp → AI đọc → tự điền form.
- Cấu hình: thay `GEMINI_API_KEY` trong `warehouse.jsx`
- Lấy key miễn phí tại: https://aistudio.google.com
- Giới hạn miễn phí: 15 request/phút

### 📂 Import Excel
Nhập dữ liệu hàng loạt từ file `.xlsx/.xls/.csv`.
- Tự detect header tiếng Việt (fuzzy match)
- Hỗ trợ: sản phẩm, khách hàng, nhà cung cấp, đơn hàng, tổng hợp N-X-T
- Upload 2 file trùng mã → tự bỏ qua, không cộng dồn

### 🗄️ Sổ Kho N-X-T
- Bảng tổng hợp Nhập–Xuất–Tồn theo tháng
- Click tên hàng → xem sổ chi tiết từng giao dịch
- Xuất Excel đúng format kế toán
- Dữ liệu giữ nguyên khi chuyển trang (sessionStorage)

---

## Backend

Hiện tại chưa có backend — mọi API call thất bại sẽ dùng dữ liệu tạm (sessionStorage).

Khi chạy backend Node.js/Express + MySQL:
- Toàn bộ dữ liệu lưu vào DB thật
- Xem schema tại: `backend/database/migration.sql`
