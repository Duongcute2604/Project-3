// ============================================================
// REPORTS: ReportRevenue, ReportExpense, ReportStock
// ============================================================

function ReportRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const load = () => {
    setLoading(true);
    axios.get('/api/reports/revenue', { params: { from, to } })
      .then(r => setData(r.data.data))
      .catch(() => setData({
        total_revenue: 185000000, total_orders: 42, completed_orders: 38,
        by_day: [
          { date: '01/06', revenue: 8200000 }, { date: '05/06', revenue: 15400000 },
          { date: '10/06', revenue: 22100000 }, { date: '15/06', revenue: 18500000 },
          { date: '20/06', revenue: 31200000 }, { date: '25/06', revenue: 28600000 },
          { date: '30/06', revenue: 12500000 },
        ],
      }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading">⏳ Đang tải...</div>;
  const maxRev = data ? Math.max(...data.by_day.map(d => d.revenue)) : 1;

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ color: '#9e9e9e', fontSize: '12px' }}>Từ ngày</label>
              <input className="search-input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ color: '#9e9e9e', fontSize: '12px' }}>Đến ngày</label>
              <input className="search-input" type="date" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={load} style={{ alignSelf: 'flex-end' }}>🔍 Xem báo cáo</button>
            <button className="btn btn-secondary" onClick={() => alert('Xuất CSV')} style={{ alignSelf: 'flex-end' }}>⬇ Xuất CSV</button>
          </div>
        </div>
      </div>
      {data && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card"><div className="stat-icon green">💰</div><div><div className="stat-value">{utils.formatMoney(data.total_revenue)}</div><div className="stat-label">Tổng doanh thu</div></div></div>
            <div className="stat-card"><div className="stat-icon blue">🛒</div><div><div className="stat-value">{data.total_orders}</div><div className="stat-label">Tổng đơn hàng</div></div></div>
            <div className="stat-card"><div className="stat-icon yellow">✅</div><div><div className="stat-value">{data.completed_orders}</div><div className="stat-label">Đơn hoàn thành</div></div></div>
          </div>
          <div className="chart-container">
            <div className="chart-title">📈 Doanh Thu Theo Ngày</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', padding: '0 8px' }}>
              {data.by_day.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ fontSize: '10px', color: '#9e9e9e' }}>{(d.revenue / 1000000).toFixed(1)}M</div>
                  <div style={{ width: '100%', height: `${(d.revenue / maxRev) * 160}px`, background: 'linear-gradient(to top, #f44336, #ef9a9a)', borderRadius: '4px 4px 0 0', minHeight: '4px' }}></div>
                  <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{d.date}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportExpense() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/reports/expenses')
      .then(r => setData(r.data.data))
      .catch(() => setData({
        total_labor: 15000000, total_shipping: 2800000, total: 17800000,
        items: [
          { type: 'labor',    amount: 5000000, expense_date: '2024-06-01', description: 'Luong thang 6' },
          { type: 'shipping', amount: 350000,  expense_date: '2024-06-20', description: 'Phi giao DH001' },
        ]
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">⏳ Đang tải...</div>;

  return (
    <div>
      {data && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
            <div className="stat-card"><div className="stat-icon yellow">👷</div><div><div className="stat-value">{utils.formatMoney(data.total_labor)}</div><div className="stat-label">Chi phí nhân công</div></div></div>
            <div className="stat-card"><div className="stat-icon blue">🚚</div><div><div className="stat-value">{utils.formatMoney(data.total_shipping)}</div><div className="stat-label">Chi phí vận chuyển</div></div></div>
            <div className="stat-card"><div className="stat-icon red">💸</div><div><div className="stat-value">{utils.formatMoney(data.total)}</div><div className="stat-label">Tổng chi phí</div></div></div>
          </div>
          <div className="card">
            <div className="card-header"><h3>📋 Chi Tiết Chi Phí</h3><button className="btn btn-sm btn-secondary" onClick={() => alert('Xuất CSV')}>⬇ Xuất CSV</button></div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Loại</th><th>Số tiền</th><th>Ngày</th><th>Mô tả</th></tr></thead>
                <tbody>
                  {data.items.map((e, i) => (
                    <tr key={i}>
                      <td><span className={`badge ${e.type === 'labor' ? 'badge-pending' : 'badge-approved'}`}>{e.type === 'labor' ? '👷 Nhân công' : '🚚 Vận chuyển'}</span></td>
                      <td style={{ fontWeight: 600, color: '#f44336' }}>{utils.formatMoney(e.amount)}</td>
                      <td style={{ color: '#9e9e9e' }}>{e.expense_date}</td>
                      <td>{e.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportStock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/reports/inventory')
      .then(r => setItems(r.data.data || r.data))
      .catch(() => setItems([
        { code: 'SP001', name: 'Giay In A4 80gsm',     quantity: 20,  unit: 'ream',  min_stock: 50,  price: 85000,  total_value: 1700000 },
        { code: 'SP002', name: 'Giay Kho Lon A0',      quantity: 150, unit: 'cuon',  min_stock: 30,  price: 320000, total_value: 48000000 },
        { code: 'SP003', name: 'Giay Anh Bong A4',     quantity: 200, unit: 'ream',  min_stock: 50,  price: 150000, total_value: 30000000 },
        { code: 'SP004', name: 'Loi Ong 3 Inch',       quantity: 45,  unit: 'cuon',  min_stock: 100, price: 12000,  total_value: 540000 },
        { code: 'SP005', name: 'Vai Vun Cotton',        quantity: 80,  unit: 'kg',    min_stock: 200, price: 25000,  total_value: 2000000 },
        { code: 'SP006', name: 'Giay Bia Cung 300gsm', quantity: 500, unit: 'to',    min_stock: 100, price: 5000,   total_value: 2500000 },
      ]))
      .finally(() => setLoading(false));
  }, []);

  const totalValue = items.reduce((s, i) => s + Number(i.total_value || 0), 0);
  const lowCount = items.filter(i => i.quantity < i.min_stock).length;

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
        <div className="stat-card"><div className="stat-icon blue">📦</div><div><div className="stat-value">{items.length}</div><div className="stat-label">Tổng sản phẩm</div></div></div>
        <div className="stat-card"><div className="stat-icon red">⚠️</div><div><div className="stat-value">{lowCount}</div><div className="stat-label">Sắp hết hàng</div></div></div>
        <div className="stat-card"><div className="stat-icon green">💰</div><div><div className="stat-value">{utils.formatMoney(totalValue)}</div><div className="stat-label">Tổng giá trị tồn kho</div></div></div>
      </div>
      <div className="card">
        <div className="card-header"><h3>📋 Báo Cáo Tồn Kho</h3><button className="btn btn-sm btn-secondary" onClick={() => alert('Xuất CSV')}>⬇ Xuất CSV</button></div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Tồn kho</th><th>Đơn vị</th><th>Tối thiểu</th><th>Giá trị tồn</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {items.map((item, i) => {
                  const isLow = item.quantity < item.min_stock;
                  return (
                    <tr key={i}>
                      <td style={{ color: '#f44336', fontWeight: 600 }}>{item.code}</td>
                      <td>{item.name}</td>
                      <td style={{ fontWeight: 600, color: isLow ? '#f44336' : '#66bb6a' }}>{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td style={{ color: '#9e9e9e' }}>{item.min_stock}</td>
                      <td style={{ fontWeight: 600 }}>{utils.formatMoney(item.total_value)}</td>
                      <td>{isLow ? <span className="badge badge-cancelled">⚠ Sắp hết</span> : <span className="badge badge-success">✓ Đủ hàng</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
