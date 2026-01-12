const express = require('express');
const router = express.Router();
const { createUser, findUserByEmail } = require('../prototypeDb');
const prototypeAuth = require('./prototypeAuth');

// POST /api/proto/user/signup
router.post('/signup', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  if (findUserByEmail(email)) return res.status(400).json({ error: 'Email already in use' });

  const user = createUser({ name, email, password, role });

  // Return user and a simple token (user id)
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, token: user.id });
});

// POST /api/user/login - supports both email/password and userId
router.post('/login', (req, res) => {
  console.log('Login request body:', req.body);
  const { email, password, userId } = req.body;
  
  // If userId provided (prototype simple mode), use it directly
  if (userId && userId.trim()) {
    const { findUserById } = require('../prototypeDb');
    console.log('Attempting userId login with:', userId);
    const user = findUserById(userId);
    if (!user) {
      console.log('User not found for userId:', userId);
      return res.status(401).json({ error: 'Invalid user ID' });
    }
    console.log('User found:', user.id, user.name);
    const response = { id: user.id, name: user.name, email: user.email, role: user.role, token: user.id };
    console.log('Login response:', response);
    return res.json(response);
  }
  
  // Otherwise use email/password (compatibility mode)
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Missing fields' });
  }

  const user = findUserByEmail(email);
  if (!user || user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, token: user.id });
});

module.exports = router;

// GET /api/user/me - return authenticated user (prototype)
router.get('/me', prototypeAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(req.user);
});
