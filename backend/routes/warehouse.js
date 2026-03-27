const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ---- INVENTORY ----
router.get('/inventory', authMiddleware, async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where = search ? 'WHERE p.name LIKE ? OR p.code LIKE ?' : '';
  const params = search ? [`%${search}%`, `%${search}%`] : [];
  try {
    const [[{ total }]] = await db.query(`SELECT COUNT(*) total FROM products p ${where}`, params);
    const [data] = await db.query(
      `SELECT p.id product_id, p.code, p.name, c.name category,
              COALESCE(i.quantity,0) quantity, p.unit, p.min_stock, p.price
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN inventory i  ON i.product_id = p.id
       ${where} ORDER BY p.code LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ data, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ---- RECEIPTS ----
router.get('/receipts', authMiddleware, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) total FROM warehouse_receipts');
    const [data] = await db.query(
      `SELECT r.*, s.name supplier_name, p.name product_name, u.full_name created_by_name
       FROM warehouse_receipts r
       LEFT JOIN suppliers s ON s.id = r.supplier_id
       LEFT JOIN products  p ON p.id = r.product_id
       LEFT JOIN users     u ON u.id = r.created_by
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    res.json({ data, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/receipts', authMiddleware, adminOnly, async (req, res) => {
  const { supplier_id, product_id, quantity, unit, unit_price, receipt_date, note } = req.body;
  if (!product_id || !quantity || !receipt_date)
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Tạo mã phiếu tự động
    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) cnt FROM warehouse_receipts');
    const code = 'PN' + String(cnt + 1).padStart(4, '0');

    await conn.query(
      'INSERT INTO warehouse_receipts (code,supplier_id,product_id,quantity,unit,unit_price,receipt_date,note,created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [code, supplier_id || null, product_id, quantity, unit || 'kg', unit_price || 0, receipt_date, note || null, req.user.id]
    );
    // Cập nhật tồn kho
    await conn.query(
      'UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?',
      [quantity, product_id]
    );
    await conn.commit();
    res.status(201).json({ message: 'Tạo phiếu nhập thành công', code });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

// ---- ISSUES ----
router.get('/issues', authMiddleware, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) total FROM warehouse_issues');
    const [data] = await db.query(
      `SELECT r.*, p.name product_name, u.full_name created_by_name
       FROM warehouse_issues r
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN users    u ON u.id = r.created_by
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    res.json({ data, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/issues', authMiddleware, adminOnly, async (req, res) => {
  const { product_id, quantity, unit, unit_price = 0, reason, issue_date, note } = req.body;
  if (!product_id || !quantity || !reason || !issue_date)
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Kiểm tra tồn kho
    const [[inv]] = await conn.query('SELECT quantity FROM inventory WHERE product_id=?', [product_id]);
    if (!inv || inv.quantity < quantity)
      return res.status(400).json({ message: 'Tồn kho không đủ' });

    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) cnt FROM warehouse_issues');
    const code = 'PX' + String(cnt + 1).padStart(4, '0');

    await conn.query(
      'INSERT INTO warehouse_issues (code,product_id,quantity,unit,unit_price,reason,issue_date,note,created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [code, product_id, quantity, unit || 'kg', unit_price, reason, issue_date, note || null, req.user.id]
    );
    await conn.query(
      'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?',
      [quantity, product_id]
    );
    await conn.commit();
    res.status(201).json({ message: 'Tạo phiếu xuất thành công', code });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

// ---- STOCKTAKES ----
router.get('/stocktakes', authMiddleware, async (req, res) => {
  try {
    const [data] = await db.query(
      `SELECT s.*, u.full_name created_by_name,
              (SELECT COUNT(*) FROM stocktake_items si WHERE si.stocktake_id = s.id) item_count
       FROM stocktakes s
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY s.created_at DESC`
    );
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/stocktakes', authMiddleware, adminOnly, async (req, res) => {
  const { note, items } = req.body;
  if (!items || !items.length)
    return res.status(400).json({ message: 'Cần ít nhất 1 sản phẩm kiểm kê' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) cnt FROM stocktakes');
    const code = 'KK' + String(cnt + 1).padStart(4, '0');
    const [r] = await conn.query(
      'INSERT INTO stocktakes (code, note, created_by) VALUES (?,?,?)',
      [code, note || null, req.user.id]
    );
    for (const item of items) {
      const [[inv]] = await conn.query('SELECT quantity FROM inventory WHERE product_id=?', [item.product_id]);
      await conn.query(
        'INSERT INTO stocktake_items (stocktake_id,product_id,system_quantity,actual_quantity,reason) VALUES (?,?,?,?,?)',
        [r.insertId, item.product_id, inv?.quantity ?? 0, item.actual_quantity, item.reason || null]
      );
    }
    await conn.commit();
    res.status(201).json({ message: 'Tạo phiếu kiểm kê thành công', code });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

router.put('/stocktakes/:id/confirm', authMiddleware, adminOnly, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [items] = await conn.query(
      'SELECT * FROM stocktake_items WHERE stocktake_id=?', [req.params.id]
    );
    for (const item of items) {
      await conn.query(
        'UPDATE inventory SET quantity=? WHERE product_id=?',
        [item.actual_quantity, item.product_id]
      );
    }
    await conn.query(
      'UPDATE stocktakes SET confirmed_at=NOW() WHERE id=?', [req.params.id]
    );
    await conn.commit();
    res.json({ message: 'Đã xác nhận kiểm kê và cập nhật tồn kho' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
