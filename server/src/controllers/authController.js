const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const DataStore = require('../db/store');
const { JWT_SECRET } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/mailer');

const RESET_TOKEN_TTL_MINUTES = 30;
const MIN_PASSWORD_LENGTH = 6;
const FORGOT_PASSWORD_MESSAGE = 'If an account exists for that email, a reset link has been sent.';
const INVALID_RESET_MESSAGE = 'This reset link is invalid or has expired. Request a new one.';

function hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function buildResetUrl(rawToken) {
    const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
    return `${base}/reset-password?token=${rawToken}`;
}

function isValidResetToken(token) {
    return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
}

async function issueResetLink(user, ip) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
    await DataStore.createPasswordResetToken({ user_id: user.id, token_hash: hashToken(rawToken), expires_at });

    // Not awaited: response time must not reveal whether the account exists
    sendPasswordResetEmail({
        to: user.email,
        name: user.full_name,
        resetUrl: buildResetUrl(rawToken),
        expiresMinutes: RESET_TOKEN_TTL_MINUTES,
    }).catch((err) => console.error('[mailer] Password reset email failed:', err.message));

    await DataStore.logAudit({ user_id: user.id, action: 'PASSWORD_RESET_REQUESTED', details: {}, ip_address: ip });
}

const AuthController = {
    // Register New User (Donor by default, or with role)
    async register(req, res, next) {
        try {
            const { full_name, email, password, role = 'DONOR' } = req.body;

            if (!full_name || !email || !password) {
                return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
            }

            const existingUser = await DataStore.findUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
            }

            const normalizedRole = ['DONOR', 'COORDINATOR', 'STAFF', 'ADMIN'].includes(role) ? role : 'DONOR';
            const password_hash = await bcrypt.hash(password, 10);
            const user = await DataStore.createUser({
                full_name,
                email,
                password_hash,
                role: normalizedRole
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
            const { full_name } = req.body;
            const updated = await DataStore.updateUser(req.user.id, {
                ...(full_name && { full_name })
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

    // Forgot Password — same response whether or not the account exists
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            if (typeof email !== 'string' || !email.trim()) {
                return res.status(400).json({ success: false, message: 'Email is required.' });
            }

            const user = await DataStore.findUserByEmail(email.trim());
            if (user) {
                await issueResetLink(user, req.ip);
            }

            return res.status(200).json({ success: true, message: FORGOT_PASSWORD_MESSAGE });
        } catch (err) {
            next(err);
        }
    },

    // Reset Password — consumes a one-time token, signs out every existing session
    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;
            if (!isValidResetToken(token)) {
                return res.status(400).json({ success: false, message: INVALID_RESET_MESSAGE });
            }
            if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
                return res.status(400).json({
                    success: false,
                    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
                });
            }

            const password_hash = await bcrypt.hash(password, 10);
            const result = await DataStore.resetPasswordWithToken({ token_hash: hashToken(token), password_hash });
            if (!result) {
                return res.status(400).json({ success: false, message: INVALID_RESET_MESSAGE });
            }

            await DataStore.logAudit({
                user_id: result.user_id,
                action: 'PASSWORD_RESET_COMPLETED',
                details: {},
                ip_address: req.ip
            });

            return res.status(200).json({ success: true, message: 'Password updated. Please sign in.' });
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
