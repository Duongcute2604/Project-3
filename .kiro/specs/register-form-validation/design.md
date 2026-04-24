# Design Document: Register Form Validation

## Overview

Tính năng bổ sung validation toàn diện cho form đăng ký tài khoản trong hệ thống quản lý kho giấy. Hiện tại `register.html` chỉ kiểm tra email có chứa `@` và `.`, không kiểm tra độ mạnh mật khẩu, và không hiển thị lỗi inline theo từng trường.

Thiết kế tập trung vào hai lớp validation:
- **Client-side**: Real-time feedback ngay khi người dùng nhập/rời trường (blur/change events), hiển thị InlineError dưới từng trường.
- **Server-side**: BackendValidator trong `backend/routes/auth.js` kiểm tra độc lập, đảm bảo tính toàn vẹn dữ liệu kể cả khi client bị bypass.

Không dùng TypeScript, không có build tool — code viết thuần JSX chạy qua Babel standalone.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  register.html                      │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           RegisterPage (React)               │   │
│  │                                              │   │
│  │  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │  formState   │  │   fieldErrors state  │  │   │
│  │  └──────────────┘  └──────────────────────┘  │   │
│  │                                              │   │
│  │  ┌──────────────────────────────────────┐    │   │
│  │  │         validateField(name, value)   │    │   │
│  │  │         validateAll(formData)        │    │   │
│  │  │         getPasswordStrength(pw)      │    │   │
│  │  └──────────────────────────────────────┘    │   │
│  │                                              │   │
│  │  ┌──────────────────────────────────────┐    │   │
│  │  │  PasswordStrengthIndicator component │    │   │
│  │  └──────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         │ POST /api/auth/register
                         ▼
┌─────────────────────────────────────────────────────┐
│              backend/routes/auth.js                 │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           validateRegisterInput()            │   │
│  │  - required fields check                     │   │
│  │  - email format (RFC 5322 regex)             │   │
│  │  - password length >= 8                      │   │
│  │  - phone format (optional, VN pattern)       │   │
│  └──────────────────────────────────────────────┘   │
│                         │                           │
│                         ▼                           │
│              bcrypt.hash + INSERT users             │
└─────────────────────────────────────────────────────┘
```

Luồng xử lý:
1. Người dùng nhập vào trường → `onChange` xóa lỗi của trường đó.
2. Người dùng rời trường → `onBlur` gọi `validateField` → cập nhật `fieldErrors`.
3. Người dùng submit → `validateAll` kiểm tra toàn bộ → nếu có lỗi thì dừng, không gọi API.
4. Nếu client pass → gọi `POST /api/auth/register` → backend validate lại → trả lỗi hoặc tạo user.

---

## Components and Interfaces

### `validateField(name, value, formData)`

Hàm pure kiểm tra một trường đơn lẻ. Trả về chuỗi lỗi hoặc `''` nếu hợp lệ.

```js
// Trả về: string (thông báo lỗi) hoặc '' (hợp lệ)
function validateField(name, value, formData) { ... }
```

| Trường | Điều kiện lỗi | Thông báo |
|---|---|---|
| `full_name` | Rỗng hoặc chỉ khoảng trắng | "Vui lòng nhập họ và tên" |
| `email` | Rỗng | "Vui lòng nhập email" |
| `email` | Không khớp EmailRegex | "Email không đúng định dạng" |
| `phone` | Không rỗng và không khớp PhoneRegex | "Số điện thoại không hợp lệ" |
| `password` | Rỗng | "Vui lòng nhập mật khẩu" |
| `password` | Strength = "Yếu" | "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt" |
| `confirmPassword` | Không khớp `formData.password` | "Mật khẩu xác nhận không khớp" |

### `validateAll(formData)`

Gọi `validateField` cho tất cả các trường. Trả về object `{ fieldName: errorString }`. Dùng khi submit.

### `getPasswordStrength(password)`

Hàm pure, trả về `'weak' | 'medium' | 'strong'`.

```js
function getPasswordStrength(password) {
  // Đếm số tiêu chí đạt được trong 4 tiêu chí:
  // - có chữ hoa
  // - có chữ thường
  // - có chữ số
  // - có ký tự đặc biệt
  // Nếu < 8 ký tự hoặc chỉ 1 loại → 'weak'
  // Nếu >= 8 ký tự và đạt 2-3 tiêu chí → 'medium'
  // Nếu >= 8 ký tự và đạt đủ 4 tiêu chí → 'strong'
}
```

### `PasswordStrengthIndicator` component

```jsx
function PasswordStrengthIndicator({ password }) {
  const strength = getPasswordStrength(password);
  // Render thanh màu + label: Yếu/Trung bình/Mạnh
}
```

Hiển thị khi `password.length > 0`. Ẩn khi trường password rỗng.

### `validateRegisterInput(body)` — Backend

Hàm trong `backend/routes/auth.js`, kiểm tra request body trước khi xử lý:

```js
function validateRegisterInput({ full_name, email, phone, password }) {
  // Trả về { valid: false, status: 400, message: '...' }
  // hoặc { valid: true }
}
```

---

## Data Models

### FormState (client)

```js
{
  full_name: string,       // bắt buộc
  email: string,           // bắt buộc
  phone: string,           // tùy chọn
  password: string,        // bắt buộc
  confirmPassword: string  // bắt buộc, không gửi lên server
}
```

### FieldErrors (client)

```js
{
  full_name: string,       // '' = không có lỗi
  email: string,
  phone: string,
  password: string,
  confirmPassword: string
}
```

### Validation Rules

**EmailRegex** (RFC 5322 simplified):
```
/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
```
Yêu cầu: phần local không có khoảng trắng/@, có `@`, domain có ít nhất một dấu chấm, TLD ≥ 2 ký tự.

**PhoneRegex** (số điện thoại Việt Nam):
```
/^(0|\+84)[0-9]{9}$/
```
Chấp nhận: bắt đầu bằng `0` hoặc `+84`, theo sau là đúng 9 chữ số.

**PasswordStrength criteria**:
- Chữ hoa: `/[A-Z]/`
- Chữ thường: `/[a-z]/`
- Chữ số: `/[0-9]/`
- Ký tự đặc biệt: `/[^A-Za-z0-9]/`

### User (database — bảng `users`)

```sql
id          INT AUTO_INCREMENT PRIMARY KEY
full_name   VARCHAR(100) NOT NULL
email       VARCHAR(150) NOT NULL UNIQUE
phone       VARCHAR(15)  NULL
password    VARCHAR(255) NOT NULL  -- bcrypt hash
role        ENUM('admin','customer') DEFAULT 'customer'
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Backend Response Errors

