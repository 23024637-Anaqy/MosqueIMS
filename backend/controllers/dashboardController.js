const Inventory = require('../models/inventoryModel');
const User = require('../models/userModel');
const { query: dbQuery } = require('../db');

// Get Admin Dashboard Data
const getAdminDashboardData = async (req, res) => {
  try {
    // Get current date and calculate date ranges
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Inventory Statistics
    const [totalProductsRes, lowStockRes, outOfStockRes, totalValueRes] = await Promise.all([
      dbQuery('SELECT COUNT(*) FROM products'),
      dbQuery('SELECT COUNT(*) FROM products WHERE quantity < 20 AND quantity > 0'),
      dbQuery('SELECT COUNT(*) FROM products WHERE quantity = 0'),
      dbQuery('SELECT SUM(quantity * rate) as total FROM products WHERE rate IS NOT NULL')
    ]);

    // Recent Products (last 10 added)
    const recentProductsRes = await dbQuery(
      'SELECT id, name, sku, quantity, rate, created_at FROM products ORDER BY created_at DESC LIMIT 10'
    );

    // Products added today
    const todayProductsRes = await dbQuery(
      'SELECT COUNT(*) FROM products WHERE created_at >= $1',
      [startOfToday]
    );

    // Products added this month
    const thisMonthProductsRes = await dbQuery(
      'SELECT COUNT(*) FROM products WHERE created_at >= $1',
      [startOfThisMonth]
    );

    // User Statistics
    const [totalUsersRes, adminUsersRes, staffUsersRes] = await Promise.all([
      dbQuery('SELECT COUNT(*) FROM users'),
      dbQuery('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']),
      dbQuery('SELECT COUNT(*) FROM users WHERE role = $1', ['staff'])
    ]);

    // Top items by quantity
    const topItemsRes = await dbQuery(
      'SELECT id, name, type, quantity, rate FROM products ORDER BY quantity DESC LIMIT 5'
    );

    // Format the response
    const dashboardData = {
      activityStats: {
        itemsAddedToday: parseInt(todayProductsRes.rows[0].count) || 0,
        itemsAddedThisMonth: parseInt(thisMonthProductsRes.rows[0].count) || 0
      },
      inventoryStats: {
        totalProducts: parseInt(totalProductsRes.rows[0].count) || 0,
        lowStock: parseInt(lowStockRes.rows[0].count) || 0,
        outOfStock: parseInt(outOfStockRes.rows[0].count) || 0,
        totalValue: parseFloat(totalValueRes.rows[0].total) || 0
      },
      userStats: {
        totalUsers: parseInt(totalUsersRes.rows[0].count) || 0,
        adminUsers: parseInt(adminUsersRes.rows[0].count) || 0,
        staffUsers: parseInt(staffUsersRes.rows[0].count) || 0
      },
      recentProducts: recentProductsRes.rows || [],
      topItems: topItemsRes.rows || []
    };

    res.status(200).json({
      message: 'Admin Dashboard Data',
      user: req.user,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// Get Staff Dashboard Data
const getStaffDashboardData = async (req, res) => {
  try {
    // Get current date and calculate date ranges
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Products added today
    const todayProductsRes = await dbQuery(
      'SELECT COUNT(*) FROM products WHERE created_at >= $1',
      [startOfToday]
    );

    // Products added this month
    const thisMonthProductsRes = await dbQuery(
      'SELECT COUNT(*) FROM products WHERE created_at >= $1',
      [startOfThisMonth]
    );

    // Inventory Statistics (limited)
    const [totalProductsRes, lowStockRes, outOfStockRes] = await Promise.all([
      dbQuery('SELECT COUNT(*) FROM products'),
      dbQuery('SELECT COUNT(*) FROM products WHERE quantity < 20 AND quantity > 0'),
      dbQuery('SELECT COUNT(*) FROM products WHERE quantity = 0')
    ]);

    // Recent Products (last 5)
    const recentProductsRes = await dbQuery(
      'SELECT id, name, sku, quantity, rate FROM products ORDER BY created_at DESC LIMIT 5'
    );

    // Products created by this staff member
    const myProductsRes = await dbQuery(
      'SELECT id, name, sku, quantity, rate, created_at FROM products WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );

    const dashboardData = {
      activityStats: {
        itemsAddedToday: parseInt(todayProductsRes.rows[0].count) || 0,
        itemsAddedThisMonth: parseInt(thisMonthProductsRes.rows[0].count) || 0
      },
      inventoryStats: {
        totalProducts: parseInt(totalProductsRes.rows[0].count) || 0,
        lowStock: parseInt(lowStockRes.rows[0].count) || 0,
        outOfStock: parseInt(outOfStockRes.rows[0].count) || 0
      },
      recentProducts: recentProductsRes.rows || [],
      myProducts: myProductsRes.rows || []
    };

    res.status(200).json({
      message: 'Staff Dashboard Data',
      user: req.user,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching staff dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

module.exports = {
  getAdminDashboardData,
  getStaffDashboardData
};
