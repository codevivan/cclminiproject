const { query } = require('../config/db');

/**
 * @route   GET /api/admin/users
 * @desc    View all registered accounts and roles (never exposes passwords/hashes)
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    let sql = 'SELECT id, name, email, role, is_active, auth_provider, avatar_url, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (role && role !== 'all') {
      const upper = role.toUpperCase();
      const target = upper === 'ADMIN' ? 'OWNER' : upper;
      sql += ' AND role = ?';
      params.push(target);
    }

    if (search && search.trim()) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY FIELD(role, "OWNER", "STUDENT"), created_at DESC';

    const users = await query(sql, params);
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user accounts.' });
  }
};

/**
 * @route   PATCH /api/admin/users/:id/toggle-status
 * @desc    Deactivate or reactivate a student account (Owner account protected)
 * @access  Private (Owner only)
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'The Owner cannot deactivate their own account.' });
    }

    const [user] = await query('SELECT id, name, role, is_active FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (user.role === 'OWNER') {
      return res.status(400).json({ success: false, message: 'The master OWNER account cannot be deactivated.' });
    }

    const newStatus = !user.is_active;
    await query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

    return res.status(200).json({
      success: true,
      message: `Account for ${user.name} is now ${newStatus ? 'Active' : 'Deactivated'}.`,
      userId: id,
      isActive: newStatus
    });
  } catch (error) {
    console.error('toggleUserStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

/**
 * @route   GET /api/admin/canteen-status
 * @desc    Get today's canteen operating status & notice
 * @access  Public / Authenticated
 */
const getCanteenStatus = async (req, res) => {
  try {
    const [statusRow] = await query(
      'SELECT * FROM canteen_status WHERE status_date = CURDATE()'
    );

    if (statusRow) {
      return res.status(200).json({ success: true, status: statusRow });
    }

    // Default status if not yet set today
    return res.status(200).json({
      success: true,
      status: {
        status: 'open',
        notice: 'Welcome! Online food pre-orders are open today.',
        opening_time: '08:00',
        closing_time: '20:00',
        status_date: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('getCanteenStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch canteen operating status.' });
  }
};

/**
 * @route   PUT /api/admin/canteen-status
 * @desc    Update today's canteen operating status & notice (Admin only)
 * @access  Private (Admin only)
 */
const updateCanteenStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { status, notice, opening_time, closing_time } = req.body;

    const validStatuses = ['open', 'paused', 'closing_soon', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    await query(
      `INSERT INTO canteen_status (status_date, status, notice, opening_time, closing_time, updated_by)
       VALUES (CURDATE(), ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         notice = VALUES(notice),
         opening_time = VALUES(opening_time),
         closing_time = VALUES(closing_time),
         updated_by = VALUES(updated_by)`,
      [
        status,
        notice !== undefined ? notice.trim() : '',
        opening_time || '08:00',
        closing_time || '20:00',
        adminId
      ]
    );

    const [updated] = await query('SELECT * FROM canteen_status WHERE status_date = CURDATE()');

    return res.status(200).json({
      success: true,
      message: `Canteen status updated to "${status.replace('_', ' ').toUpperCase()}".`,
      status: updated
    });
  } catch (error) {
    console.error('updateCanteenStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update canteen status.' });
  }
};

/**
 * @route   GET /api/admin/reports
 * @desc    Get detailed sales, order breakdown & reports from real database data
 * @access  Private (Admin only)
 */
const getCanteenReports = async (req, res) => {
  try {
    // 1. Time-based sales metrics (Confirmed revenue: only PAID payments!)
    const [todaySales] = await query(
      `SELECT COUNT(*) as orders,
              COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as revenue,
              COALESCE(SUM(CASE WHEN payment_status != 'PAID' THEN total_amount ELSE 0 END), 0) as pending_revenue
       FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled'`
    );

    const [weekSales] = await query(
      `SELECT COUNT(*) as orders,
              COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as revenue,
              COALESCE(SUM(CASE WHEN payment_status != 'PAID' THEN total_amount ELSE 0 END), 0) as pending_revenue
       FROM orders WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) AND status != 'cancelled'`
    );

    const [monthSales] = await query(
      `SELECT COUNT(*) as orders,
              COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as revenue,
              COALESCE(SUM(CASE WHEN payment_status != 'PAID' THEN total_amount ELSE 0 END), 0) as pending_revenue
       FROM orders WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND status != 'cancelled'`
    );

    const [allTimeSales] = await query(
      `SELECT COUNT(*) as orders,
              COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as revenue,
              COALESCE(SUM(CASE WHEN payment_status != 'PAID' THEN total_amount ELSE 0 END), 0) as pending_revenue
       FROM orders WHERE status != 'cancelled'`
    );

    // 2. Status distribution
    const statusCounts = await query(
      `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
    );

    // 3. Payment method distribution (with confirmed vs pending)
    const paymentMethods = await query(
      `SELECT payment_method,
              COUNT(*) as count,
              COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as confirmed_revenue,
              COALESCE(SUM(CASE WHEN payment_status != 'PAID' THEN total_amount ELSE 0 END), 0) as pending_revenue,
              COALESCE(SUM(total_amount), 0) as total_amount
       FROM orders WHERE status != 'cancelled'
       GROUP BY payment_method`
    );

    // 4. Top 5 selling menu items
    const topItems = await query(
      `SELECT oi.item_name, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
       GROUP BY oi.item_name
       ORDER BY total_sold DESC
       LIMIT 5`
    );

    // 5. Recent completed orders
    const recentCompleted = await query(
      `SELECT o.id, o.token_number, o.receipt_number, o.total_amount, o.payment_method, o.payment_status, o.created_at, u.name as student_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status = 'completed'
       ORDER BY o.updated_at DESC
       LIMIT 5`
    );

    return res.status(200).json({
      success: true,
      reports: {
        summary: {
          todayOrders: todaySales.orders || 0,
          todayRevenue: parseFloat(todaySales.revenue || 0),
          todayPendingRevenue: parseFloat(todaySales.pending_revenue || 0),
          weekOrders: weekSales.orders || 0,
          weekRevenue: parseFloat(weekSales.revenue || 0),
          weekPendingRevenue: parseFloat(weekSales.pending_revenue || 0),
          monthOrders: monthSales.orders || 0,
          monthRevenue: parseFloat(monthSales.revenue || 0),
          monthPendingRevenue: parseFloat(monthSales.pending_revenue || 0),
          allTimeOrders: allTimeSales.orders || 0,
          allTimeRevenue: parseFloat(allTimeSales.revenue || 0),
          allTimePendingRevenue: parseFloat(allTimeSales.pending_revenue || 0)
        },
        statusCounts,
        paymentMethods,
        topItems,
        recentCompleted
      }
    });
  } catch (error) {
    console.error('getCanteenReports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate canteen reports.' });
  }
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  getCanteenStatus,
  updateCanteenStatus,
  getCanteenReports
};
