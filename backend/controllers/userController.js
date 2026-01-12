const User = require('../models/userModel');
const jwt = require('jsonwebtoken')

const createToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.SECRET, { expiresIn: '3d' })
}
// login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.login(email, password);

        // create a token
        const token = createToken(user.id, user.role);

        res.status(200).json({ 
            email: user.email,
            name: user.name,
            role: user.role,
            token
            });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
// signup user
const signupUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const user = await User.signup(name, email, password, role);

        // create a token
        const token = createToken(user.id, user.role);

        res.status(200).json({ 
            email: user.email, 
            name: user.name,
            role: user.role,
            token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// get current user (for token validation on refresh)
const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by requireAuth middleware
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user data (token remains the same from header)
        res.status(200).json({
            email: user.email,
            name: user.name,
            role: user.role,
            token: req.user.token || req.headers.authorization?.split(' ')[1]
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = { signupUser, loginUser, getCurrentUser };