const express = require('express');
const router = express.Router();
const prototypeAuth = require('./prototypeAuth');
const { listDocuments, listInventory } = require('../prototypeDb');

// GET /api/dashboard/admin - admin dashboard
router.get('/admin', prototypeAuth, (req, res) => {
  const inventory = listInventory();
  const documents = listDocuments();
  
  res.json({
    summary: {
      totalItems: inventory.length,
      totalDocuments: documents.length,
      recentItems: inventory.slice(-5),
      recentDocuments: documents.slice(-5)
    }
  });
});

// GET /api/dashboard/staff - staff dashboard
router.get('/staff', prototypeAuth, (req, res) => {
  const inventory = listInventory();
  
  res.json({
    summary: {
      totalItems: inventory.length,
      recentItems: inventory.slice(-5)
    }
  });
});

module.exports = router;
