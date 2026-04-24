// ============================================================
// CUSTOMER APP - Trang mua hàng CÔNG TY BK
// ============================================================

const { useState, useEffect, useCallback } = React;

// ---- Header ----
function CustomerHeader({ cartCount, setPage, currentPage }) {
  const user = auth.getUser();
  return (
    <header style={{
      background: '#1565c0',
      padding: '0 32px', height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 12px rgba(21,101,192,0.4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={() => window.location.href = '../index.html'}>
        <span style={{ fontSize: '22px' }}>🗃️</span>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: '18px', letterSpacing: '0.5px' }}>CÔNG TY BK</span>
      </div>

      <nav style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[
          { key: 'products', label: '🛍️ Sản Phẩm' },
          { key: 'orders',   label: '🛒 Giỏ Hàng' },
          ...(user ? [{ key: 'history', label: '📋 Đơn Hàng' }] : []),
        ].map(item => (
          <button key={item.key} onClick={() => setPage(item.key)} style={{
            background: currentPage === item.key ? 'rgba(255,255,255,0.2)' : 'transparent',
            border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '14px', fontWeight: 500,
            transition: 'background 0.2s', position: 'relative'
          }}>
            {item.label}
            {item.key === 'orders' && cartCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '6px',
                background: '#f44336', color: '#fff', borderRadius: '50%',
                width: '16px', height: '16px', fontSize: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
              }}>{cartCount}</span>
            )}
          </button>
        ))}

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)', margin: '0 8px' }} />

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
              padding: '6px 14px', color: '#fff', fontSize: '13px'
            }}>👤 {user.full_name}</div>
            <button onClick={() => auth.logout()} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'
            }}>Đăng Xuất</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="../login.html" style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff', padding: '7px 16px', borderRadius: '8px', fontSize: '13px',
              textDecoration: 'none', fontWeight: 500
            }}>Đăng Nhập</a>
            <a href="../register.html" style={{
              background: '#fff', color: '#1565c0',
              padding: '7px 16px', borderRadius: '8px', fontSize: '13px',
              textDecoration: 'none', fontWeight: 700
            }}>Đăng Ký</a>
          </div>
        )}
      </nav>
    </header>
  );
}

