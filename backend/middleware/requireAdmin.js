const requireAdmin = async (req, res, next) => {
    // Check if user is authenticated and has admin role
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

module.exports = requireAdmin;
