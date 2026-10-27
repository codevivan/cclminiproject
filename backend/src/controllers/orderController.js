const { query, pool } = require('../config/db');
const { createNotification } = require('../utils/notificationHelper');
const { generateOrderReceiptPdf } = require('../utils/pdfReceiptGenerator');

/**
 * Generate a clean, readable token number for pickup (e.g. #T-104)
 */
/**
 * Generate a clean, readable token number for pickup (e.g. T001, T002...)
 * Guaranteed unique for today to prevent collisions
 */
const generateTokenNumber = async (conn) => {
  const runner = conn || pool;
  const [rows] = await runner.query(
    'SELECT COUNT(*) as todayCount FROM orders WHERE DATE(created_at) = CURDATE()'
  );
  let count = (rows && rows[0] ? rows[0].todayCount : 0) + 1;
  let candidate = `T${String(count).padStart(3, '0')}`;

  // Check candidate uniqueness for today
  let [existing] = await runner.query(
    'SELECT id FROM orders WHERE token_number = ? AND DATE(created_at) = CURDATE()',
    [candidate]
  );
  while (existing && existing.length > 0) {
    count++;
    candidate = `T${String(count).padStart(3, '0')}`;
    [existing] = await runner.query(
      'SELECT id FROM orders WHERE token_number = ? AND DATE(created_at) = CURDATE()',
      [candidate]
    );
  }
  return candidate;
};

/**
 * @route   GET /api/orders/payment-config
 * @desc    Get configured Canteen UPI details (without secrets)
 * @access  Public / Authenticated
 */
const getCanteenPaymentConfig = (req, res) => {
  return res.status(200).json({
    success: true,
    config: {
      canteen_name: process.env.CANTEEN_NAME || 'Campus Canteen',
      upi_id: process.env.CANTEEN_UPI_ID || 'canteen@okhdfcbank',
      upi_name: process.env.CANTEEN_UPI_NAME || 'Campus Canteen Billing'
    }
  });
};

/**
 * @route   POST /api/orders
 * @desc    Create a new canteen pre-order with digital token & payment selection
 * @access  Private (Student & Owner)
 */
