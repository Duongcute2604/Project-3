# Tài Liệu Yêu Cầu

## Giới Thiệu

Hệ Thống Quản Lý Kho Giấy là một ứng dụng web thương mại điện tử giúp doanh nghiệp kinh doanh giấy quản lý toàn diện hoạt động từ tồn kho sản phẩm đến bán hàng trực tuyến. Hệ thống phục vụ hai nhóm người dùng chính: Quản Trị Viên (Admin) và Khách Hàng. Frontend sử dụng React (JSX), backend Node.js/Express, cơ sở dữ liệu SQL.

---

## Bảng Thuật Ngữ

- **Hệ Thống**: Hệ Thống Quản Lý Kho Giấy (toàn bộ ứng dụng web)
- **Dịch_Vụ_Xác_Thực**: Module xử lý xác thực và phân quyền người dùng
- **Dịch_Vụ_Sản_Phẩm**: Module quản lý sản phẩm và danh mục
- **Dịch_Vụ_Kho**: Module quản lý kho hàng (nhập/xuất/tồn kho)
- **Dịch_Vụ_Đơn_Hàng**: Module quản lý đơn hàng và giỏ hàng
- **Dịch_Vụ_Đối_Tác**: Module quản lý nhà cung cấp và chi phí
- **Dịch_Vụ_Báo_Cáo**: Module thống kê và báo cáo
- **Quản Trị Viên**: Người dùng có vai trò quản trị, có toàn quyền trên hệ thống
- **Khách Hàng**: Người dùng đã đăng ký, có quyền xem sản phẩm và đặt hàng
- **Khách Vãng Lai**: Người dùng chưa đăng nhập
- **Sản Phẩm**: Sản phẩm giấy (giấy in, giấy ảnh, giấy bìa, vải vụn, lõi ống)
- **Danh Mục**: Danh mục phân loại sản phẩm
- **Phiếu Nhập Kho**: Bản ghi giao dịch nhập hàng vào kho
- **Phiếu Xuất Kho**: Bản ghi giao dịch xuất hàng ra khỏi kho
- **Tồn Kho**: Số lượng hàng hóa hiện có của một sản phẩm
- **Đơn Vị Tính**: Đơn vị đo lường (tấn, kg, ream, cuộn)
- **Giỏ Hàng**: Giỏ hàng của khách hàng
- **Đơn Hàng**: Đơn hàng được tạo từ giỏ hàng
- **Trạng Thái Đơn Hàng**: Trạng thái đơn hàng (chờ duyệt, đã duyệt, đang giao, hoàn thành, hủy)
- **Hóa Đơn VAT**: Hóa đơn giá trị gia tăng đính kèm đơn hàng
- **Nhà Cung Cấp**: Đơn vị cung cấp nguyên liệu/sản phẩm
- **Chi Phí**: Bản ghi chi phí vận hành (nhân công, vận chuyển)

---

## Yêu Cầu

### Yêu Cầu 1: Đăng Ký Tài Khoản Khách Hàng

**Câu chuyện người dùng:** Là Khách Vãng Lai, tôi muốn đăng ký tài khoản mới để có thể đăng nhập và đặt hàng trên hệ thống.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG PHẢI cung cấp form đăng ký với các trường: họ tên, email, số điện thoại, mật khẩu và xác nhận mật khẩu.
2. KHI Khách Vãng Lai gửi form đăng ký, Dịch_Vụ_Xác_Thực PHẢI kiểm tra email đúng định dạng (có "@" và tên miền).
3. KHI Khách Vãng Lai gửi form đăng ký, Dịch_Vụ_Xác_Thực PHẢI kiểm tra số điện thoại có từ 10 đến 11 chữ số.
4. KHI Khách Vãng Lai gửi form đăng ký, Dịch_Vụ_Xác_Thực PHẢI kiểm tra mật khẩu có ít nhất 8 ký tự.
5. KHI Khách Vãng Lai nhập mật khẩu và xác nhận mật khẩu không khớp, Dịch_Vụ_Xác_Thực PHẢI hiển thị lỗi "Mật khẩu xác nhận không khớp".
6. KHI Khách Vãng Lai đăng ký bằng email đã tồn tại, Dịch_Vụ_Xác_Thực PHẢI hiển thị lỗi "Email đã được sử dụng".
7. KHI Khách Vãng Lai gửi form hợp lệ, Dịch_Vụ_Xác_Thực PHẢI tạo tài khoản Khách Hàng với vai trò "customer" và lưu mật khẩu dưới dạng bcrypt hash.
8. KHI tài khoản được tạo thành công, Dịch_Vụ_Xác_Thực PHẢI chuyển hướng đến trang đăng nhập.
9. NẾU dịch vụ đăng ký không khả dụng, Dịch_Vụ_Xác_Thực PHẢI hiển thị lỗi "Không thể kết nối đến máy chủ, vui lòng thử lại".

