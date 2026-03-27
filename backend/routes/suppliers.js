const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [data] = await db.query('SELECT * FROM suppliers ORDER BY name');
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { code, name, contact_person, phone, email, address } = req.body;
  if (!code || !name || !phone) return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  try {
    const [r] = await db.query(
      'INSERT INTO suppliers (code,name,contact_person,phone,email,address) VALUES (?,?,?,?,?,?)',
      [code, name, contact_person || null, phone, email || null, address || null]
    );
    res.status(201).json({ message: 'Thêm nhà cung cấp thành công', id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Mã hoặc tên NCC đã tồn tại' });
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { code, name, contact_person, phone, email, address } = req.body;
  try {
    await db.query(
      'UPDATE suppliers SET code=?,name=?,contact_person=?,phone=?,email=?,address=? WHERE id=?',
      [code, name, contact_person || null, phone, email || null, address || null, req.params.id]
    );
    res.json({ message: 'Cập nhật thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[{ cnt }]] = await db.query(
      'SELECT COUNT(*) cnt FROM warehouse_receipts WHERE supplier_id=?', [req.params.id]
    );
    if (cnt > 0) return res.status(409).json({ message: 'Không thể xóa NCC đang có phiếu nhập' });
    await db.query('DELETE FROM suppliers WHERE id=?', [req.params.id]);
    res.json({ message: 'Đã xóa nhà cung cấp' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