// ---- Trang sản phẩm ----
function ProductList({ onAddCart }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  useEffect(() => {
    axios.get('/api/categories').then(r => setCategories(r.data.data || r.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    axios.get('/api/products', { params: { search, category_id: catFilter, page, limit: LIMIT } })
      .then(r => {
        let data = r.data.data || r.data;
        // Nếu DB trống, bổ sung từ sessionStorage
        if (data.length === 0) {
          try {
            const local = JSON.parse(sessionStorage.getItem('products_local') || '[]');
            data = local.filter(p => {
              const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
              return matchSearch && p.is_visible !== false;
            });
          } catch {}
        }
        setItems(data);
        setTotal(r.data.total || data.length);
      })
      .catch(() => {
        try {
          const local = JSON.parse(sessionStorage.getItem('products_local') || '[]');
          const filtered = local.filter(p => {
            const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
            return matchSearch && p.is_visible !== false;
          });
          setItems(filtered);
          setTotal(filtered.length);
        } catch { setItems([]); setTotal(0); }
      })
      .finally(() => setLoading(false));
  }, [search, catFilter, page]);

  useEffect(() => { load(); }, [load]);

  const BG_COLORS = ['#e3f2fd','#e8f5e9','#fff3e0','#f3e5f5','#e0f2f1','#fff8e1','#fce4ec','#e8eaf6'];
  const ICONS = ['📄','🗞️','📋','🖼️','🧻','🧵','📦','🎯'];

  return (
    <div style={{ background: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1565c0, #1976d2)',
        padding: '32px', color: '#fff', textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>🛍️ Danh Mục Sản Phẩm</h2>
        <p style={{ opacity: 0.85, fontSize: '15px' }}>Giấy khổ lớn, lõi ống, vải vụn chất lượng cao</p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Filter bar */}
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '16px 20px',
          display: 'flex', gap: '12px', marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
            <input
              placeholder="Tìm sản phẩm theo tên, mã..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%', padding: '10px 12px 10px 38px',
                border: '1.5px solid #e0e0e0', borderRadius: '8px',
                fontSize: '14px', outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#1565c0'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
          <select
            value={catFilter}
            onChange={e => { setCatFilter(e.target.value); setPage(1); }}
            style={{
              padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: '8px',
              fontSize: '14px', background: '#fff', cursor: 'pointer', minWidth: '160px'
            }}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ color: '#9e9e9e', fontSize: '13px', alignSelf: 'center' }}>
            {total > 0 ? `${total} sản phẩm` : ''}
          </div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#9e9e9e' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px', background: '#fff',
            borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
            <h3 style={{ color: '#333', marginBottom: '8px' }}>Chưa có sản phẩm</h3>
            <p style={{ color: '#9e9e9e' }}>Vui lòng liên hệ để được tư vấn báo giá</p>
            <a href="../lien-he.html" style={{
              display: 'inline-block', marginTop: '16px',
              background: '#1565c0', color: '#fff', padding: '10px 24px',
              borderRadius: '8px', textDecoration: 'none', fontWeight: 600
            }}>📞 Liên Hệ Ngay</a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {items.map((p, idx) => {
              const bg = BG_COLORS[idx % BG_COLORS.length];
              const icon = ICONS[idx % ICONS.length];
              const inStock = p.inventory?.quantity > 0;
              return (
                <div key={p.id} style={{
                  background: '#fff', borderRadius: '14px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                  overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
                  border: '1px solid #f0f0f0'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(21,101,192,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
                >
                  <div style={{ background: bg, height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' }}>
                    {icon}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#1565c0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      {p.code} · {p.category || 'Sản phẩm'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a1a', marginBottom: '6px', lineHeight: 1.4 }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '12px' }}>
                      Đơn vị: {p.unit} · Tồn kho: <span style={{ color: inStock ? '#2e7d32' : '#c62828', fontWeight: 600 }}>{p.inventory?.quantity ?? 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#1565c0', fontWeight: 800, fontSize: '16px' }}>{utils.formatMoney(p.price)}</span>
                      <button
                        onClick={() => onAddCart(p)}
                        disabled={!inStock}
                        style={{
                          background: inStock ? '#1565c0' : '#e0e0e0',
                          color: inStock ? '#fff' : '#9e9e9e',
                          border: 'none', borderRadius: '8px', padding: '8px 14px',
                          fontSize: '13px', fontWeight: 600, cursor: inStock ? 'pointer' : 'not-allowed',
                          transition: 'background 0.2s'
                        }}
                      >
                        {inStock ? '🛒 Thêm vào giỏ' : 'Hết hàng'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{
              padding: '8px 16px', border: '1px solid #e0e0e0', borderRadius: '8px',
              background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#333'
            }}>‹ Trước</button>
            <span style={{ padding: '8px 16px', background: '#1565c0', color: '#fff', borderRadius: '8px', fontWeight: 600 }}>
              {page} / {Math.ceil(total / LIMIT)}
            </span>
            <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)} style={{
              padding: '8px 16px', border: '1px solid #e0e0e0', borderRadius: '8px',
              background: '#fff', cursor: page >= Math.ceil(total / LIMIT) ? 'not-allowed' : 'pointer', color: '#333'
            }}>Sau ›</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Giỏ hàng ----
function Cart({ cart, onUpdate, onRemove, onCheckout }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div style={{ background: '#f5f7fa', minHeight: 'calc(100vh - 64px)', padding: '32px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', marginBottom: '24px' }}>🛒 Giỏ Hàng</h2>

        {cart.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '64px',
            textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
            <h3 style={{ color: '#333', marginBottom: '8px' }}>Giỏ hàng trống</h3>
            <p style={{ color: '#9e9e9e', marginBottom: '20px' }}>Hãy thêm sản phẩm vào giỏ hàng</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  background: '#fff', borderRadius: '12px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '32px', width: '48px', textAlign: 'center' }}>📦</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '15px' }}>{item.name}</div>
                    <div style={{ color: '#9e9e9e', fontSize: '12px', marginTop: '2px' }}>{item.code} · {item.unit}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => onUpdate(item.id, item.qty - 1)} style={{
                      width: '32px', height: '32px', border: '1px solid #e0e0e0', borderRadius: '8px',
                      background: '#f5f5f5', cursor: 'pointer', fontSize: '16px', fontWeight: 700
                    }}>−</button>
                    <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 700, fontSize: '15px' }}>{item.qty}</span>
                    <button onClick={() => onUpdate(item.id, item.qty + 1)} style={{
                      width: '32px', height: '32px', border: '1px solid #e0e0e0', borderRadius: '8px',
                      background: '#f5f5f5', cursor: 'pointer', fontSize: '16px', fontWeight: 700
                    }}>+</button>
                  </div>
                  <div style={{ color: '#1565c0', fontWeight: 800, fontSize: '16px', minWidth: '110px', textAlign: 'right' }}>
                    {utils.formatMoney(item.price * item.qty)}
                  </div>
                  <button onClick={() => onRemove(item.id)} style={{
                    background: '#ffebee', border: 'none', color: '#c62828',
                    width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px'
                  }}>✕</button>
                </div>
              ))}
            </div>

            <div style={{
              background: '#fff', borderRadius: '12px', padding: '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '16px' }}>
                <span style={{ color: '#666' }}>Tổng cộng ({cart.length} sản phẩm):</span>
                <span style={{ color: '#1565c0', fontWeight: 800, fontSize: '22px' }}>{utils.formatMoney(total)}</span>
              </div>
              <button onClick={onCheckout} style={{
                width: '100%', padding: '14px', background: '#1565c0', color: '#fff',
                border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 700,
                cursor: 'pointer', transition: 'background 0.2s'
              }}>✓ Đặt Hàng Ngay</button>
              <p style={{ textAlign: 'center', color: '#9e9e9e', fontSize: '12px', marginTop: '10px' }}>
                Chúng tôi sẽ liên hệ xác nhận đơn hàng trong vòng 24h
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Lịch sử đơn hàng ----
function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!auth.isLoggedIn()) { setLoading(false); return; }
    axios.get('/api/orders', { params: { limit: 50 } })
      .then(r => setOrders(r.data.data || r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = async (orderId) => {
    if (expanded === orderId) { setExpanded(null); return; }
    try {
      const r = await axios.get(`/api/orders/${orderId}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: r.data.items || [] } : o));
    } catch {}
    setExpanded(orderId);
  };

  const STATUS = {
    pending:   { label: 'Chờ duyệt',  bg: '#fff3e0', color: '#e65100' },
    approved:  { label: 'Đã duyệt',   bg: '#e3f2fd', color: '#1565c0' },
    shipping:  { label: 'Đang giao',  bg: '#f3e5f5', color: '#6a1b9a' },
    completed: { label: 'Hoàn thành', bg: '#e8f5e9', color: '#2e7d32' },
    cancelled: { label: 'Đã hủy',     bg: '#ffebee', color: '#c62828' },
  };

  const PAY = {
    unpaid:  { label: 'Chưa thanh toán', color: '#c62828' },
    partial: { label: 'TT một phần',     color: '#e65100' },
    paid:    { label: 'Đã thanh toán',   color: '#2e7d32' },
  };

  if (!auth.isLoggedIn()) return (
    <div style={{ background: '#f5f7fa', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', background: '#fff', padding: '48px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h3 style={{ color: '#333', marginBottom: '8px' }}>Vui lòng đăng nhập</h3>
        <p style={{ color: '#9e9e9e', marginBottom: '20px' }}>Đăng nhập để xem lịch sử đơn hàng</p>
        <a href="../login.html?redirect=1" style={{ background: '#1565c0', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>Đăng Nhập</a>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f5f7fa', minHeight: 'calc(100vh - 64px)', padding: '32px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', marginBottom: '24px' }}>📋 Lịch Sử Đơn Hàng</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9e9e9e' }}>⏳ Đang tải...</div>
        ) : orders.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '64px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: '#9e9e9e' }}>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map(o => {
              const s = STATUS[o.order_status] || { label: o.order_status, bg: '#f5f5f5', color: '#666' };
              const ps = PAY[o.payment_status] || { label: o.payment_status, color: '#666' };
              const isOpen = expanded === o.id;
              return (
                <div key={o.id} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                  {/* Header — click để mở chi tiết */}
                  <div onClick={() => loadDetail(o.id)} style={{
                    padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: isOpen ? '#f0f4ff' : '#fff',
                    borderBottom: isOpen ? '1px solid #e3f2fd' : 'none'
                  }}>
                    <div>
                      <span style={{ color: '#1565c0', fontWeight: 800, fontSize: '15px' }}>{o.code}</span>
                      <span style={{ color: '#9e9e9e', fontSize: '12px', marginLeft: '12px' }}>{utils.formatDate(o.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{utils.formatMoney(o.total_amount)}</span>
                      <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{s.label}</span>
                      <span style={{ color: ps.color, fontSize: '12px', fontWeight: 500 }}>{ps.label}</span>
                      <span style={{ color: '#9e9e9e' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Chi tiết sản phẩm */}
                  {isOpen && (
                    <div style={{ padding: '16px 20px' }}>
                      {o.items && o.items.length > 0 ? (
                        <>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#555', marginBottom: '10px' }}>📦 Sản phẩm đã đặt:</div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ background: '#f5f7fa' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Sản phẩm</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#666', fontWeight: 600 }}>ĐVT</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>SL</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Đơn giá</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.items.map((item, i) => (
                                <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.product_name}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#666' }}>{item.unit}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.quantity}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{utils.formatMoney(item.unit_price)}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1565c0' }}>{utils.formatMoney(item.total_price || item.quantity * item.unit_price)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ borderTop: '2px solid #e0e0e0', background: '#f8faff' }}>
                                <td colSpan="4" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#555' }}>Tổng cộng:</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#1565c0', fontSize: '15px' }}>{utils.formatMoney(o.total_amount)}</td>
                              </tr>
                            </tfoot>
                          </table>
                          {o.note && <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fff8e1', borderRadius: '8px', fontSize: '13px', color: '#666' }}>📝 {o.note}</div>}
                        </>
                      ) : (
                        <div style={{ color: '#9e9e9e', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Không có thông tin sản phẩm</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- APP ROOT ----
function CustomerApp() {
  const [page, setPage] = useState('products');
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const addToCart = (product) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`✅ Đã thêm "${product.name}" vào giỏ hàng`);
  };

  const updateCart = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id));
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    if (!auth.isLoggedIn()) {
      window.location.href = '../login.html?redirect=1';
      return;
    }
    const user = auth.getUser();
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    try {
      await axios.post('/api/orders', {
        customer_name:  user.full_name,
        customer_phone: user.phone || '',
        subtotal: total, total_amount: total,
        payment_method: 'transfer',
        items: cart.map(i => ({ product_id: i.id, product_name: i.name, unit: i.unit, quantity: i.qty, unit_price: i.price }))
      });
      setCart([]);
      showToast('✅ Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận sớm.');
      setPage('history');
    } catch {
      showToast('❌ Đặt hàng thất bại, vui lòng thử lại');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <CustomerHeader cartCount={cart.length} setPage={setPage} currentPage={page} />

      {toast && (
        <div style={{
          position: 'fixed', top: '76px', right: '20px', zIndex: 9999,
          background: toast.startsWith('✅') ? '#1b5e20' : '#b71c1c',
          color: '#fff', padding: '12px 20px', borderRadius: '10px',
          fontSize: '14px', fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          animation: 'slideIn 0.3s ease'
        }}>{toast}</div>
      )}

      {page === 'products' && <ProductList onAddCart={addToCart} />}
      {page === 'orders'   && <Cart cart={cart} onUpdate={updateCart} onRemove={id => updateCart(id, 0)} onCheckout={checkout} />}
      {page === 'history'  && <OrderHistory />}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

ReactDOM.render(<CustomerApp />, document.getElementById('root'));