---

### Yêu Cầu 2: Đăng Nhập

**Câu chuyện người dùng:** Là Khách Hàng hoặc Quản Trị Viên, tôi muốn đăng nhập bằng thông tin tài khoản để truy cập các chức năng tương ứng với vai trò của mình.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG PHẢI cung cấp form đăng nhập với các trường: email và mật khẩu.
2. KHI người dùng đăng nhập đúng thông tin, Dịch_Vụ_Xác_Thực PHẢI tạo JWT token có thời hạn 24 giờ và trả về cho client.
3. KHI người dùng đăng nhập thành công, Dịch_Vụ_Xác_Thực PHẢI chuyển hướng đến trang tương ứng với vai trò (trang quản trị hoặc trang chủ khách hàng).
4. KHI người dùng nhập sai email hoặc mật khẩu, Dịch_Vụ_Xác_Thực PHẢI hiển thị lỗi "Email hoặc mật khẩu không đúng".
5. KHI người dùng để trống email hoặc mật khẩu, Dịch_Vụ_Xác_Thực PHẢI hiển thị lỗi xác thực trước khi gửi yêu cầu lên server.
6. TRONG KHI người dùng đã đăng nhập, Dịch_Vụ_Xác_Thực PHẢI đính kèm JWT token vào tất cả các yêu cầu API qua header Authorization.
7. KHI JWT token hết hạn, Dịch_Vụ_Xác_Thực PHẢI chuyển hướng người dùng về trang đăng nhập.
8. NẾU dịch vụ đăng nhập không khả dụng, Dịch_Vụ_Xác_Thực PHẢI hiển thị lỗi "Không thể kết nối đến máy chủ, vui lòng thử lại".

---

### Yêu Cầu 3: Quản Lý Danh Mục Sản Phẩm

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn quản lý danh mục sản phẩm để phân loại hàng hóa một cách hợp lý.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Sản_Phẩm PHẢI duy trì danh sách danh mục bao gồm tối thiểu: Giấy In, Giấy Ảnh, Giấy Bìa, Vải Vụn, Lõi Ống.
2. KHI Quản Trị Viên tạo danh mục mới với tên chưa tồn tại, Dịch_Vụ_Sản_Phẩm PHẢI lưu và hiển thị danh mục trong danh sách.
3. KHI Quản Trị Viên tạo danh mục với tên đã tồn tại, Dịch_Vụ_Sản_Phẩm PHẢI hiển thị lỗi "Tên danh mục đã tồn tại".
4. KHI Quản Trị Viên cập nhật tên danh mục, Dịch_Vụ_Sản_Phẩm PHẢI cập nhật và phản ánh thay đổi trên tất cả sản phẩm liên quan.
5. KHI Quản Trị Viên xóa danh mục không có sản phẩm, Dịch_Vụ_Sản_Phẩm PHẢI xóa danh mục khỏi hệ thống.
6. KHI Quản Trị Viên xóa danh mục đang có sản phẩm, Dịch_Vụ_Sản_Phẩm PHẢI hiển thị lỗi "Không thể xóa danh mục đang có sản phẩm".

---

### Yêu Cầu 4: Quản Lý Sản Phẩm

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn thêm, sửa, ẩn và xóa sản phẩm để duy trì danh mục hàng hóa chính xác và cập nhật.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Sản_Phẩm PHẢI hỗ trợ các thuộc tính sản phẩm: tên, danh mục, mô tả, đơn vị tính (tấn/kg/ream/cuộn), giá bán, hình ảnh (tối đa 5 ảnh) và trạng thái hiển thị (hiện/ẩn).
2. KHI Quản Trị Viên tạo sản phẩm mới với đầy đủ thông tin bắt buộc, Dịch_Vụ_Sản_Phẩm PHẢI lưu sản phẩm và gán mã sản phẩm duy nhất.
3. KHI Quản Trị Viên tạo sản phẩm thiếu trường bắt buộc (tên, danh mục, đơn vị hoặc giá), Dịch_Vụ_Sản_Phẩm PHẢI hiển thị lỗi xác thực chỉ rõ trường còn thiếu.
4. KHI Quản Trị Viên cập nhật thông tin sản phẩm, Dịch_Vụ_Sản_Phẩm PHẢI lưu và phản ánh thay đổi ngay lập tức trên trang danh sách sản phẩm.
5. KHI Quản Trị Viên ẩn sản phẩm, Dịch_Vụ_Sản_Phẩm PHẢI loại sản phẩm đó khỏi tất cả danh sách hiển thị cho Khách Hàng.
6. KHI Quản Trị Viên hiện sản phẩm, Dịch_Vụ_Sản_Phẩm PHẢI đưa sản phẩm trở lại danh sách hiển thị cho Khách Hàng.
7. KHI Quản Trị Viên xóa sản phẩm không có đơn hàng hoặc phiếu kho liên quan, Dịch_Vụ_Sản_Phẩm PHẢI xóa vĩnh viễn sản phẩm đó.
8. KHI Quản Trị Viên xóa sản phẩm đang có đơn hàng hoặc phiếu kho, Dịch_Vụ_Sản_Phẩm PHẢI hiển thị lỗi "Không thể xóa sản phẩm đang có đơn hàng hoặc phiếu kho liên quan".
9. KHI Khách Hàng xem danh sách sản phẩm, Dịch_Vụ_Sản_Phẩm CHỈ ĐƯỢC hiển thị các sản phẩm có trạng thái hiện.
10. KHI Khách Hàng tìm kiếm sản phẩm theo tên hoặc danh mục, Dịch_Vụ_Sản_Phẩm PHẢI trả kết quả trong vòng 500ms.

