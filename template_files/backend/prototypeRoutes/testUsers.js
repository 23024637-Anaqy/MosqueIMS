const express = require('express');
const router = express.Router();
const { getSeededUsers } = require('../prototypeSeed');

// GET test users for prototype demo login
router.get('/', (req, res) => {
  const seededUsers = getSeededUsers();
  if (!seededUsers) {
    return res.status(500).json({ error: 'Seeded users not available' });
  }
  
  res.json({
    testUsers: [
      { role: 'admin', userId: seededUsers.admin.id, name: seededUsers.admin.name },
      { role: 'staff', userId: seededUsers.staff.id, name: seededUsers.staff.name }
    ]
  });
});

module.exports = router;
