# Kế Hoạch Triển Khai: Hệ Thống Quản Lý Kho Giấy

## Tổng Quan

Triển khai theo kiến trúc Client-Server: backend Node.js/Express với REST API, frontend React SPA. Các task được sắp xếp theo thứ tự từ nền tảng đến tích hợp, mỗi bước xây dựng trên bước trước.

## Tasks

- [ ] 1. Khởi tạo cấu trúc dự án và cơ sở dữ liệu
  - Tạo thư mục `backend/` với cấu trúc như trong design
  - Tạo thư mục `frontend/` với các thư mục con: `css/`, `js/`, `admin/`, `customer/`
  - Khởi tạo `package.json` cho backend (express, mysql2/pg, jsonwebtoken, bcrypt, multer, sharp, pdfkit, nodemailer, fast-check, cors)
  - Thêm `express.static('frontend')` vào `app.js` để backend serve frontend
  - Tạo file `backend/src/config/db.js` kết nối MySQL/PostgreSQL với connection pool
  - Tạo file `.env` mẫu với các biến: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, JWT_SECRET, EMAIL_HOST, EMAIL_USER, EMAIL_PASS
  - Tạo file SQL migration với toàn bộ schema: users, categories, products, product_images, inventory, suppliers, warehouse_receipts, warehouse_issues, stocktakes, stocktake_items, cart_items, orders, order_items, order_status_logs, payments, expenses
  - Chèn dữ liệu mặc định: 5 danh mục (Giấy In, Giấy Ảnh, Giấy Bìa, Vải Vụn, Lõi Ống)
  - _Requirements: 3.1_

- [ ] 2. Xây dựng middleware và tiện ích backend
  - [ ] 2.1 Tạo middleware xác thực JWT
    - Viết `backend/src/middleware/auth.js` với hàm `verifyToken` (kiểm tra header Authorization, decode JWT, gán `req.user`)
    - Viết hàm `checkRole(role)` kiểm tra `req.user.role`, trả 403 nếu không đủ quyền
    - Viết `backend/src/middleware/errorHandler.js` xử lý lỗi toàn cục, trả JSON `{success, message, errors}`
    - _Requirements: 17.1, 17.2, 17.3_

  - [ ]* 2.2 Viết property test cho middleware xác thực
    - **Property 3: JWT token có thời hạn 24 giờ**
    - **Property 4: Đăng nhập sai thông tin phải trả lỗi**
    - **Validates: Requirements 2.2, 2.4**

  - [ ] 2.3 Tạo các tiện ích dùng chung
    - Viết `backend/src/utils/codeGenerator.js`: tạo mã duy nhất theo prefix (SP, PN, PX, KK, DH, NCC)
    - Viết `backend/src/utils/pagination.js`: helper tính offset, trả `{data, total, page, totalPages}`
    - Tạo `backend/src/config/multer.js`: cấu hình multer lưu vào `uploads/products/`, giới hạn 5MB, chỉ nhận jpg/png/webp
    - _Requirements: 4.2, 23.4_


- [ ] 3. Triển khai module Xác Thực (Auth)
  - [ ] 3.1 Viết Auth Controller và Routes
    - Tạo `backend/src/controllers/auth.controller.js` với các hàm: `register`, `login`, `getMe`
    - `register`: validate email (có "@" và tên miền), phone (10-11 chữ số), password (>=8 ký tự), confirmPassword khớp; hash bcrypt; lưu DB; trả 201
    - `login`: tìm user theo email, so sánh bcrypt, tạo JWT 24h với payload `{id, role}`, trả token
    - Tạo `backend/src/routes/auth.routes.js` với POST /register, POST /login, GET /me
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.2, 2.4_

  - [ ]* 3.2 Viết property test cho validation đăng ký và bcrypt
    - **Property 1: Validation đầu vào đăng ký**
    - **Property 2: Mật khẩu được lưu dạng bcrypt hash**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.7**

  - [ ] 3.3 Xây dựng trang Auth Frontend
    - Tạo `frontend/js/api.js`: Axios instance với baseURL `/api`, interceptor tự đính kèm JWT từ localStorage và redirect về `/login.html` khi nhận 401
    - Tạo `frontend/js/auth.js`: hàm `login()`, `logout()`, `getMe()`, `isLoggedIn()`, `getRole()`
    - Tạo `frontend/login.html`: load React + Babel CDN, form đăng nhập với validation phía client
    - Tạo `frontend/register.html`: form đăng ký với validation phía client
    - Tạo `frontend/admin/index.html`: shell HTML load CDN (React, Babel, Axios, Recharts), kiểm tra token + role admin khi load, mount `app-admin.jsx`
    - Tạo `frontend/customer/index.html`: shell HTML load CDN, kiểm tra token khi load, mount `app-customer.jsx`
    - Routing trong JSX dùng hash (`window.location.hash`) hoặc `history.pushState`
    - _Requirements: 1.1, 1.8, 2.1, 2.3, 2.5, 2.6, 2.7, 17.1, 17.2, 17.4, 17.5_

