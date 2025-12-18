require('dotenv').config();
const cors = require("cors");

const express = require('express');
const mongoose = require('mongoose');

// Prototype (in-memory) routes
const prototypeInventoryRoutes = require('./prototypeRoutes/inventory');
const prototypeUserRoutes = require('./prototypeRoutes/user');
const prototypeReportsRoutes = require('./prototypeRoutes/reports');
const prototypeDocumentsRoutes = require('./prototypeRoutes/documents');
const prototypeDashboardRoutes = require('./prototypeRoutes/dashboard');
const prototypeTestUsersRoutes = require('./prototypeRoutes/testUsers');

// Determine mode first
const IS_PROTOTYPE = (process.env.PROTOTYPE === 'true') || !process.env.MONGO_URI;

// Only require DB routes if not in prototype mode
let inventoryRoutes, userRoutes, reportsRoutes, documentsRoutes, requireAuth;
if (!IS_PROTOTYPE) {
  inventoryRoutes = require('./routes/inventory');
  userRoutes = require('./routes/user');
  reportsRoutes = require('./routes/reports');
  documentsRoutes = require('./routes/documents');
  requireAuth = require('./middleware/requireAuth');
} else {
  requireAuth = require('./middleware/requireAuth');
}

// express app
const app = express();
   

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// IS_PROTOTYPE already determined above
if (IS_PROTOTYPE && process.env.PROTOTYPE !== 'true') {
  console.warn('MONGO_URI not provided — defaulting to PROTOTYPE (in-memory) mode for development/demo');
}


// routes
// If prototype mode enabled, mount lightweight in-memory endpoints
if (IS_PROTOTYPE) {
  console.log('Starting server in PROTOTYPE mode (in-memory DB)');

  // public prototype user routes (signup/login) mounted at /api/user for demo compatibility
  app.use('/api/user', prototypeUserRoutes);

  // test users endpoint (public, for demo purposes)
  app.use('/api/test-users', prototypeTestUsersRoutes);

  // protected prototype routes (prototype middleware inside modules)
  app.use('/api/reports', prototypeReportsRoutes);
  app.use('/api/documents', prototypeDocumentsRoutes);
  app.use('/api/inventory', prototypeInventoryRoutes);
  app.use('/api/dashboard', prototypeDashboardRoutes);

} else {
  // Normal (DB-backed) protected routes
  app.use('/api/user', userRoutes);
  app.use(requireAuth);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/documents', documentsRoutes);
  app.use('/api/inventory', inventoryRoutes);  // Changed from /api/inventories to /api/inventory

  // NOTE: The following features have been removed for the mosque prototype:
  // purchases, purchase-orders, receiving-receipts, sales, shipments, dashboard
}




// start server (connect to DB unless prototype mode enabled)
if (IS_PROTOTYPE) {
  // Auto-seed prototype data for demo
  try {
    const seed = require('./prototypeSeed');
    seed();
  } catch (err) {
    console.warn('Prototype seeder failed to run:', err.message || err);
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Prototype server listening on port ${port}`);
  });
} else {
  // connect to real DB
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      app.listen(process.env.PORT, () => {
        console.log('connected to db & listening on port', process.env.PORT);
      });
    })
    .catch((error) => {
      console.log(error);
    });
}
