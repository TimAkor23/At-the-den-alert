const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');  // ✅ ADDED - for password hashing
const User = require('../models/User');

// Test route
router.get('/test', (req, res) => {
  console.log('✅ Test route hit!');  
  res.json({ success: true, message: 'Auth routes are working!' });
});

// Use the same secret key from .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-123';

// Middleware to protect routes
const protect = async (req, res, next) => {
    try {
        let token;
        
        console.log('\n=== AUTH MIDDLEWARE DEBUG ===');
        console.log('Authorization header:', req.headers.authorization);
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('Token extracted:', token);
            console.log('Token length:', token.length);
        } else {
            console.log('No authorization header found or invalid format');
        }

        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({ 
                success: false, 
                error: 'Not authorized to access this route' 
            });
        }

        try {
            console.log('JWT_SECRET being used:', process.env.JWT_SECRET);
            console.log('Attempting to verify token...');
            
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log('✅ Token verified successfully!');
            console.log('Decoded payload:', decoded);
            
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                console.log('❌ User not found for ID:', decoded.id);
                return res.status(401).json({ 
                    success: false, 
                    error: 'User not found' 
                });
            }
            
            console.log('✅ User found:', req.user.email);
            next();
        } catch (jwtError) {
            console.error('❌ JWT Verification Error:');
            console.error('Error name:', jwtError.name);
            console.error('Error message:', jwtError.message);
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid or expired token' 
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ 
            success: false, 
            error: 'Not authorized' 
        });
    }
};

// Register - ✅ FIXED with password hashing
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        console.log('📝 Registering user:', email);
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }
        
        // ✅ HASH THE PASSWORD BEFORE SAVING
        console.log('🟠 Hashing password...');
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('🟢 Password hashed successfully');
        
        // Create user with hashed password
        const user = await User.create({
            name,
            email,
            password: hashedPassword,  // Use hashed password, not plain text
            role: role || 'student'
        });
        
        console.log('✅ User registered:', user.email);
        
        // Generate token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
        
        res.json({ 
            success: true, 
            token, 
            data: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login - ✅ FIXED to use bcrypt.compare
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Login attempt for:', email);
        
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        // ✅ Use bcrypt.compare to check password
        console.log('Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('❌ Password incorrect');
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        console.log('✅ User logged in:', user.email);
        
        // Generate token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
        
        res.json({ 
            success: true, 
            token, 
            data: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get current user (GET request)
router.get('/me', protect, (req, res) => {
    try {
        console.log('📌 /me endpoint called for user:', req.user.email);
        res.json({ 
            success: true, 
            data: req.user
        });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test endpoint to verify token is working
router.get('/test-token', protect, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid!',
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

module.exports = router;