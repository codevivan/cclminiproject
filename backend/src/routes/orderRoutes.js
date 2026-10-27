const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public/Authenticated config route
router.get('/payment-config', getCanteenPaymentConfig);

// Specific named routes (BEFORE :id wildcard)
router.get('/my-orders', protect, getMyOrders);
router.get('/stats', protect, authorize('OWNER'), getDashboardStats);
router.get('/admin/payments', protect, authorize('OWNER'), getPaymentOrders);

// Order creation & admin collection
router.post('/', protect, createOrder);
router.get('/', protect, authorize('OWNER'), getAllOrders);

// Param routes (:id)
router.get('/:id', protect, getOrderById);
router.get('/:id/receipt', protect, downloadReceipt);
router.patch('/:id/status', protect, authorize('OWNER'), updateOrderStatus);
router.patch('/:id/confirm-payment', protect, authorize('OWNER'), confirmPayment);

module.exports = router;
