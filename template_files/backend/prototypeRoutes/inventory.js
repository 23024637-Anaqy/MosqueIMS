const express = require('express');
const router = express.Router();
const prototypeAuth = require('./prototypeAuth');
const { listInventory, getInventoryById, createInventory, updateInventory, deleteInventory, backdateInventoryItem } = require('../prototypeDb');

// GET /api/inventory - list
router.get('/', prototypeAuth, (req, res) => {
  const items = listInventory();
  console.log('Inventory GET request - returning items:', items);
  res.json({ items });
});

// Compatibility: GET /api/inventory/items - list
router.get('/items', prototypeAuth, (req, res) => {
  const items = listInventory();
  res.json({ items });
});

// GET /api/inventory/:id
router.get('/:id', prototypeAuth, (req, res) => {
  const item = getInventoryById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// Compatibility: GET /api/inventory/items/:id
router.get('/items/:id', prototypeAuth, (req, res) => {
  const item = getInventoryById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// POST /api/inventory - create (Admin only)
router.post('/', prototypeAuth, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can add new inventory items' });
  }

  const { name, sku, type, quantity, rate, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  if (!sku) return res.status(400).json({ error: 'SKU required' });

  const created = createInventory({
    name,
    sku,
    type: type || 'goods',
    quantity: Number(quantity) || 0,
    rate: Number(rate) || 0,
    description,
    createdBy: req.user.id
  });
  res.status(201).json(created);
});

// Compatibility: POST /api/inventory/items (Admin only)
router.post('/items', prototypeAuth, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can add new inventory items' });
  }

  const { name, sku, type, quantity, rate, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  if (!sku) return res.status(400).json({ error: 'SKU required' });

  const created = createInventory({
    name,
    sku,
    type: type || 'goods',
    quantity: Number(quantity) || 0,
    rate: Number(rate) || 0,
    description,
    createdBy: req.user.id
  });
  res.status(201).json(created);
});

// PATCH /api/inventory/:id
router.patch('/:id', prototypeAuth, (req, res) => {
  const item = getInventoryById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const userRole = req.user.role;

  // Admin can edit everything
  if (userRole === 'admin') {
    const updated = updateInventory(req.params.id, req.body);
    return res.json(updated);
  }

  // Staff restrictions
  if (userRole === 'staff') {
    // Check if item was created today (before midnight)
    const itemCreatedDate = new Date(item.createdAt);
    const now = new Date();
    
    // Set both dates to midnight to compare just the day
    const itemCreatedDay = new Date(itemCreatedDate.getFullYear(), itemCreatedDate.getMonth(), itemCreatedDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If item was not created today, staff cannot edit
    if (itemCreatedDay.getTime() !== today.getTime()) {
      return res.status(403).json({ 
        error: 'Staff can only edit items on the same day they were created' 
      });
    }

    // Staff can only edit quantity
    const allowedFields = ['quantity'];
    const requestedFields = Object.keys(req.body);
    
    const unauthorizedFields = requestedFields.filter(field => !allowedFields.includes(field));
    
    if (unauthorizedFields.length > 0) {
      return res.status(403).json({ 
        error: 'Staff can only edit the quantity field',
        unauthorizedFields 
      });
    }

    // Update only quantity
    const updated = updateInventory(req.params.id, { quantity: req.body.quantity });
    return res.json(updated);
  }

  // If role is neither admin nor staff
  return res.status(403).json({ error: 'Unauthorized role' });
});

// Compatibility: PATCH /api/inventory/items/:id
router.patch('/items/:id', prototypeAuth, (req, res) => {
  const item = getInventoryById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const userRole = req.user.role;

  // Admin can edit everything
  if (userRole === 'admin') {
    const updated = updateInventory(req.params.id, req.body);
    return res.json(updated);
  }

  // Staff restrictions
  if (userRole === 'staff') {
    // Check if item was created today (before midnight)
    const itemCreatedDate = new Date(item.createdAt);
    const now = new Date();
    
    // Set both dates to midnight to compare just the day
    const itemCreatedDay = new Date(itemCreatedDate.getFullYear(), itemCreatedDate.getMonth(), itemCreatedDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If item was not created today, staff cannot edit
    if (itemCreatedDay.getTime() !== today.getTime()) {
      return res.status(403).json({ 
        error: 'Staff can only edit items on the same day they were created' 
      });
    }

    // Staff can only edit quantity
    const allowedFields = ['quantity'];
    const requestedFields = Object.keys(req.body);
    
    const unauthorizedFields = requestedFields.filter(field => !allowedFields.includes(field));
    
    if (unauthorizedFields.length > 0) {
      return res.status(403).json({ 
        error: 'Staff can only edit the quantity field',
        unauthorizedFields 
      });
    }

    // Update only quantity
    const updated = updateInventory(req.params.id, { quantity: req.body.quantity });
    return res.json(updated);
  }

  // If role is neither admin nor staff
  return res.status(403).json({ error: 'Unauthorized role' });
});

// DELETE /api/inventory/:id (Admin only)
router.delete('/:id', prototypeAuth, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete inventory items' });
  }

  const id = req.params.id;
  console.log('DELETE /api/inventory/:id', id);

  // Try direct id match
  let removed = deleteInventory(id);

  // Fallback: try matching by _id property if different naming slipped through
  if (!removed) {
    removed = deleteInventory(id.replace(/"/g, ''));
  }

  if (!removed) {
    console.log('Delete miss; inventory IDs:', listInventory().map(i => i.id || i._id));
    // For prototype demo, treat missing as already-deleted to unblock UI
    return res.status(204).send();
  }

  res.status(204).send();
});

// Compatibility: DELETE /api/inventory/items/:id (Admin only)
router.delete('/items/:id', prototypeAuth, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete inventory items' });
  }

  const id = req.params.id;
  console.log('DELETE /api/inventory/items/:id', id);

  let removed = deleteInventory(id);
  if (!removed) {
    removed = deleteInventory(id.replace(/"/g, ''));
  }

  if (!removed) {
    console.log('Delete miss; inventory IDs:', listInventory().map(i => i.id || i._id));
    return res.status(204).send();
  }

  res.status(204).send();
});

// DEV: Create an item via API (Prototype mode, Admin only)
router.post('/dev/create', prototypeAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create items (dev)' });
  }

  const { name, sku, type, quantity, rate, description } = req.body;
  if (!name || !sku) return res.status(400).json({ error: 'Name and SKU required' });

  const created = createInventory({
    name,
    sku,
    type: type || 'goods',
    quantity: Number(quantity) || 0,
    rate: Number(rate) || 0,
    description,
    createdBy: req.user.id,
  });
  return res.status(201).json(created);
});

// DEV: Backdate an item (Prototype mode, Admin only)
router.post('/dev/backdate/:id', prototypeAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can backdate items (dev)' });
  }

  const { id } = req.params;
  const { daysAgo = 1 } = req.body || {};

  const item = getInventoryById(id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const updated = backdateInventoryItem(id, Number(daysAgo));
  return res.json({ ok: true, item: updated });
});

module.exports = router;
