const Inventory = require('../models/inventoryModel');
const { query: dbQuery } = require('../db');

// Generate report data for the specified date range
const generateReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      return res.status(400).json({ error: 'Start date cannot be greater than end date' });
    }

    // Get inventory additions (new items created within date range)
    const inventoryAdditions = await dbQuery(
      `SELECT id, name, quantity, type, description, rate, created_at, user_id 
       FROM products 
       WHERE created_at >= $1 AND created_at <= $2 
       ORDER BY created_at DESC`,
      [start, end]
    );

    // Parse numeric fields from PostgreSQL strings
    const items = inventoryAdditions.rows.map(item => ({
      ...item,
      quantity: parseInt(item.quantity),
      rate: item.rate ? parseFloat(item.rate) : 0
    }));

    // Calculate totals
    const totalInventoryQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalInventoryValue = items.reduce((sum, item) => sum + item.rate * item.quantity, 0);

    // Format response data
    const reportData = {
      dateRange: {
        startDate,
        endDate
      },
      inventory: {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          type: item.type,
          description: item.description,
          rate: item.rate,
          dateAdded: item.created_at,
          value: item.rate * item.quantity
        })),
        totalQuantity: totalInventoryQuantity,
        totalValue: totalInventoryValue
      },
      summary: {
        totalStockAdded: totalInventoryQuantity,
        totalInventoryValue: totalInventoryValue,
        numberOfItems: items.length
      }
    };

    res.status(200).json(reportData);

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

module.exports = {
  generateReport
};