| Tình huống | HTTP Status | Message |
|---|---|---|
| Thiếu `full_name` | 400 | "Vui lòng nhập họ và tên" |
| Thiếu `email` | 400 | "Vui lòng nhập email" |
| `email` sai định dạng | 400 | "Email không đúng định dạng" |
| Thiếu `password` | 400 | "Vui lòng nhập mật khẩu" |
| `password` < 8 ký tự | 400 | "Mật khẩu phải có ít nhất 8 ký tự" |
| `phone` không hợp lệ | 400 | "Số điện thoại không hợp lệ" |
| `email` đã tồn tại | 409 | "Email đã được đăng ký" |


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Email validation phân loại đúng valid/invalid

*For any* chuỗi email, `validateField('email', value)` phải trả về `''` khi email khớp pattern `local@domain.tld` (domain có dấu chấm, TLD ≥ 2 ký tự), và trả về chuỗi lỗi khác rỗng khi email không khớp pattern đó.

**Validates: Requirements 1.1, 1.2, 1.3**

---

### Property 2: Phân loại độ mạnh mật khẩu nhất quán

*For any* chuỗi mật khẩu, `getPasswordStrength(password)` phải trả về:
- `'weak'` khi độ dài < 8 hoặc chỉ đáp ứng ≤ 1 trong 4 tiêu chí (chữ hoa, chữ thường, chữ số, ký tự đặc biệt)
- `'medium'` khi độ dài ≥ 8 và đáp ứng đúng 2 hoặc 3 tiêu chí
- `'strong'` khi độ dài ≥ 8 và đáp ứng đủ 4 tiêu chí

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

### Property 3: Xác nhận mật khẩu khớp/không khớp

*For any* cặp giá trị `(password, confirmPassword)`, `validateField('confirmPassword', confirmPassword, { password })` phải trả về chuỗi lỗi khác rỗng khi `confirmPassword !== password`, và trả về `''` khi `confirmPassword === password`.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 4: Phone validation phân loại đúng valid/invalid

*For any* chuỗi phone không rỗng, `validateField('phone', value)` phải trả về `''` khi phone khớp pattern Việt Nam (`/^(0|\+84)[0-9]{9}$/`), và trả về chuỗi lỗi khác rỗng khi không khớp. Khi phone là chuỗi rỗng, hàm phải luôn trả về `''`.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

---

### Property 5: onChange xóa lỗi của trường tương ứng

