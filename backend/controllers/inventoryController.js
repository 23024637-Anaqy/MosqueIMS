const Inventory = require('../models/inventoryModel');

// GET all inventory items (shared among all users - from products table)
const getInventories = async (req, res) => {
  try {
    console.log('Fetching products from database...');
    
    const inventory = await Inventory.findAll();
    console.log('Found', inventory.length, 'products');
    
    // Log first item to see structure
    if (inventory.length > 0) {
      console.log('Sample product:', inventory[0]);
    }
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
};


// GET a single inventory item by ID
const getInventory = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const inventory = await Inventory.findById(id);
    
    if (!inventory) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
};


// CREATE a new inventory item in products table (Admin only)
const createInventory = async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can add new inventory items' });
  }

  const { name, sku, type, description, rate, quantity } = req.body;
  let emptyFields = [];

  if (!name) emptyFields.push('name');
  if (!sku) emptyFields.push('sku');
  if (!type) emptyFields.push('type');
  if (rate == null) emptyFields.push('rate'); // allow 0 rate
  if (quantity == null) emptyFields.push('quantity');

  if (emptyFields.length > 0) {
    return res.status(400).json({ error: 'Please fill in all fields', emptyFields });
  }

  try {
    const user_id = req.user.id;
    const inventory = await Inventory.create({
      name,
      sku,
      type,
      description,
      rate,
      quantity,
      user_id,
    });
    console.log('Created new product:', inventory);
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ error: error.message });
  }
};

// DELETE an inventory item (Admin only)
const deleteInventory = async (req, res) => {
  const { id } = req.params;

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete inventory items' });
  }

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'No such inventory item' });
  }

  try {
    const inventory = await Inventory.delete(id);
    if (!inventory) {
      return res.status(400).json({ error: 'Inventory item not found' });
    }
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE an inventory item
const updateInventory = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'No such inventory item' });
  }

  try {
    // Fetch existing inventory first
    const existingInventory = await Inventory.findById(id);
    if (!existingInventory) {
      return res.status(400).json({ error: 'Inventory item not found' });
    }

    const userRole = req.user.role;

    // Admin can edit everything
    if (userRole === 'admin') {
      // Merge existing user_id with req.body so user_id is not lost
      const updatedData = { ...req.body, user_id: existingInventory.user_id };

      const inventory = await Inventory.update(id, updatedData);

      return res.status(200).json(inventory);
    }

    // Staff restrictions
    if (userRole === 'staff') {
      // Check if item was created today (before midnight)
      const itemCreatedDate = new Date(existingInventory.created_at);
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
      const inventory = await Inventory.update(id, { quantity: req.body.quantity });

      return res.status(200).json(inventory);
    }

    // If role is neither admin nor staff
    return res.status(403).json({ error: 'Unauthorized role' });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


module.exports = {
  createInventory,
  getInventories,
  getInventory,
  deleteInventory,
  updateInventory,
};