const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { items, notes, payment_method, transaction_ref } = req.body;

    // Check today's canteen operating status
    const [canteenStatusRow] = await query(
      'SELECT status, notice FROM canteen_status WHERE status_date = CURDATE()'
    );
    if (canteenStatusRow && (canteenStatusRow.status === 'paused' || canteenStatusRow.status === 'closed')) {
      return res.status(403).json({
        success: false,
        message: canteenStatusRow.status === 'paused'
          ? `Online ordering is temporarily paused: ${canteenStatusRow.notice || 'Please check back shortly.'}`
          : `The canteen is closed for today: ${canteenStatusRow.notice || 'Orders are not being accepted.'}`
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Please select food items.' });
    }

    // Validate payment method
    const validMethods = ['UPI', 'Cash', 'Credit Card', 'Debit Card'];
    const chosenMethod = validMethods.includes(payment_method) ? payment_method : 'Cash';

    // Security: Payment status is determined strictly by the backend logic, never trusted from frontend!
    // If UPI: PENDING_VERIFICATION (needs Owner check)
    // If Cash / Card: PENDING (pay at counter)
    const paymentStatus = chosenMethod === 'UPI' ? 'PENDING_VERIFICATION' : 'PENDING';
    const cleanTxRef = chosenMethod === 'UPI' && transaction_ref ? String(transaction_ref).trim().substring(0, 100) : null;

    // Begin database transaction
    await connection.beginTransaction();

    let calculatedTotal = 0;
    const verifiedItems = [];
    const categoriesSeen = new Set();

    for (const item of items) {
      const { id: menuItemId, quantity } = item;
      const qty = parseInt(quantity) || 1;
      if (qty <= 0) continue;

      const [menuItem] = await connection.query(
        'SELECT id, name, price, category, is_available FROM menu_items WHERE id = ?',
        [menuItemId]
      );

      if (!menuItem || menuItem.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: `Menu item #${menuItemId} not found.` });
      }

      const dish = menuItem[0];
      if (!dish.is_available) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `"${dish.name}" is currently sold out.` });
      }

      const unitPrice = parseFloat(dish.price);
      const subtotal = unitPrice * qty;
      calculatedTotal += subtotal;
      categoriesSeen.add(dish.category);

      verifiedItems.push({
        menu_item_id: dish.id,
        item_name: dish.name,
        quantity: qty,
        unit_price: unitPrice,
        subtotal
      });
    }

    if (verifiedItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'No valid items found in order.' });
    }

    // Determine pickup counter based on categories ordered
    let pickupCounter = 'Bay #1 (Hot Meals)';
    if (categoriesSeen.has('Beverages') && categoriesSeen.size === 1) {
      pickupCounter = 'Beverages Bar (Counter 3)';
    } else if (categoriesSeen.has('Snacks') && !categoriesSeen.has('Meals')) {
      pickupCounter = 'Bay #2 (Snacks & Quick Bites)';
    }

    const tokenNumber = await generateTokenNumber(connection);
    const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Insert Order record with payment method & calculated total
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, token_number, receipt_number, status, payment_method, payment_status, transaction_ref, total_amount, pickup_counter, notes)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [userId, tokenNumber, receiptNumber, chosenMethod, paymentStatus, cleanTxRef, calculatedTotal, pickupCounter, notes || null]
    );

    const orderId = orderResult.insertId;

    // Insert Order Items
    for (const it of verifiedItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, it.menu_item_id, it.item_name, it.quantity, it.unit_price, it.subtotal]
      );
    }

    await connection.commit();

    // Trigger in-app notification for student
    if (chosenMethod === 'UPI') {
      await createNotification({
        userId,
        orderId,
        title: `Order Placed · Token #${tokenNumber}`,
        message: `Your pre-order for ₹${calculatedTotal.toFixed(2)} has been submitted. UPI payment is awaiting verification by canteen staff.`,
        type: 'payment_review'
      });
    } else {
      await createNotification({
        userId,
        orderId,
        title: `Order Placed · Token #${tokenNumber}`,
        message: `Your pre-order for ₹${calculatedTotal.toFixed(2)} has been placed with ${chosenMethod}. Please complete payment at the counter billing desk.`,
        type: 'order_created'
      });
    }

    // Trigger in-app notification for OWNER
    try {
      const owners = await query('SELECT id FROM users WHERE role = "OWNER"');
      for (const owner of owners) {
        await createNotification({
          userId: owner.id,
          orderId,
          title: `New Order Received · Token #${tokenNumber}`,
          message: `${req.user.name} placed order #${tokenNumber} (₹${calculatedTotal.toFixed(2)}) via ${chosenMethod}${chosenMethod === 'UPI' ? ' · UPI verification required.' : ' · Counter payment pending.'}`,
          type: chosenMethod === 'UPI' ? 'payment_review' : 'order_created'
        });
      }
    } catch (notifErr) {
      console.warn('Owner notification dispatch warning:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! Token issued.',
      order: {
        id: orderId,
        token_number: tokenNumber,
        receipt_number: receiptNumber,
        status: 'pending',
        payment_method: chosenMethod,
        payment_status: paymentStatus,
        transaction_ref: cleanTxRef,
        total_amount: calculatedTotal,
        pickup_counter: pickupCounter,
        notes: notes || null,
        created_at: new Date().toISOString(),
        items: verifiedItems
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('createOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to place order. Please try again.' });
  } finally {
    connection.release();
  }
};

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get order history and active tokens for logged-in user
 * @access  Private
 */
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await query(
      `SELECT o.id, o.token_number, o.receipt_number, o.status, o.payment_method, o.payment_status,
              o.transaction_ref, o.verified_at, o.total_amount, o.pickup_counter, o.notes, o.created_at, o.updated_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const items = await query(
        `SELECT oi.order_id, oi.id, oi.menu_item_id, oi.item_name, oi.quantity, oi.unit_price, oi.subtotal, m.image_url
         FROM order_items oi
         LEFT JOIN menu_items m ON oi.menu_item_id = m.id
         WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})`,
        orderIds
      );
      const itemsByOrderId = {};
      for (const item of items) {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push(item);
      }
      for (const ord of orders) {
        ord.items = itemsByOrderId[ord.id] || [];
      }
    }

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('getMyOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
};

/**
 * @route   GET /api/orders
 * @desc    Get all canteen orders (Admin only)
 * @access  Private (Admin)
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    let sql = `
      SELECT o.id, o.token_number, o.receipt_number, o.status, o.payment_method, o.payment_status,
             o.transaction_ref, o.verified_at, o.total_amount, o.pickup_counter, o.notes, o.created_at, o.updated_at,
             u.name as student_name, u.email as student_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      const lower = String(status).toLowerCase().trim();
      const mapped = lower === 'placed' ? 'pending' : (lower === 'ready_for_pickup' ? 'ready' : lower);
      sql += ' AND o.status = ?';
      params.push(mapped);
    }

    sql += ' ORDER BY FIELD(o.status, "pending", "confirmed", "preparing", "ready", "completed", "cancelled"), o.created_at DESC LIMIT ?';
    params.push(parseInt(limit) || 100);

    const orders = await query(sql, params);

    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const items = await query(
        `SELECT order_id, item_name, quantity, unit_price, subtotal FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
        orderIds
      );
      const itemsByOrderId = {};
      for (const item of items) {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push(item);
      }
      for (const ord of orders) {
        ord.items = itemsByOrderId[ord.id] || [];
      }
    }

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('getAllOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve canteen orders.' });
  }
};

/**
 * @route   GET /api/orders/payments
 * @desc    Get all payment records for Admin management
 * @access  Private (Admin)
 */
const getPaymentOrders = async (req, res) => {
  try {
    const { payment_status, payment_method, limit = 100 } = req.query;
    let sql = `
      SELECT o.id, o.token_number, o.receipt_number, o.status, o.payment_method, o.payment_status,
             o.transaction_ref, o.verified_by, o.verified_at, o.total_amount, o.created_at,
             u.name as student_name, u.email as student_email,
             admin_u.name as verified_by_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN users admin_u ON o.verified_by = admin_u.id
      WHERE 1=1
    `;
    const params = [];

    if (payment_status && payment_status !== 'all') {
      sql += ' AND o.payment_status = ?';
      params.push(payment_status);
    }

    if (payment_method && payment_method !== 'all') {
      sql += ' AND o.payment_method = ?';
      params.push(payment_method);
    }

    sql += ' ORDER BY FIELD(o.payment_status, "PENDING_VERIFICATION", "PENDING", "PAID"), o.created_at DESC LIMIT ?';
    params.push(parseInt(limit) || 100);

    const orders = await query(sql, params);

    for (const ord of orders) {
      ord.items = await query(
        'SELECT item_name, quantity, unit_price, subtotal FROM order_items WHERE order_id = ?',
        [ord.id]
      );
    }

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('getPaymentOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payment records.' });
  }
};

/**
 * @route   PATCH /api/orders/:id/confirm-payment
 * @desc    Verify UPI or Confirm Cash/Card payment at counter (Admin only)
 * @access  Private (Admin)
 */
const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const [order] = await query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.payment_status === 'PAID') {
      return res.status(400).json({ success: false, message: 'This payment has already been confirmed.' });
    }

    const verifiedAt = new Date();
    await query(
      'UPDATE orders SET payment_status = "PAID", verified_by = ?, verified_at = ? WHERE id = ?',
      [adminId, verifiedAt, id]
    );

    // Create student notification
    await createNotification({
      userId: order.user_id,
      orderId: order.id,
      title: `Payment Confirmed · Token #${order.token_number}`,
      message: `Your payment of ₹${parseFloat(order.total_amount).toFixed(2)} via ${order.payment_method} has been verified and confirmed! Your official paid receipt is ready for download.`,
      type: 'payment_confirmed'
    });

    return res.status(200).json({
      success: true,
      message: `Payment for Token #${order.token_number} confirmed successfully.`,
      orderId: id,
      payment_status: 'PAID',
      verified_at: verifiedAt
    });
  } catch (error) {
    console.error('confirmPayment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to confirm payment.' });
  }
};

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order preparation/pickup status (Owner only)
 * @access  Private (Owner)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const normalizeStatus = (s) => {
      if (!s) return null;
      const lower = String(s).trim().toLowerCase();
      if (lower === 'placed') return 'pending';
      if (lower === 'ready_for_pickup' || lower === 'ready-for-pickup') return 'ready';
      return lower;
    };

    const targetStatus = normalizeStatus(status);
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: PLACED/pending, CONFIRMED/confirmed, PREPARING/preparing, READY_FOR_PICKUP/ready, COMPLETED/completed, CANCELLED/cancelled`
      });
    }

    const [existing] = await query('SELECT id, user_id, status, token_number, pickup_counter FROM orders WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Status transition rules
    const current = existing.status;
    if (current === 'completed' && targetStatus !== 'completed') {
      return res.status(400).json({ success: false, message: 'Completed orders cannot be transitioned to another status.' });
    }
    if (current === 'cancelled' && targetStatus !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled orders cannot be reopened.' });
    }

    // Record the status update timestamp and the authorized Owner who made the change
    const updateResult = await query(
      'UPDATE orders SET status = ?, status_updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [targetStatus, req.user.id, id]
    );

    if (!updateResult || updateResult.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Database failed to update order status in MySQL.' });
    }

    // Send targeted in-app notification based on status to the student
    if (targetStatus === 'confirmed') {
      await createNotification({
        userId: existing.user_id,
        orderId: existing.id,
        title: `Order Accepted · Token #${existing.token_number}`,
        message: 'Your order has been accepted by the canteen team and queued for preparation.',
        type: 'order_created'
      });
    } else if (targetStatus === 'preparing') {
      await createNotification({
        userId: existing.user_id,
        orderId: existing.id,
        title: `Kitchen Preparing · Token #${existing.token_number}`,
        message: `Your food is now being freshly prepared for token #${existing.token_number}.`,
        type: 'preparing'
      });
    } else if (targetStatus === 'ready') {
      await createNotification({
        userId: existing.user_id,
        orderId: existing.id,
        title: `Order Ready for Pickup! · Token #${existing.token_number}`,
        message: `Your order #${existing.token_number} is ready for pickup. Please collect it from ${existing.pickup_counter || 'the counter'}.`,
        type: 'ready'
      });
    } else if (targetStatus === 'completed') {
      await createNotification({
        userId: existing.user_id,
        orderId: existing.id,
        title: `Order Completed · Token #${existing.token_number}`,
        message: `Order #${existing.token_number} has been completed. Thank you for ordering with us!`,
        type: 'completed'
      });
    } else if (targetStatus === 'cancelled') {
      await createNotification({
        userId: existing.user_id,
        orderId: existing.id,
        title: `Order Cancelled · Token #${existing.token_number}`,
        message: `Your order #${existing.token_number} was cancelled by canteen staff. Any payment made will be refunded.`,
        type: 'cancelled'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Token #${existing.token_number} status updated to "${targetStatus}".`,
      orderId: Number(id),
      newStatus: targetStatus,
      status: targetStatus
    });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
};

