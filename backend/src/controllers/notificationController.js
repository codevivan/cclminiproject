const { query } = require('../config/db');

/**
 * @route   GET /api/notifications
 * @desc    Get logged-in user's in-app notifications
 * @access  Private
 */
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await query(
      `SELECT n.id, n.order_id, n.title, n.message, n.type, n.is_read, n.created_at,
              o.token_number
       FROM notifications n
       LEFT JOIN orders o ON n.order_id = o.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    const [unreadRow] = await query(
      'SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    return res.status(200).json({
      success: true,
      unreadCount: unreadRow ? unreadRow.unreadCount : 0,
      notifications
    });
  } catch (error) {
    console.error('getMyNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for user
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
