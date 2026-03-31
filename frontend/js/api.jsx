// ============================================================
// Axios instance với baseURL và interceptors
// ============================================================

// Cấu hình Axios
axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Request interceptor - tự động đính kèm JWT token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý lỗi 401 (token hết hạn)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      // Bỏ qua 401 từ API login (sai mật khẩu — để component tự xử lý)
      if (url.includes('/api/auth/')) {
        return Promise.reject(error);
      }
      // Chỉ redirect nếu đang ở trang admin/customer VÀ token là JWT thật (không phải demo)
      const token = localStorage.getItem('token') || '';
      const isRealJWT = token.split('.').length === 3; // JWT có 3 phần ngăn cách bởi dấu .
      if (isRealJWT) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const currentPath = window.location.pathname;
        const frontendIdx = currentPath.indexOf('/frontend/');
        const base = frontendIdx !== -1 ? currentPath.substring(0, frontendIdx) + '/frontend/' : './';
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = base + 'login.html?redirect=1';
      }
      // Demo token bị 401 → im lặng, để component fallback tự xử lý
    }
    return Promise.reject(error);
  }
);
