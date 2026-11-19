// Sign-up, sign-in, sign-out, email verification and password reset are handled by Neon Auth.
// This controller only links a verified Neon identity to the app's users row and serves the profile.
const DataStore = require('../db/store');

function auditActionFor({ linked, created }) {
    if (linked) return 'USER_LINKED';
    if (created) return 'USER_REGISTERED';
    return null;
}

const AuthController = {
    // POST /api/auth/profile — idempotent; safe to call after every sign-in
    async syncProfile(req, res, next) {
        try {
            const requestedRole = typeof req.body?.role === 'string' ? req.body.role : undefined;
            const result = await DataStore.linkOrCreateUserForIdentity({
                sub: req.identity.sub,
                email: req.identity.email,
                name: req.identity.name,
                requestedRole
            });

            const action = auditActionFor(result);
            if (action) {
                await DataStore.logAudit({
                    user_id: result.user.id,
                    action,
                    details: { role: result.user.role, email: result.user.email },
                    ip_address: req.ip
                });
            }

            return res.status(result.created ? 201 : 200).json({
                success: true,
                linked: result.linked,
                user: result.user
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
            return res.status(200).json({ success: true, user });
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
            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully.',
                user: updated
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AuthController;
