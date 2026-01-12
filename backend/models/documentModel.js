const { query } = require('../db');

class Document {
  // Create new document
  static async create(data) {
    const {
      title,
      type,
      description,
      start_date,
      end_date,
      file_data,
      file_name,
      file_size,
      generated_by,
      total_stock_added,
      total_sales_amount,
      total_items_sold,
      number_of_orders,
      tags,
      is_archived
    } = data;
    
    const result = await query(
      `INSERT INTO documents (
        title, type, description, start_date, end_date, file_data, file_name, 
        file_size, generated_by, total_stock_added, total_sales_amount, 
        total_items_sold, number_of_orders, tags, is_archived
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING *`,
      [
        title,
        type,
        description || '',
        start_date || null,
        end_date || null,
        file_data,
        file_name,
        file_size,
        generated_by,
        total_stock_added || null,
        total_sales_amount || null,
        total_items_sold || null,
        number_of_orders || null,
        tags || null,
        is_archived || false
      ]
    );
    
    return result.rows[0];
  }

  // Find all documents with filters
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.type) {
      sql += ` AND type = $${paramCount}`;
      params.push(filters.type);
      paramCount++;
    }

    if (filters.generated_by) {
      sql += ` AND generated_by = $${paramCount}`;
      params.push(filters.generated_by);
      paramCount++;
    }

    if (filters.is_archived !== undefined) {
      sql += ` AND is_archived = $${paramCount}`;
      params.push(filters.is_archived);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  // Find document by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Find document by ID with user info
  static async findByIdWithUser(id) {
    const result = await query(
      `SELECT d.*, u.name as generated_by_name, u.email as generated_by_email 
       FROM documents d 
       LEFT JOIN users u ON d.generated_by = u.id 
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Update document
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
    const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(sql, values);
    return result.rows[0];
  }

  // Delete document
  static async delete(id) {
    const result = await query(
      'DELETE FROM documents WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // Archive/Unarchive document
  static async setArchived(id, isArchived) {
    const result = await query(
      'UPDATE documents SET is_archived = $1 WHERE id = $2 RETURNING *',
      [isArchived, id]
    );
    return result.rows[0];
  }

  // Get documents by date range
  static async getByDateRange(startDate, endDate, filters = {}) {
    let sql = 'SELECT * FROM documents WHERE created_at BETWEEN $1 AND $2';
    const params = [startDate, endDate];
    let paramCount = 3;

    if (filters.type) {
      sql += ` AND type = $${paramCount}`;
      params.push(filters.type);
      paramCount++;
    }

    if (filters.is_archived !== undefined) {
      sql += ` AND is_archived = $${paramCount}`;
      params.push(filters.is_archived);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  // Get documents by type
  static async getByType(type) {
    const result = await query(
      'SELECT * FROM documents WHERE type = $1 ORDER BY created_at DESC',
      [type]
    );
    return result.rows;
  }

  // Search documents
  static async search(searchTerm) {
    const result = await query(
      `SELECT * FROM documents 
       WHERE title ILIKE $1 OR description ILIKE $1 
       ORDER BY created_at DESC`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }
}

module.exports = Document;
