const express = require('express');
const router = express.Router();
const {
  getAdminDashboardData,
  getStaffDashboardData
} = require('../controllers/dashboardController');

// GET admin dashboard data
router.get('/admin', getAdminDashboardData);

// GET staff dashboard data
router.get('/staff', getStaffDashboardData);

module.exports = router;
