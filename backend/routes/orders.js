const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/orders
router.get('/', authMiddleware, async (req, res) => {
  const { search = '', order_status = '', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const conds = []; const params = [];
  if (search) { conds.push('(o.code LIKE ? OR o.customer_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (order_status) { conds.push('o.order_status = ?'); params.push(order_status); }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  try {
    const [[{ total }]] = await db.query(`SELECT COUNT(*) total FROM orders o ${where}`, params);
    const [data] = await db.query(
      `SELECT o.*, COALESCE(SUM(p.amount),0) paid_amount
       FROM orders o LEFT JOIN payments p ON p.order_id = o.id
       ${where} GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ data, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/orders/unpaid
router.get('/unpaid', authMiddleware, async (req, res) => {
  try {
    const [data] = await db.query(
      `SELECT o.*, COALESCE(SUM(p.amount),0) paid_amount
       FROM orders o LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.payment_status != 'paid' AND o.order_status != 'cancelled'
       GROUP BY o.id ORDER BY o.created_at DESC`
    );
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id=?', [req.params.id]);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id=?', [req.params.id]);
    res.json({ ...order, items });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/orders
router.post('/', authMiddleware, async (req, res) => {
  const { customer_name, customer_phone, customer_id, shipping_address,
          shipping_fee = 0, subtotal = 0, vat_amount = 0, total_amount,
          payment_method = 'transfer', note, items = [] } = req.body;
  if (!customer_name) return res.status(400).json({ message: 'Thiếu tên khách hàng' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) cnt FROM orders');
    const code = 'DH' + String(cnt + 1).padStart(5, '0');
    const total = total_amount || subtotal;

    const [r] = await conn.query(
      `INSERT INTO orders (code,customer_id,customer_name,customer_phone,shipping_address,
        shipping_fee,subtotal,vat_amount,total_amount,payment_method,note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [code, customer_id || null, customer_name, customer_phone || null,
       shipping_address || null, shipping_fee, subtotal, vat_amount, total, payment_method, note || null]
    );
    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id,product_id,product_name,unit,quantity,unit_price) VALUES (?,?,?,?,?,?)',
        [r.insertId, item.product_id || null, item.product_name, item.unit, item.quantity, item.unit_price]
      );
    }
    await conn.commit();
    res.status(201).json({ message: 'Tạo đơn hàng thành công', id: r.insertId, code });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  const { order_status } = req.body;
  try {
    const [[old]] = await db.query('SELECT order_status FROM orders WHERE id=?', [req.params.id]);
    await db.query('UPDATE orders SET order_status=? WHERE id=?', [order_status, req.params.id]);
    await db.query(
      'INSERT INTO order_status_logs (order_id,old_status,new_status,changed_by) VALUES (?,?,?,?)',
      [req.params.id, old?.order_status, order_status, req.user.id]
    );
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/orders/:id/payments
router.post('/:id/payments', authMiddleware, adminOnly, async (req, res) => {
  const { amount, method = 'transfer', payment_date, note } = req.body;
  if (!amount) return res.status(400).json({ message: 'Thiếu số tiền' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'INSERT INTO payments (order_id,amount,method,payment_date,confirmed_by,note) VALUES (?,?,?,?,?,?)',
      [req.params.id, amount, method, payment_date, req.user.id, note || null]
    );
    // Cập nhật payment_status
    const [[{ total_amount }]] = await conn.query('SELECT total_amount FROM orders WHERE id=?', [req.params.id]);
    const [[{ paid }]] = await conn.query('SELECT COALESCE(SUM(amount),0) paid FROM payments WHERE order_id=?', [req.params.id]);
    const status = paid >= total_amount ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    await conn.query('UPDATE orders SET payment_status=? WHERE id=?', [status, req.params.id]);
    await conn.commit();
    res.status(201).json({ message: 'Ghi nhận thanh toán thành công', payment_status: status });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