---

### Yêu Cầu 5: Quản Lý Nhập Kho

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn tạo phiếu nhập kho để theo dõi chính xác toàn bộ hàng hóa nhập vào.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Kho PHẢI cung cấp form tạo Phiếu Nhập Kho với các trường: nhà cung cấp, sản phẩm, số lượng, đơn vị tính, đơn giá nhập, ngày nhập và ghi chú.
2. KHI Quản Trị Viên gửi form hợp lệ, Dịch_Vụ_Kho PHẢI lưu phiếu và tăng Tồn Kho của sản phẩm tương ứng theo số lượng đã nhập.
3. KHI Quản Trị Viên nhập số lượng bằng 0 hoặc âm, Dịch_Vụ_Kho PHẢI hiển thị lỗi "Số lượng nhập phải lớn hơn 0".
4. KHI Quản Trị Viên gửi form thiếu trường bắt buộc (nhà cung cấp, sản phẩm, số lượng hoặc đơn giá), Dịch_Vụ_Kho PHẢI hiển thị lỗi xác thực chỉ rõ trường còn thiếu.
5. KHI Phiếu Nhập Kho được lưu, Dịch_Vụ_Kho PHẢI ghi lại mã người dùng của Quản Trị Viên tạo phiếu.
6. Dịch_Vụ_Kho PHẢI hiển thị danh sách tất cả Phiếu Nhập Kho với bộ lọc theo khoảng thời gian, nhà cung cấp và sản phẩm.

---

### Yêu Cầu 6: Quản Lý Xuất Kho

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn tạo phiếu xuất kho để theo dõi chính xác toàn bộ hàng hóa xuất ra.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Kho PHẢI cung cấp form tạo Phiếu Xuất Kho với các trường: sản phẩm, số lượng, đơn vị tính, lý do xuất, ngày xuất và ghi chú.
2. KHI Quản Trị Viên gửi form hợp lệ, Dịch_Vụ_Kho PHẢI lưu phiếu và giảm Tồn Kho của sản phẩm tương ứng theo số lượng đã xuất.
3. KHI Quản Trị Viên nhập số lượng xuất lớn hơn Tồn Kho hiện tại, Dịch_Vụ_Kho PHẢI hiển thị lỗi "Số lượng xuất vượt quá tồn kho hiện tại".
4. KHI Quản Trị Viên nhập số lượng bằng 0 hoặc âm, Dịch_Vụ_Kho PHẢI hiển thị lỗi "Số lượng xuất phải lớn hơn 0".
5. KHI Phiếu Xuất Kho được lưu, Dịch_Vụ_Kho PHẢI ghi lại mã người dùng của Quản Trị Viên tạo phiếu.
6. Dịch_Vụ_Kho PHẢI hiển thị danh sách tất cả Phiếu Xuất Kho với bộ lọc theo khoảng thời gian và sản phẩm.

---

### Yêu Cầu 7: Theo Dõi Tồn Kho

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn xem tồn kho hiện tại của tất cả sản phẩm để đưa ra quyết định mua hàng và bán hàng phù hợp.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Kho PHẢI hiển thị bảng tổng quan tồn kho gồm: tên sản phẩm, danh mục, Tồn Kho hiện tại và đơn vị tính.
2. KHI Tồn Kho của sản phẩm xuống dưới ngưỡng tối thiểu đã cấu hình, Dịch_Vụ_Kho PHẢI đánh dấu cảnh báo trên dòng sản phẩm đó.
3. Dịch_Vụ_Kho PHẢI tính Tồn Kho = tổng số lượng nhập - tổng số lượng xuất của từng sản phẩm.
4. KHI Quản Trị Viên xuất báo cáo tồn kho, Dịch_Vụ_Kho PHẢI tạo file CSV chứa tất cả sản phẩm và Tồn Kho hiện tại.

---

### Yêu Cầu 8: Giỏ Hàng

**Câu chuyện người dùng:** Là Khách Hàng, tôi muốn quản lý giỏ hàng để xem lại và điều chỉnh lựa chọn trước khi đặt hàng.

#### Tiêu Chí Chấp Nhận

