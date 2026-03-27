const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/reports/stock-summary?month=2024-06
router.get('/stock-summary', authMiddleware, async (req, res) => {
  const { month } = req.query; // format: YYYY-MM
  if (!month) return res.status(400).json({ message: 'Thiếu tham số month (YYYY-MM)' });

  const [year, mon] = month.split('-');
  const startDate = `${year}-${mon}-01`;
  const endDate   = `${year}-${mon}-31`;

  try {
    // Lấy tất cả sản phẩm có giao dịch trong tháng hoặc có tồn kho
    const [products] = await db.query(
      `SELECT p.id, p.code, p.name, p.unit FROM products p ORDER BY p.code`
    );

    const rows = await Promise.all(products.map(async (p) => {
      // Tồn đầu kỳ = tồn hiện tại - nhập trong tháng + xuất trong tháng
      const [[inv]]     = await db.query('SELECT COALESCE(quantity,0) qty FROM inventory WHERE product_id=?', [p.id]);
      const [[inMonth]] = await db.query(
        'SELECT COALESCE(SUM(quantity),0) qty, COALESCE(SUM(total_price),0) val FROM warehouse_receipts WHERE product_id=? AND receipt_date BETWEEN ? AND ?',
        [p.id, startDate, endDate]
      );
      const [[outMonth]] = await db.query(
        'SELECT COALESCE(SUM(quantity),0) qty, COALESCE(SUM(total_price),0) val FROM warehouse_issues WHERE product_id=? AND issue_date BETWEEN ? AND ?',
        [p.id, startDate, endDate]
      );

      const close_qty = Number(inv.qty);
      const in_qty    = Number(inMonth.qty);
      const out_qty   = Number(outMonth.qty);
      const open_qty  = close_qty - in_qty + out_qty;

      // Bỏ qua sản phẩm không có giao dịch và tồn = 0
      if (open_qty === 0 && in_qty === 0 && out_qty === 0 && close_qty === 0) return null;

      return {
        code:      p.code,
        name:      p.name,
        unit:      p.unit,
        open_qty,  open_val:  0,
        in_qty,    in_val:    Number(inMonth.val),
        out_qty,   out_val:   Number(outMonth.val),
        close_qty, close_val: 0,
      };
    }));

    res.json({ data: rows.filter(Boolean), month });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/reports/stock-detail/:code?month=2024-06
router.get('/stock-detail/:code', authMiddleware, async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'Thiếu tham số month' });

  const [year, mon] = month.split('-');
  const startDate = `${year}-${mon}-01`;
  const endDate   = `${year}-${mon}-31`;

  try {
    const [[product]] = await db.query('SELECT * FROM products WHERE code=?', [req.params.code]);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const [receipts] = await db.query(
      `SELECT r.receipt_date date, r.code doc_no, CONCAT('Nhập - ', COALESCE(s.name,'')) description,
              r.unit, r.unit_price, r.quantity in_qty, r.total_price in_val, 0 out_qty, 0 out_val
       FROM warehouse_receipts r
       LEFT JOIN suppliers s ON s.id = r.supplier_id
       WHERE r.product_id=? AND r.receipt_date BETWEEN ? AND ?`,
      [product.id, startDate, endDate]
    );
    const [issues] = await db.query(
      `SELECT i.issue_date date, i.code doc_no, CONCAT('Xuất - ', i.reason) description,
              i.unit, i.unit_price, 0 in_qty, 0 in_val, i.quantity out_qty, i.total_price out_val
       FROM warehouse_issues i
       WHERE i.product_id=? AND i.issue_date BETWEEN ? AND ?`,
      [product.id, startDate, endDate]
    );

    // Gộp và sắp xếp theo ngày
    const rows = [...receipts, ...issues].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Tính tồn lũy kế
    let bal = 0;
    const data = rows.map(r => {
      bal += Number(r.in_qty) - Number(r.out_qty);
      return { ...r, bal_qty: bal, bal_val: 0 };
    });

    res.json({ data, product, month });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/reports/revenue?from=2024-06-01&to=2024-06-30
router.get('/revenue', authMiddleware, async (req, res) => {
  const { from, to, month } = req.query;
  try {
    let where = `WHERE o.order_status != 'cancelled'`;
    const params = [];
    if (from && to) {
      where += ` AND DATE(o.created_at) BETWEEN ? AND ?`;
      params.push(from, to);
    } else if (month) {
      where += ` AND DATE_FORMAT(o.created_at,'%Y-%m') = ?`;
      params.push(month);
    }

    const [[summary]] = await db.query(
      `SELECT COUNT(*) total_orders,
              COALESCE(SUM(o.total_amount),0) total_revenue,
              COUNT(CASE WHEN o.order_status='completed' THEN 1 END) completed_orders
       FROM orders o ${where}`, params
    );
    const [byDay] = await db.query(
      `SELECT DATE_FORMAT(o.created_at,'%d/%m') date,
              SUM(o.total_amount) revenue
       FROM orders o ${where}
       GROUP BY DATE(o.created_at) ORDER BY DATE(o.created_at)`, params
    );
    res.json({
      data: {
        total_revenue:    Number(summary.total_revenue),
        total_orders:     summary.total_orders,
        completed_orders: summary.completed_orders,
        by_day: byDay.map(r => ({ date: r.date, revenue: Number(r.revenue) })),
      }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/reports/expenses
router.get('/expenses', authMiddleware, async (req, res) => {
  try {
    const [[totals]] = await db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type='labor'    THEN amount END),0) total_labor,
        COALESCE(SUM(CASE WHEN type='shipping' THEN amount END),0) total_shipping,
        COALESCE(SUM(amount),0) total
       FROM expenses`
    );
    const [items] = await db.query(
      'SELECT * FROM expenses ORDER BY expense_date DESC LIMIT 100'
    );
    res.json({
      data: {
        total_labor:    Number(totals.total_labor),
        total_shipping: Number(totals.total_shipping),
        total:          Number(totals.total),
        items,
      }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/reports/inventory
router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    const [data] = await db.query(
      `SELECT p.code, p.name, p.unit, p.price, p.min_stock,
              COALESCE(i.quantity, 0) quantity,
              COALESCE(i.quantity, 0) * p.price total_value
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       ORDER BY p.code`
    );
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/reports/dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const [[orders]]   = await db.query(`SELECT COUNT(*) total, SUM(total_amount) revenue FROM orders WHERE order_status != 'cancelled'`);
    const [[products]] = await db.query('SELECT COUNT(*) total FROM products WHERE is_visible=1');
    const [[lowStock]] = await db.query('SELECT COUNT(*) total FROM products p JOIN inventory i ON i.product_id=p.id WHERE i.quantity < p.min_stock AND p.min_stock > 0');
    const [[customers]]= await db.query('SELECT COUNT(*) total FROM customers');
    res.json({
      total_orders:    orders.total,
      total_revenue:   orders.revenue || 0,
      total_products:  products.total,
      low_stock_count: lowStock.total,
      total_customers: customers.total,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
