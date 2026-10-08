const jwt = require('jsonwebtoken');
const DataStore = require('../db/store');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_blood_donation_coordinator_jwt_key_2026!';

// Authenticate user via JWT Bearer Token or Cookie
async function authenticate(req, res, next) {
    try {
        let token = null;

        // 1. Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // 2. Check cookies if available
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. No token provided.'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await DataStore.findUserById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User account not found or deactivated.'
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            blood_group: user.blood_group
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
    }
}

// Role Authorization Middleware (RBAC)
function authorizeRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role is ${req.user.role}.`
                });
            }
        }

        next();
    };
}

module.exports = {
    authenticate,
    authorizeRole,
    JWT_SECRET
};
