const express = require('express');
const requireAuth = require('../middleware/requireAuth');

// controller functions
const {
    loginUser,
    signupUser,
    getCurrentUser
} = require('../controllers/userController');

const router = express.Router();

// login route
router.post('/login', loginUser);

// signup route
router.post('/signup', signupUser);

// get current user (requires auth)
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;