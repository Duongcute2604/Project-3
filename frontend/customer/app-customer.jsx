// ============================================================
// CUSTOMER APP - Trang mua hàng khách hàng
// ============================================================

const { useState, useEffect, useCallback } = React;

// Kiểm tra đăng nhập — chỉ cần khi đặt hàng, không cần khi xem sản phẩm
const currentUser = auth.getUser();

// ---- Header ----
function CustomerHeader({ cartCount, setPage }) {
  const user = auth.getUser();
  return (
    <header style={{
      background: '#1a1a1a', borderBottom: '1px solid #2a2a2a',
      padding: '0 24px', height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>🗃️</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>CÔNG TY BK</span>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setPage('products')}>🛍️ Sản phẩm</button>
        <button className="btn btn-secondary btn-sm" onClick={() => setPage('orders')} style={{ position: 'relative' }}>
          🛒 Giỏ hàng
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              background: '#f44336', color: '#fff', borderRadius: '50%',
              width: '18px', height: '18px', fontSize: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{cartCount}</span>
          )}
        </button>
        {user ? (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage('history')}>📋 Đơn hàng</button>
            <span style={{ color: '#9e9e9e', fontSize: '13px' }}>👤 {user.full_name}</span>
            <button className="btn btn-sm" style={{ background: '#333', color: '#ccc', border: '1px solid #444' }}
              onClick={() => auth.logout()}>⏻ Thoát</button>
          </>
        ) : (
          <>
            <a href="../login.html" className="btn btn-sm" style={{ background: '#1565c0', color: '#fff', border: 'none' }}>Đăng Nhập</a>
            <a href="../register.html" className="btn btn-sm" style={{ background: '#f44336', color: '#fff', border: 'none' }}>Đăng Ký</a>
          </>
        )}
      </div>
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
      .then(r => { setItems(r.data.data || r.data); setTotal(r.data.total || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [search, catFilter, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input className="search-input" placeholder="🔍 Tìm sản phẩm..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: '200px' }} />
        <select className="filter-select" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <div className="loading">⏳ Đang tải...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {items.length === 0
            ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#9e9e9e' }}>Không có sản phẩm</div>
            : items.map(p => (
              <div key={p.id} style={{
                background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '10px',
                padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div style={{ fontSize: '40px', textAlign: 'center', padding: '16px', background: '#2a2a2a', borderRadius: '8px' }}>📦</div>
                <div>
                  <div style={{ color: '#f44336', fontSize: '11px', fontWeight: 600 }}>{p.code}</div>
                  <div style={{ color: '#e0e0e0', fontWeight: 600, fontSize: '14px', marginTop: '4px' }}>{p.name}</div>
                  <div style={{ color: '#9e9e9e', fontSize: '12px', marginTop: '4px' }}>{p.category} · {p.unit}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#66bb6a', fontWeight: 700, fontSize: '15px' }}>{utils.formatMoney(p.price)}</span>
                  <span style={{ color: '#9e9e9e', fontSize: '12px' }}>Tồn: {p.inventory?.quantity ?? 0}</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => onAddCart(p)}
                  disabled={!p.inventory?.quantity}>
                  {p.inventory?.quantity ? '🛒 Thêm vào giỏ' : '❌ Hết hàng'}
                </button>
              </div>
            ))
          }
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          <span style={{ color: '#9e9e9e', padding: '6px 12px' }}>Trang {page} / {Math.ceil(total / LIMIT)}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}
    </div>
  );
}

// ---- Giỏ hàng ----
function Cart({ cart, onUpdate, onRemove, onCheckout }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (cart.length === 0) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#9e9e9e' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
      <p>Giỏ hàng trống</p>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <h3 style={{ color: '#e0e0e0', marginBottom: '20px' }}>🛒 Giỏ Hàng ({cart.length} sản phẩm)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {cart.map(item => (
          <div key={item.id} style={{
            background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '8px',
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e0e0e0', fontWeight: 600 }}>{item.name}</div>
              <div style={{ color: '#9e9e9e', fontSize: '12px' }}>{item.code} · {item.unit}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => onUpdate(item.id, item.qty - 1)}>−</button>
              <span style={{ color: '#e0e0e0', minWidth: '32px', textAlign: 'center' }}>{item.qty}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => onUpdate(item.id, item.qty + 1)}>+</button>
            </div>
            <div style={{ color: '#66bb6a', fontWeight: 600, minWidth: '100px', textAlign: 'right' }}>
              {utils.formatMoney(item.price * item.qty)}
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => onRemove(item.id)}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ color: '#9e9e9e' }}>Tổng cộng:</span>
          <span style={{ color: '#f44336', fontWeight: 700, fontSize: '18px' }}>{utils.formatMoney(total)}</span>
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onCheckout}>
          ✓ Đặt Hàng Ngay
        </button>
      </div>
    </div>
  );
}

