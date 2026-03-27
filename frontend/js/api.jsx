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
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect về trang login nếu không phải đang ở trang login/register
      const currentPath = window.location.pathname;
      if (!currentPath.includes('login') && !currentPath.includes('register') && !currentPath.includes('index.html')) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // Tính đường dẫn tương đối
        const parts = currentPath.replace(/\\/g, '/').split('/').filter(Boolean);
        const dirs = parts.slice(0, -1);
        const prefix = dirs.length > 0 ? '../'.repeat(dirs.length) : './';
        window.location.href = prefix + 'login.html?redirect=1';
      }
    }
    return Promise.reject(error);
  }
);
