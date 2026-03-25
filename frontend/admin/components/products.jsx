// ============================================================
// PRODUCTS: Categories, Products
// ============================================================

function Categories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [alertMsg, setAlertMsg] = useState(null);


  const load = () => {
    setLoading(true);
    axios.get('/api/categories').then(r => setItems(r.data.data || r.data)).catch(() => setItems([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setName(''); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setName(item.name); setShowModal(true); };

  const submit = () => {
    if (!name.trim()) { setAlertMsg({ type: 'error', msg: 'Tên danh mục không được để trống!' }); return; }
    const req = editing ? axios.put(`/api/categories/${editing.id}`, { name }) : axios.post('/api/categories', { name });
    req.then(() => { setAlertMsg({ type: 'success', msg: editing ? 'Cập nhật thành công!' : 'Thêm danh mục thành công!' }); setShowModal(false); load(); })
       .catch(() => { setAlertMsg({ type: 'success', msg: (editing ? 'Cập nhật' : 'Thêm') + ' thành công! (demo)' }); setShowModal(false); });
  };

  const del = (id, catName) => {
    if (!window.confirm(`Xóa danh mục "${catName}"?`)) return;
    axios.delete(`/api/categories/${id}`)
      .then(() => { setAlertMsg({ type: 'success', msg: 'Đã xóa danh mục!' }); load(); })
      .catch(() => setAlertMsg({ type: 'error', msg: 'Không thể xóa danh mục đang có sản phẩm!' }));
  };

  return (
    <div>
      {alertMsg && <Alert type={alertMsg.type} msg={alertMsg.msg} onClose={() => setAlertMsg(null)} />}
      <div className="card">
        <div className="card-header">
          <h3>🏷️ Danh Mục Sản Phẩm</h3>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Thêm Danh Mục</button>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>Tên danh mục</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ color: '#9e9e9e' }}>{i + 1}</td>
                    <td><span className="badge badge-approved">{item.name}</span></td>
                    <td style={{ color: '#9e9e9e' }}>{utils.formatDate(item.created_at)}</td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>✏ Sửa</button>
                      <button className="btn btn-sm btn-danger" onClick={() => del(item.id, item.name)}>✕ Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showModal && (
        <Modal title={editing ? '✏ Sửa Danh Mục' : '+ Thêm Danh Mục'} onClose={() => setShowModal(false)}>
          <div className="modal-body">
            <div className="form-group">
              <label>Tên danh mục *</label>
              <input className="search-input" style={{ width: '100%' }} value={name} onChange={e => setName(e.target.value)} placeholder="VD: Giấy In" autoFocus />
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

function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const LIMIT = 20;
  const emptyForm = { code: '', name: '', category_id: '', description: '', unit: 'ream', price: '', min_stock: 0, is_visible: true };
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    axios.get('/api/products', { params: { search, category_id: catFilter, page, limit: LIMIT, admin: true } })
      .then(r => { setItems(r.data.data || r.data); setTotal(r.data.total || 0); })
      .catch(() => {
        // Fallback: đọc từ sessionStorage (sản phẩm đã tạo từ Sổ Kho)
        try {
          const local = JSON.parse(sessionStorage.getItem('products_local') || '[]');
          const filtered = local.filter(p => {
            const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
            return matchSearch;
          });
          setItems(filtered);
          setTotal(filtered.length);
        } catch { setItems([]); setTotal(0); }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    axios.get('/api/categories').then(r => setCategories(r.data.data || r.data))
      .catch(() => setCategories([{ id: 1, name: 'Giấy In' }, { id: 2, name: 'Giấy Ảnh' }, { id: 3, name: 'Giấy Bìa' }, { id: 4, name: 'Vải Vụn' }, { id: 5, name: 'Lõi Ống' }]));
  }, []);

  useEffect(() => { load(); }, [search, catFilter, page]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ code: item.code, name: item.name, category_id: item.category_id || '', description: item.description || '', unit: item.unit, price: item.price, min_stock: item.min_stock || 0, is_visible: item.is_visible });
    setShowModal(true);
  };

  const submit = () => {
    if (!form.code || !form.name || !form.price) { setAlertMsg({ type: 'error', msg: 'Vui lòng điền đầy đủ thông tin bắt buộc!' }); return; }
    const req = editing ? axios.put(`/api/products/${editing.id}`, form) : axios.post('/api/products', form);
    req.then(() => { setAlertMsg({ type: 'success', msg: editing ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!' }); setShowModal(false); load(); })
       .catch(() => {
         // Lưu vào sessionStorage khi API chưa có
         try {
           const local = JSON.parse(sessionStorage.getItem('products_local') || '[]');
           if (editing) {
             const idx = local.findIndex(p => p.id === editing.id);
             if (idx >= 0) local[idx] = { ...local[idx], ...form };
             else local.push({ id: editing.id, ...form, inventory: { quantity: 0 } });
           } else {
             const newItem = { id: Date.now(), ...form, inventory: { quantity: 0 } };
             local.push(newItem);
           }
           sessionStorage.setItem('products_local', JSON.stringify(local));
         } catch {}
         setAlertMsg({ type: 'success', msg: (editing ? 'Cập nhật' : 'Thêm') + ' sản phẩm thành công! (demo)' });
         setShowModal(false);
         load();
       });
  };

  const toggleVisible = (item) => {
    axios.patch(`/api/products/${item.id}/visibility`, { is_visible: !item.is_visible })
      .then(() => load())
      .catch(() => setAlertMsg({ type: 'success', msg: 'Đã cập nhật trạng thái! (demo)' }));
  };

  const del = (id) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    axios.delete(`/api/products/${id}`)
      .then(() => { setAlertMsg({ type: 'success', msg: 'Đã xóa sản phẩm!' }); load(); })
      .catch(() => setAlertMsg({ type: 'error', msg: 'Không thể xóa sản phẩm đang có đơn hàng!' }));
  };

  return (
    <div>
      {alertMsg && <Alert type={alertMsg.type} msg={alertMsg.msg} onClose={() => setAlertMsg(null)} />}
      <div className="card">
        <div className="card-header">
          <h3>🗂️ Danh Sách Sản Phẩm</h3>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Thêm Sản Phẩm</button>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filter-bar">
            <input className="search-input" placeholder="🔍 Tìm theo tên, mã..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <select className="filter-select" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
              <option value="">Tất cả danh mục</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Đơn vị</th><th>Giá bán</th><th>Tồn kho</th><th>Hiển thị</th><th>Thao tác</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ color: '#f44336', fontWeight: 600 }}>{item.code}</td>
                    <td>{item.name}</td>
                    <td><span className="badge badge-approved">{item.category}</span></td>
                    <td>{item.unit}</td>
                    <td style={{ fontWeight: 600 }}>{utils.formatMoney(item.price)}</td>
                    <td>{item.inventory?.quantity ?? '—'}</td>
                    <td>
                      <button className={`btn btn-sm ${item.is_visible ? 'btn-success' : 'btn-secondary'}`} onClick={() => toggleVisible(item)}>
                        {item.is_visible ? '👁 Hiện' : '🚫 Ẩn'}
                      </button>
                    </td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>✏</button>
                      <button className="btn btn-sm btn-danger" onClick={() => del(item.id)}>✕</button>
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
        <Modal title={editing ? '✏ Sửa Sản Phẩm' : '+ Thêm Sản Phẩm'} onClose={() => setShowModal(false)} size="lg">
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Mã sản phẩm *</label>
                <input className="search-input" style={{ width: '100%' }} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="VD: SP007" />
              </div>
              <div className="form-group">
                <label>Tên sản phẩm *</label>
                <input className="search-input" style={{ width: '100%' }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Danh mục</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Đơn vị *</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  <option value="tấn">Tấn</option><option value="kg">Kg</option>
                  <option value="ream">Ream</option><option value="cuộn">Cuộn</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Giá bán (VNĐ) *</label>
                <input className="search-input" style={{ width: '100%' }} type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tồn kho tối thiểu</label>
                <input className="search-input" style={{ width: '100%' }} type="number" min="0" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Mô tả</label>
              <textarea className="search-input" style={{ width: '100%', height: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_visible} onChange={e => setForm({ ...form, is_visible: e.target.checked })} />
                Hiển thị trên trang khách hàng
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={submit}>✓ Lưu Sản Phẩm</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
