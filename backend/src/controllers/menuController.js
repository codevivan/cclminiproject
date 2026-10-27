const { query } = require('../config/db');

/**
 * @route   GET /api/menu
 * @desc    Get all menu items with optional category and search filters
 * @access  Public
 */
const getMenuItems = async (req, res) => {
  try {
    const { category, search, availableOnly } = req.query;
    let sql = 'SELECT * FROM menu_items WHERE 1=1';
    const params = [];

    if (availableOnly === 'true' || availableOnly === true) {
      sql += ' AND is_available = TRUE';
    }

    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim()) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY is_featured DESC, category ASC, name ASC';

    const items = await query(sql, params);
    return res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('getMenuItems error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve menu items.' });
  }
};

/**
 * @route   POST /api/menu
 * @desc    Add a new menu item
 * @access  Private (Admin only)
 */
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image_url, prep_time_minutes, is_featured, is_available } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Item name is required.' });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 1) {
      return res.status(400).json({ success: false, message: 'Price must be a valid positive number (at least ₹1).' });
    }

    const validCategories = ['Meals', 'Snacks', 'Beverages', 'Desserts'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const result = await query(
      'INSERT INTO menu_items (name, description, price, category, image_url, prep_time_minutes, is_featured, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name.trim(),
        description ? description.trim() : '',
        numPrice,
        category,
        image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        parseInt(prep_time_minutes) || 10,
        Boolean(is_featured),
        is_available !== undefined ? Boolean(is_available) : true
      ]
    );

    const [newItem] = await query('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: `Menu item "${newItem.name}" added successfully.`, data: newItem });
  } catch (error) {
    console.error('createMenuItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create menu item.' });
  }
};

/**
 * @route   PUT /api/menu/:id
 * @desc    Update a menu item or toggle availability / today's special
 * @access  Private (Admin only)
 */
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, prep_time_minutes, is_available, is_featured } = req.body;

    const [existing] = await query('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    let parsedPrice = null;
    if (price !== undefined) {
      parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 1) {
        return res.status(400).json({ success: false, message: 'Price must be a valid positive number (at least ₹1).' });
      }
    }

    const validCategories = ['Meals', 'Snacks', 'Beverages', 'Desserts'];
    if (category !== undefined && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    await query(
      `UPDATE menu_items 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           category = COALESCE(?, category),
           image_url = COALESCE(?, image_url),
           prep_time_minutes = COALESCE(?, prep_time_minutes),
           is_available = COALESCE(?, is_available),
           is_featured = COALESCE(?, is_featured)
       WHERE id = ?`,
      [
        name !== undefined ? name.trim() : null,
        description !== undefined ? description.trim() : null,
        parsedPrice !== null ? parsedPrice : null,
        category !== undefined ? category : null,
        image_url !== undefined ? image_url : null,
        prep_time_minutes !== undefined ? parseInt(prep_time_minutes) : null,
        is_available !== undefined ? Boolean(is_available) : null,
        is_featured !== undefined ? Boolean(is_featured) : null,
        id
      ]
    );

    const [updatedItem] = await query('SELECT * FROM menu_items WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: `Menu item "${updatedItem.name}" updated successfully.`, data: updatedItem });
  } catch (error) {
    console.error('updateMenuItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update menu item.' });
  }
};

/**
 * @route   DELETE /api/menu/:id
 * @desc    Delete a menu item while preserving all historical order records and receipts
 * @access  Private (Admin only)
 */
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await query('SELECT id, name FROM menu_items WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    // Historical protection: nullify reference in order_items so historical records, receipts, and order items are 100% preserved!
    await query('UPDATE order_items SET menu_item_id = NULL WHERE menu_item_id = ?', [id]);

    await query('DELETE FROM menu_items WHERE id = ?', [id]);
    return res.status(200).json({
      success: true,
      message: `Menu item "${existing.name}" deleted successfully. Historical orders and receipts are preserved.`
    });
  } catch (error) {
    console.error('deleteMenuItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete menu item.' });
  }
};

module.exports = {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
