// ============================================================
// STOCK LEDGER: Tổng Hợp N-X-T + Sổ Chi Tiết Vật Tư
// ============================================================

// ---- Import Excel: đọc file và parse dữ liệu ----
// Hỗ trợ 2 loại file:
//   1. File xuất từ hệ thống này (cột: STT, Mã hàng, Tên hàng, ĐVT, ...)
//   2. File Excel gốc dạng tổng hợp N-X-T bất kỳ (tự detect header)
function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        // Lấy sheet đầu tiên
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Tìm dòng header (chứa 'Mã hàng' hoặc 'Tên hàng')
        let headerRow = -1;
        for (let i = 0; i < Math.min(raw.length, 10); i++) {
          const rowStr = raw[i].join('|').toLowerCase();
          if (rowStr.includes('mã hàng') || rowStr.includes('tên hàng') || rowStr.includes('ma hang')) {
            headerRow = i;
            break;
          }
        }
        if (headerRow === -1) { reject(new Error('Không tìm thấy header. File cần có cột "Mã hàng" và "Tên hàng".')); return; }

        const headers = raw[headerRow].map(h => String(h).toLowerCase().trim());
        const findCol = (...keys) => headers.findIndex(h => keys.some(k => h.includes(k)));

        // Map cột — linh hoạt với nhiều tên cột khác nhau
        const colMap = {
          code:      findCol('mã hàng', 'ma hang', 'mã sp', 'code'),
          name:      findCol('tên hàng', 'ten hang', 'tên sp', 'name'),
          unit:      findCol('đvt', 'dvt', 'đơn vị', 'unit'),
          open_qty:  findCol('đầu kỳ - sl', 'đầu kỳ sl', 'tồn đầu sl', 'open_qty'),
          open_val:  findCol('đầu kỳ - giá', 'đầu kỳ giá', 'tồn đầu giá', 'open_val'),
          in_qty:    findCol('nhập kho - sl', 'nhập sl', 'nhập - sl', 'in_qty'),
          in_val:    findCol('nhập kho - giá', 'nhập giá', 'nhập - giá', 'in_val'),
          out_qty:   findCol('xuất kho - sl', 'xuất sl', 'xuất - sl', 'out_qty'),
          out_val:   findCol('xuất kho - giá', 'xuất giá', 'xuất - giá', 'out_val'),
          close_qty: findCol('tồn cuối kỳ - sl', 'tồn cuối sl', 'tồn - sl', 'close_qty'),
          close_val: findCol('tồn cuối kỳ - giá', 'tồn cuối giá', 'tồn - giá', 'close_val'),
        };

        const toNum = (v) => {
          if (v === '' || v === null || v === undefined) return 0;
          return parseFloat(String(v).replace(/[^0-9.\-]/g, '')) || 0;
        };

        const items = [];
        for (let i = headerRow + 1; i < raw.length; i++) {
          const row = raw[i];
          const code = colMap.code >= 0 ? String(row[colMap.code] || '').trim() : '';
          const name = colMap.name >= 0 ? String(row[colMap.name] || '').trim() : '';
          // Bỏ qua dòng trống hoặc dòng tổng cộng
          if (!code && !name) continue;
          if (['tổng', 'tong', 'total', 'cộng'].some(k => (code + name).toLowerCase().includes(k))) continue;

          items.push({
            code:      code || `ROW${i}`,
            name:      name || code,
            unit:      colMap.unit      >= 0 ? String(row[colMap.unit] || 'Kg').trim() : 'Kg',
            open_qty:  colMap.open_qty  >= 0 ? toNum(row[colMap.open_qty])  : 0,
            open_val:  colMap.open_val  >= 0 ? toNum(row[colMap.open_val])  : 0,
            in_qty:    colMap.in_qty    >= 0 ? toNum(row[colMap.in_qty])    : 0,
            in_val:    colMap.in_val    >= 0 ? toNum(row[colMap.in_val])    : 0,
            out_qty:   colMap.out_qty   >= 0 ? toNum(row[colMap.out_qty])   : 0,
            out_val:   colMap.out_val   >= 0 ? toNum(row[colMap.out_val])   : 0,
            close_qty: colMap.close_qty >= 0 ? toNum(row[colMap.close_qty]) : 0,
            close_val: colMap.close_val >= 0 ? toNum(row[colMap.close_val]) : 0,
          });
        }
        if (items.length === 0) { reject(new Error('Không đọc được dữ liệu. Kiểm tra lại file.')); return; }
        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsArrayBuffer(file);
  });
}

