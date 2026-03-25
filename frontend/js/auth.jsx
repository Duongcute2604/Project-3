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
    // Tìm đường dẫn tương đối về login.html
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
    window.location.href = prefix + 'login.html';
    // Không dùng ?redirect=1 khi logout — để trang login không tự redirect lại
  },

  // Kiểm tra quyền truy cập trang admin
  requireAdmin() {
    if (!this.isLoggedIn()) {
      alert('Vui lòng đăng nhập để tiếp tục');
      const depth = window.location.pathname.split('/').filter(Boolean).length;
      const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
      window.location.href = prefix + 'login.html?redirect=1';
      return false;
    }
    if (!this.isAdmin()) {
      alert('Bạn không có quyền truy cập trang này');
      window.location.href = '../customer/index.html';
      return false;
    }
    return true;
  },

  // Kiểm tra quyền truy cập trang customer
  requireAuth() {
    if (!this.isLoggedIn()) {
      alert('Vui lòng đăng nhập để tiếp tục');
      const depth = window.location.pathname.split('/').filter(Boolean).length;
      const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
      window.location.href = prefix + 'login.html?redirect=1';
      return false;
    }
    return true;
  }
};