- [ ] 4. Triển khai module Danh Mục và Sản Phẩm
  - [ ] 4.1 Viết Category Controller và Routes
    - Tạo `backend/src/controllers/category.controller.js`: CRUD danh mục, kiểm tra tên trùng (409), kiểm tra có sản phẩm trước khi xóa (400)
    - Tạo `backend/src/routes/category.routes.js`: GET public, POST/PUT/DELETE yêu cầu admin
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 4.2 Viết property test cho tên danh mục duy nhất
    - **Property 5: Tên danh mục là duy nhất**
    - **Validates: Requirements 3.3**

  - [ ] 4.3 Viết Product Controller và Routes
    - Tạo `backend/src/controllers/product.controller.js`: CRUD sản phẩm, gán mã duy nhất khi tạo, validate trường bắt buộc, kiểm tra có đơn hàng/phiếu kho trước khi xóa
    - Endpoint GET /api/products hỗ trợ query params: search, category_id, min_price, max_price, in_stock, sort, page, limit, admin
    - PATCH /api/products/:id/visibility để ẩn/hiện sản phẩm
    - Tạo `backend/src/routes/product.routes.js`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 22.1, 22.3, 22.4_

  - [ ]* 4.4 Viết property test cho sản phẩm ẩn
    - **Property 6: Sản phẩm ẩn không xuất hiện trong danh sách khách hàng**
    - **Validates: Requirements 4.5, 4.9**

  - [ ] 4.5 Triển khai upload ảnh sản phẩm
    - Tạo `backend/src/services/image.service.js`: dùng sharp để nén ảnh và tạo thumbnail (200x200), lưu vào `uploads/products/` và `uploads/thumbnails/`
    - Thêm POST /api/products/:id/images (multer + image.service) và DELETE /api/products/:id/images/:imgId (xóa file gốc + thumbnail)
    - _Requirements: 25.1, 25.2, 25.3, 25.4_

  - [ ]* 4.6 Viết property test cho upload ảnh
    - **Property 21: Upload ảnh vượt 5MB bị từ chối**
    - **Validates: Requirements 25.2**

  - [ ] 4.7 Xây dựng trang Sản Phẩm Frontend
    - Thêm các component vào `frontend/customer/app-customer.jsx`: ProductList (filter/sort/phân trang), ProductDetail (gallery ảnh, nút thêm giỏ)
    - Thêm các component vào `frontend/admin/app-admin.jsx`: ProductList (admin), ProductForm (tạo/sửa, upload ảnh), CategoryList
    - _Requirements: 4.1, 4.9, 22.1, 22.2, 22.3, 22.4_

- [ ] 5. Checkpoint - Kiểm tra auth, danh mục và sản phẩm
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có thắc mắc.


