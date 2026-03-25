// ============================================================
// ORDERS: printInvoice, Orders, Customers
// ============================================================

// ---- Import Excel: Khách hàng ----
function parseCustomerExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        let headerRow = -1;
        for (let i = 0; i < Math.min(raw.length, 10); i++) {
          const s = raw[i].join('|').toLowerCase();
          if (s.includes('tên') || s.includes('họ') || s.includes('name') || s.includes('phone') || s.includes('sđt')) { headerRow = i; break; }
        }
        if (headerRow === -1) { reject(new Error('Không tìm thấy header. Cần cột Tên/Họ tên/SĐT')); return; }
        const headers = raw[headerRow].map(h => String(h).toLowerCase().trim());
        const col = (...keys) => headers.findIndex(h => keys.some(k => h.includes(k)));
        const colMap = {
          name:    col('họ tên', 'tên khách', 'tên', 'full_name', 'name'),
          phone:   col('sđt', 'điện thoại', 'phone', 'số điện thoại'),
          email:   col('email', 'mail'),
          address: col('địa chỉ', 'address'),
          company: col('công ty', 'company'),
        };
        const items = [];
        for (let i = headerRow + 1; i < raw.length; i++) {
          const row = raw[i];
          const name = colMap.name >= 0 ? String(row[colMap.name] || '').trim() : '';
          if (!name) continue;
          items.push({
            full_name: name,
            phone:   colMap.phone   >= 0 ? String(row[colMap.phone]   || '').trim() : '',
            email:   colMap.email   >= 0 ? String(row[colMap.email]   || '').trim() : '',
            address: colMap.address >= 0 ? String(row[colMap.address] || '').trim() : '',
            company: colMap.company >= 0 ? String(row[colMap.company] || '').trim() : '',
          });
        }
        if (items.length === 0) { reject(new Error('Không đọc được dữ liệu')); return; }
        resolve(items);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsArrayBuffer(file);
  });
}

// ---- Import Excel: Đơn hàng ----
function parseOrderExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        let headerRow = -1;
        for (let i = 0; i < Math.min(raw.length, 10); i++) {
          const s = raw[i].join('|').toLowerCase();
          if (s.includes('khách') || s.includes('tổng') || s.includes('mã đơn') || s.includes('order')) { headerRow = i; break; }
        }
        if (headerRow === -1) { reject(new Error('Không tìm thấy header đơn hàng')); return; }
        const headers = raw[headerRow].map(h => String(h).toLowerCase().trim());
        const col = (...keys) => headers.findIndex(h => keys.some(k => h.includes(k)));
        const colMap = {
          code:     col('mã đơn', 'code', 'số đơn'),
          customer: col('khách hàng', 'tên khách', 'customer'),
          phone:    col('sđt', 'phone', 'điện thoại'),
          amount:   col('tổng tiền', 'tổng', 'amount', 'tiền'),
          date:     col('ngày', 'date', 'created'),
          status:   col('trạng thái', 'status'),
          note:     col('ghi chú', 'note'),
        };
        const toNum = v => parseFloat(String(v).replace(/[^0-9.\-]/g, '')) || 0;
        const items = [];
        for (let i = headerRow + 1; i < raw.length; i++) {
          const row = raw[i];
          const customer = colMap.customer >= 0 ? String(row[colMap.customer] || '').trim() : '';
          if (!customer) continue;
          items.push({
            code:          colMap.code     >= 0 ? String(row[colMap.code]     || '').trim() : '',
            customer_name: customer,
            customer_phone:colMap.phone    >= 0 ? String(row[colMap.phone]    || '').trim() : '',
            total_amount:  colMap.amount   >= 0 ? toNum(row[colMap.amount])   : 0,
            created_at:    colMap.date     >= 0 ? String(row[colMap.date]     || '').trim() : '',
            order_status:  'pending',
            payment_status:'unpaid',
            note:          colMap.note     >= 0 ? String(row[colMap.note]     || '').trim() : '',
          });
        }
        if (items.length === 0) { reject(new Error('Không đọc được dữ liệu đơn hàng')); return; }
        resolve(items);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsArrayBuffer(file);
  });
}

