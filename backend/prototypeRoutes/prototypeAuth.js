const { findUserById } = require('../prototypeDb');

// Simple prototype auth: expects header Authorization: Bearer <userId>
const prototypeAuth = (req, res, next) => {
  const { authorization } = req.headers;
  console.log('Auth check - header:', authorization);
  if (!authorization) {
    console.log('No auth header');
    return res.status(401).json({ error: 'Authorization header required' });
  }
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('Malformed auth header:', parts);
    return res.status(401).json({ error: 'Malformed authorization header' });
  }

  const userId = parts[1];
  console.log('Looking up user:', userId);
  const user = findUserById(userId);
  if (!user) {
    console.log('User not found');
    return res.status(401).json({ error: 'Invalid prototype token' });
  }

  console.log('Auth success for user:', user.id, user.name);
  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
};

module.exports = prototypeAuth;
