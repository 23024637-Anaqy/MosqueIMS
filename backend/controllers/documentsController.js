const Document = require('../models/documentModel');
const User = require('../models/userModel');
const { query: dbQuery } = require('../db');

// Get all documents for admin, only user's documents for non-admin
const getDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search, startDate, endDate } = req.query;
    const { id: userId, role } = req.user;

    // Build query
    let sql = `SELECT d.id, d.title, d.type, d.description, d.start_date, d.end_date, d.file_name, d.file_size, 
               d.generated_by, d.total_stock_added, d.total_sales_amount, d.total_items_sold, 
               d.number_of_orders, d.tags, d.is_archived, d.created_at, d.updated_at,
               u.name as generated_by_name, u.email as generated_by_email
               FROM documents d
               LEFT JOIN users u ON d.generated_by = u.id
               WHERE d.is_archived = false`;
    const params = [];
    let paramCount = 1;
    
    // Role-based access: admin sees all, users see only their own
    if (role !== 'admin') {
      sql += ` AND d.generated_by = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    // Filter by type
    if (type && type !== 'all') {
      sql += ` AND d.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    // Filter by date range
    if (startDate) {
      sql += ` AND d.created_at >= $${paramCount}`;
      params.push(new Date(startDate));
      paramCount++;
    }
    if (endDate) {
      sql += ` AND d.created_at <= $${paramCount}`;
      params.push(new Date(endDate));
      paramCount++;
    }

    // Text search
    if (search) {
      sql += ` AND (d.title ILIKE $${paramCount} OR d.description ILIKE $${paramCount} OR d.file_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Count total for pagination
    const countSql = `SELECT COUNT(*) FROM documents d WHERE d.is_archived = false` + 
                     (role !== 'admin' ? ` AND d.generated_by = ${userId}` : '');
    const countResult = await dbQuery(countSql, []);
    const total = parseInt(countResult.rows[0].count);

    // Add sorting and pagination
    sql += ' ORDER BY d.created_at DESC';
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await dbQuery(sql, params);

    // Format the response to match what frontend expects
    const documents = result.rows.map(doc => ({
      ...doc,
      generatedBy: {
        _id: doc.generated_by,
        name: doc.generated_by_name,
        email: doc.generated_by_email
      }
    }));

    res.status(200).json({
      documents,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Get a specific document by ID
const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    let sql = `SELECT d.*, u.name as generated_by_name, u.email as generated_by_email 
               FROM documents d 
               LEFT JOIN users u ON d.generated_by = u.id 
               WHERE d.id = $1`;
    const params = [id];
    
    // Role-based access: admin sees all, users see only their own
    if (role !== 'admin') {
      sql += ' AND d.generated_by = $2';
      params.push(userId);
    }

    const result = await dbQuery(sql, params);
    const document = result.rows[0];

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.status(200).json(document);

  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

// Save a new document
const saveDocument = async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      dateRange,
      fileData,
      fileName,
      fileSize,
      metadata,
      tags
    } = req.body;

    const { id: userId } = req.user;

    // Validate required fields
    if (!title || !type || !fileData || !fileName) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, type, fileData, fileName' 
      });
    }

    // Create new document
    const document = await Document.create({
      title,
      type,
      description: description || '',
      start_date: dateRange?.startDate || null,
      end_date: dateRange?.endDate || null,
      file_data: fileData,
      file_name: fileName,
      file_size: fileSize || 0,
      generated_by: userId,
      total_stock_added: metadata?.totalStockAdded || null,
      total_sales_amount: metadata?.totalSalesAmount || null,
      total_items_sold: metadata?.totalItemsSold || null,
      number_of_orders: metadata?.numberOfOrders || null,
      tags: tags || null
    });

    // Return document without file data for response
    const sql = `SELECT id, title, type, description, start_date, end_date, file_name, file_size, generated_by, total_stock_added, total_sales_amount, total_items_sold, number_of_orders, tags, is_archived, created_at, updated_at FROM documents WHERE id = $1`;
    const result = await dbQuery(sql, [document.id]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).json({ error: 'Failed to save document' });
  }
};

// Update document metadata (not file content)
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, type } = req.body;
    const { id: userId, role } = req.user;

    // Check if document exists and user has permission
    let checkSql = 'SELECT * FROM documents WHERE id = $1';
    const checkParams = [id];
    
    if (role !== 'admin') {
      checkSql += ' AND generated_by = $2';
      checkParams.push(userId);
    }

    const checkResult = await dbQuery(checkSql, checkParams);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Build update query
    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (tags) updates.tags = tags;
    if (type) updates.type = type;

    const document = await Document.update(id, updates);

    // Return without file data
    const sql = `SELECT id, title, type, description, start_date, end_date, file_name, file_size, generated_by, total_stock_added, total_sales_amount, total_items_sold, number_of_orders, tags, is_archived, created_at, updated_at FROM documents WHERE id = $1`;
    const result = await dbQuery(sql, [id]);

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

// Archive/unarchive document
const toggleArchiveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // Check if document exists and user has permission
    let checkSql = 'SELECT * FROM documents WHERE id = $1';
    const checkParams = [id];
    
    if (role !== 'admin') {
      checkSql += ' AND generated_by = $2';
      checkParams.push(userId);
    }

    const checkResult = await dbQuery(checkSql, checkParams);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const currentDoc = checkResult.rows[0];
    await Document.setArchived(id, !currentDoc.is_archived);

    // Return updated document without file data
    const sql = `SELECT id, title, type, description, start_date, end_date, file_name, file_size, generated_by, total_stock_added, total_sales_amount, total_items_sold, number_of_orders, tags, is_archived, created_at, updated_at FROM documents WHERE id = $1`;
    const result = await dbQuery(sql, [id]);

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Error archiving document:', error);
    res.status(500).json({ error: 'Failed to archive document' });
  }
};

// Delete document permanently (admin only)
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    // Only admin can permanently delete documents
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete documents' });
    }

    const document = await Document.delete(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.status(200).json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

// Download document file
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    let sql = 'SELECT file_data, file_name, file_size FROM documents WHERE id = $1';
    const params = [id];
    
    // Role-based access: admin can download all, users can download only their own
    if (role !== 'admin') {
      sql += ' AND generated_by = $2';
      params.push(userId);
    }

    const result = await dbQuery(sql, params);
    const document = result.rows[0];

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Return the file data as base64
    res.status(200).json({
      fileData: document.file_data,
      fileName: document.file_name,
      fileSize: document.file_size
    });

  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

// Get document statistics
const getDocumentStats = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let sql = `
      SELECT 
        COUNT(*) as total_documents,
        SUM(file_size) as total_size,
        json_agg(json_build_object('type', type, 'count', type_count, 'size', type_size)) as type_breakdown
      FROM (
        SELECT 
          type,
          COUNT(*) as type_count,
          SUM(file_size) as type_size
        FROM documents
        WHERE is_archived = false
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Role-based access: admin sees all, users see only their own
    if (role !== 'admin') {
      sql += ` AND generated_by = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    sql += `
        GROUP BY type
      ) sub
    `;

    const result = await dbQuery(sql, params);
    const stats = result.rows[0];

    const response = {
      totalDocuments: parseInt(stats.total_documents) || 0,
      totalSize: parseInt(stats.total_size) || 0,
      typeBreakdown: stats.type_breakdown || []
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ error: 'Failed to fetch document statistics' });
  }
};

module.exports = {
  getDocuments,
  getDocument,
  saveDocument,
  updateDocument,
  toggleArchiveDocument,
  deleteDocument,
  downloadDocument,
  getDocumentStats
};