- [ ] 6. Triển khai module Kho Hàng (Warehouse)
  - [ ] 6.1 Viết Inventory Service
    - Tạo `backend/src/services/inventory.service.js` với các hàm:
      - `increaseStock(productId, quantity, trx)`: tăng tồn kho trong transaction
      - `decreaseStock(productId, quantity, trx)`: kiểm tra đủ hàng rồi giảm, ném lỗi nếu không đủ
      - `adjustStock(productId, actualQuantity, trx)`: cập nhật theo số thực tế (kiểm kê)
      - `getStock(productId)`: lấy tồn kho hiện tại
    - Sau mỗi `decreaseStock` hoặc `adjustStock`, kiểm tra nếu `quantity < min_stock` thì gọi email service (async, không block)
    - _Requirements: 5.2, 6.2, 6.3, 7.3, 19.2_

  - [ ]* 6.2 Viết property tests cho inventory service
    - **Property 7: Nhập kho tăng tồn kho đúng số lượng**
    - **Property 8: Số lượng nhập/xuất phải lớn hơn 0**
    - **Property 9: Xuất kho giảm tồn kho đúng số lượng**
    - **Property 10: Không thể xuất kho vượt tồn kho**
    - **Property 11: Tồn kho = tổng nhập - tổng xuất**
    - **Validates: Requirements 5.2, 5.3, 6.2, 6.3, 6.4, 7.3**

  - [ ] 6.3 Viết Warehouse Controller và Routes (Nhập/Xuất Kho)
    - Tạo `backend/src/controllers/warehouse.controller.js`:
      - `createReceipt`: validate trường bắt buộc, lưu phiếu nhập, gọi `increaseStock` trong transaction, ghi `created_by`
      - `createIssue`: validate, gọi `decreaseStock` trong transaction, ghi `created_by`
      - `getInventory`: trả danh sách tồn kho kèm cờ cảnh báo (`quantity < min_stock`)
      - `exportInventoryCsv`: tạo CSV tồn kho dùng `csv.service.js`
      - Danh sách phiếu nhập/xuất với filter và phân trang
    - Tạo `backend/src/routes/warehouse.routes.js` (tất cả yêu cầu admin)
    - Tạo `backend/src/services/csv.service.js`: hàm `generateCsv(headers, rows)` trả buffer CSV
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.4_

  - [ ] 6.4 Triển khai Kiểm Kê Kho
    - Thêm vào warehouse.controller.js:
      - `createStocktake`: tạo phiếu kiểm kê với danh sách sản phẩm và tồn kho hệ thống hiện tại
      - `confirmStocktake`: gọi `adjustStock` cho từng dòng có chênh lệch trong transaction, ghi `confirmed_at`
      - `getStocktakes`: lịch sử kiểm kê có phân trang
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [ ]* 6.5 Viết property test cho kiểm kê
    - **Property 18: Chênh lệch kiểm kê = thực tế - hệ thống**
    - **Validates: Requirements 18.2**

  - [ ] 6.6 Xây dựng trang Kho Hàng Frontend
    - Thêm vào `frontend/admin/app-admin.jsx` các component: Inventory (bảng tồn kho, highlight cảnh báo, nút xuất CSV), ReceiptList, ReceiptForm, IssueList, IssueForm, Stocktake (nhập số lượng thực tế, hiển thị chênh lệch, nút xác nhận)
    - _Requirements: 5.1, 5.6, 6.1, 6.6, 7.1, 7.2, 7.4, 18.1, 18.2, 18.3, 18.4, 19.3_

- [ ] 7. Triển khai module Nhà Cung Cấp và Chi Phí
  - [ ] 7.1 Viết Supplier Controller và Routes
    - Tạo `backend/src/controllers/supplier.controller.js`: CRUD nhà cung cấp, gán mã duy nhất, kiểm tra tên trùng (409), kiểm tra có phiếu nhập trước khi xóa (400)
    - Tạo `backend/src/routes/supplier.routes.js` (tất cả yêu cầu admin)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ] 7.2 Viết Expense Controller và Routes
    - Tạo `backend/src/controllers/expense.controller.js`: CRUD chi phí, validate số tiền > 0, ghi `created_by`, filter theo loại và khoảng thời gian
    - Tạo `backend/src/routes/expense.routes.js` (tất cả yêu cầu admin)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 7.3 Xây dựng trang Nhà Cung Cấp và Chi Phí Frontend
    - Thêm vào `frontend/admin/app-admin.jsx` các component: SupplierList, SupplierForm, ExpenseList (với form tạo chi phí inline)
    - _Requirements: 12.1, 13.1, 13.4, 23.3_

- [ ] 8. Checkpoint - Kiểm tra kho hàng, nhà cung cấp và chi phí
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có thắc mắc.


