const { query } = require('../config/db');

/**
 * Creates an in-app notification stored in MySQL
 * @param {Object} options
 * @param {number} options.userId - Target user ID (Student)
 * @param {number|null} options.orderId - Associated order ID if applicable
 * @param {string} options.title - Notification title
 * @param {string} options.message - Detailed notification description
 * @param {string} options.type - 'order_created' | 'payment_review' | 'payment_confirmed' | 'preparing' | 'ready' | 'completed' | 'info'
 */
const createNotification = async ({ userId, orderId = null, title, message, type = 'info' }) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, order_id, title, message, type)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, orderId, title, message, type]
    );
  } catch (err) {
    console.error('Failed to create in-app notification:', err.message);
  }
};

module.exports = { createNotification };
