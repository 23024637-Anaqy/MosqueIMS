const express = require('express');
const router = express.Router();
const prototypeAuth = require('./prototypeAuth');
const { listInventory } = require('../prototypeDb');

// GET /api/reports?startDate=&endDate=
router.get('/', prototypeAuth, (req, res) => {
  // For prototype, reports aggregate simple inventory counts
  const items = listInventory();
  
  const totalQuantity = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  const totalValue = items.reduce((s, it) => s + ((Number(it.quantity) || 0) * (Number(it.rate) || 0)), 0);
  const lowStockItems = items.filter(it => (Number(it.quantity) || 0) < 10).length;
  
  const inventory = {
    items: items.map(item => ({
      name: item.name,
      sku: item.sku || item.id,
      type: item.type || 'General',
      quantity: Number(item.quantity) || 0,
      rate: Number(item.rate) || 0
    })),
    totalItems: items.length,
    totalQuantity,
    totalValue,
    lowStockItems
  };

  res.json({ 
    dateRange: { startDate: req.query.startDate, endDate: req.query.endDate }, 
    inventory,
    generatedAt: new Date().toISOString()
  });
});

module.exports = router;
