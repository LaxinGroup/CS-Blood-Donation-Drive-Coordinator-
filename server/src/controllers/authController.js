const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DataStore = require('../db/store');
const { JWT_SECRET } = require('../middleware/auth');

const AuthController = {
    // Register New User (Donor by default, or with role)
    async register(req, res, next) {
        try {
            const { full_name, email, password, role = 'DONOR', blood_group, phone, date_of_birth } = req.body;

            if (!full_name || !email || !password) {
                return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
            }

            const existingUser = await DataStore.findUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
            }

            const password_hash = await bcrypt.hash(password, 10);
            const user = await DataStore.createUser({
                full_name,
                email,
                password_hash,
                role: ['DONOR', 'COORDINATOR', 'STAFF', 'ADMIN'].includes(role) ? role : 'DONOR',
                blood_group,
                phone,
                date_of_birth
            });

            // Issue JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            await DataStore.logAudit({
                user_id: user.id,
                action: 'USER_REGISTERED',
                details: { role: user.role, email: user.email },
                ip_address: req.ip
            });

            const { password_hash: _, ...safeUser } = user;
            return res.status(201).json({
                success: true,
                message: 'Account created successfully.',
                token,
                user: safeUser
            });
        } catch (err) {
            next(err);
        }
    },

    // User Login
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required.' });
            }

            const user = await DataStore.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            await DataStore.logAudit({
                user_id: user.id,
                action: 'USER_LOGIN',
                details: { role: user.role, email: user.email },
                ip_address: req.ip
            });

            const { password_hash: _, ...safeUser } = user;
            return res.status(200).json({
                success: true,
                message: 'Login successful.',
                token,
                user: safeUser
            });
        } catch (err) {
            next(err);
        }
    },

    // Get Current Authenticated User Profile
    async getMe(req, res, next) {
        try {
            const user = await DataStore.findUserById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const { password_hash, ...safeUser } = user;
            return res.status(200).json({
                success: true,
                user: safeUser
            });
        } catch (err) {
            next(err);
        }
    },

    // Update Profile
    async updateMe(req, res, next) {
        try {
            const { full_name, phone, blood_group, date_of_birth } = req.body;
            const updated = await DataStore.updateUser(req.user.id, {
                ...(full_name && { full_name }),
                ...(phone && { phone }),
                ...(blood_group && { blood_group }),
                ...(date_of_birth && { date_of_birth })
            });

            const { password_hash, ...safeUser } = updated;
            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully.',
                user: safeUser
            });
        } catch (err) {
            next(err);
        }
    },

    // Logout
    async logout(req, res) {
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });
    }
};

module.exports = AuthController;
