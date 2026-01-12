require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { pool, initializeDatabase } = require('./db');

// DB-backed routes only (prototype code moved to template_files)
const inventoryRoutes = require('./routes/inventory');
const userRoutes = require('./routes/user');
const reportsRoutes = require('./routes/reports');
const documentsRoutes = require('./routes/documents');
const dashboardRoutes = require('./routes/dashboard');
const requireAuth = require('./middleware/requireAuth');

// express app
const app = express();
   

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// routes (DB-backed only)
app.use('/api/user', userRoutes);
app.use(requireAuth);
app.use('/api/reports', reportsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);




// start server (connect to DB)
const startServer = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database');

    if (process.env.INIT_DB === 'true') {
      await initializeDatabase();
      console.log('Database schema initialized');
    }

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

startServer();