- [ ] 9. Triển khai module Giỏ Hàng và Đơn Hàng
  - [ ] 9.1 Viết Cart Controller và Routes
    - Tạo `backend/src/controllers/cart.controller.js`:
      - `getCart`: lấy giỏ hàng của user hiện tại kèm thông tin sản phẩm
      - `addItem`: thêm sản phẩm hoặc tăng số lượng nếu đã có (upsert theo `user_id, product_id`)
      - `updateItem`: cập nhật số lượng; nếu quantity = 0 thì xóa dòng
      - `removeItem`: xóa một dòng
      - `clearCart`: xóa toàn bộ giỏ hàng của user
    - Tạo `backend/src/routes/cart.routes.js` (yêu cầu xác thực, role customer)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 9.2 Viết property test cho giỏ hàng
    - **Property 12: Thêm sản phẩm đã có trong giỏ tăng số lượng**
    - **Validates: Requirements 8.2**

  - [ ] 9.3 Viết Order Controller và Routes
    - Tạo `backend/src/controllers/order.controller.js`:
      - `createOrder`: validate địa chỉ/SĐT, tính phí vận chuyển theo khu vực (nội thành 30k, ngoại thành 50k, tỉnh khác 100k), tạo đơn hàng + order_items trong transaction, xóa giỏ hàng, gửi email xác nhận async
      - `getOrders`: admin thấy tất cả (filter theo status/thời gian/tên KH), customer chỉ thấy của mình
      - `getOrderById`: kiểm tra quyền truy cập
      - `updateOrderStatus`: kiểm tra state machine hợp lệ, ghi log vào `order_status_logs`
      - `getUnpaidOrders`: danh sách đơn chưa/thiếu thanh toán
    - Tạo `backend/src/routes/order.routes.js`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 9.4 Viết property tests cho đơn hàng
    - **Property 13: Đơn hàng mới tạo có trạng thái "chờ duyệt" và mã duy nhất**
    - **Property 14: Tạo đơn hàng xóa giỏ hàng**
    - **Property 15: State machine trạng thái đơn hàng**
    - **Validates: Requirements 9.2, 9.5, 10.1, 10.5, 10.6**

  - [ ] 9.5 Triển khai theo dõi thanh toán
    - Thêm vào order.controller.js hàm `recordPayment`: lưu bản ghi vào bảng `payments`, tính tổng đã thanh toán, tự động cập nhật `payment_status` thành `'paid'` nếu đủ tiền
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [ ]* 9.6 Viết property test cho thanh toán
    - **Property 19: Thanh toán đủ tự động cập nhật trạng thái**
    - **Validates: Requirements 20.3**

  - [ ] 9.7 Xây dựng trang Giỏ Hàng và Đặt Hàng Frontend
    - Thêm vào `frontend/customer/app-customer.jsx` các component: Cart (hiển thị giỏ, cập nhật số lượng, xóa, tổng tiền), Checkout (form địa chỉ/SĐT/thanh toán, tùy chọn VAT, hiển thị phí ship), OrderHistory, OrderDetail
    - Thêm vào `frontend/admin/app-admin.jsx` các component: OrderList (filter trạng thái/thời gian/tên KH), OrderDetail (cập nhật trạng thái, ghi nhận thanh toán)
    - State giỏ hàng quản lý bằng React state + đồng bộ API
    - _Requirements: 8.7, 9.1, 9.3, 9.4, 11.1, 11.2, 11.3, 11.4, 20.4_

- [ ] 10. Checkpoint - Kiểm tra giỏ hàng và đơn hàng
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có thắc mắc.


- [ ] 11. Triển khai dịch vụ Email và PDF
  - [ ] 11.1 Viết Email Service
    - Tạo `backend/src/services/email.service.js` dùng nodemailer:
      - `sendOrderConfirmation(order, user)`: gửi email xác nhận đơn hàng
      - `sendLowStockAlert(product, adminEmail)`: gửi email cảnh báo tồn kho thấp
    - Mọi lỗi email phải được ghi log, không ném exception ra ngoài
    - _Requirements: 9.6, 9.7, 19.2, 19.4_

  - [ ] 11.2 Viết PDF Service
    - Tạo `backend/src/services/pdf.service.js` dùng pdfkit:
      - `generateReceiptPdf(receipt)`: PDF phiếu nhập kho (mã phiếu, ngày, nhà cung cấp, sản phẩm, số lượng, đơn giá, tổng tiền)
      - `generateIssuePdf(issue)`: PDF phiếu xuất kho
      - `generateInvoicePdf(order)`: PDF hóa đơn VAT (tên công ty, mã số thuế, địa chỉ, danh sách hàng, thuế suất, tổng tiền)
    - Kết nối vào các route: GET /api/warehouse/receipts/:id/pdf, GET /api/warehouse/issues/:id/pdf, GET /api/orders/:id/pdf
    - _Requirements: 26.1, 26.2, 26.3_

