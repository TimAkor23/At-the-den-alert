const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Authorization header:', req.headers.authorization);
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }
    
    console.log('Token extracted (first 50 chars):', token.substring(0, 50) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      console.log('User not found');
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    console.log('User found:', req.user.email, 'Role:', req.user.role);
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ success: false, error: 'Not authorized, token failed' });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('=== ROLE CHECK DEBUG ===');
    console.log('User role:', req.user?.role);
    console.log('Allowed roles:', roles);
    
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`Access denied: ${req.user.role} not in [${roles}]`);
      return res.status(403).json({ 
        success: false, 
        error: `Access denied. ${req.user.role} role does not have permission for this action.` 
      });
    }
    
    console.log('Role check passed');
    next();
  };
};