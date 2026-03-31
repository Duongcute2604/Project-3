// ============================================================
// ADMIN APP ROOT - CÔNG TY BK
// ============================================================

const { useState, useEffect, useCallback, useRef } = React;

// Kiểm tra quyền admin — không dùng alert, redirect thẳng
if (!auth.isLoggedIn()) {
  window.location.href = '../login.html?redirect=1';
} else if (!auth.isAdmin()) {
  window.location.href = '../customer/index.html';
}

const currentUser = auth.getUser();

// ============================================================
// CONSTANTS
// ============================================================
const MENU = [
  { key: 'dashboard',   icon: '📊', label: 'Tổng Quan' },
  { section: 'KHO HÀNG' },
  { key: 'inventory',   icon: '📦', label: 'Tồn Kho' },
  { key: 'receipts',    icon: '📥', label: 'Phiếu Nhập Kho' },
  { key: 'issues',      icon: '📤', label: 'Phiếu Xuất Kho' },
  { key: 'stocktake',   icon: '🔍', label: 'Kiểm Kê Kho' },
  { section: 'BÁN HÀNG' },
  { key: 'products',    icon: '🗂️', label: 'Sản Phẩm' },
  { key: 'categories',  icon: '🏷️', label: 'Danh Mục' },
  { key: 'orders',      icon: '🛒', label: 'Đơn Hàng' },
  { key: 'customers',   icon: '👥', label: 'Khách Hàng' },
  { section: 'TÀI CHÍNH' },
  { key: 'suppliers',   icon: '🏭', label: 'Nhà Cung Cấp' },
  { key: 'expenses',    icon: '💸', label: 'Chi Phí' },
  { key: 'payments',    icon: '💳', label: 'Thanh Toán' },
  { section: 'SỔ KHO' },
  { key: 'stock-ledger', icon: '🗄️', label: 'Tổng Hợp N-X-T' },
  { section: 'BÁO CÁO' },
  { key: 'rpt-revenue', icon: '📈', label: 'Doanh Thu' },
  { key: 'rpt-expense', icon: '📉', label: 'Chi Phí' },
  { key: 'rpt-stock',   icon: '📋', label: 'Tồn Kho' },
];

const PAGE_TITLES = {
  dashboard:    'Tổng Quan',
  inventory:    'Quản Lý Tồn Kho',
  receipts:     'Phiếu Nhập Kho',
  issues:       'Phiếu Xuất Kho',
  stocktake:    'Kiểm Kê Kho',
  products:     'Quản Lý Sản Phẩm',
  categories:   'Quản Lý Danh Mục',
  orders:       'Quản Lý Đơn Hàng',
  customers:    'Khách Hàng',
  suppliers:    'Nhà Cung Cấp',
  expenses:     'Chi Phí Vận Hành',
  payments:     'Theo Dõi Thanh Toán',
  'stock-ledger': 'Tổng Hợp Nhập Xuất Tồn',
  'rpt-revenue':'Báo Cáo Doanh Thu',
  'rpt-expense':'Báo Cáo Chi Phí',
  'rpt-stock':  'Báo Cáo Tồn Kho',
};

const STATUS_MAP = {
  pending:   { label: 'Chờ duyệt',  cls: 'badge-pending' },
  approved:  { label: 'Đã duyệt',   cls: 'badge-approved' },
  shipping:  { label: 'Đang giao',  cls: 'badge-shipping' },
  completed: { label: 'Hoàn thành', cls: 'badge-completed' },
  cancelled: { label: 'Đã hủy',     cls: 'badge-cancelled' },
};

const PAYMENT_STATUS = {
  unpaid:  { label: 'Chưa TT',    cls: 'badge-cancelled' },
  partial: { label: 'TT một phần', cls: 'badge-pending' },
  paid:    { label: 'Đã TT',      cls: 'badge-success' },
};

// ============================================================
// APP ROOT
// ============================================================
function AdminApp() {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard':   return <Dashboard setPage={setPage} />;
      case 'inventory':   return <Inventory />;
      case 'receipts':    return <Receipts />;
      case 'issues':      return <Issues />;
      case 'stocktake':   return <Stocktake />;
      case 'products':    return <Products />;
      case 'categories':  return <Categories />;
      case 'orders':      return <Orders />;
      case 'customers':   return <Customers />;
      case 'suppliers':   return <Suppliers />;
      case 'expenses':    return <Expenses />;
      case 'payments':    return <Payments />;
      case 'stock-ledger': return <StockLedger />;
      case 'rpt-revenue': return <ReportRevenue />;
      case 'rpt-expense': return <ReportExpense />;
      case 'rpt-stock':   return <ReportStock />;
      default:            return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar page={page} setPage={setPage} />
      <div className="main-content">
        <Topbar page={page} />
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<AdminApp />, document.getElementById('root'));