1. KHI Khách Hàng thêm sản phẩm đang hiển thị vào Giỏ Hàng, Dịch_Vụ_Đơn_Hàng PHẢI thêm sản phẩm với số lượng đã chọn vào Giỏ Hàng.
2. KHI Khách Hàng thêm sản phẩm đã có trong Giỏ Hàng, Dịch_Vụ_Đơn_Hàng PHẢI tăng số lượng sản phẩm đó theo số lượng được chọn thêm.
3. KHI Khách Hàng cập nhật số lượng sản phẩm trong giỏ về 0, Dịch_Vụ_Đơn_Hàng PHẢI xóa sản phẩm đó khỏi Giỏ Hàng.
4. KHI Khách Hàng xóa một sản phẩm khỏi Giỏ Hàng, Dịch_Vụ_Đơn_Hàng PHẢI xóa sản phẩm đó.
5. Dịch_Vụ_Đơn_Hàng PHẢI lưu trữ nội dung Giỏ Hàng của Khách Hàng đã đăng nhập qua các phiên trình duyệt.
6. KHI Khách Vãng Lai cố thêm sản phẩm vào Giỏ Hàng, Dịch_Vụ_Đơn_Hàng PHẢI chuyển hướng đến trang đăng nhập.
7. Dịch_Vụ_Đơn_Hàng PHẢI hiển thị Giỏ Hàng với: tên sản phẩm, đơn vị, số lượng, đơn giá, thành tiền từng dòng và tổng tiền giỏ hàng.

---

### Yêu Cầu 9: Tạo Đơn Hàng

**Câu chuyện người dùng:** Là Khách Hàng, tôi muốn đặt hàng từ giỏ hàng để mua sản phẩm và nhận hàng tại địa chỉ của mình.

#### Tiêu Chí Chấp Nhận

1. KHI Khách Hàng tiến hành thanh toán, Dịch_Vụ_Đơn_Hàng PHẢI hiển thị form thanh toán với các trường: địa chỉ giao hàng, số điện thoại, phương thức thanh toán và yêu cầu hóa đơn VAT (tùy chọn).
2. KHI Khách Hàng gửi form đầy đủ thông tin, Dịch_Vụ_Đơn_Hàng PHẢI tạo Đơn Hàng với trạng thái "chờ duyệt" và mã đơn hàng duy nhất.
3. Dịch_Vụ_Đơn_Hàng PHẢI tính phí vận chuyển dựa theo khu vực giao hàng và hiển thị cho Khách Hàng trước khi xác nhận đơn.
4. KHI Khách Hàng yêu cầu Hóa Đơn VAT, Dịch_Vụ_Đơn_Hàng PHẢI thu thập thêm: tên công ty, mã số thuế và địa chỉ công ty, rồi đính kèm vào Đơn Hàng.
5. KHI Đơn Hàng được tạo, Dịch_Vụ_Đơn_Hàng PHẢI xóa Giỏ Hàng của Khách Hàng.
6. KHI Đơn Hàng được tạo, Dịch_Vụ_Đơn_Hàng PHẢI gửi email xác nhận đơn hàng đến địa chỉ email đã đăng ký của Khách Hàng.
7. NẾU dịch vụ gửi email không khả dụng, Dịch_Vụ_Đơn_Hàng VẪN PHẢI hoàn tất việc tạo đơn hàng và ghi log lỗi gửi thông báo.
8. KHI Khách Hàng gửi form thiếu địa chỉ giao hàng hoặc số điện thoại, Dịch_Vụ_Đơn_Hàng PHẢI hiển thị lỗi xác thực trước khi gửi yêu cầu lên server.

---

### Yêu Cầu 10: Quản Lý Trạng Thái Đơn Hàng

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn cập nhật trạng thái đơn hàng để quản lý quy trình xử lý từ duyệt đơn đến giao hàng.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Đơn_Hàng PHẢI hỗ trợ các Trạng Thái Đơn Hàng theo thứ tự: chờ duyệt → đã duyệt → đang giao → hoàn thành.
2. KHI Quản Trị Viên duyệt Đơn Hàng đang ở trạng thái "chờ duyệt", Dịch_Vụ_Đơn_Hàng PHẢI cập nhật trạng thái thành "đã duyệt".
3. KHI Quản Trị Viên đánh dấu Đơn Hàng đã giao cho đơn vị vận chuyển, Dịch_Vụ_Đơn_Hàng PHẢI cập nhật trạng thái thành "đang giao".
4. KHI Quản Trị Viên đánh dấu Đơn Hàng đã giao thành công, Dịch_Vụ_Đơn_Hàng PHẢI cập nhật trạng thái thành "hoàn thành".
5. KHI Quản Trị Viên hủy Đơn Hàng đang ở trạng thái "chờ duyệt" hoặc "đã duyệt", Dịch_Vụ_Đơn_Hàng PHẢI cập nhật trạng thái thành "hủy".
6. KHI Quản Trị Viên cố hủy Đơn Hàng đang ở trạng thái "đang giao" hoặc "hoàn thành", Dịch_Vụ_Đơn_Hàng PHẢI hiển thị lỗi "Không thể hủy đơn hàng ở trạng thái này".
7. KHI Khách Hàng hủy Đơn Hàng của mình đang ở trạng thái "chờ duyệt", Dịch_Vụ_Đơn_Hàng PHẢI cập nhật trạng thái thành "hủy".
8. KHI Khách Hàng cố hủy Đơn Hàng không ở trạng thái "chờ duyệt", Dịch_Vụ_Đơn_Hàng PHẢI hiển thị lỗi "Chỉ có thể hủy đơn hàng đang ở trạng thái chờ duyệt".
9. KHI Trạng Thái Đơn Hàng thay đổi, Dịch_Vụ_Đơn_Hàng PHẢI ghi lại thời điểm thay đổi trạng thái.

