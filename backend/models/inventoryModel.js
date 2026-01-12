const { query } = require('../db');

class Inventory {
  // Helper function to convert PostgreSQL numeric strings to numbers
  static _parseProduct(product) {
    if (!product) return null;
    return {
      ...product,
      rate: product.rate ? parseFloat(product.rate) : null,
      quantity: parseInt(product.quantity),
      id: parseInt(product.id),
      user_id: product.user_id ? parseInt(product.user_id) : null
    };
  }

  // Create new inventory item
  static async create(data) {
    const { name, sku, type, description, rate, quantity, user_id } = data;
    
    const result = await query(
      `INSERT INTO products (name, sku, type, description, rate, quantity, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, sku || null, type, description || null, rate || null, quantity, user_id || null]
    );
    
    return this._parseProduct(result.rows[0]);
  }

  // Find all inventory items with optional filters
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.type) {
      sql += ` AND type = $${paramCount}`;
      params.push(filters.type);
      paramCount++;
    }

    if (filters.user_id) {
      sql += ` AND user_id = $${paramCount}`;
      params.push(filters.user_id);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows.map(row => this._parseProduct(row));
  }

  // Find inventory item by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    return this._parseProduct(result.rows[0]);
  }

  // Find inventory item by SKU
  static async findBySku(sku) {
    const result = await query(
      'SELECT * FROM products WHERE sku = $1',
      [sku]
    );
    return this._parseProduct(result.rows[0]);
  }

  // Update inventory item
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic UPDATE query
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw Error('No fields to update');
    }

    values.push(id);
    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(sql, values);
    return this._parseProduct(result.rows[0]);
  }

  // Delete inventory item
  static async delete(id) {
    const result = await query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );
    return this._parseProduct(result.rows[0]);
  }

  // Get low stock items (quantity < threshold)
  static async getLowStock(threshold = 10) {
    const result = await query(
      'SELECT * FROM products WHERE quantity < $1 ORDER BY quantity ASC',
      [threshold]
    );
    return result.rows.map(row => this._parseProduct(row));
  }

  // Get inventory by date range
  static async getByDateRange(startDate, endDate) {
    const result = await query(
      'SELECT * FROM products WHERE created_at BETWEEN $1 AND $2 ORDER BY created_at DESC',
      [startDate, endDate]
    );
    return result.rows.map(row => this._parseProduct(row));
  }

  // Get total inventory value
  static async getTotalValue() {
    const result = await query(
      'SELECT SUM(rate * quantity) as total_value FROM products WHERE rate IS NOT NULL'
    );
    return result.rows[0]?.total_value || 0;
  }

  // Get inventory statistics
  static async getStats() {
    const result = await query(
      `SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity,
        SUM(rate * quantity) as total_value,
        AVG(quantity) as avg_quantity
       FROM products`
    );
    return result.rows[0];
  }
}

module.exports = Inventory;
