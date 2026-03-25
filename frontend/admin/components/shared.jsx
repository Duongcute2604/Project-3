// ============================================================
// SHARED COMPONENTS - Modal, Pagination, Alert, Sidebar, Topbar
// ============================================================

function Modal({ title, onClose, children, size }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={size === 'lg' ? { maxWidth: '800px' } : {}}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Pagination({ page, total, limit, onPage }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  const pages = utils.getPageNumbers(page, totalPages);
  return (
    <div className="pagination">
      <span className="pagination-info">
        Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total} bản ghi
      </span>
      <div className="pagination-buttons">
        <button className="page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>‹</button>
        {pages.map(p => (
          <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
        ))}
        <button className="page-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}>›</button>
      </div>
    </div>
  );
}

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type}`} style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{msg}</span>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 18 }}>×</button>}
    </div>
  );
}

function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        🗃️ CÔNG TY BK
        <span style={{ fontSize: '11px', color: '#ef9a9a', marginLeft: 'auto' }}>ADMIN</span>
      </div>
      <nav className="sidebar-menu">
        {MENU.map((item, i) => {
          if (item.section !== undefined && !item.key) {
            return <div key={i} className="menu-section-title">{item.section}</div>;
          }
          return (
            <button key={item.key} className={`menu-item ${page === item.key ? 'active' : ''}`} onClick={() => setPage(item.key)}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{currentUser?.full_name?.[0] || 'A'}</div>
          <div>
            <div className="user-name">{currentUser?.full_name || 'Admin'}</div>
            <div className="user-role">Quản Trị Viên</div>
          </div>
        </div>
        <button className="btn-logout" onClick={() => auth.logout()}>⏻ Đăng Xuất</button>
      </div>
    </aside>
  );
}

function Topbar({ page }) {
  return (
    <div className="topbar">
      <h2>{PAGE_TITLES[page] || 'Admin'}</h2>
      <span style={{ fontSize: '13px', color: '#9e9e9e' }}>
        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </span>
    </div>
  );
}