---

### Yêu Cầu 11: Xem Đơn Hàng

**Câu chuyện người dùng:** Là Khách Hàng hoặc Quản Trị Viên, tôi muốn xem chi tiết và lịch sử đơn hàng để theo dõi trạng thái và thông tin mua hàng.

#### Tiêu Chí Chấp Nhận

1. KHI Khách Hàng xem lịch sử đơn hàng, Dịch_Vụ_Đơn_Hàng CHỈ ĐƯỢC hiển thị các Đơn Hàng của Khách Hàng đó, sắp xếp theo ngày tạo mới nhất.
2. KHI Khách Hàng xem chi tiết Đơn Hàng, Dịch_Vụ_Đơn_Hàng PHẢI hiển thị: mã đơn hàng, ngày tạo, danh sách sản phẩm (tên, số lượng, đơn vị, đơn giá, thành tiền), phí vận chuyển, thuế VAT (nếu có), tổng tiền và Trạng Thái Đơn Hàng hiện tại.
3. KHI Quản Trị Viên xem trang quản lý đơn hàng, Dịch_Vụ_Đơn_Hàng PHẢI hiển thị tất cả Đơn Hàng với bộ lọc theo Trạng Thái, khoảng thời gian và tên khách hàng.
4. KHI Quản Trị Viên xem chi tiết Đơn Hàng, Dịch_Vụ_Đơn_Hàng PHẢI hiển thị tất cả thông tin như Khách Hàng thấy cộng thêm thông tin liên hệ và địa chỉ giao hàng của khách.

---

### Yêu Cầu 12: Quản Lý Nhà Cung Cấp

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn quản lý thông tin nhà cung cấp để theo dõi nguồn hàng và thông tin liên hệ.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Đối_Tác PHẢI cung cấp form tạo Nhà Cung Cấp với các trường: tên, người liên hệ, số điện thoại, email, địa chỉ và danh mục sản phẩm cung cấp.
2. KHI Quản Trị Viên tạo Nhà Cung Cấp với đầy đủ trường bắt buộc (tên, số điện thoại), Dịch_Vụ_Đối_Tác PHẢI lưu và gán mã nhà cung cấp duy nhất.
3. KHI Quản Trị Viên tạo Nhà Cung Cấp với tên đã tồn tại, Dịch_Vụ_Đối_Tác PHẢI hiển thị lỗi "Tên nhà cung cấp đã tồn tại".
4. KHI Quản Trị Viên cập nhật thông tin Nhà Cung Cấp, Dịch_Vụ_Đối_Tác PHẢI lưu thay đổi ngay lập tức.
5. KHI Quản Trị Viên xóa Nhà Cung Cấp không có Phiếu Nhập Kho liên quan, Dịch_Vụ_Đối_Tác PHẢI xóa khỏi hệ thống.
6. KHI Quản Trị Viên xóa Nhà Cung Cấp đang có Phiếu Nhập Kho liên quan, Dịch_Vụ_Đối_Tác PHẢI hiển thị lỗi "Không thể xóa nhà cung cấp đang có phiếu nhập kho liên quan".

---

### Yêu Cầu 13: Quản Lý Chi Phí

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn ghi nhận các khoản chi phí vận hành để theo dõi chi phí nhân công và vận chuyển phục vụ báo cáo lợi nhuận chính xác.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Đối_Tác PHẢI cung cấp form tạo Chi Phí với các trường: loại chi phí (nhân công / vận chuyển), số tiền, ngày, mô tả và liên kết đơn hàng hoặc phiếu nhập kho (tùy chọn).
2. KHI Quản Trị Viên gửi form hợp lệ, Dịch_Vụ_Đối_Tác PHẢI lưu bản ghi kèm mã người dùng và thời điểm tạo.
3. KHI Quản Trị Viên nhập số tiền bằng 0 hoặc âm, Dịch_Vụ_Đối_Tác PHẢI hiển thị lỗi "Số tiền chi phí phải lớn hơn 0".
4. Dịch_Vụ_Đối_Tác PHẢI hiển thị danh sách tất cả Chi Phí với bộ lọc theo loại chi phí và khoảng thời gian.

