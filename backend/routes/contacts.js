const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// POST /api/contacts — khách gửi yêu cầu báo giá (không cần đăng nhập)
router.post('/', async (req, res) => {
  const { full_name, phone, email, product, message } = req.body;
  if (!full_name || !phone)
    return res.status(400).json({ message: 'Vui lòng nhập họ tên và số điện thoại' });
  try {
    const [r] = await db.query(
      'INSERT INTO contact_requests (full_name, phone, email, product, message) VALUES (?,?,?,?,?)',
      [full_name, phone, email || null, product || null, message || null]
    );
    res.status(201).json({ message: 'Gửi yêu cầu thành công', id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/contacts — admin xem danh sách
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  const { status = '', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where = status ? 'WHERE status = ?' : '';
  const params = status ? [status] : [];
  try {
    const [[{ total }]] = await db.query(`SELECT COUNT(*) total FROM contact_requests ${where}`, params);
    const [data] = await db.query(
      `SELECT * FROM contact_requests ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ data, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/contacts/:id/status — admin cập nhật trạng thái
router.patch('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE contact_requests SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ message: 'Cập nhật thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
