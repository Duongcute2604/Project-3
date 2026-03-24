// ============================================================
// Auth utilities
// ============================================================

const auth = {
  // Kiểm tra đã đăng nhập chưa
  isLoggedIn() {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Lấy thông tin user hiện tại
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Lấy role của user
  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  // Kiểm tra có phải admin không
  isAdmin() {
    return this.getRole() === 'admin';
  },

  // Đăng xuất
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },

  // Kiểm tra quyền truy cập trang admin
  requireAdmin() {
    if (!this.isLoggedIn()) {
      alert('Vui lòng đăng nhập để tiếp tục');
      window.location.href = '/login.html';
      return false;
    }
    if (!this.isAdmin()) {
      alert('Bạn không có quyền truy cập trang này');
      window.location.href = '/customer/index.html';
      return false;
    }
    return true;
  },

  // Kiểm tra quyền truy cập trang customer
  requireAuth() {
    if (!this.isLoggedIn()) {
      alert('Vui lòng đăng nhập để tiếp tục');
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }
};
