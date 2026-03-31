const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ---- EXPENSES ----
router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) total FROM expenses');
    const [data] = await db.query(
      'SELECT * FROM expenses ORDER BY expense_date DESC LIMIT ? OFFSET ?',
      [Number(limit), Number(offset)]
    );
    res.json({ data, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { type, amount, expense_date, description } = req.body;
  if (!type || !amount || !expense_date)
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  try {
    const [r] = await db.query(
      'INSERT INTO expenses (type,amount,expense_date,description,created_by) VALUES (?,?,?,?,?)',
      [type, amount, expense_date, description || null, req.user.id]
    );
    res.status(201).json({ message: 'Thêm chi phí thành công', id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { type, amount, expense_date, description } = req.body;
  try {
    await db.query(
      'UPDATE expenses SET type=?,amount=?,expense_date=?,description=? WHERE id=?',
      [type, amount, expense_date, description || null, req.params.id]
    );
    res.json({ message: 'Cập nhật thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM expenses WHERE id=?', [req.params.id]);
    res.json({ message: 'Đã xóa' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
