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

  // Đăng xuất — về trang chủ
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Tìm vị trí 'frontend' trong path để tính đường về index.html
    const path = window.location.pathname.replace(/\\/g, '/');
    const frontendIdx = path.indexOf('/frontend/');
    if (frontendIdx !== -1) {
      // Đang trong thư mục frontend → về /frontend/index.html
      window.location.href = path.substring(0, frontendIdx) + '/frontend/index.html';
    } else {
      // Fallback: về login
      window.location.href = 'login.html';
    }
  },

  // Kiểm tra quyền truy cập trang admin
  requireAdmin() {
    if (!this.isLoggedIn()) {
      alert('Vui lòng đăng nhập để tiếp tục');
      const parts = window.location.pathname.replace(/\\/g, '/').split('/').filter(Boolean);
      const dirs = parts.slice(0, -1);
      const prefix = dirs.length > 0 ? '../'.repeat(dirs.length) : './';
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
      const parts = window.location.pathname.replace(/\\/g, '/').split('/').filter(Boolean);
      const dirs = parts.slice(0, -1);
      const prefix = dirs.length > 0 ? '../'.repeat(dirs.length) : './';
      window.location.href = prefix + 'login.html?redirect=1';
      return false;
    }
    return true;
  }
};