---

### Yêu Cầu 14: Thống Kê Tồn Kho

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn xem thống kê tồn kho để nắm rõ phân bổ hàng hóa và phát hiện sản phẩm sắp hết hàng.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Báo_Cáo PHẢI hiển thị bảng tóm tắt tồn kho gồm: tên sản phẩm, danh mục, Tồn Kho hiện tại, đơn vị tính và giá trị tồn kho ước tính (Tồn Kho × đơn giá nhập trung bình).
2. Dịch_Vụ_Báo_Cáo PHẢI hiển thị biểu đồ cột thể hiện Tồn Kho theo từng sản phẩm, nhóm theo danh mục.
3. KHI Quản Trị Viên lọc báo cáo tồn kho theo danh mục, Dịch_Vụ_Báo_Cáo PHẢI cập nhật cả bảng và biểu đồ chỉ hiển thị sản phẩm thuộc danh mục đó.
4. KHI Quản Trị Viên xuất báo cáo tồn kho, Dịch_Vụ_Báo_Cáo PHẢI tạo file CSV chứa toàn bộ dữ liệu đang hiển thị trong bảng.

---

### Yêu Cầu 15: Thống Kê Doanh Thu

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn xem thống kê doanh thu để theo dõi hiệu quả kinh doanh theo thời gian.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Báo_Cáo PHẢI hiển thị tóm tắt doanh thu gồm: tổng doanh thu, tổng số đơn hàng và giá trị đơn hàng trung bình trong khoảng thời gian được chọn.
2. Dịch_Vụ_Báo_Cáo PHẢI hiển thị biểu đồ đường thể hiện doanh thu theo ngày hoặc tháng trong khoảng thời gian được chọn.
3. KHI Quản Trị Viên lọc báo cáo doanh thu theo khoảng thời gian, Dịch_Vụ_Báo_Cáo PHẢI tính lại và cập nhật tất cả chỉ số và biểu đồ trong vòng 1 giây.
4. Dịch_Vụ_Báo_Cáo CHỈ ĐƯỢC tính doanh thu từ các Đơn Hàng có Trạng Thái "hoàn thành".
5. KHI Quản Trị Viên xuất báo cáo doanh thu, Dịch_Vụ_Báo_Cáo PHẢI tạo file CSV chứa doanh thu theo ngày trong khoảng thời gian được chọn.

---

### Yêu Cầu 16: Thống Kê Chi Phí

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn xem thống kê chi phí để theo dõi chi tiêu vận hành và tính lợi nhuận ròng.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Báo_Cáo PHẢI hiển thị tóm tắt chi phí phân theo loại (nhân công, vận chuyển, nhập kho) trong khoảng thời gian được chọn.
2. Dịch_Vụ_Báo_Cáo PHẢI hiển thị biểu đồ tròn thể hiện tỷ lệ từng loại chi phí trong khoảng thời gian được chọn.
3. Dịch_Vụ_Báo_Cáo PHẢI hiển thị lợi nhuận ròng = tổng doanh thu - tổng chi phí trong khoảng thời gian được chọn.
4. KHI Quản Trị Viên lọc báo cáo chi phí theo khoảng thời gian, Dịch_Vụ_Báo_Cáo PHẢI tính lại và cập nhật tất cả chỉ số và biểu đồ trong vòng 1 giây.
5. KHI Quản Trị Viên xuất báo cáo chi phí, Dịch_Vụ_Báo_Cáo PHẢI tạo file CSV chứa các bản ghi chi phí trong khoảng thời gian được chọn.

---

### Yêu Cầu 17: Phân Quyền Truy Cập

**Câu chuyện người dùng:** Là người vận hành hệ thống, tôi muốn kiểm soát truy cập theo vai trò trên tất cả các route để Khách Hàng không thể truy cập chức năng của Quản Trị Viên và người chưa đăng nhập không thể truy cập tài nguyên được bảo vệ.

#### Tiêu Chí Chấp Nhận

1. KHI Khách Vãng Lai cố truy cập route yêu cầu xác thực, Dịch_Vụ_Xác_Thực PHẢI chuyển hướng về trang đăng nhập.
2. KHI Khách Hàng cố truy cập route chỉ dành cho Quản Trị Viên, Dịch_Vụ_Xác_Thực PHẢI trả về HTTP 403 và hiển thị lỗi "Bạn không có quyền truy cập trang này".
3. Dịch_Vụ_Xác_Thực PHẢI kiểm tra quyền ở cả cấp độ route frontend lẫn API backend.
4. KHI Quản Trị Viên truy cập hệ thống, Dịch_Vụ_Xác_Thực PHẢI cấp quyền truy cập vào: quản lý sản phẩm, danh mục, kho hàng, đơn hàng, nhà cung cấp, chi phí và toàn bộ báo cáo.
5. KHI Khách Hàng truy cập hệ thống, Dịch_Vụ_Xác_Thực PHẢI cấp quyền truy cập vào: xem sản phẩm, quản lý giỏ hàng, đặt hàng và xem lịch sử đơn hàng cá nhân.

