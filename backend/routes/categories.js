const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [data] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' });
  try {
    const [r] = await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
    res.status(201).json({ message: 'Thêm danh mục thành công', id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Tên danh mục đã tồn tại' });
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name } = req.body;
  try {
    await db.query('UPDATE categories SET name=? WHERE id=?', [name, req.params.id]);
    res.json({ message: 'Cập nhật thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) cnt FROM products WHERE category_id=?', [req.params.id]);
    if (cnt > 0) return res.status(409).json({ message: 'Không thể xóa danh mục đang có sản phẩm' });
    await db.query('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ message: 'Đã xóa danh mục' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
