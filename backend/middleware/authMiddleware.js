const jwt = require('jsonwebtoken');
const jsonService = require('../services/jsonService');

const SECRET_KEY = process.env.JWT_SECRET || 'bettrion_jwt_secret_v2';

const supabase = require('../config/supabase');

const authMiddleware = {
    verifyToken: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token == null) return res.status(401).json({ message: 'No token provided' });

        // BYPASS FOR TESTING
        if (token === 'bypass_token') {
            req.user = { id: 'sudo_admin', role: 'admin' };
            return next();
        }

        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) return res.status(403).json({ message: 'Invalid Token' });
            req.user = user;
            next();
        });
    },

    isAdmin: async (req, res, next) => {
        // FAST PATH: Check Token
        if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
            return next();
        }

        // SLOW PATH: Check Database (Fallback for promoted users who haven't relogged)
        if (req.user && req.user.id) {
            try {
                const { data: user, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', req.user.id)
                    .single();

                if (!error && user && (user.role === 'admin' || user.role === 'owner')) {
                    // Update req.user for this request
                    req.user.role = user.role;
                    console.log(`[Admin Access] DB Role Override for ${req.user.id}`);
                    return next();
                }
            } catch (err) {
                console.error("DB Admin Check Error:", err);
            }
        }

        // WARN & BLOCK
        if (req.user) console.warn(`[Admin Blocked] User ${req.user.id} role: ${req.user.role}`);
        res.status(403).json({ message: 'Require Admin Role' });
    }
};

module.exports = authMiddleware;