---

### Yêu Cầu 18: Kiểm Kê Kho Định Kỳ

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn thực hiện kiểm kê kho để đối chiếu số liệu tồn kho thực tế với số liệu trên hệ thống.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Kho PHẢI cung cấp chức năng tạo phiếu kiểm kê với danh sách tất cả sản phẩm và Tồn Kho hiện tại theo hệ thống.
2. KHI Quản Trị Viên nhập số lượng thực tế cho từng sản phẩm, Dịch_Vụ_Kho PHẢI tính và hiển thị chênh lệch (thực tế - hệ thống) cho từng dòng.
3. KHI Quản Trị Viên xác nhận phiếu kiểm kê, Dịch_Vụ_Kho PHẢI cập nhật Tồn Kho theo số liệu thực tế và ghi lại phiếu điều chỉnh kèm lý do.
4. Dịch_Vụ_Kho PHẢI lưu lịch sử tất cả các lần kiểm kê để Quản Trị Viên tra cứu sau.

---

### Yêu Cầu 19: Cảnh Báo Tồn Kho Thấp

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn nhận cảnh báo khi tồn kho xuống thấp để kịp thời đặt hàng bổ sung.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Kho PHẢI cho phép Quản Trị Viên cấu hình ngưỡng tồn kho tối thiểu cho từng sản phẩm.
2. KHI Tồn Kho của sản phẩm xuống dưới ngưỡng tối thiểu, Dịch_Vụ_Kho PHẢI gửi email cảnh báo đến địa chỉ email của Quản Trị Viên.
3. KHI Quản Trị Viên đăng nhập, Hệ Thống PHẢI hiển thị thông báo danh sách các sản phẩm đang dưới ngưỡng tồn kho tối thiểu trên trang tổng quan.
4. NẾU dịch vụ gửi email không khả dụng, Dịch_Vụ_Kho VẪN PHẢI hiển thị cảnh báo trong hệ thống và ghi log lỗi gửi email.

---

### Yêu Cầu 20: Theo Dõi Thanh Toán Đơn Hàng

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn ghi nhận và theo dõi trạng thái thanh toán của từng đơn hàng để kiểm soát công nợ khách hàng.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Đơn_Hàng PHẢI lưu trạng thái thanh toán cho mỗi Đơn Hàng với các giá trị: chưa thanh toán, đã thanh toán một phần, đã thanh toán đủ.
2. KHI Quản Trị Viên xác nhận đã nhận thanh toán, Dịch_Vụ_Đơn_Hàng PHẢI ghi nhận số tiền, phương thức (chuyển khoản/tiền mặt), ngày thanh toán và mã người xác nhận.
3. KHI tổng số tiền đã thanh toán bằng tổng tiền Đơn Hàng, Dịch_Vụ_Đơn_Hàng PHẢI tự động cập nhật trạng thái thanh toán thành "đã thanh toán đủ".
4. Dịch_Vụ_Đơn_Hàng PHẢI hiển thị danh sách các Đơn Hàng chưa thanh toán hoặc thanh toán một phần để Quản Trị Viên theo dõi công nợ.

---

### Yêu Cầu 21: Lịch Sử Mua Hàng Khách Hàng

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn xem lịch sử mua hàng của từng khách hàng để phục vụ chăm sóc khách hàng và phân tích hành vi mua sắm.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Đơn_Hàng PHẢI cung cấp trang hồ sơ khách hàng cho Quản Trị Viên xem, bao gồm: thông tin cá nhân, tổng số đơn hàng, tổng giá trị mua hàng và danh sách tất cả đơn hàng.
2. KHI Quản Trị Viên xem hồ sơ khách hàng, Dịch_Vụ_Đơn_Hàng PHẢI hiển thị danh sách đơn hàng sắp xếp theo ngày tạo mới nhất, có phân trang 20 đơn mỗi trang.
3. Dịch_Vụ_Đơn_Hàng PHẢI cho phép Quản Trị Viên tìm kiếm khách hàng theo tên, email hoặc số điện thoại.

---

### Yêu Cầu 22: Tìm Kiếm và Lọc Sản Phẩm Nâng Cao