// ---- Lịch sử đơn hàng ----
function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/orders', { params: { limit: 50 } })
      .then(r => setOrders(r.data.data || r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const STATUS = {
    pending:   { label: 'Chờ duyệt',  color: '#ffb74d' },
    approved:  { label: 'Đã duyệt',   color: '#42a5f5' },
    shipping:  { label: 'Đang giao',  color: '#ab47bc' },
    completed: { label: 'Hoàn thành', color: '#66bb6a' },
    cancelled: { label: 'Đã hủy',     color: '#ef5350' },
  };

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ color: '#e0e0e0', marginBottom: '20px' }}>📋 Lịch Sử Đơn Hàng</h3>
      {loading ? <div className="loading">⏳ Đang tải...</div> : (
        orders.length === 0
          ? <div style={{ textAlign: 'center', padding: '48px', color: '#9e9e9e' }}>Chưa có đơn hàng nào</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map(o => (
                <div key={o.id} style={{
                  background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#f44336', fontWeight: 700 }}>{o.code}</span>
                      <span style={{ color: '#9e9e9e', fontSize: '12px', marginLeft: '12px' }}>{utils.formatDate(o.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ color: '#66bb6a', fontWeight: 600 }}>{utils.formatMoney(o.total_amount)}</span>
                      <span style={{ color: STATUS[o.order_status]?.color, fontSize: '13px', fontWeight: 600 }}>
                        {STATUS[o.order_status]?.label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
}

// ---- APP ROOT ----
function CustomerApp() {
  const [page, setPage] = useState('products');
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState('');

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
    setAlert(`✅ Đã thêm "${product.name}" vào giỏ`);
    setTimeout(() => setAlert(''), 2500);
  };

  const updateCart = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id));
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const checkout = async () => {
    if (cart.length === 0) return;

    // Yêu cầu đăng nhập khi đặt hàng
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
        subtotal:       total,
        total_amount:   total,
        payment_method: 'transfer',
        items: cart.map(i => ({
          product_id:   i.id,
          product_name: i.name,
          unit:         i.unit,
          quantity:     i.qty,
          unit_price:   i.price,
        }))
      });
      setCart([]);
      setAlert('✅ Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận sớm.');
      setPage('history');
    } catch {
      setAlert('❌ Đặt hàng thất bại, vui lòng thử lại');
    }
    setTimeout(() => setAlert(''), 4000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#121212' }}>
      <CustomerHeader cartCount={cart.length} setPage={setPage} />
      {alert && (
        <div style={{
          position: 'fixed', top: '70px', right: '20px', zIndex: 999,
          background: alert.startsWith('✅') ? '#1b5e20' : '#b71c1c',
          color: '#fff', padding: '12px 20px', borderRadius: '8px',
          fontSize: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
        }}>{alert}</div>
      )}
      {page === 'products' && <ProductList onAddCart={addToCart} />}
      {page === 'orders'   && <Cart cart={cart} onUpdate={updateCart} onRemove={id => updateCart(id, 0)} onCheckout={checkout} />}
      {page === 'history'  && <OrderHistory />}
    </div>
  );
}

ReactDOM.render(<CustomerApp />, document.getElementById('root'));
