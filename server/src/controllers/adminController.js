const DataStore = require('../db/store');

const AdminController = {
    // List all users
    async getUsers(req, res, next) {
        try {
            const users = await DataStore.getAllUsers();
            return res.status(200).json({
                success: true,
                count: users.length,
                users
            });
        } catch (err) {
            next(err);
        }
    },

    // Update user role
    async updateUserRole(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!['DONOR', 'COORDINATOR', 'STAFF', 'ADMIN'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role specified.' });
            }

            const updated = await DataStore.updateUser(id, { role });
            if (!updated) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            await DataStore.logAudit({
                user_id: req.user.id,
                action: 'USER_ROLE_CHANGED',
                details: { target_user_id: id, new_role: role },
                ip_address: req.ip
            });

            const { password_hash, ...safeUser } = updated;
            return res.status(200).json({
                success: true,
                message: `User role updated to ${role}.`,
                user: safeUser
            });
        } catch (err) {
            next(err);
        }
    },

    // Get audit logs
    async getAuditLogs(req, res, next) {
        try {
            const logs = await DataStore.getAuditLogs(100);
            return res.status(200).json({
                success: true,
                count: logs.length,
                logs
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AdminController;