**Câu chuyện người dùng:** Là Khách Hàng, tôi muốn tìm kiếm và lọc sản phẩm theo nhiều tiêu chí để nhanh chóng tìm được hàng hóa phù hợp.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Sản_Phẩm PHẢI hỗ trợ tìm kiếm sản phẩm theo: tên, danh mục, khoảng giá (giá tối thiểu - tối đa) và tình trạng còn hàng.
2. KHI Khách Hàng áp dụng bộ lọc, Dịch_Vụ_Sản_Phẩm PHẢI cập nhật kết quả ngay lập tức mà không cần tải lại trang.
3. Dịch_Vụ_Sản_Phẩm PHẢI hỗ trợ sắp xếp kết quả theo: giá tăng dần, giá giảm dần, tên A-Z và mới nhất.
4. Dịch_Vụ_Sản_Phẩm PHẢI phân trang kết quả với tối đa 20 sản phẩm mỗi trang và hiển thị tổng số kết quả tìm được.

---

### Yêu Cầu 23: Phân Trang Danh Sách

**Câu chuyện người dùng:** Là Quản Trị Viên hoặc Khách Hàng, tôi muốn các danh sách dữ liệu được phân trang để trang web tải nhanh và dễ duyệt.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Đơn_Hàng PHẢI phân trang danh sách đơn hàng với tối đa 20 bản ghi mỗi trang.
2. Dịch_Vụ_Kho PHẢI phân trang danh sách phiếu nhập/xuất kho với tối đa 20 bản ghi mỗi trang.
3. Dịch_Vụ_Đối_Tác PHẢI phân trang danh sách nhà cung cấp và chi phí với tối đa 20 bản ghi mỗi trang.
4. Tất cả trang phân trang PHẢI hiển thị: tổng số bản ghi, trang hiện tại, tổng số trang và các nút điều hướng (trang trước, trang sau, nhảy đến trang).

---

### Yêu Cầu 24: Dashboard Tổng Quan Admin

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn có trang tổng quan với các chỉ số kinh doanh quan trọng để nắm bắt tình hình nhanh mà không cần vào từng trang riêng lẻ.

#### Tiêu Chí Chấp Nhận

1. Hệ Thống PHẢI hiển thị trang tổng quan ngay sau khi Quản Trị Viên đăng nhập với các chỉ số: doanh thu hôm nay, số đơn hàng chờ duyệt, số sản phẩm dưới ngưỡng tồn kho tối thiểu và tổng doanh thu tháng hiện tại.
2. Hệ Thống PHẢI hiển thị danh sách 5 đơn hàng mới nhất cần xử lý trên trang tổng quan.
3. Hệ Thống PHẢI hiển thị danh sách các sản phẩm đang dưới ngưỡng tồn kho tối thiểu trên trang tổng quan.
4. Hệ Thống PHẢI hiển thị biểu đồ doanh thu 7 ngày gần nhất trên trang tổng quan.
5. KHI Quản Trị Viên nhấn vào một chỉ số trên trang tổng quan, Hệ Thống PHẢI chuyển hướng đến trang chi tiết tương ứng.

---

### Yêu Cầu 25: Upload Hình Ảnh Sản Phẩm

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn upload hình ảnh thực tế cho sản phẩm để khách hàng có thể xem trước khi mua.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Sản_Phẩm PHẢI cho phép Quản Trị Viên upload tối đa 5 hình ảnh cho mỗi sản phẩm với định dạng JPG, PNG hoặc WEBP.
2. KHI Quản Trị Viên upload hình ảnh vượt quá 5MB mỗi file, Dịch_Vụ_Sản_Phẩm PHẢI hiển thị lỗi "Kích thước file không được vượt quá 5MB".
3. Dịch_Vụ_Sản_Phẩm PHẢI tự động nén và tạo thumbnail cho hình ảnh được upload để tối ưu tốc độ tải trang.
4. KHI Quản Trị Viên xóa hình ảnh sản phẩm, Dịch_Vụ_Sản_Phẩm PHẢI xóa cả file gốc và thumbnail khỏi server.

---

### Yêu Cầu 26: Xuất PDF Phiếu Kho và Hóa Đơn

**Câu chuyện người dùng:** Là Quản Trị Viên, tôi muốn xuất phiếu nhập/xuất kho và hóa đơn VAT ra file PDF để in ấn và lưu trữ.

#### Tiêu Chí Chấp Nhận

1. Dịch_Vụ_Kho PHẢI cho phép Quản Trị Viên xuất Phiếu Nhập Kho hoặc Phiếu Xuất Kho ra file PDF với đầy đủ thông tin: mã phiếu, ngày tạo, danh sách sản phẩm, số lượng, đơn giá, tổng tiền và chữ ký người lập phiếu.
2. Dịch_Vụ_Đơn_Hàng PHẢI cho phép Quản Trị Viên xuất Hóa Đơn VAT ra file PDF với đầy đủ thông tin theo quy định: tên công ty, mã số thuế, địa chỉ, danh sách hàng hóa, thuế suất và tổng tiền.
3. KHI Quản Trị Viên nhấn xuất PDF, Hệ Thống PHẢI tạo và tải file PDF về máy trong vòng 3 giây.
