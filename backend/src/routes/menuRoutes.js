const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to view menu
router.get('/', getMenuItems);

// Owner-only routes for menu management
router.post('/', protect, authorize('OWNER'), createMenuItem);
router.put('/:id', protect, authorize('OWNER'), updateMenuItem);
router.delete('/:id', protect, authorize('OWNER'), deleteMenuItem);

module.exports = router;
