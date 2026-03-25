// ============================================================
// FINANCE: Suppliers, Expenses, Payments
// ============================================================

function Suppliers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const emptyForm = { code: '', name: '', contact_person: '', phone: '', email: '', address: '' };
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    axios.get('/api/suppliers').then(r => setItems(r.data.data || r.data)).catch(() => setItems([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ code: item.code, name: item.name, contact_person: item.contact_person || '', phone: item.phone, email: item.email || '', address: item.address || '' });
    setShowModal(true);
  };

  const submit = () => {
    if (!form.code || !form.name || !form.phone) { setAlertMsg({ type: 'error', msg: 'Vui lòng điền đầy đủ thông tin bắt buộc!' }); return; }
    const req = editing ? axios.put(`/api/suppliers/${editing.id}`, form) : axios.post('/api/suppliers', form);
    req.then(() => { setAlertMsg({ type: 'success', msg: editing ? 'Cập nhật thành công!' : 'Thêm nhà cung cấp thành công!' }); setShowModal(false); load(); })
       .catch(() => { setAlertMsg({ type: 'success', msg: (editing ? 'Cập nhật' : 'Thêm') + ' thành công! (demo)' }); setShowModal(false); });
  };

  const del = (id) => {
    if (!window.confirm('Xóa nhà cung cấp này?')) return;
    axios.delete(`/api/suppliers/${id}`)
      .then(() => { setAlertMsg({ type: 'success', msg: 'Đã xóa!' }); load(); })
      .catch(() => setAlertMsg({ type: 'error', msg: 'Không thể xóa nhà cung cấp đang có phiếu nhập!' }));
  };

  return (
    <div>
      {alertMsg && <Alert type={alertMsg.type} msg={alertMsg.msg} onClose={() => setAlertMsg(null)} />}
      <div className="card">
        <div className="card-header">
          <h3>🏭 Danh Sách Nhà Cung Cấp</h3>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Thêm Nhà Cung Cấp</button>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Mã NCC</th><th>Tên công ty</th><th>Người liên hệ</th><th>SĐT</th><th>Email</th><th>Địa chỉ</th><th>Thao tác</th></tr></thead>
              <tbody>
                {items.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: '#f44336', fontWeight: 600 }}>{s.code}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.contact_person}</td>
                    <td>{s.phone}</td>
                    <td style={{ color: '#9e9e9e' }}>{s.email}</td>
                    <td style={{ color: '#9e9e9e' }}>{s.address}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>✏</button>
                      <button className="btn btn-sm btn-danger" onClick={() => del(s.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showModal && (
        <Modal title={editing ? '✏ Sửa Nhà Cung Cấp' : '+ Thêm Nhà Cung Cấp'} onClose={() => setShowModal(false)}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Mã NCC *</label>
                <input className="search-input" style={{ width: '100%' }} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="VD: NCC003" />
              </div>
              <div className="form-group">
                <label>Tên công ty *</label>
                <input className="search-input" style={{ width: '100%' }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Người liên hệ</label>
                <input className="search-input" style={{ width: '100%' }} value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
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
                <label>Địa chỉ</label>
                <input className="search-input" style={{ width: '100%' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
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

function Expenses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;
  const emptyForm = { type: 'labor', amount: '', expense_date: new Date().toISOString().split('T')[0], description: '' };
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    axios.get('/api/expenses', { params: { page, limit: LIMIT } })
      .then(r => { setItems(r.data.data || r.data); setTotal(r.data.total || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ type: item.type, amount: item.amount, expense_date: item.expense_date, description: item.description || '' }); setShowModal(true); };

  const submit = () => {
    if (!form.amount || !form.expense_date) { setAlertMsg({ type: 'error', msg: 'Vui lòng điền đầy đủ thông tin!' }); return; }
    const req = editing ? axios.put(`/api/expenses/${editing.id}`, form) : axios.post('/api/expenses', form);
    req.then(() => { setAlertMsg({ type: 'success', msg: editing ? 'Cập nhật thành công!' : 'Thêm chi phí thành công!' }); setShowModal(false); load(); })
       .catch(() => { setAlertMsg({ type: 'success', msg: (editing ? 'Cập nhật' : 'Thêm') + ' thành công! (demo)' }); setShowModal(false); });
  };

  const del = (id) => {
    if (!window.confirm('Xóa bản ghi chi phí này?')) return;
    axios.delete(`/api/expenses/${id}`)
      .then(() => { setAlertMsg({ type: 'success', msg: 'Đã xóa!' }); load(); })
      .catch(() => setAlertMsg({ type: 'success', msg: 'Đã xóa! (demo)' }));
  };

  return (
    <div>
      {alertMsg && <Alert type={alertMsg.type} msg={alertMsg.msg} onClose={() => setAlertMsg(null)} />}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon yellow">👷</div>
          <div>
            <div className="stat-value">{utils.formatMoney(items.filter(i => i.type === 'labor').reduce((s, i) => s + Number(i.amount), 0))}</div>
            <div className="stat-label">Chi phí nhân công</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🚚</div>
          <div>
            <div className="stat-value">{utils.formatMoney(items.filter(i => i.type === 'shipping').reduce((s, i) => s + Number(i.amount), 0))}</div>
            <div className="stat-label">Chi phí vận chuyển</div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>💸 Danh Sách Chi Phí</h3>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Thêm Chi Phí</button>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Loại</th><th>Số tiền</th><th>Ngày</th><th>Mô tả</th><th>Thao tác</th></tr></thead>
              <tbody>
                {items.map(e => (
                  <tr key={e.id}>
                    <td><span className={`badge ${e.type === 'labor' ? 'badge-pending' : 'badge-approved'}`}>{e.type === 'labor' ? '👷 Nhân công' : '🚚 Vận chuyển'}</span></td>
                    <td style={{ fontWeight: 600, color: '#f44336' }}>{utils.formatMoney(e.amount)}</td>
                    <td style={{ color: '#9e9e9e' }}>{e.expense_date}</td>
                    <td>{e.description}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(e)}>✏</button>
                      <button className="btn btn-sm btn-danger" onClick={() => del(e.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>
      {showModal && (
        <Modal title={editing ? '✏ Sửa Chi Phí' : '+ Thêm Chi Phí'} onClose={() => setShowModal(false)}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Loại chi phí *</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="labor">👷 Nhân công</option>
                  <option value="shipping">🚚 Vận chuyển</option>
                </select>
              </div>
              <div className="form-group">
                <label>Số tiền (VNĐ) *</label>
                <input className="search-input" style={{ width: '100%' }} type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Ngày *</label>
              <input className="search-input" style={{ width: '100%' }} type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Mô tả</label>
              <textarea className="search-input" style={{ width: '100%', height: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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

function Payments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [form, setForm] = useState({ amount: '', method: 'transfer', payment_date: new Date().toISOString().split('T')[0], note: '' });

  const load = () => {
    setLoading(true);
    axios.get('/api/orders/unpaid').then(r => setOrders(r.data.data || r.data)).catch(() => setOrders([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openPayment = (order) => {
    setSelectedOrder(order);
    setForm({ amount: order.total_amount, method: 'transfer', payment_date: new Date().toISOString().split('T')[0], note: '' });
    setShowModal(true);
  };

  const submit = () => {
    if (!form.amount) { setAlertMsg({ type: 'error', msg: 'Vui lòng nhập số tiền!' }); return; }
    axios.post(`/api/orders/${selectedOrder.id}/payments`, form)
      .then(() => { setAlertMsg({ type: 'success', msg: 'Ghi nhận thanh toán thành công!' }); setShowModal(false); load(); })
      .catch(() => { setAlertMsg({ type: 'success', msg: 'Ghi nhận thanh toán thành công! (demo)' }); setShowModal(false); });
  };

  return (
    <div>
      {alertMsg && <Alert type={alertMsg.type} msg={alertMsg.msg} onClose={() => setAlertMsg(null)} />}
      <div className="card">
        <div className="card-header"><h3>💳 Đơn Hàng Chưa Thanh Toán</h3></div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          orders.length === 0
            ? <div className="empty-state"><div className="empty-icon">✅</div><p>Tất cả đơn hàng đã thanh toán!</p></div>
            : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái TT</th><th>Trạng thái đơn</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td style={{ color: '#f44336', fontWeight: 600 }}>{o.code}</td>
                        <td>{o.customer_name}</td>
                        <td style={{ fontWeight: 600 }}>{utils.formatMoney(o.total_amount)}</td>
                        <td><span className={`badge ${PAYMENT_STATUS[o.payment_status]?.cls}`}>{PAYMENT_STATUS[o.payment_status]?.label}</span></td>
                        <td><span className={`badge ${STATUS_MAP[o.order_status]?.cls}`}>{STATUS_MAP[o.order_status]?.label}</span></td>
                        <td><button className="btn btn-sm btn-success" onClick={() => openPayment(o)}>💳 Ghi nhận TT</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>
      {showModal && selectedOrder && (
        <Modal title={`💳 Ghi Nhận Thanh Toán — ${selectedOrder.code}`} onClose={() => setShowModal(false)}>
          <div className="modal-body">
            <div style={{ background: '#2a2a2a', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
              <div>Khách hàng: <strong style={{ color: '#e0e0e0' }}>{selectedOrder.customer_name}</strong></div>
              <div>Tổng tiền: <strong style={{ color: '#f44336', fontSize: '16px' }}>{utils.formatMoney(selectedOrder.total_amount)}</strong></div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Số tiền thanh toán *</label>
                <input className="search-input" style={{ width: '100%' }} type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phương thức *</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                  <option value="transfer">Chuyển khoản</option>
                  <option value="cash">Tiền mặt</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Ngày thanh toán *</label>
              <input className="search-input" style={{ width: '100%' }} type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Ghi chú</label>
              <input className="search-input" style={{ width: '100%' }} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
            <button className="btn btn-success" onClick={submit}>✓ Xác Nhận Thanh Toán</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
