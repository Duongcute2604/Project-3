// ============================================================
// WAREHOUSE: Inventory, Receipts, Issues, Stocktake
// ============================================================

// ============================================================
// TÍNH NĂNG ĐỌC ẢNH PHIẾU TỰ ĐỘNG (AI OCR)
// ============================================================
//
// CÁCH HOẠT ĐỘNG:
//   1. Người dùng upload ảnh chụp phiếu nhập/xuất kho (giấy tờ thực tế)
//   2. Ảnh được chuyển sang base64 ngay trên trình duyệt (không gửi lên server)
//   3. Gửi ảnh + câu lệnh (prompt) đến Google Gemini Vision API
//   4. Gemini đọc nội dung ảnh, trả về JSON chứa thông tin phiếu
//   5. Hệ thống tự điền vào các ô form (sản phẩm, số lượng, đơn giá, ngày...)
//   6. Người dùng kiểm tra lại rồi bấm Lưu
//
// CÔNG NGHỆ SỬ DỤNG:
//   - Google Gemini 1.5 Flash  : model AI đọc ảnh (Vision) + hiểu tiếng Việt
//   - FileReader API (browser) : đọc file ảnh → base64, không cần server
//   - Fetch API (browser)      : gọi Gemini REST API trực tiếp từ frontend
//
// CẤU HÌNH:
//   - Lấy API key miễn phí tại: https://aistudio.google.com
//   - Thay 'YOUR_GEMINI_API_KEY' bên dưới bằng key của bạn
//   - Gemini 1.5 Flash miễn phí 15 request/phút, đủ dùng cho nội bộ
//
// LƯU Ý BẢO MẬT:
//   - API key để ở frontend nên chỉ dùng cho môi trường nội bộ/demo
//   - Nếu deploy public, nên chuyển sang gọi qua backend để ẩn key
// ============================================================
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // ← THAY KEY CỦA BẠN VÀO ĐÂY

async function readImageWithGemini(base64Data, mimeType, promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{
      parts: [
        { text: promptText },
        { inline_data: { mime_type: mimeType, data: base64Data } }
      ]
    }]
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error('Gemini API lỗi: ' + res.status);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // Parse JSON từ response
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Không đọc được thông tin từ ảnh');
  return JSON.parse(match[0]);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- OCR Upload Box component ---
