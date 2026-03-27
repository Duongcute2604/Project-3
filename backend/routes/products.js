const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/products
router.get('/', async (req, res) => {
  const { search = '', category_id = '', page = 1, limit = 20, admin } = req.query;
  const offset = (page - 1) * limit;
  let where = admin ? '' : 'WHERE p.is_visible = 1';
  const params = [];

  if (search) {
    where += (where ? ' AND' : 'WHERE') + ' (p.name LIKE ? OR p.code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category_id) {
    where += (where ? ' AND' : 'WHERE') + ' p.category_id = ?';
    params.push(category_id);
  }

  try {
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) total FROM products p ${where}`, params
    );
    const [data] = await db.query(
      `SELECT p.*, c.name category, i.quantity inventory_qty
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN inventory i  ON i.product_id = p.id
       ${where} ORDER BY p.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    // Gắn inventory object để frontend dùng item.inventory.quantity
    const rows = data.map(r => ({ ...r, inventory: { quantity: r.inventory_qty ?? 0 } }));
    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT p.*, c.name category, i.quantity inventory_qty
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN inventory i  ON i.product_id = p.id
       WHERE p.id = ?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json({ ...row, inventory: { quantity: row.inventory_qty ?? 0 } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/products
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { code, name, category_id, description, unit, price, min_stock = 0, is_visible = 1 } = req.body;
  if (!code || !name || !unit)
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  try {
    const [r] = await db.query(
      'INSERT INTO products (code,name,category_id,description,unit,price,min_stock,is_visible) VALUES (?,?,?,?,?,?,?,?)',
      [code, name, category_id || null, description || null, unit, price || 0, min_stock, is_visible ? 1 : 0]
    );
    // Tạo inventory row
    await db.query('INSERT INTO inventory (product_id, quantity) VALUES (?,0)', [r.insertId]);
    res.status(201).json({ message: 'Thêm sản phẩm thành công', id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Mã sản phẩm đã tồn tại' });
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/products/:id
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, category_id, description, unit, price, min_stock, is_visible } = req.body;
  try {
    await db.query(
      'UPDATE products SET name=?,category_id=?,description=?,unit=?,price=?,min_stock=?,is_visible=? WHERE id=?',
      [name, category_id || null, description || null, unit, price, min_stock ?? 0, is_visible ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Cập nhật thành công' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/products/:id/visibility
router.patch('/:id/visibility', authMiddleware, adminOnly, async (req, res) => {
  const { is_visible } = req.body;
  try {
    await db.query('UPDATE products SET is_visible=? WHERE id=?', [is_visible ? 1 : 0, req.params.id]);
    res.json({ message: 'Cập nhật trạng thái hiển thị thành công' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[{ cnt }]] = await db.query(
      'SELECT COUNT(*) cnt FROM order_items WHERE product_id=?', [req.params.id]
    );
    if (cnt > 0)
      return res.status(409).json({ message: 'Không thể xóa sản phẩm đang có đơn hàng' });
    await db.query('DELETE FROM products WHERE id=?', [req.params.id]);
    res.json({ message: 'Đã xóa sản phẩm' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
