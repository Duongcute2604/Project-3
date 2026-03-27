require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ---- Middleware ----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Routes ----
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/categories',require('./routes/categories'));
app.use('/api/warehouse', require('./routes/warehouse'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/expenses',  require('./routes/finance'));
app.use('/api/reports',   require('./routes/reports'));

// ---- Health check ----
app.get('/api/ping', (req, res) => res.json({ ok: true, time: new Date() }));

// ---- 404 ----
app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} không tồn tại` }));

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Lỗi server' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));