/**
 * @route   GET /api/orders/stats
 * @desc    Get real operational stats for Owner Dashboard (Confirmed revenue only counts PAID)
 * @access  Private (Owner)
 */
const getDashboardStats = async (req, res) => {
  try {
    const [todayCountRow] = await query(
      `SELECT
         COUNT(*) as count,
         COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as confirmed_revenue,
         COALESCE(SUM(CASE WHEN payment_status != 'PAID' AND status != 'cancelled' THEN total_amount ELSE 0 END), 0) as pending_revenue,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
         COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
         COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders,
         COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_orders,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
         COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
       FROM orders WHERE DATE(created_at) = CURDATE()`
    );

    const [activeRow] = await query(
      'SELECT COUNT(*) as count FROM orders WHERE status IN ("pending", "confirmed", "preparing") AND DATE(created_at) = CURDATE()'
    );
    const [readyRow] = await query(
      'SELECT COUNT(*) as count FROM orders WHERE status = "ready" AND DATE(created_at) = CURDATE()'
    );
    const [menuCountRow] = await query(
      'SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN is_available = TRUE THEN 1 ELSE 0 END), 0) as available FROM menu_items'
    );
    const [paymentStatsRow] = await query(
      `SELECT
         COUNT(CASE WHEN payment_status = 'PENDING_VERIFICATION' THEN 1 END) as pending_upi,
         COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) as pending_counter,
         COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as total_paid
       FROM orders`
    );

    const stats = todayCountRow || {};

    return res.status(200).json({
      success: true,
      stats: {
        todayOrders: stats.count || 0,
        todayRevenue: parseFloat(stats.confirmed_revenue || 0),
        todayPendingRevenue: parseFloat(stats.pending_revenue || 0),
        pendingOrders: (stats.pending_orders || 0) + (stats.confirmed_orders || 0),
        preparingOrders: stats.preparing_orders || 0,
        readyOrders: stats.ready_orders || 0,
        completedOrders: stats.completed_orders || 0,
        cancelledOrders: stats.cancelled_orders || 0,
        activeQueue: activeRow ? activeRow.count : 0,
        readyForPickup: readyRow ? readyRow.count : 0,
        totalMenuItems: menuCountRow ? menuCountRow.total : 0,
        availableMenuItems: menuCountRow ? menuCountRow.available : 0,
        pendingUpiVerifications: paymentStatsRow ? paymentStatsRow.pending_upi : 0,
        pendingCounterPayments: paymentStatsRow ? paymentStatsRow.pending_counter : 0,
        totalPaidOrders: paymentStatsRow ? paymentStatsRow.total_paid : 0
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details (Private: Student can ONLY view own order; Owner can view any)
 * @access  Private
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [order] = await query(
      `SELECT o.*, u.name as student_name, u.email as student_email,
              admin_u.name as verified_by_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN users admin_u ON o.verified_by = admin_u.id
       WHERE o.id = ?`,
      [id]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const isOwner = String(req.user.role).toUpperCase() === 'OWNER' || String(req.user.role).toUpperCase() === 'ADMIN';
    if (!isOwner && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view other students\' orders.'
      });
    }

    order.items = await query(
      'SELECT oi.*, m.image_url FROM order_items oi LEFT JOIN menu_items m ON oi.menu_item_id = m.id WHERE oi.order_id = ?',
      [id]
    );

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order details.' });
  }
};

/**
 * @route   GET /api/orders/:id/receipt
 * @desc    Stream professional PDF receipt for order
 * @access  Private (Student can download own receipt; Owner can download any)
 */
const downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const [order] = await query(
      `SELECT o.*, u.name as student_name, u.email as student_email,
              admin_u.name as verified_by_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN users admin_u ON o.verified_by = admin_u.id
       WHERE o.id = ?`,
      [id]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const isOwner = String(req.user.role).toUpperCase() === 'OWNER' || String(req.user.role).toUpperCase() === 'ADMIN';
    if (!isOwner && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    order.items = await query(
      'SELECT oi.* FROM order_items oi WHERE oi.order_id = ?',
      [id]
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${order.token_number}.pdf"`);

    await generateOrderReceiptPdf(order, res);
  } catch (error) {
    console.error('downloadReceipt error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate receipt PDF.' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats,
  confirmPayment,
  getPaymentOrders,
  downloadReceipt,
  getCanteenPaymentConfig
};
