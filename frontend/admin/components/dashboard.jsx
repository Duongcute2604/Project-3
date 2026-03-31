// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/reports/dashboard')
      .then(r => {
        // API trả về r.data trực tiếp (không có wrapper .data)
        const d = r.data;
        setStats({
          today_revenue:      d.today_revenue      || 0,
          pending_orders:     d.pending_orders      || d.total_orders || 0,
          low_stock_count:    d.low_stock_count     || 0,
          month_revenue:      d.month_revenue       || d.total_revenue || 0,
          recent_orders:      d.recent_orders       || [],
          low_stock_products: d.low_stock_products  || [],
          revenue_7days:      d.revenue_7days       || [],
        });
      })
      .catch(() => setStats({
        today_revenue: 12500000,
        pending_orders: 5,
        low_stock_count: 3,
        month_revenue: 185000000,
        recent_orders: [
          { id: 1, code: 'DH001', customer: 'Nguyễn Văn A', total: 2500000, status: 'pending',   created_at: new Date() },
          { id: 2, code: 'DH002', customer: 'Trần Thị B',   total: 4800000, status: 'approved',  created_at: new Date() },
          { id: 3, code: 'DH003', customer: 'Lê Văn C',     total: 1200000, status: 'shipping',  created_at: new Date() },
          { id: 4, code: 'DH004', customer: 'Phạm Thị D',   total: 3600000, status: 'completed', created_at: new Date() },
          { id: 5, code: 'DH005', customer: 'Hoàng Văn E',  total: 900000,  status: 'cancelled', created_at: new Date() },
        ],
        low_stock_products: [
          { name: 'Giấy In A4 80gsm', quantity: 20, min_stock: 50, unit: 'ream' },
          { name: 'Lõi Ống 3 Inch',   quantity: 45, min_stock: 100, unit: 'cuộn' },
          { name: 'Vải Vụn Cotton',    quantity: 80, min_stock: 200, unit: 'kg' },
        ],
        revenue_7days: [
          { date: '18/06', revenue: 8200000 },
          { date: '19/06', revenue: 15400000 },
          { date: '20/06', revenue: 9800000 },
          { date: '21/06', revenue: 22100000 },
          { date: '22/06', revenue: 18500000 },
          { date: '23/06', revenue: 11200000 },
          { date: '24/06', revenue: 12500000 },
        ],
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">⏳ Đang tải dữ liệu...</div>;

  const maxRevenue = Math.max(...stats.revenue_7days.map(d => d.revenue));

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setPage('orders')}>
          <div className="stat-icon blue">💰</div>
          <div>
            <div className="stat-value">{utils.formatMoney(stats.today_revenue)}</div>
            <div className="stat-label">Doanh thu hôm nay</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => setPage('orders')}>
          <div className="stat-icon yellow">🕐</div>
          <div>
            <div className="stat-value">{stats.pending_orders}</div>
            <div className="stat-label">Đơn chờ duyệt</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => setPage('inventory')}>
          <div className="stat-icon red">⚠️</div>
          <div>
            <div className="stat-value">{stats.low_stock_count}</div>
            <div className="stat-label">Sản phẩm sắp hết</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => setPage('rpt-revenue')}>
          <div className="stat-icon green">📈</div>
          <div>
            <div className="stat-value">{utils.formatMoney(stats.month_revenue)}</div>
            <div className="stat-label">Doanh thu tháng này</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="chart-container">
          <div className="chart-title">📈 Doanh Thu 7 Ngày Gần Nhất</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '180px', padding: '0 8px' }}>
            {stats.revenue_7days.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '10px', color: '#9e9e9e', textAlign: 'center' }}>
                  {(d.revenue / 1000000).toFixed(1)}M
                </div>
                <div style={{
                  width: '100%',
                  height: `${(d.revenue / maxRevenue) * 130}px`,
                  background: 'linear-gradient(to top, #f44336, #ef9a9a)',
                  borderRadius: '4px 4px 0 0',
                  minHeight: '4px',
                  transition: 'height 0.3s'
                }}></div>
                <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{d.date}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>⚠️ Tồn Kho Thấp</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => setPage('inventory')}>Xem tất cả</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Sản phẩm</th><th>Tồn kho</th><th>Tối thiểu</th></tr></thead>
              <tbody>
                {stats.low_stock_products.map((p, i) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td><span className="badge badge-cancelled">{p.quantity} {p.unit}</span></td>
                    <td style={{ color: '#9e9e9e' }}>{p.min_stock} {p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>🛒 Đơn Hàng Mới Nhất</h3>
          <button className="btn btn-sm btn-secondary" onClick={() => setPage('orders')}>Xem tất cả</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead>
            <tbody>
              {stats.recent_orders.map(o => (
                <tr key={o.id}>
                  <td style={{ color: '#f44336', fontWeight: 600 }}>{o.code}</td>
                  <td>{o.customer}</td>
                  <td style={{ fontWeight: 600 }}>{utils.formatMoney(o.total)}</td>
                  <td><span className={`badge ${STATUS_MAP[o.status]?.cls}`}>{STATUS_MAP[o.status]?.label}</span></td>
                  <td style={{ color: '#9e9e9e' }}>{utils.formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
