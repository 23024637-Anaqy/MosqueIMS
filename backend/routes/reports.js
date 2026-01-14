const express = require('express');
const router = express.Router();
const {
  generateReport
} = require('../controllers/reportsController');
const requireAdmin = require('../middleware/requireAdmin');

// GET reports data for a date range (admin only)
router.get('/', requireAdmin, generateReport);

module.exports = router;