*For any* trạng thái `fieldErrors` có lỗi ở bất kỳ trường nào, khi người dùng thay đổi giá trị của trường đó (onChange), `fieldErrors` của trường đó phải được reset về `''` ngay lập tức, bất kể giá trị mới là gì.

**Validates: Requirements 1.5, 3.3, 5.3**

---

### Property 6: Nút submit bị vô hiệu hóa khi có lỗi

*For any* trạng thái `fieldErrors` mà ít nhất một trong các trường bắt buộc (`full_name`, `email`, `password`, `confirmPassword`) có giá trị lỗi khác rỗng, nút "Đăng Ký" phải có thuộc tính `disabled`.

**Validates: Requirements 5.4**

---

### Property 7: BackendValidator từ chối input không hợp lệ

*For any* request body gửi đến `POST /api/auth/register`, hàm `validateRegisterInput` phải trả về `{ valid: false, status: 400 }` khi:
- Thiếu `full_name`, `email`, hoặc `password`
- `email` không khớp EmailRegex
- `password` có độ dài < 8
- `phone` không rỗng và không khớp PhoneRegex

Và phải trả về `{ valid: true }` khi tất cả các điều kiện trên đều được thỏa mãn.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

---

## Error Handling

### Client-side

| Tình huống | Xử lý |
|---|---|
| Backend trả về 409 (email trùng) | Hiển thị InlineError dưới trường email: "Email đã được đăng ký" |
| Backend trả về 400 | Hiển thị InlineError dưới trường tương ứng dựa vào message |
| Network error / backend không khả dụng | Fallback sang `localStorage` (demo_users) như hiện tại |
| Backend trả về 500 | Hiển thị thông báo chung: "Có lỗi xảy ra, vui lòng thử lại" |

### Server-side

- `validateRegisterInput` chạy trước mọi xử lý DB.
- Nếu validation fail → trả về ngay, không chạm đến DB.
- Nếu `bcrypt.hash` hoặc `db.query` throw → trả về 500 với message từ error.
- Không bao giờ trả về stack trace ra client.

---

## Testing Strategy

### Đánh giá PBT

Feature này có nhiều hàm pure (`validateField`, `getPasswordStrength`, `validateRegisterInput`) với input space lớn (chuỗi email, phone, password tùy ý). PBT phù hợp để kiểm tra các hàm này.

**PBT library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, không cần TypeScript).

**Test runner**: Jest (cần cài thêm vào project).

### Unit Tests (example-based)

Kiểm tra các trường hợp cụ thể và edge cases:

- `validateField('email', '')` → lỗi "Vui lòng nhập email"
- `validateField('email', 'test@example.com')` → `''`
- `validateField('phone', '')` → `''` (optional)
- `validateField('phone', '0901234567')` → `''`
- `validateField('phone', '123')` → lỗi
- `getPasswordStrength('abc')` → `'weak'`
- `getPasswordStrength('Abcdef1!')` → `'strong'`
- Backend: POST với email trùng → 409
- Backend: POST hợp lệ → 201 + user trong DB

### Property-Based Tests

Mỗi property test chạy tối thiểu 100 iterations. Tag format: `Feature: register-form-validation, Property N: <text>`.

```
// Feature: register-form-validation, Property 1: Email validation phân loại đúng valid/invalid
test('email validation classifies correctly', () => {
  fc.assert(fc.property(
    fc.emailAddress(),
    (email) => validateField('email', email) === ''
  ), { numRuns: 100 });
  fc.assert(fc.property(
    fc.string().filter(s => !EMAIL_REGEX.test(s) && s.length > 0),
    (email) => validateField('email', email) !== ''
  ), { numRuns: 100 });
});

// Feature: register-form-validation, Property 2: Phân loại độ mạnh mật khẩu nhất quán
// Feature: register-form-validation, Property 3: Xác nhận mật khẩu khớp/không khớp
// Feature: register-form-validation, Property 4: Phone validation phân loại đúng valid/invalid
// Feature: register-form-validation, Property 5: onChange xóa lỗi của trường tương ứng
// Feature: register-form-validation, Property 6: Nút submit bị vô hiệu hóa khi có lỗi
// Feature: register-form-validation, Property 7: BackendValidator từ chối input không hợp lệ
```

### Integration Tests

- POST `/api/auth/register` với email đã tồn tại → 409
- POST `/api/auth/register` với payload hợp lệ → 201, user được lưu với password hash

### Không cần test

- Layout/vị trí hiển thị InlineError (5.1) — kiểm tra thủ công
- Màu sắc PasswordStrengthIndicator — kiểm tra thủ công