// ---- Component nút Import ----
function ImportExcelBtn({ onImport, hasData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const inputRef = useRef(null);

  const handle = async (file) => {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const items = await parseExcelFile(file);
      onImport(items);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      inputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
      <button
        className="btn btn-secondary"
        style={{ alignSelf: 'flex-end', background: '#1b5e20', borderColor: '#2e7d32', color: '#fff' }}
        onClick={() => inputRef.current.click()}
        disabled={loading}
      >
        {loading ? '⏳ Đang đọc...' : (hasData ? '📂 Thêm file Excel' : '📂 Nhập từ Excel')}
      </button>
      {error && <span style={{ color: '#f44336', fontSize: '11px', maxWidth: '200px' }}>⚠ {error}</span>}
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
        onChange={e => handle(e.target.files[0])} />
    </div>
  );
}
function exportSummaryExcel(items, month) {
  const header = [
    ['CÔNG TY BK — TỔNG HỢP NHẬP XUẤT TỒN'],
    [`Tháng: ${month}`],
    [],
    [
      'STT', 'Mã hàng', 'Tên hàng', 'ĐVT',
      'Đầu kỳ - SL', 'Đầu kỳ - Giá trị',
      'Nhập kho - SL', 'Nhập kho - Giá trị',
      'Xuất kho - SL', 'Xuất kho - Giá trị',
      'Tồn cuối kỳ - SL', 'Tồn cuối kỳ - Giá trị',
    ],
  ];
  const rows = items.map((r, i) => [
    i + 1, r.code, r.name, r.unit,
    r.open_qty,  r.open_val,
    r.in_qty,    r.in_val,
    r.out_qty,   r.out_val,
    r.close_qty, r.close_val,
  ]);
  const totals = items.reduce((a, r) => [
    'TỔNG', '', '', '',
    a[4]  + r.open_qty,  a[5]  + r.open_val,
    a[6]  + r.in_qty,    a[7]  + r.in_val,
    a[8]  + r.out_qty,   a[9]  + r.out_val,
    a[10] + r.close_qty, a[11] + r.close_val,
  ], ['TỔNG','','','',0,0,0,0,0,0,0,0]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows, totals]);

  // Độ rộng cột
  ws['!cols'] = [
    {wch:5},{wch:12},{wch:28},{wch:6},
    {wch:12},{wch:16},{wch:12},{wch:16},
    {wch:12},{wch:16},{wch:12},{wch:16},
  ];
  // Merge tiêu đề
  ws['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:11} }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tổng Hợp N-X-T');
  XLSX.writeFile(wb, `TongHop_NXT_${month}.xlsx`);
}