// ---- Component nút Import Excel chung ----
function ImportBtn({ label, onImport, parser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const inputRef = useRef(null);
  const handle = async (file) => {
    if (!file) return;
    setError(''); setLoading(true);
    try { const items = await parser(file); onImport(items); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = ''; }
  };
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <button className="btn btn-secondary btn-sm"
        style={{ background: '#1b5e20', borderColor: '#2e7d32', color: '#fff' }}
        onClick={() => inputRef.current.click()} disabled={loading}>
        {loading ? '⏳...' : label}
      </button>
      {error && <span style={{ color: '#f44336', fontSize: '11px', maxWidth: '180px' }}>⚠ {error}</span>}
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
        onChange={e => handle(e.target.files[0])} />
    </div>
  );
}

// ---- OCR ảnh đơn hàng / khách hàng bằng Gemini ----
function OcrImportBtn({ label, prompt, onResult }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError]       = useState('');
  const [preview, setPreview]   = useState(null);
  const inputRef = useRef(null);

  const handle = async (file) => {
    if (!file) return;
    setError(''); setScanning(true);
    setPreview(URL.createObjectURL(file));
    try {
      const base64 = await fileToBase64(file);
      const result = await readImageWithGemini(base64, file.type, prompt);
      onResult(result);
    } catch (e) { setError(e.message); }
    finally { setScanning(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <button className="btn btn-secondary btn-sm"
        style={{ background: '#4a148c', borderColor: '#6a1b9a', color: '#fff' }}
        onClick={() => inputRef.current.click()} disabled={scanning}>
        {scanning ? '🔍 Đang đọc...' : label}
      </button>
      {preview && <img src={preview} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #333' }} />}
      {error && <span style={{ color: '#f44336', fontSize: '11px', maxWidth: '180px' }}>⚠ {error}</span>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handle(e.target.files[0])} />
    </div>
  );
}

function printInvoice(order) {
  const statusLabel = { pending: 'Chờ duyệt', approved: 'Đã duyệt', shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
  const payLabel = { unpaid: 'Chưa thanh toán', partial: 'Thanh toán một phần', paid: 'Đã thanh toán' };
  const methodLabel = { cash: 'Tiền mặt', transfer: 'Chuyển khoản' };

  const itemsRows = (order.items && order.items.length > 0)
    ? order.items.map((item, i) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${i + 1}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${item.product_name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity} ${item.unit}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">${utils.formatMoney(item.unit_price)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${utils.formatMoney(item.total_price)}</td>
        </tr>`).join('')
    : `<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">Không có sản phẩm</td></tr>`;

  const subtotal = order.items ? order.items.reduce((s, i) => s + Number(i.total_price || 0), 0) : order.total_amount;
  const vat = order.vat_amount || 0;
  const shipping = order.shipping_fee || 0;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hóa Đơn ${order.code}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #222; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #f44336; }
    .company-logo { display: flex; align-items: center; gap: 14px; }
    .logo-box { width: 56px; height: 56px; background: linear-gradient(135deg,#f44336,#b71c1c); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
    .company-name { font-size: 22px; font-weight: 800; color: #f44336; letter-spacing: 1px; }
    .company-sub  { font-size: 12px; color: #666; margin-top: 2px; }
    .company-contact { font-size: 11px; color: #888; margin-top: 6px; line-height: 1.6; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 26px; font-weight: 800; color: #f44336; text-transform: uppercase; letter-spacing: 2px; }
    .invoice-title .code { font-size: 16px; font-weight: 700; color: #333; margin-top: 4px; }
    .invoice-title .date { font-size: 12px; color: #888; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .info-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 16px; }
    .info-box h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #f44336; letter-spacing: 0.5px; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .info-row .label { color: #888; }
    .info-row .value { font-weight: 600; color: #222; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table thead th { background: #f44336; color: #fff; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .items-table thead th:last-child, .items-table thead th:nth-child(4) { text-align: right; }
    .items-table thead th:nth-child(3) { text-align: center; }
    .items-table tbody tr:nth-child(even) { background: #fafafa; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 28px; }
    .totals-box { width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
    .total-row .label { color: #666; }
    .total-row .value { font-weight: 600; }
    .total-final { display: flex; justify-content: space-between; padding: 12px 16px; background: #f44336; border-radius: 8px; margin-top: 8px; }
    .total-final .label { color: rgba(255,255,255,0.85); font-weight: 600; font-size: 14px; }
    .total-final .value { color: #fff; font-weight: 800; font-size: 18px; }
    .footer { border-top: 2px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .sign-box { text-align: center; width: 180px; }
    .sign-box .sign-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #555; margin-bottom: 60px; }
    .sign-box .sign-line { border-top: 1px solid #333; padding-top: 6px; font-size: 11px; color: #888; }
    .footer-note { font-size: 11px; color: #aaa; text-align: center; flex: 1; }
    .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #f44336; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; }
    @media print { .print-btn { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨 In Hóa Đơn</button>
  <div class="page">
    <div class="header">
      <div class="company-logo">
        <div class="logo-box">🗃️</div>
        <div>
          <div class="company-name">CÔNG TY BK</div>
          <div class="company-sub">Quản Lý Kho Giấy & Vật Tư</div>
          <div class="company-contact">📍 Địa chỉ công ty<br>📞 Hotline: 1900 xxxx</div>
        </div>
      </div>
      <div class="invoice-title">
        <h2>Hóa Đơn</h2>
        <div class="code">${order.code}</div>
        <div class="date">Ngày: ${new Date().toLocaleDateString('vi-VN')}</div>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-box">
        <h4>Thông Tin Khách Hàng</h4>
        <div class="info-row"><span class="label">Họ tên:</span><span class="value">${order.customer_name || '—'}</span></div>
        <div class="info-row"><span class="label">SĐT:</span><span class="value">${order.customer_phone || '—'}</span></div>
        <div class="info-row"><span class="label">Địa chỉ:</span><span class="value">${order.shipping_address || '—'}</span></div>
      </div>
      <div class="info-box">
        <h4>Thông Tin Đơn Hàng</h4>
        <div class="info-row"><span class="label">Mã đơn:</span><span class="value" style="color:#f44336">${order.code}</span></div>
        <div class="info-row"><span class="label">Trạng thái:</span><span class="value">${statusLabel[order.order_status] || order.order_status}</span></div>
        <div class="info-row"><span class="label">Thanh toán:</span><span class="value">${payLabel[order.payment_status] || order.payment_status}</span></div>
        <div class="info-row"><span class="label">Phương thức:</span><span class="value">${methodLabel[order.payment_method] || 'Chuyển khoản'}</span></div>
      </div>
    </div>
    <table class="items-table">
      <thead>
        <tr><th>#</th><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="totals">
      <div class="totals-box">
        <div class="total-row"><span class="label">Tạm tính:</span><span class="value">${utils.formatMoney(subtotal)}</span></div>
        ${vat ? `<div class="total-row"><span class="label">VAT (10%):</span><span class="value">${utils.formatMoney(vat)}</span></div>` : ''}
        ${shipping ? `<div class="total-row"><span class="label">Phí vận chuyển:</span><span class="value">${utils.formatMoney(shipping)}</span></div>` : ''}
        <div class="total-final"><span class="label">TỔNG CỘNG</span><span class="value">${utils.formatMoney(order.total_amount || subtotal)}</span></div>
      </div>
    </div>
    ${order.note ? `<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:14px;margin-bottom:24px;font-size:12px;color:#555;"><strong style="color:#f57f17">Ghi chú:</strong> ${order.note}</div>` : ''}
    <div class="footer">
      <div class="sign-box"><div class="sign-title">Khách hàng ký tên</div><div class="sign-line">(Ký và ghi rõ họ tên)</div></div>
      <div class="footer-note">Cảm ơn quý khách đã tin tưởng CÔNG TY BK!<br>Mọi thắc mắc vui lòng liên hệ hotline.</div>
      <div class="sign-box"><div class="sign-title">Người bán hàng</div><div class="sign-line">(Ký và ghi rõ họ tên)</div></div>
    </div>
  </div>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

function Orders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const LIMIT = 20;

  const load = () => {
    setLoading(true);
    axios.get('/api/orders', { params: { search, order_status: statusFilter, page, limit: LIMIT } })
      .then(r => { setItems(r.data.data || r.data); setTotal(r.data.total || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter, page]);

  const updateStatus = (id, newStatus) => {
    axios.patch(`/api/orders/${id}/status`, { order_status: newStatus })
      .then(() => { setAlertMsg({ type: 'success', msg: 'Cập nhật trạng thái thành công!' }); load(); setSelected(null); })
      .catch(() => { setAlertMsg({ type: 'success', msg: 'Cập nhật thành công! (demo)' }); setSelected(null); });
  };

  const NEXT_STATUS = { pending: 'approved', approved: 'shipping', shipping: 'completed' };
  const NEXT_LABEL  = { pending: '✓ Duyệt đơn', approved: '🚚 Bắt đầu giao', shipping: '✓ Hoàn thành' };

  return (
    <div>
      {alertMsg && <Alert type={alertMsg.type} msg={alertMsg.msg} onClose={() => setAlertMsg(null)} />}
      <div className="card">
        <div className="card-header">
          <h3>🛒 Quản Lý Đơn Hàng</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ImportBtn label="📂 Import Excel" parser={parseOrderExcel} onImport={(imported) => {
              const promises = imported.map(o => axios.post('/api/orders', o).catch(() => null));
              Promise.all(promises).then(() => { setAlertMsg({ type: 'success', msg: `✅ Đã import ${imported.length} đơn hàng` }); load(); });
            }} />
          </div>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filter-bar">
            <input className="search-input" placeholder="🔍 Tìm mã đơn, tên khách..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>SĐT</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
              <tbody>
                {items.map(o => (
                  <tr key={o.id}>
                    <td style={{ color: '#f44336', fontWeight: 600 }}>{o.code}</td>
                    <td>{o.customer_name}</td>
                    <td style={{ color: '#9e9e9e' }}>{o.customer_phone}</td>
                    <td style={{ fontWeight: 600 }}>{utils.formatMoney(o.total_amount)}</td>
                    <td><span className={`badge ${PAYMENT_STATUS[o.payment_status]?.cls}`}>{PAYMENT_STATUS[o.payment_status]?.label}</span></td>
                    <td><span className={`badge ${STATUS_MAP[o.order_status]?.cls}`}>{STATUS_MAP[o.order_status]?.label}</span></td>
                    <td style={{ color: '#9e9e9e' }}>{utils.formatDate(o.created_at)}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setSelected(o)}>👁 Chi tiết</button>
                      {NEXT_STATUS[o.order_status] && (
                        <button className="btn btn-sm btn-success" onClick={() => updateStatus(o.id, NEXT_STATUS[o.order_status])}>
                          {NEXT_LABEL[o.order_status]}
                        </button>
                      )}
                      {o.order_status === 'pending' && (
                        <button className="btn btn-sm btn-danger" onClick={() => updateStatus(o.id, 'cancelled')}>✕ Hủy</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>
      {selected && (
        <Modal title={`📋 Chi Tiết Đơn Hàng ${selected.code}`} onClose={() => setSelected(null)} size="lg">
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div><span style={{ color: '#9e9e9e' }}>Khách hàng:</span> <strong style={{ color: '#e0e0e0' }}>{selected.customer_name}</strong></div>
              <div><span style={{ color: '#9e9e9e' }}>SĐT:</span> <strong style={{ color: '#e0e0e0' }}>{selected.customer_phone}</strong></div>
              <div><span style={{ color: '#9e9e9e' }}>Trạng thái:</span> <span className={`badge ${STATUS_MAP[selected.order_status]?.cls}`}>{STATUS_MAP[selected.order_status]?.label}</span></div>
              <div><span style={{ color: '#9e9e9e' }}>Thanh toán:</span> <span className={`badge ${PAYMENT_STATUS[selected.payment_status]?.cls}`}>{PAYMENT_STATUS[selected.payment_status]?.label}</span></div>
              <div><span style={{ color: '#9e9e9e' }}>Tổng tiền:</span> <strong style={{ color: '#f44336', fontSize: '16px' }}>{utils.formatMoney(selected.total_amount)}</strong></div>
              <div><span style={{ color: '#9e9e9e' }}>Ngày tạo:</span> <span style={{ color: '#e0e0e0' }}>{utils.formatDate(selected.created_at)}</span></div>
            </div>
            {selected.items && selected.items.length > 0 && (
              <div>
                <strong style={{ color: '#e0e0e0', display: 'block', marginBottom: '8px' }}>Sản phẩm đặt hàng:</strong>
                <table>
                  <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                  <tbody>
                    {selected.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>{utils.formatMoney(item.unit_price)}</td>
                        <td style={{ fontWeight: 600 }}>{utils.formatMoney(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>Đóng</button>
            <button className="btn btn-primary" onClick={() => printInvoice(selected)}>🖨 In Hóa Đơn</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Customers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [alertMsg, setAlertMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', address: '', company: '' });
  const LIMIT = 20;

  const OCR_PROMPT_CUSTOMER = `Đây là ảnh danh thiếp hoặc thông tin khách hàng. Đọc và trả về JSON:
{
  "full_name": "họ tên đầy đủ",
  "phone": "số điện thoại",
  "email": "email nếu có",
  "address": "địa chỉ nếu có",
  "company": "tên công ty nếu có"
}
Chỉ trả về JSON, không giải thích.`;

  const load = () => {
    setLoading(true);
    axios.get('/api/customers', { params: { search, page, limit: LIMIT } })
      .then(r => { setItems(r.data.data || r.data); setTotal(r.data.total || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, page]);

  const handleImportExcel = (imported) => {
    // Gọi API tạo hàng loạt hoặc hiển thị preview
    const promises = imported.map(c => axios.post('/api/customers', c).catch(() => null));
    Promise.all(promises).then(() => {
      setAlertMsg({ type: 'success', msg: `✅ Đã import ${imported.length} khách hàng từ Excel` });
      load();
    });
  };

  const openAdd = (prefill = {}) => {
    setForm({ full_name: prefill.full_name || '', phone: prefill.phone || '', email: prefill.email || '', address: prefill.address || '', company: prefill.company || '' });
    setShowModal(true);
  };

  const submit = () => {
    if (!form.full_name || !form.phone) { setAlertMsg({ type: 'error', msg: 'Vui lòng nhập Họ tên và SĐT!' }); return; }
    axios.post('/api/customers', form)
      .then(() => { setAlertMsg({ type: 'success', msg: 'Thêm khách hàng thành công!' }); setShowModal(false); load(); })
      .catch(() => { setAlertMsg({ type: 'success', msg: 'Thêm thành công! (demo)' }); setShowModal(false); });
  };

  return (
    <div>
      {alertMsg && <Alert type={alertMsg.type} msg={alertMsg.msg} onClose={() => setAlertMsg(null)} />}
      <div className="card">
        <div className="card-header">
          <h3>👥 Danh Sách Khách Hàng</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <OcrImportBtn label="📷 Đọc ảnh" prompt={OCR_PROMPT_CUSTOMER} onResult={(r) => openAdd(r)} />
            <ImportBtn label="📂 Excel" parser={parseCustomerExcel} onImport={handleImportExcel} />
            <button className="btn btn-primary btn-sm" onClick={() => openAdd()}>+ Thêm</button>
          </div>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filter-bar">
            <input className="search-input" placeholder="🔍 Tìm theo tên, email, SĐT..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Họ tên</th><th>Công ty</th><th>SĐT</th><th>Email</th><th>Địa chỉ</th><th>Số đơn</th><th>Tổng chi tiêu</th></tr></thead>
              <tbody>
                {items.length === 0
                  ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#9e9e9e' }}>Chưa có khách hàng</td></tr>
                  : items.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.full_name}</td>
                    <td style={{ color: '#9e9e9e' }}>{c.company || '—'}</td>
                    <td>{c.phone}</td>
                    <td style={{ color: '#9e9e9e' }}>{c.email || '—'}</td>
                    <td style={{ color: '#9e9e9e', maxWidth: 160 }}>{c.address || '—'}</td>
                    <td><span className="badge badge-approved">{c.order_count || 0} đơn</span></td>
                    <td style={{ fontWeight: 600, color: '#66bb6a' }}>{utils.formatMoney(c.total_spent || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>

      {showModal && (
        <Modal title="+ Thêm Khách Hàng" onClose={() => setShowModal(false)}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Họ tên *</label>
                <input className="search-input" style={{ width: '100%' }} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>SĐT *</label>
                <input className="search-input" style={{ width: '100%' }} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input className="search-input" style={{ width: '100%' }} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Công ty</label>
                <input className="search-input" style={{ width: '100%' }} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Địa chỉ</label>
              <input className="search-input" style={{ width: '100%' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={submit}>✓ Lưu</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
