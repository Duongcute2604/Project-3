const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/reports/stock-summary?month=2024-06
router.get('/stock-summary', authMiddleware, async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'Thiếu tham số month (YYYY-MM)' });

  const [year, mon] = month.split('-');
  const startDate = `${year}-${mon}-01`;
  const endDate   = `${year}-${mon}-31`;

  try {
    const [products] = await db.query(
      `SELECT p.id, p.code, p.name, p.unit, p.price, COALESCE(i.quantity,0) close_qty
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       ORDER BY p.code`
    );

    // Gộp nhập/xuất trong tháng bằng 2 query thay vì N*3
    const [inRows] = await db.query(
      `SELECT product_id, SUM(quantity) qty, SUM(total_price) val
       FROM warehouse_receipts WHERE receipt_date BETWEEN ? AND ?
       GROUP BY product_id`, [startDate, endDate]
    );
    const [outRows] = await db.query(
      `SELECT product_id, SUM(quantity) qty, SUM(total_price) val
       FROM warehouse_issues WHERE issue_date BETWEEN ? AND ?
       GROUP BY product_id`, [startDate, endDate]
    );

    const inMap  = Object.fromEntries(inRows.map(r  => [r.product_id, r]));
    const outMap = Object.fromEntries(outRows.map(r => [r.product_id, r]));

    const data = products.map(p => {
      const close_qty = Number(p.close_qty);
      const in_qty    = Number(inMap[p.id]?.qty  || 0);
      const in_val    = Number(inMap[p.id]?.val  || 0);
      const out_qty   = Number(outMap[p.id]?.qty || 0);
      const out_val   = Number(outMap[p.id]?.val || 0);
      const open_qty  = close_qty - in_qty + out_qty;
      const price     = Number(p.price) || 0;
      // Tính giá trị theo giá sản phẩm nếu không có giá nhập/xuất
      const open_val  = open_qty  * price;
      const close_val = close_qty * price;

      if (open_qty === 0 && in_qty === 0 && out_qty === 0 && close_qty === 0) return null;

      return { code: p.code, name: p.name, unit: p.unit,
               open_qty, open_val, in_qty, in_val, out_qty, out_val, close_qty, close_val };
    }).filter(Boolean);

    res.json({ data, month });
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
    const [[orders]]    = await db.query(`SELECT COUNT(*) total, COALESCE(SUM(total_amount),0) revenue FROM orders WHERE order_status != 'cancelled'`);
    const [[pending]]   = await db.query(`SELECT COUNT(*) total FROM orders WHERE order_status = 'pending'`);
    const [[products]]  = await db.query('SELECT COUNT(*) total FROM products WHERE is_visible=1');
    const [[lowStock]]  = await db.query('SELECT COUNT(*) total FROM products p JOIN inventory i ON i.product_id=p.id WHERE i.quantity < p.min_stock AND p.min_stock > 0');
    const [[customers]] = await db.query('SELECT COUNT(*) total FROM customers');

    // Doanh thu hôm nay
    const [[today]] = await db.query(
      `SELECT COALESCE(SUM(total_amount),0) revenue FROM orders WHERE DATE(created_at) = CURDATE() AND order_status != 'cancelled'`
    );
    // Doanh thu tháng này
    const [[month]] = await db.query(
      `SELECT COALESCE(SUM(total_amount),0) revenue FROM orders WHERE DATE_FORMAT(created_at,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m') AND order_status != 'cancelled'`
    );
    // 5 đơn hàng mới nhất
    const [recentOrders] = await db.query(
      `SELECT id, code, customer_name customer, total_amount total, order_status status, created_at FROM orders ORDER BY created_at DESC LIMIT 5`
    );
    // Sản phẩm tồn kho thấp
    const [lowStockProducts] = await db.query(
      `SELECT p.name, i.quantity, p.min_stock, p.unit FROM products p JOIN inventory i ON i.product_id=p.id WHERE i.quantity < p.min_stock AND p.min_stock > 0 ORDER BY (i.quantity/p.min_stock) LIMIT 5`
    );
    // Doanh thu 7 ngày gần nhất
    const [revenue7] = await db.query(
      `SELECT DATE_FORMAT(created_at,'%d/%m') date, COALESCE(SUM(total_amount),0) revenue
       FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND order_status != 'cancelled'
       GROUP BY DATE(created_at) ORDER BY DATE(created_at)`
    );

    res.json({
      total_orders:       orders.total,
      total_revenue:      Number(orders.revenue),
      pending_orders:     pending.total,
      total_products:     products.total,
      low_stock_count:    lowStock.total,
      total_customers:    customers.total,
      today_revenue:      Number(today.revenue),
      month_revenue:      Number(month.revenue),
      recent_orders:      recentOrders,
      low_stock_products: lowStockProducts,
      revenue_7days:      revenue7.map(r => ({ date: r.date, revenue: Number(r.revenue) })),
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