// ---- Xuất Excel: Sổ Chi Tiết ----
function exportDetailExcel(rows, product, month) {
  const header = [
    ['CÔNG TY BK — SỔ CHI TIẾT VẬT TƯ HÀNG HÓA'],
    [`Mã hàng: ${product.code}   Tên hàng: ${product.name}   ĐVT: ${product.unit}`],
    [`Tháng: ${month}`],
    [],
    [
      'STT', 'Ngày CT', 'Số CT', 'Diễn giải', 'ĐVT', 'Đơn giá',
      'Nhập - SL', 'Nhập - Giá trị',
      'Xuất - SL', 'Xuất - Giá trị',
      'Tồn - SL',  'Tồn - Giá trị',
    ],
  ];
  const dataRows = rows.map((r, i) => [
    i + 1, r.date, r.doc_no, r.description, r.unit, r.unit_price,
    r.in_qty  || 0, r.in_val  || 0,
    r.out_qty || 0, r.out_val || 0,
    r.bal_qty || 0, r.bal_val || 0,
  ]);
  const totals = rows.reduce((a, r) => [
    'TỔNG','','','','','',
    a[6] + (r.in_qty  || 0), a[7] + (r.in_val  || 0),
    a[8] + (r.out_qty || 0), a[9] + (r.out_val || 0),
    '','',
  ], ['TỔNG','','','','','',0,0,0,0,'','']);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...dataRows, totals]);
  ws['!cols'] = [
    {wch:5},{wch:12},{wch:10},{wch:40},{wch:6},{wch:12},
    {wch:12},{wch:16},{wch:12},{wch:16},{wch:12},{wch:16},
  ];
  ws['!merges'] = [
    { s:{r:0,c:0}, e:{r:0,c:11} },
    { s:{r:1,c:0}, e:{r:1,c:11} },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, product.code.slice(0, 31));
  XLSX.writeFile(wb, `SoChiTiet_${product.code}_${month}.xlsx`);
}

