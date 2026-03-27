const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where = search ? 'WHERE full_name LIKE ? OR phone LIKE ? OR email LIKE ?' : '';
  const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
  try {
    const [[{ total }]] = await db.query(`SELECT COUNT(*) total FROM customers ${where}`, params);
    const [data] = await db.query(
      `SELECT * FROM customers ${where} ORDER BY full_name LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ data, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { full_name, phone, email, address, company } = req.body;
  if (!full_name || !phone) return res.status(400).json({ message: 'Thiếu họ tên và SĐT' });
  try {
    const [r] = await db.query(
      'INSERT INTO customers (full_name,phone,email,address,company) VALUES (?,?,?,?,?)',
      [full_name, phone, email || null, address || null, company || null]
    );
    res.status(201).json({ message: 'Thêm khách hàng thành công', id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { full_name, phone, email, address, company } = req.body;
  try {
    await db.query(
      'UPDATE customers SET full_name=?,phone=?,email=?,address=?,company=? WHERE id=?',
      [full_name, phone, email || null, address || null, company || null, req.params.id]
    );
    res.json({ message: 'Cập nhật thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.json({ message: 'Đã xóa khách hàng' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
