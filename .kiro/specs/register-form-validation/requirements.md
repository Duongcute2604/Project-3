# Requirements Document

## Introduction

Tính năng này bổ sung validation toàn diện cho form đăng ký tài khoản (`register.html`) trong hệ thống quản lý kho giấy. Hiện tại form chỉ kiểm tra email có chứa `@` và `.`, và không kiểm tra độ mạnh mật khẩu. Mục tiêu là nâng cấp validation phía client (real-time feedback) và phía server (backend guard), đảm bảo dữ liệu đầu vào hợp lệ trước khi lưu vào cơ sở dữ liệu.

## Glossary

- **RegisterForm**: Component React trong `register.html` xử lý giao diện và logic đăng ký.
- **Validator**: Module/hàm thực hiện kiểm tra tính hợp lệ của dữ liệu đầu vào.
- **PasswordStrengthIndicator**: Thành phần UI hiển thị mức độ mạnh của mật khẩu theo thời gian thực.
- **EmailRegex**: Biểu thức chính quy chuẩn RFC 5322 dùng để kiểm tra định dạng email.
- **StrongPassword**: Mật khẩu đáp ứng tối thiểu: 8 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
- **BackendValidator**: Logic kiểm tra đầu vào trong `backend/routes/auth.js` trước khi ghi vào DB.
- **InlineError**: Thông báo lỗi hiển thị ngay dưới trường input tương ứng.

---

## Requirements

### Requirement 1: Kiểm tra định dạng email hợp lệ

**User Story:** Là người dùng, tôi muốn được thông báo ngay khi nhập email sai định dạng, để tôi có thể sửa trước khi submit form.

#### Acceptance Criteria

1. WHEN người dùng rời khỏi trường email (blur event), THE RegisterForm SHALL kiểm tra email theo EmailRegex và hiển thị InlineError nếu không hợp lệ.
2. WHEN người dùng submit form với email không hợp lệ, THE Validator SHALL ngăn submit và hiển thị thông báo "Email không đúng định dạng".
3. THE Validator SHALL chấp nhận email hợp lệ theo định dạng `local@domain.tld` trong đó `domain` có ít nhất một dấu chấm và `tld` có ít nhất 2 ký tự.
4. IF email đã tồn tại trong hệ thống, THEN THE BackendValidator SHALL trả về HTTP 409 với message "Email đã được đăng ký".
5. WHEN người dùng sửa lại trường email sau khi có lỗi, THE RegisterForm SHALL xóa InlineError của trường email ngay lập tức.

---

### Requirement 2: Kiểm tra độ mạnh mật khẩu

**User Story:** Là người dùng, tôi muốn biết mật khẩu của mình có đủ mạnh không ngay khi đang nhập, để tôi tạo được tài khoản an toàn.

#### Acceptance Criteria

1. WHEN người dùng nhập vào trường password, THE PasswordStrengthIndicator SHALL hiển thị mức độ mạnh theo thời gian thực với 3 mức: "Yếu" (đỏ), "Trung bình" (vàng), "Mạnh" (xanh).
2. THE Validator SHALL đánh giá mật khẩu là "Yếu" khi ít hơn 8 ký tự hoặc chỉ có một loại ký tự.
3. THE Validator SHALL đánh giá mật khẩu là "Trung bình" khi có ít nhất 8 ký tự và đáp ứng 2 trong 4 tiêu chí: chữ hoa, chữ thường, chữ số, ký tự đặc biệt.
4. THE Validator SHALL đánh giá mật khẩu là "Mạnh" khi có ít nhất 8 ký tự và đáp ứng đủ 4 tiêu chí: chữ hoa, chữ thường, chữ số, ký tự đặc biệt.
5. WHEN người dùng submit form với mật khẩu "Yếu", THE RegisterForm SHALL ngăn submit và hiển thị InlineError "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt".
6. THE BackendValidator SHALL từ chối mật khẩu có độ dài dưới 8 ký tự và trả về HTTP 400 với message "Mật khẩu phải có ít nhất 8 ký tự".

---