function OcrUploadBox({ onResult, type }) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const prompt = type === 'receipt'
    ? `Đây là ảnh phiếu nhập kho. Hãy đọc và trả về JSON với các trường sau (nếu không tìm thấy thì để chuỗi rỗng):
{
  "supplier_name": "tên nhà cung cấp",
  "product_name": "tên sản phẩm",
  "quantity": "số lượng (chỉ số, không đơn vị)",
  "unit": "đơn vị (ream/kg/cuộn/tấn/tờ)",
  "unit_price": "đơn giá (chỉ số, không ký tự tiền tệ)",
  "receipt_date": "ngày nhập định dạng YYYY-MM-DD",
  "note": "ghi chú nếu có"
}
Chỉ trả về JSON, không giải thích thêm.`
    : `Đây là ảnh phiếu xuất kho. Hãy đọc và trả về JSON với các trường sau (nếu không tìm thấy thì để chuỗi rỗng):
{
  "product_name": "tên sản phẩm",
  "quantity": "số lượng (chỉ số, không đơn vị)",
  "unit": "đơn vị (ream/kg/cuộn/tấn/tờ)",
  "reason": "lý do xuất kho",
  "issue_date": "ngày xuất định dạng YYYY-MM-DD",
  "note": "ghi chú nếu có"
}
Chỉ trả về JSON, không giải thích thêm.`;

  const handleFile = async (file) => {
    if (!file) return;
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      setError('Chưa cấu hình Gemini API key! Mở warehouse.jsx và thay YOUR_GEMINI_API_KEY.');
      return;
    }
    setError('');
    setPreview(URL.createObjectURL(file));
    setScanning(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await readImageWithGemini(base64, file.type, prompt);
      onResult(result);
    } catch (e) {
      setError('Lỗi đọc ảnh: ' + e.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        onClick={() => !scanning && inputRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: '2px dashed #555', borderRadius: '8px', padding: '16px', textAlign: 'center',
          cursor: scanning ? 'wait' : 'pointer', background: '#1e1e1e', transition: 'border-color 0.2s',
          position: 'relative', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
        }}
      >
        {preview && (
          <img src={preview} alt="preview" style={{ height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
        )}
        <div>
          {scanning
            ? <span style={{ color: '#f44336' }}>⏳ Đang đọc ảnh bằng AI...</span>
            : <span style={{ color: '#9e9e9e', fontSize: '13px' }}>📷 Click hoặc kéo thả ảnh phiếu vào đây để tự động điền form</span>
          }
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      </div>
      {error && <div style={{ color: '#f44336', fontSize: '12px', marginTop: '6px' }}>⚠ {error}</div>}
    </div>
  );
}

// --- Inventory ---
function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    axios.get('/api/warehouse/inventory', { params: { search, page, limit: LIMIT } })
      .then(r => { setItems(r.data.data || r.data); setTotal(r.data.total || 0); })
      .catch(() => {
        setItems([
          { product_id: 1, code: 'SP001', name: 'Giấy In A4 80gsm',     category: 'Giấy In',  quantity: 20,  unit: 'ream',  min_stock: 50,  price: 85000 },
          { product_id: 2, code: 'SP002', name: 'Giấy Khổ Lớn A0',      category: 'Giấy In',  quantity: 150, unit: 'cuộn', min_stock: 30,  price: 320000 },
          { product_id: 3, code: 'SP003', name: 'Giấy Ảnh Bóng A4',     category: 'Giấy Ảnh', quantity: 200, unit: 'ream',  min_stock: 50,  price: 150000 },
          { product_id: 4, code: 'SP004', name: 'Lõi Ống 3 Inch',       category: 'Lõi Ống',  quantity: 45,  unit: 'cuộn', min_stock: 100, price: 12000 },
          { product_id: 5, code: 'SP005', name: 'Vải Vụn Cotton',        category: 'Vải Vụn',  quantity: 80,  unit: 'kg',   min_stock: 200, price: 25000 },
          { product_id: 6, code: 'SP006', name: 'Giấy Bìa Cứng 300gsm', category: 'Giấy Bìa', quantity: 500, unit: 'tờ',   min_stock: 100, price: 5000 },
        ]);
        setTotal(6);
      })
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>🗃️ Danh Sách Tồn Kho</h3>
          <button className="btn btn-sm btn-secondary" onClick={() => alert('Xuất CSV tồn kho')}>⬇ Xuất CSV</button>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filter-bar">
            <input className="search-input" placeholder="🔍 Tìm theo tên, mã sản phẩm..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Tồn kho</th><th>Đơn vị</th><th>Tối thiểu</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const isLow = item.quantity < item.min_stock;
                  return (
                    <tr key={item.product_id}>
                      <td style={{ color: '#f44336', fontWeight: 600 }}>{item.code}</td>
                      <td>{item.name}</td>
                      <td><span className="badge badge-approved">{item.category}</span></td>
                      <td style={{ fontWeight: 600, color: isLow ? '#f44336' : '#66bb6a' }}>{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td style={{ color: '#9e9e9e' }}>{item.min_stock}</td>
                      <td>{isLow ? <span className="badge badge-cancelled">⚠ Sắp hết</span> : <span className="badge badge-success">✓ Đủ hàng</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>
    </div>
  );
}

// --- Receipts (có OCR) ---
function Receipts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [alertMsg, setAlertMsg] = useState(null);
  const [form, setForm] = useState({ supplier_id: '', product_id: '', quantity: '', unit: 'ream', unit_price: '', receipt_date: new Date().toISOString().split('T')[0], note: '' });
  const LIMIT = 20;

  const load = () => {
    setLoading(true);
    axios.get('/api/warehouse/receipts', { params: { page, limit: LIMIT } })
      .then(r => { setItems(r.data.data || r.data); setTotal(r.data.total || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const openModal = () => {
    Promise.all([
      axios.get('/api/suppliers').catch(() => ({ data: { data: [{ id: 1, name: 'Công ty Giấy Việt' }, { id: 2, name: 'Nhà Cung Cấp ABC' }] } })),
      axios.get('/api/products').catch(() => ({ data: { data: [{ id: 1, name: 'Giấy In A4 80gsm' }, { id: 2, name: 'Lõi Ống 3 Inch' }] } })),
    ]).then(([s, p]) => { setSuppliers(s.data.data || s.data); setProducts(p.data.data || p.data); setShowModal(true); });
  };

  // Khi Gemini trả về kết quả, tự động điền form
  const handleOcrResult = (result) => {
    const matchedSupplier = suppliers.find(s => s.name.toLowerCase().includes((result.supplier_name || '').toLowerCase()));
    const matchedProduct  = products.find(p => p.name.toLowerCase().includes((result.product_name || '').toLowerCase()));
    const unitMap = { 'ream': 'ream', 'kg': 'kg', 'cuộn': 'cuộn', 'cuon': 'cuộn', 'tấn': 'tấn', 'tan': 'tấn', 'tờ': 'tờ', 'to': 'tờ' };
    const unit = unitMap[(result.unit || '').toLowerCase()] || 'ream';
    setForm(prev => ({
      ...prev,
      supplier_id: matchedSupplier ? String(matchedSupplier.id) : prev.supplier_id,
      product_id:  matchedProduct  ? String(matchedProduct.id)  : prev.product_id,
      quantity:    result.quantity  || prev.quantity,
      unit:        unit,
      unit_price:  result.unit_price ? String(result.unit_price).replace(/[^0-9]/g, '') : prev.unit_price,
      receipt_date: result.receipt_date || prev.receipt_date,
      note:        result.note || prev.note,
    }));
    setAlertMsg({ type: 'success', msg: '✅ Đã đọc ảnh và điền thông tin! Kiểm tra lại trước khi lưu.' });
  };

  const submit = () => {
    if (!form.supplier_id || !form.product_id || !form.quantity || !form.unit_price) {
      setAlertMsg({ type: 'error', msg: 'Vui lòng điền đầy đủ thông tin!' }); return;
    }
    axios.post('/api/warehouse/receipts', form)
      .then(() => { setAlertMsg({ type: 'success', msg: 'Tạo phiếu nhập thành công!' }); setShowModal(false); load(); })
      .catch(() => { setAlertMsg({ type: 'success', msg: 'Tạo phiếu nhập thành công! (demo)' }); setShowModal(false); });
  };

  return (
    <div>
      {alertMsg && <Alert type={alertMsg.type} msg={alertMsg.msg} onClose={() => setAlertMsg(null)} />}
      <div className="card">
        <div className="card-header">
          <h3>📥 Danh Sách Phiếu Nhập Kho</h3>
          <button className="btn btn-primary btn-sm" onClick={openModal}>+ Tạo Phiếu Nhập</button>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Mã phiếu</th><th>Nhà cung cấp</th><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th><th>Ngày nhập</th></tr></thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: '#f44336', fontWeight: 600 }}>{r.code}</td>
                    <td>{r.supplier_name}</td>
                    <td>{r.product_name}</td>
                    <td>{r.quantity} {r.unit}</td>
                    <td>{utils.formatMoney(r.unit_price)}</td>
                    <td style={{ fontWeight: 600 }}>{utils.formatMoney(r.total_price)}</td>
                    <td style={{ color: '#9e9e9e' }}>{r.receipt_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>

      {showModal && (
        <Modal title="📥 Tạo Phiếu Nhập Kho" onClose={() => setShowModal(false)}>
          <div className="modal-body">
            <OcrUploadBox type="receipt" onResult={handleOcrResult} />
            <div className="form-row">
              <div className="form-group">
                <label>Nhà cung cấp *</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Sản phẩm *</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Số lượng *</label>
                <input className="search-input" style={{ width: '100%' }} type="number" min="0.001" step="0.001" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Đơn vị *</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  <option value="tấn">Tấn</option><option value="kg">Kg</option>
                  <option value="ream">Ream</option><option value="cuộn">Cuộn</option><option value="tờ">Tờ</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Đơn giá (VNĐ) *</label>
                <input className="search-input" style={{ width: '100%' }} type="number" min="0" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Ngày nhập *</label>
                <input className="search-input" style={{ width: '100%' }} type="date" value={form.receipt_date} onChange={e => setForm({ ...form, receipt_date: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Ghi chú</label>
              <textarea className="search-input" style={{ width: '100%', height: '80px', resize: 'vertical' }} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
            {form.quantity && form.unit_price && (
              <div style={{ background: '#2a2a2a', padding: '12px', borderRadius: '6px', marginTop: '8px' }}>
                <strong style={{ color: '#66bb6a' }}>Thành tiền: {utils.formatMoney(form.quantity * form.unit_price)}</strong>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={submit}>✓ Tạo Phiếu Nhập</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Issues (có OCR) ---
function Issues() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [alertMsg, setAlertMsg] = useState(null);
  const [form, setForm] = useState({ product_id: '', quantity: '', unit: 'ream', reason: '', issue_date: new Date().toISOString().split('T')[0], note: '' });
  const LIMIT = 20;

  const load = () => {
    setLoading(true);
    axios.get('/api/warehouse/issues', { params: { page, limit: LIMIT } })
      .then(r => { setItems(r.data.data || r.data); setTotal(r.data.total || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const openModal = () => {
    axios.get('/api/products').catch(() => ({ data: { data: [{ id: 1, name: 'Giấy In A4 80gsm' }, { id: 2, name: 'Vải Vụn Cotton' }] } }))
      .then(r => { setProducts(r.data.data || r.data); setShowModal(true); });
  };

  const handleOcrResult = (result) => {
    const matchedProduct = products.find(p => p.name.toLowerCase().includes((result.product_name || '').toLowerCase()));
    const unitMap = { 'ream': 'ream', 'kg': 'kg', 'cuộn': 'cuộn', 'cuon': 'cuộn', 'tấn': 'tấn', 'tan': 'tấn', 'tờ': 'tờ', 'to': 'tờ' };
    const unit = unitMap[(result.unit || '').toLowerCase()] || 'ream';
    setForm(prev => ({
      ...prev,
      product_id: matchedProduct ? String(matchedProduct.id) : prev.product_id,
      quantity:   result.quantity  || prev.quantity,
      unit:       unit,
      reason:     result.reason    || prev.reason,
      issue_date: result.issue_date || prev.issue_date,
      note:       result.note      || prev.note,
    }));
    setAlertMsg({ type: 'success', msg: '✅ Đã đọc ảnh và điền thông tin! Kiểm tra lại trước khi lưu.' });
  };

  const submit = () => {
    if (!form.product_id || !form.quantity || !form.reason) {
      setAlertMsg({ type: 'error', msg: 'Vui lòng điền đầy đủ thông tin!' }); return;
    }
    axios.post('/api/warehouse/issues', form)
      .then(() => { setAlertMsg({ type: 'success', msg: 'Tạo phiếu xuất thành công!' }); setShowModal(false); load(); })
      .catch(() => { setAlertMsg({ type: 'success', msg: 'Tạo phiếu xuất thành công! (demo)' }); setShowModal(false); });
  };

  return (
    <div>
      {alertMsg && <Alert type={alertMsg.type} msg={alertMsg.msg} onClose={() => setAlertMsg(null)} />}
      <div className="card">
        <div className="card-header">
          <h3>📤 Danh Sách Phiếu Xuất Kho</h3>
          <button className="btn btn-primary btn-sm" onClick={openModal}>+ Tạo Phiếu Xuất</button>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Mã phiếu</th><th>Sản phẩm</th><th>Số lượng</th><th>Lý do xuất</th><th>Ngày xuất</th><th>Người tạo</th></tr></thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: '#f44336', fontWeight: 600 }}>{r.code}</td>
                    <td>{r.product_name}</td>
                    <td>{r.quantity} {r.unit}</td>
                    <td>{r.reason}</td>
                    <td style={{ color: '#9e9e9e' }}>{r.issue_date}</td>
                    <td>{r.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>

      {showModal && (
        <Modal title="📤 Tạo Phiếu Xuất Kho" onClose={() => setShowModal(false)}>
          <div className="modal-body">
            <OcrUploadBox type="issue" onResult={handleOcrResult} />
            <div className="form-row">
              <div className="form-group">
                <label>Sản phẩm *</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Đơn vị *</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  <option value="tấn">Tấn</option><option value="kg">Kg</option>
                  <option value="ream">Ream</option><option value="cuộn">Cuộn</option><option value="tờ">Tờ</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Số lượng *</label>
                <input className="search-input" style={{ width: '100%' }} type="number" min="0.001" step="0.001" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Ngày xuất *</label>
                <input className="search-input" style={{ width: '100%' }} type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Lý do xuất *</label>
              <input className="search-input" style={{ width: '100%' }} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="VD: Xuất bán đơn DH001" />
            </div>
            <div className="form-group">
              <label>Ghi chú</label>
              <textarea className="search-input" style={{ width: '100%', height: '80px', resize: 'vertical' }} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={submit}>✓ Tạo Phiếu Xuất</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Stocktake (không đổi) ---
function Stocktake() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([{ product_id: '', system_quantity: 0, actual_quantity: '', reason: '' }]);
  const [note, setNote] = useState('');
  const [alertMsg, setAlertMsg] = useState(null);

  const load = () => {
    setLoading(true);
    axios.get('/api/warehouse/stocktakes').then(r => setItems(r.data.data || r.data)).catch(() => setItems([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openModal = () => {
    axios.get('/api/warehouse/inventory').catch(() => ({ data: [{ product_id: 1, name: 'Giấy In A4 80gsm', quantity: 20 }, { product_id: 2, name: 'Lõi Ống 3 Inch', quantity: 45 }] }))
      .then(r => {
        const inv = r.data.data || r.data;
        setProducts(inv);
        setRows(inv.slice(0, 3).map(p => ({ product_id: p.product_id, system_quantity: p.quantity, actual_quantity: '', reason: '' })));
        setShowModal(true);
      });
  };

  const submit = () => {
    const validRows = rows.filter(r => r.product_id && r.actual_quantity !== '');
    if (!validRows.length) { setAlertMsg({ type: 'error', msg: 'Vui lòng nhập ít nhất 1 sản phẩm!' }); return; }
    axios.post('/api/warehouse/stocktakes', { note, items: validRows })
      .then(() => { setAlertMsg({ type: 'success', msg: 'Tạo phiếu kiểm kê thành công!' }); setShowModal(false); load(); })
      .catch(() => { setAlertMsg({ type: 'success', msg: 'Tạo phiếu kiểm kê thành công! (demo)' }); setShowModal(false); });
  };

  const confirm = (id) => {
    if (!window.confirm('Xác nhận kiểm kê này? Tồn kho sẽ được cập nhật theo số liệu thực tế.')) return;
    axios.put(`/api/warehouse/stocktakes/${id}/confirm`)
      .then(() => { setAlertMsg({ type: 'success', msg: 'Đã xác nhận kiểm kê!' }); load(); })
      .catch(() => setAlertMsg({ type: 'success', msg: 'Đã xác nhận kiểm kê! (demo)' }));
  };

  return (
    <div>
      {alertMsg && <Alert type={alertMsg.type} msg={alertMsg.msg} onClose={() => setAlertMsg(null)} />}
      <div className="card">
        <div className="card-header">
          <h3>🔍 Lịch Sử Kiểm Kê Kho</h3>
          <button className="btn btn-primary btn-sm" onClick={openModal}>+ Tạo Phiếu Kiểm Kê</button>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Mã phiếu</th><th>Ghi chú</th><th>Số SP</th><th>Ngày tạo</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: '#f44336', fontWeight: 600 }}>{r.code}</td>
                    <td>{r.note}</td>
                    <td>{r.item_count}</td>
                    <td style={{ color: '#9e9e9e' }}>{utils.formatDate(r.created_at)}</td>
                    <td>{r.confirmed_at ? <span className="badge badge-success">✓ Đã xác nhận</span> : <span className="badge badge-pending">Chờ xác nhận</span>}</td>
                    <td>{!r.confirmed_at && <button className="btn btn-sm btn-success" onClick={() => confirm(r.id)}>✓ Xác nhận</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showModal && (
        <Modal title="🔍 Tạo Phiếu Kiểm Kê" onClose={() => setShowModal(false)} size="lg">
          <div className="modal-body">
            <div className="form-group">
              <label>Ghi chú</label>
              <input className="search-input" style={{ width: '100%' }} value={note} onChange={e => setNote(e.target.value)} placeholder="VD: Kiểm kê định kỳ tháng 6" />
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: '#e0e0e0' }}>Danh sách sản phẩm kiểm kê</strong>
                <button className="btn btn-sm btn-secondary" onClick={() => setRows([...rows, { product_id: '', system_quantity: 0, actual_quantity: '', reason: '' }])}>+ Thêm dòng</button>
              </div>
              <table>
                <thead><tr><th>Sản phẩm</th><th>Tồn hệ thống</th><th>Thực tế</th><th>Chênh lệch</th><th>Lý do</th><th></th></tr></thead>
                <tbody>
                  {rows.map((row, i) => {
                    const diff = row.actual_quantity !== '' ? (parseFloat(row.actual_quantity) - row.system_quantity) : null;
                    return (
                      <tr key={i}>
                        <td>
                          <select className="filter-select" style={{ width: '100%' }} value={row.product_id}
                            onChange={e => { const p = products.find(x => x.product_id == e.target.value); const nr = [...rows]; nr[i] = { ...nr[i], product_id: e.target.value, system_quantity: p ? p.quantity : 0 }; setRows(nr); }}>
                            <option value="">-- Chọn --</option>
                            {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td style={{ color: '#9e9e9e' }}>{row.system_quantity}</td>
                        <td><input className="search-input" style={{ width: '80px' }} type="number" min="0" step="0.001" value={row.actual_quantity} onChange={e => { const nr = [...rows]; nr[i] = { ...nr[i], actual_quantity: e.target.value }; setRows(nr); }} /></td>
                        <td style={{ color: diff === null ? '#9e9e9e' : diff < 0 ? '#f44336' : diff > 0 ? '#66bb6a' : '#9e9e9e', fontWeight: 600 }}>{diff !== null ? (diff > 0 ? '+' : '') + diff : '—'}</td>
                        <td><input className="search-input" style={{ width: '120px' }} value={row.reason} onChange={e => { const nr = [...rows]; nr[i] = { ...nr[i], reason: e.target.value }; setRows(nr); }} placeholder="Lý do..." /></td>
                        <td><button className="btn btn-sm btn-danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={submit}>✓ Tạo Phiếu Kiểm Kê</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
