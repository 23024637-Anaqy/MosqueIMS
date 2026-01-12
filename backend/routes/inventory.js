const express = require('express');
const {
  createInventory,
  getInventories,
  getInventory,
  deleteInventory,
  updateInventory
} = require('../controllers/inventoryController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Require auth for all inventory routes
router.use(requireAuth);

// GET all inventory items (both / and /items for compatibility)
router.get('/', getInventories);
router.get('/items', getInventories);

// GET a single inventory item
router.get('/items/:id', getInventory);

// POST a new inventory item (both / and /items for compatibility)
router.post('/', createInventory);
router.post('/items', createInventory);

// UPDATE an inventory item (both PUT and PATCH for compatibility)
router.put('/items/:id', updateInventory);
router.patch('/items/:id', updateInventory);

// DELETE an inventory item
router.delete('/items/:id', deleteInventory);

// Also support direct / routes for updates
router.put('/:id', updateInventory);
router.patch('/:id', updateInventory);

// Also support delete on /
router.delete('/:id', deleteInventory);

module.exports = router;
