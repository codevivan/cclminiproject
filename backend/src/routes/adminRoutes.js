const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleUserStatus,
  getCanteenStatus,
  updateCanteenStatus,
  getCanteenReports
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route: students & visitors can see today's canteen operating status & notice
router.get('/canteen-status', getCanteenStatus);

// All routes below strictly require verified OWNER role
router.use(protect, authorize('OWNER'));

router.put('/canteen-status', updateCanteenStatus);
router.get('/reports', getCanteenReports);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;