// ---- Modal cảnh báo mã sản phẩm mới ----
function NewProductsModal({ newProducts, onConfirm, onCancel }) {
  if (!newProducts || newProducts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#1e1e1e', border: '1px solid #f44336', borderRadius: '8px',
        padding: '24px', maxWidth: '560px', width: '90%', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <div style={{ color: '#f44336', fontWeight: 700, fontSize: '16px' }}>Phát hiện mã sản phẩm mới!</div>
            <div style={{ color: '#9e9e9e', fontSize: '13px' }}>
              {newProducts.length} mã hàng trong file chưa tồn tại trong hệ thống.
            </div>
          </div>
        </div>

        {/* Danh sách mã mới */}
        <div style={{ overflowY: 'auto', maxHeight: '300px', border: '1px solid #333', borderRadius: '4px' }}>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#2a2a2a', position: 'sticky', top: 0 }}>
                <th style={{ padding: '8px', textAlign: 'left', color: '#9e9e9e' }}>Mã hàng</th>
                <th style={{ padding: '8px', textAlign: 'left', color: '#9e9e9e' }}>Tên hàng</th>
                <th style={{ padding: '8px', textAlign: 'center', color: '#9e9e9e' }}>ĐVT</th>
              </tr>
            </thead>
            <tbody>
              {newProducts.map((p, i) => (
                <tr key={p.code} style={{ borderTop: '1px solid #2a2a2a', background: i % 2 === 0 ? 'transparent' : '#1a1a1a' }}>
                  <td style={{ padding: '7px 8px', color: '#f44336', fontWeight: 600 }}>{p.code}</td>
                  <td style={{ padding: '7px 8px', color: '#e0e0e0' }}>{p.name}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'center', color: '#9e9e9e' }}>{p.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ color: '#ffb74d', fontSize: '13px', background: '#2a1a00', padding: '10px', borderRadius: '4px' }}>
          💡 Bạn có muốn tạo mới {newProducts.length} loại sản phẩm này và lưu vào hệ thống không?
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>✖ Bỏ qua, không tạo</button>
          <button className="btn btn-primary" style={{ background: '#2e7d32', borderColor: '#388e3c' }} onClick={onConfirm}>
            ✔ Tạo mới & lưu {newProducts.length} sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Key lưu sessionStorage ----
const SS_KEY   = 'stockSummary_items';
const SS_MONTH = 'stockSummary_month';

// ---- TỔNG HỢP NHẬP XUẤT TỒN ----
function StockSummary({ onViewDetail }) {
  // Khôi phục dữ liệu từ sessionStorage khi quay lại trang
  const [items, setItemsState] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SS_KEY) || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [month, setMonthState] = useState(() => sessionStorage.getItem(SS_MONTH) || new Date().toISOString().slice(0, 7));
  const [importAlert, setImportAlert] = useState('');
  const [newProductsModal, setNewProductsModal] = useState(null);

  // Wrapper setItems: tự động lưu sessionStorage
  const setItems = React.useCallback((val) => {
    setItemsState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      try { sessionStorage.setItem(SS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Wrapper setMonth: tự động lưu sessionStorage
  const setMonth = React.useCallback((m) => {
    sessionStorage.setItem(SS_MONTH, m);
    setMonthState(m);
  }, []);

  // Không có dữ liệu mẫu — import từ Excel hoặc kết nối DB
  const MOCK = [];

  // Lưu tập mã hàng đã có trong DB để kiểm tra mã mới khi import
  const dbCodesRef = React.useRef(new Set(items.map(r => r.code.toLowerCase().trim())));

  const load = () => {
    setLoading(true);
    axios.get('/api/reports/stock-summary', { params: { month } })
      .then(r => {
        const data = r.data.data || r.data;
        setItems(data);
        dbCodesRef.current = new Set(data.map(d => d.code.toLowerCase().trim()));
      })
      .catch(() => {
        // Không ghi đè dữ liệu đã import — chỉ cập nhật dbCodes từ items hiện tại
        setItemsState(cur => {
          dbCodesRef.current = new Set(cur.map(d => d.code.toLowerCase().trim()));
          return cur;
        });
      })
      .finally(() => setLoading(false));
  };

  // Chỉ auto-load từ DB khi đổi tháng VÀ chưa có dữ liệu import
  useEffect(() => {
    if (items.length === 0) {
      load();
    } else {
      setLoading(false);
      dbCodesRef.current = new Set(items.map(r => r.code.toLowerCase().trim()));
    }
  }, [month]);

  const totals = items.reduce((acc, r) => ({
    open_qty:  acc.open_qty  + r.open_qty,
    open_val:  acc.open_val  + r.open_val,
    in_qty:    acc.in_qty    + r.in_qty,
    in_val:    acc.in_val    + r.in_val,
    out_qty:   acc.out_qty   + r.out_qty,
    out_val:   acc.out_val   + r.out_val,
    close_qty: acc.close_qty + r.close_qty,
    close_val: acc.close_val + r.close_val,
  }), { open_qty:0, open_val:0, in_qty:0, in_val:0, out_qty:0, out_val:0, close_qty:0, close_val:0 });

  const fmt = (n) => utils.formatMoney(n);
  const fqty = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 1 });

  return (
    <div>
      {/* Modal cảnh báo mã sản phẩm mới */}
      {newProductsModal && (
        <NewProductsModal
          newProducts={newProductsModal.newProducts}
          onCancel={() => {
            // Bỏ qua mã mới, chỉ merge mã đã biết
            const { knownItems } = newProductsModal;
            setNewProductsModal(null);
            if (knownItems.length > 0) {
              setItems(prev => {
                const existingCodes = new Set(prev.map(r => r.code.toLowerCase().trim()));
                const toAdd = knownItems.filter(r => !existingCodes.has(r.code.toLowerCase().trim()));
                setImportAlert(`✅ Thêm ${toAdd.length} mã đã biết, bỏ qua ${newProductsModal.newProducts.length} mã mới`);
                setTimeout(() => setImportAlert(''), 5000);
                return [...prev, ...toAdd];
              });
            } else {
              setImportAlert(`⚠ Đã bỏ qua ${newProductsModal.newProducts.length} mã sản phẩm mới`);
              setTimeout(() => setImportAlert(''), 5000);
            }
          }}
          onConfirm={() => {
            // Tạo mới sản phẩm trong DB rồi merge tất cả
            const { newProducts, allImported } = newProductsModal;
            setNewProductsModal(null);

            // Lưu sản phẩm mới vào sessionStorage để trang Sản Phẩm đọc được
            try {
              const existing = JSON.parse(sessionStorage.getItem('products_local') || '[]');
              const existingCodes = new Set(existing.map(p => p.code.toLowerCase().trim()));
              const toSave = newProducts.filter(p => !existingCodes.has(p.code.toLowerCase().trim()))
                .map((p, i) => ({
                  id: Date.now() + i,
                  code: p.code, name: p.name, unit: p.unit,
                  category: 'Nhập từ Excel', price: 0, is_visible: true,
                  inventory: { quantity: p.close_qty || 0 }
                }));
              sessionStorage.setItem('products_local', JSON.stringify([...existing, ...toSave]));
            } catch {}

            // Gọi API tạo sản phẩm mới, đồng thời lưu vào sessionStorage làm fallback
            const saveLocal = (products) => {
              try {
                const existing = JSON.parse(sessionStorage.getItem('products_local') || '[]');
                const existCodes = new Set(existing.map(p => p.code.toLowerCase()));
                const toAdd = products
                  .filter(p => !existCodes.has(p.code.toLowerCase()))
                  .map((p, i) => ({
                    id: Date.now() + i,
                    code: p.code, name: p.name, unit: p.unit,
                    category: 'Nhập từ Excel', price: 0, is_visible: true,
                    inventory: { quantity: p.close_qty || 0 }
                  }));
                sessionStorage.setItem('products_local', JSON.stringify([...existing, ...toAdd]));
              } catch {}
            };

            const createPromises = newProducts.map(p =>
              axios.post('/api/products', { code: p.code, name: p.name, unit: p.unit, category_id: null, price: 0 })
                .catch(() => null)
            );
            Promise.all(createPromises).then(() => {
              // Lưu vào sessionStorage để trang Sản Phẩm đọc được dù API có thành công hay không
              saveLocal(newProducts);
              newProducts.forEach(p => dbCodesRef.current.add(p.code.toLowerCase().trim()));
              setItems(prev => {
                const existingCodes = new Set(prev.map(r => r.code.toLowerCase().trim()));
                const toAdd = allImported.filter(r => !existingCodes.has(r.code.toLowerCase().trim()));
                setImportAlert(`✅ Đã tạo ${newProducts.length} sản phẩm mới và thêm ${toAdd.length} mã vào bảng`);
                setTimeout(() => setImportAlert(''), 6000);
                return [...prev, ...toAdd];
              });
            });
          }}
        />
      )}
      {/* Filter */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ color: '#9e9e9e', fontSize: '12px' }}>Tháng</label>
              <input className="search-input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={load} style={{ alignSelf: 'flex-end' }}>🔍 Xem từ DB</button>
            <button className="btn btn-secondary" onClick={() => exportSummaryExcel(items, month)} style={{ alignSelf: 'flex-end' }} disabled={items.length === 0}>⬇ Xuất Excel</button>
            <ImportExcelBtn
              hasData={items.length > 0}
              onImport={(imported) => {
                // Tách mã mới (chưa có trong DB) và mã đã biết
                const dbCodes = dbCodesRef.current;
                const brandNew = imported.filter(r => !dbCodes.has(r.code.toLowerCase().trim()));
                const known    = imported.filter(r =>  dbCodes.has(r.code.toLowerCase().trim()));

                const doMerge = (toAdd) => {
                  setItems(prev => {
                    if (prev.length === 0) {
                      setImportAlert(`✅ Đã nhập ${toAdd.length} mặt hàng từ file Excel`);
                      return toAdd;
                    }
                    const existingCodes = new Set(prev.map(r => r.code.toLowerCase().trim()));
                    let added = 0, skipped = 0;
                    const newItems = [];
                    toAdd.forEach(r => {
                      const key = r.code.toLowerCase().trim();
                      if (existingCodes.has(key)) {
                        skipped++;
                      } else {
                        existingCodes.add(key);
                        newItems.push(r);
                        added++;
                      }
                    });
                    if (skipped > 0 && added === 0) {
                      setImportAlert(`⚠ Toàn bộ ${skipped} mã đã tồn tại — file bị trùng, không thêm gì`);
                    } else {
                      setImportAlert(`✅ Thêm ${added} mã mới${skipped > 0 ? `, bỏ qua ${skipped} mã trùng` : ''}`);
                    }
                    return [...prev, ...newItems];
                  });
                  setTimeout(() => setImportAlert(''), 5000);
                };

                if (brandNew.length > 0) {
                  // Có mã chưa tồn tại trong DB → hiện modal cảnh báo
                  setNewProductsModal({ newProducts: brandNew, knownItems: known, allImported: imported });
                } else {
                  // Tất cả mã đã có trong DB → merge bình thường
                  doMerge(imported);
                }
              }}
            />
            {items.length > 0 && (
              <button className="btn btn-sm btn-danger" style={{ alignSelf: 'flex-end' }}
                onClick={() => { if (window.confirm('Xóa toàn bộ dữ liệu đã import và tải lại từ DB?')) {
                  sessionStorage.removeItem(SS_KEY);
                  sessionStorage.removeItem(SS_MONTH);
                  setItems([]);
                  load();
                } }}>
                🗑 Xóa
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>📊 Tổng Hợp Nhập Xuất Tồn — Tháng {month}</h3>
        </div>
        {importAlert && <Alert type="success" msg={importAlert} onClose={() => setImportAlert('')} />}        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 1100, fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#1a1a1a' }}>
                  <th rowSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>STT</th>
                  <th rowSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>Mã hàng</th>
                  <th rowSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>Tên hàng</th>
                  <th rowSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>ĐVT</th>
                  <th colSpan="2" style={{ textAlign: 'center', background: '#1565c0' }}>Đầu kỳ</th>
                  <th colSpan="2" style={{ textAlign: 'center', background: '#2e7d32' }}>Nhập kho</th>
                  <th colSpan="2" style={{ textAlign: 'center', background: '#b71c1c' }}>Xuất kho</th>
                  <th colSpan="2" style={{ textAlign: 'center', background: '#4a148c' }}>Tồn cuối kỳ</th>
                </tr>
                <tr style={{ background: '#1a1a1a' }}>
                  <th style={{ textAlign: 'right', background: '#1565c0', opacity: 0.85 }}>Số lượng</th>
                  <th style={{ textAlign: 'right', background: '#1565c0', opacity: 0.85 }}>Giá trị</th>
                  <th style={{ textAlign: 'right', background: '#2e7d32', opacity: 0.85 }}>Số lượng</th>
                  <th style={{ textAlign: 'right', background: '#2e7d32', opacity: 0.85 }}>Giá trị</th>
                  <th style={{ textAlign: 'right', background: '#b71c1c', opacity: 0.85 }}>Số lượng</th>
                  <th style={{ textAlign: 'right', background: '#b71c1c', opacity: 0.85 }}>Giá trị</th>
                  <th style={{ textAlign: 'right', background: '#4a148c', opacity: 0.85 }}>Số lượng</th>
                  <th style={{ textAlign: 'right', background: '#4a148c', opacity: 0.85 }}>Giá trị</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.code} style={{ cursor: 'pointer' }} onClick={() => onViewDetail(r)}>
                    <td style={{ textAlign: 'center', color: '#9e9e9e' }}>{i + 1}</td>
                    <td style={{ color: '#f44336', fontWeight: 600 }}>{r.code}</td>
                    <td>
                      <span style={{ color: '#42a5f5', textDecoration: 'underline', cursor: 'pointer' }}>
                        {r.name}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', color: '#9e9e9e' }}>{r.unit}</td>
                    <td style={{ textAlign: 'right' }}>{fqty(r.open_qty)}</td>
                    <td style={{ textAlign: 'right', color: '#90caf9' }}>{fmt(r.open_val)}</td>
                    <td style={{ textAlign: 'right', color: '#66bb6a', fontWeight: 600 }}>{fqty(r.in_qty)}</td>
                    <td style={{ textAlign: 'right', color: '#66bb6a' }}>{fmt(r.in_val)}</td>
                    <td style={{ textAlign: 'right', color: '#ef9a9a', fontWeight: 600 }}>{fqty(r.out_qty)}</td>
                    <td style={{ textAlign: 'right', color: '#ef9a9a' }}>{fmt(r.out_val)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: r.close_qty < 0 ? '#f44336' : '#fff' }}>{fqty(r.close_qty)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: r.close_val < 0 ? '#f44336' : '#ce93d8' }}>{fmt(r.close_val)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#2a2a2a', fontWeight: 700 }}>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#e0e0e0' }}>TỔNG CỘNG</td>
                  <td style={{ textAlign: 'right' }}>{fqty(totals.open_qty)}</td>
                  <td style={{ textAlign: 'right', color: '#90caf9' }}>{fmt(totals.open_val)}</td>
                  <td style={{ textAlign: 'right', color: '#66bb6a' }}>{fqty(totals.in_qty)}</td>
                  <td style={{ textAlign: 'right', color: '#66bb6a' }}>{fmt(totals.in_val)}</td>
                  <td style={{ textAlign: 'right', color: '#ef9a9a' }}>{fqty(totals.out_qty)}</td>
                  <td style={{ textAlign: 'right', color: '#ef9a9a' }}>{fmt(totals.out_val)}</td>
                  <td style={{ textAlign: 'right', color: '#ce93d8' }}>{fqty(totals.close_qty)}</td>
                  <td style={{ textAlign: 'right', color: '#ce93d8' }}>{fmt(totals.close_val)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <div style={{ padding: '10px 16px', fontSize: '12px', color: '#9e9e9e' }}>
          💡 Click vào tên hàng để xem sổ chi tiết giao dịch
        </div>
      </div>
    </div>
  );
}

// ---- SỔ CHI TIẾT VẬT TƯ ----
function StockDetail({ product, onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Không có dữ liệu mẫu — load từ DB
  const MOCK = [];

  const load = () => {
    setLoading(true);
    axios.get(`/api/reports/stock-detail/${product.code}`, { params: { month } })
      .then(r => setRows(r.data.data || r.data))
      .catch(() => setRows(MOCK))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [month, product.code]);

  const fmt = (n) => utils.formatMoney(n);
  const fqty = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 1 });

  // Tính tổng
  const totals = rows.reduce((acc, r) => ({
    in_qty:  acc.in_qty  + (r.in_qty  || 0),
    in_val:  acc.in_val  + (r.in_val  || 0),
    out_qty: acc.out_qty + (r.out_qty || 0),
    out_val: acc.out_val + (r.out_val || 0),
  }), { in_qty: 0, in_val: 0, out_qty: 0, out_val: 0 });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>← Quay lại</button>
        <div>
          <h3 style={{ color: '#e0e0e0', margin: 0 }}>SỔ CHI TIẾT VẬT TƯ HÀNG HÓA</h3>
          <div style={{ color: '#9e9e9e', fontSize: '13px' }}>
            Mã hàng: <strong style={{ color: '#f44336' }}>{product.code}</strong>
            &nbsp;—&nbsp;Tên hàng: <strong style={{ color: '#42a5f5' }}>{product.name}</strong>
            &nbsp;—&nbsp;ĐVT: {product.unit}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ color: '#9e9e9e', fontSize: '12px' }}>Tháng</label>
              <input className="search-input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={load} style={{ alignSelf: 'flex-end' }}>🔍 Xem</button>
            <button className="btn btn-secondary" onClick={() => exportDetailExcel(rows, product, month)} style={{ alignSelf: 'flex-end' }}>⬇ Xuất Excel</button>
          </div>
        </div>
      </div>

      {/* Bảng chi tiết */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Chi Tiết Giao Dịch — {product.name}</h3>
        </div>
        {loading ? <div className="loading">⏳ Đang tải...</div> : (
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 1000, fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#1a1a1a' }}>
                  <th rowSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>STT</th>
                  <th rowSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>Ngày CT</th>
                  <th rowSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>Số CT</th>
                  <th rowSpan="2" style={{ verticalAlign: 'middle' }}>Diễn giải</th>
                  <th rowSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>ĐVT</th>
                  <th rowSpan="2" style={{ textAlign: 'right', verticalAlign: 'middle' }}>Đơn giá</th>
                  <th colSpan="2" style={{ textAlign: 'center', background: '#2e7d32' }}>Nhập</th>
                  <th colSpan="2" style={{ textAlign: 'center', background: '#b71c1c' }}>Xuất</th>
                  <th colSpan="2" style={{ textAlign: 'center', background: '#4a148c' }}>Tồn</th>
                </tr>
                <tr style={{ background: '#1a1a1a' }}>
                  <th style={{ textAlign: 'right', background: '#2e7d32', opacity: 0.85 }}>Số lượng</th>
                  <th style={{ textAlign: 'right', background: '#2e7d32', opacity: 0.85 }}>Giá trị</th>
                  <th style={{ textAlign: 'right', background: '#b71c1c', opacity: 0.85 }}>Số lượng</th>
                  <th style={{ textAlign: 'right', background: '#b71c1c', opacity: 0.85 }}>Giá trị</th>
                  <th style={{ textAlign: 'right', background: '#4a148c', opacity: 0.85 }}>Số lượng</th>
                  <th style={{ textAlign: 'right', background: '#4a148c', opacity: 0.85 }}>Giá trị</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="12" style={{ textAlign: 'center', padding: '32px', color: '#9e9e9e' }}>Không có dữ liệu</td></tr>
                ) : rows.map((r, i) => {
                  const isIn  = r.in_qty  > 0;
                  const isOut = r.out_qty > 0;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#1a1a1a' }}>
                      <td style={{ textAlign: 'center', color: '#9e9e9e' }}>{i + 1}</td>
                      <td style={{ color: '#9e9e9e', whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td style={{ color: isIn ? '#66bb6a' : '#ef9a9a', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.doc_no}</td>
                      <td style={{ maxWidth: '280px' }}>{r.description}</td>
                      <td style={{ textAlign: 'center', color: '#9e9e9e' }}>{r.unit}</td>
                      <td style={{ textAlign: 'right', color: '#9e9e9e' }}>{fmt(r.unit_price)}</td>
                      <td style={{ textAlign: 'right', color: '#66bb6a', fontWeight: isIn ? 600 : 400 }}>{r.in_qty  > 0 ? fqty(r.in_qty)  : '—'}</td>
                      <td style={{ textAlign: 'right', color: '#66bb6a' }}>{r.in_val  > 0 ? fmt(r.in_val)  : '—'}</td>
                      <td style={{ textAlign: 'right', color: '#ef9a9a', fontWeight: isOut ? 600 : 400 }}>{r.out_qty > 0 ? fqty(r.out_qty) : '—'}</td>
                      <td style={{ textAlign: 'right', color: '#ef9a9a' }}>{r.out_val > 0 ? fmt(r.out_val) : '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: r.bal_qty < 0 ? '#f44336' : '#fff' }}>{fqty(r.bal_qty)}</td>
                      <td style={{ textAlign: 'right', color: r.bal_val < 0 ? '#f44336' : '#ce93d8' }}>{fmt(r.bal_val)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#2a2a2a', fontWeight: 700 }}>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#e0e0e0' }}>TỔNG CỘNG</td>
                  <td style={{ textAlign: 'right', color: '#66bb6a' }}>{fqty(totals.in_qty)}</td>
                  <td style={{ textAlign: 'right', color: '#66bb6a' }}>{fmt(totals.in_val)}</td>
                  <td style={{ textAlign: 'right', color: '#ef9a9a' }}>{fqty(totals.out_qty)}</td>
                  <td style={{ textAlign: 'right', color: '#ef9a9a' }}>{fmt(totals.out_val)}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- WRAPPER: điều hướng giữa tổng hợp và chi tiết ----
function StockLedger() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (selectedProduct) {
    return <StockDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} />;
  }
  return <StockSummary onViewDetail={setSelectedProduct} />;
}
