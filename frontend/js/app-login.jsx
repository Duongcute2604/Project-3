// ============================================================
// LOGIN PAGE - CÔNG TY BK
// ============================================================

const { useState } = React;

const DEMO_ACCOUNTS = [
  { role: 'Admin',      email: 'admin@congty.com', password: '1', label: 'Quản trị viên' },
];

function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  // Xử lý auth state khi mount — chỉ chạy 1 lần
  React.useEffect(() => {
    if (!auth.isLoggedIn()) return;

    if (window.location.search.includes('redirect=1')) {
      // Bị redirect từ trang cần auth → về đúng trang
      window.location.href = auth.isAdmin() ? 'admin/index.html' : 'customer/index.html';
    } else {
      // Vào login chủ động → xóa token cũ (đăng xuất)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  const fill = (acc) => {
    setForm({ email: acc.email, password: acc.password });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', form);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = user.role === 'admin' ? 'admin/index.html' : 'customer/index.html';
    } catch (err) {
      // Fallback demo khi chưa có backend
      const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const registeredUser = demoUsers.find(u => u.email === form.email && u.password === form.password);
      if (registeredUser) {
        localStorage.setItem('token', 'demo-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(registeredUser));
        window.location.href = 'customer/index.html';
      } else {
        setError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {/* Logo */}
      <div className="logo">
        <div className="logo-icon">📦</div>
        <h1>CÔNG TY BK</h1>
        <p>Hệ thống quản lý kho giấy</p>
      </div>

      {/* Divider */}
      <div className="divider"><span>Đăng nhập tài khoản</span></div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">⚠ {error}</div>}

        <div className="form-group">
          <label>Email</label>
          <div className="input-wrap">
            <span className="input-icon">✉</span>
            <input
              type="email"
              value={form.email}
              onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }}
              placeholder="example@email.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Mật khẩu</label>
          <div className="input-wrap">
            <span className="input-icon">🔒</span>
            <input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
            <button type="button" className="toggle-pw" onClick={() => setShowPw(!showPw)}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-login" disabled={loading}>
          {loading
            ? <><span className="spinner"></span>Đang đăng nhập...</>
            : '→ Đăng Nhập'
          }
        </button>
      </form>

      {/* Demo accounts */}
      <div className="demo-box">
        <p>🔑 Tài khoản demo — click để điền nhanh</p>
        <div className="demo-accounts">
          {DEMO_ACCOUNTS.map((acc, i) => (
            <div key={i} className="demo-account" onClick={() => fill(acc)}>
              <div className="demo-account-info">
                <span className="demo-account-role">{acc.role}</span>
                <span className="demo-account-cred">{acc.email} / {acc.password}</span>
              </div>
              <button className="demo-fill-btn" onClick={e => { e.stopPropagation(); fill(acc); }}>
                Dùng →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="auth-links">
        <a href="register.html">Chưa có tài khoản? <span>Đăng ký ngay</span></a>
        <a href="index.html">← Về trang chủ</a>
      </div>
    </div>
  );
}

ReactDOM.render(<LoginPage />, document.getElementById('root'));
