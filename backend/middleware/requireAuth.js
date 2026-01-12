const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

const requireAuth = async (req, res, next) => {
    // verify authentication
    const { authorization } = req.headers

    if (!authorization) {
        return res.status(401).json({
            error: 'Authorization token required'})
    }
    const token = authorization.split(' ')[1]

    try {
        const { id } = jwt.verify(token, process.env.SECRET)
    
        const user = await User.findById(id);
        if (!user) {
            return res.status(401).json({error: 'User not found'})
        }
        
        req.user = { id: user.id, role: user.role };
        next()
    }   catch (error) {
        console.log(error)
        return res.status(401).json({error: 'Request is not authorized'})
    }
}

module.exports = requireAuth;