### Requirement 3: Xác nhận mật khẩu khớp nhau

**User Story:** Là người dùng, tôi muốn được cảnh báo ngay khi mật khẩu xác nhận không khớp, để tránh đăng ký nhầm mật khẩu.

#### Acceptance Criteria

1. WHEN người dùng rời khỏi trường confirmPassword, THE RegisterForm SHALL so sánh giá trị với trường password và hiển thị InlineError "Mật khẩu xác nhận không khớp" nếu khác nhau.
2. WHEN người dùng submit form với confirmPassword không khớp password, THE Validator SHALL ngăn submit.
3. WHEN người dùng cập nhật trường password sau khi đã nhập confirmPassword, THE RegisterForm SHALL tự động kiểm tra lại sự khớp nhau và cập nhật trạng thái InlineError của confirmPassword.

---

### Requirement 4: Kiểm tra số điện thoại hợp lệ

**User Story:** Là người dùng, tôi muốn được thông báo khi số điện thoại nhập sai định dạng, để đảm bảo thông tin liên lạc chính xác.

#### Acceptance Criteria

1. WHEN người dùng rời khỏi trường phone, THE RegisterForm SHALL kiểm tra số điện thoại và hiển thị InlineError nếu không hợp lệ.
2. THE Validator SHALL chấp nhận số điện thoại Việt Nam hợp lệ: bắt đầu bằng `0` hoặc `+84`, theo sau là 9 chữ số, tổng 10-11 ký tự số.
3. IF trường phone để trống, THEN THE RegisterForm SHALL không hiển thị lỗi (phone là trường tùy chọn).
4. WHEN người dùng submit form với phone không rỗng và không hợp lệ, THE Validator SHALL ngăn submit và hiển thị thông báo "Số điện thoại không hợp lệ".

---

### Requirement 5: Hiển thị lỗi inline theo từng trường

**User Story:** Là người dùng, tôi muốn thấy lỗi ngay dưới trường bị sai thay vì một thông báo chung, để biết chính xác cần sửa gì.

#### Acceptance Criteria

1. THE RegisterForm SHALL hiển thị InlineError ngay bên dưới mỗi trường input tương ứng thay vì hiển thị tất cả lỗi trong một alert chung.
2. WHEN một trường input có lỗi, THE RegisterForm SHALL thêm class CSS `input-error` vào thẻ `<input>` đó để hiển thị viền đỏ.
3. WHEN một trường input hợp lệ sau khi đã có lỗi, THE RegisterForm SHALL xóa class `input-error` và ẩn InlineError của trường đó.
4. THE RegisterForm SHALL vô hiệu hóa nút "Đăng Ký" khi bất kỳ trường bắt buộc nào (full_name, email, password, confirmPassword) đang có lỗi validation.

---

### Requirement 6: Validation phía backend (BackendValidator)

**User Story:** Là quản trị viên hệ thống, tôi muốn backend luôn kiểm tra dữ liệu đầu vào độc lập với frontend, để đảm bảo tính toàn vẹn dữ liệu ngay cả khi client bị bypass.

#### Acceptance Criteria

1. WHEN `POST /api/auth/register` nhận request thiếu `full_name`, `email` hoặc `password`, THE BackendValidator SHALL trả về HTTP 400 với message mô tả trường còn thiếu.
2. WHEN `POST /api/auth/register` nhận `email` không đúng định dạng, THE BackendValidator SHALL trả về HTTP 400 với message "Email không đúng định dạng".
3. WHEN `POST /api/auth/register` nhận `password` có độ dài dưới 8 ký tự, THE BackendValidator SHALL trả về HTTP 400 với message "Mật khẩu phải có ít nhất 8 ký tự".
4. WHEN `POST /api/auth/register` nhận `phone` không rỗng và không hợp lệ, THE BackendValidator SHALL trả về HTTP 400 với message "Số điện thoại không hợp lệ".
5. FOR ALL request hợp lệ, THE BackendValidator SHALL cho phép xử lý tiếp và lưu user vào database với mật khẩu đã được hash bằng bcrypt.