- [ ] 12. Triển khai module Báo Cáo và Dashboard
  - [ ] 12.1 Viết Report Controller và Routes
    - Tạo `backend/src/controllers/report.controller.js`:
      - `getDashboard`: doanh thu hôm nay, đơn chờ duyệt, sản phẩm dưới ngưỡng, doanh thu tháng, 5 đơn mới nhất, danh sách sản phẩm dưới ngưỡng
      - `getInventoryReport`: bảng tồn kho với giá trị ước tính (tồn kho × đơn giá nhập trung bình), filter theo danh mục
      - `getRevenueReport`: tổng doanh thu, số đơn, giá trị trung bình, doanh thu theo ngày/tháng — CHỈ từ đơn `completed`
      - `getExpenseReport`: chi phí phân theo loại, lợi nhuận ròng = doanh thu - chi phí (expenses + nhập kho)
      - Các endpoint xuất CSV: gọi `csv.service.js`
    - Tạo `backend/src/routes/report.routes.js` (tất cả yêu cầu admin)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2, 16.3, 16.4, 16.5, 24.1, 24.2, 24.3, 24.4_

  - [ ]* 12.2 Viết property tests cho báo cáo
    - **Property 16: Doanh thu chỉ tính từ đơn hoàn thành**
    - **Property 17: Lợi nhuận ròng = doanh thu - chi phí**
    - **Validates: Requirements 15.4, 16.3**

  - [ ] 12.3 Xây dựng trang Báo Cáo và Dashboard Frontend
    - Thêm vào `frontend/admin/app-admin.jsx` các component biểu đồ dùng Recharts CDN: RevenueLineChart, InventoryBarChart, ExpensePieChart
    - Thêm component Dashboard: thẻ chỉ số, biểu đồ doanh thu 7 ngày, danh sách đơn mới, cảnh báo tồn kho thấp
    - Thêm các component báo cáo: InventoryReport, RevenueReport, ExpenseReport với filter thời gian và nút xuất CSV
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.5, 16.1, 16.2, 16.3, 16.5, 24.1, 24.2, 24.3, 24.4, 24.5_

- [ ] 13. Triển khai module Khách Hàng (Admin view)
  - [ ] 13.1 Viết Customer Controller và Routes
    - Tạo `backend/src/controllers/customer.controller.js`:
      - `getCustomers`: danh sách khách hàng, tìm kiếm theo tên/email/SĐT, phân trang
      - `getCustomerProfile`: thông tin cá nhân + tổng đơn hàng + tổng giá trị + danh sách đơn hàng (phân trang 20/trang)
    - Tạo `backend/src/routes/customer.routes.js` (yêu cầu admin)
    - _Requirements: 21.1, 21.2, 21.3_

  - [ ] 13.2 Xây dựng trang Khách Hàng Frontend
    - Thêm vào `frontend/admin/app-admin.jsx` các component: CustomerList (ô tìm kiếm), CustomerProfile (thông tin + lịch sử đơn hàng phân trang)
    - _Requirements: 21.1, 21.2, 21.3_

- [ ] 14. Xây dựng Layout và Component dùng chung Frontend
  - Thêm vào `frontend/admin/app-admin.jsx` các component dùng chung: Sidebar navigation, Header, Pagination, Modal, Alert
  - Thêm vào `frontend/customer/app-customer.jsx` các component dùng chung: Header (icon giỏ hàng), Footer, Pagination
  - Tạo `frontend/css/main.css`, `frontend/css/admin.css`, `frontend/css/customer.css`
  - _Requirements: 23.4_

- [ ] 15. Checkpoint - Kiểm tra phân trang và property tests phân trang
  - [ ] 15.1 Viết property test cho phân trang
    - **Property 20: Phân trang không vượt quá giới hạn**
    - **Validates: Requirements 22.4, 23.1, 23.2, 23.3**
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có thắc mắc.

- [ ] 16. Kết nối và tích hợp toàn bộ hệ thống
  - [ ] 16.1 Kết nối backend
    - Tạo `backend/src/app.js`: khởi tạo Express, đăng ký tất cả routes, gắn errorHandler middleware
    - Đảm bảo tất cả routes được mount đúng prefix `/api/...`
    - _Requirements: 17.3_

  - [ ] 16.2 Kết nối frontend
    - Đảm bảo `frontend/admin/index.html` và `frontend/customer/index.html` load đúng CDN và file JSX
    - Kiểm tra routing hash hoạt động đúng trong từng app JSX
    - Kiểm tra Axios interceptor hoạt động đúng với JWT và redirect 401 về `/login.html`
    - _Requirements: 2.6, 2.7, 17.1, 17.2_

- [ ] 17. Checkpoint cuối - Đảm bảo tất cả tests pass
  - Đảm bảo tất cả property tests và unit tests pass, hỏi người dùng nếu có thắc mắc.

## Ghi Chú

- Tasks đánh dấu `*` là tùy chọn, có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu đến requirements cụ thể để đảm bảo traceability
- Các checkpoint giúp xác nhận tiến độ theo từng giai đoạn
- Property tests dùng thư viện **fast-check** với tối thiểu 100 iterations mỗi test
- Tag format cho property tests: `// Feature: warehouse-management-system, Property {N}: {mô tả}`
