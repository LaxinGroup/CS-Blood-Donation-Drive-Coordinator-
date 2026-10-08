const DataStore = require('../db/store');

const NotificationController = {
    // Get notifications for current user
    async getMyNotifications(req, res, next) {
        try {
            const notifications = await DataStore.getUserNotifications(req.user.id);
            const unreadCount = notifications.filter(n => !n.is_read).length;
            return res.status(200).json({
                success: true,
                count: notifications.length,
                unread_count: unreadCount,
                notifications
            });
        } catch (err) {
            next(err);
        }
    },

    // Mark single notification as read
    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await DataStore.markNotificationAsRead(id, req.user.id);
            return res.status(200).json({
                success: true,
                message: 'Notification marked as read.',
                notification: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // Mark all as read
    async markAllAsRead(req, res, next) {
        try {
            await DataStore.markAllNotificationsAsRead(req.user.id);
            return res.status(200).json({
                success: true,
                message: 'All notifications marked as read.'
            });
        } catch (err) {
            next(err);
        }
    },

    // Broadcast urgent shortage alert (Coordinators & Admins)
    async broadcastAlert(req, res, next) {
        try {
            const { title, message, target_blood_groups = [], drive_id = null } = req.body;

            if (!title || !message) {
                return res.status(400).json({ success: false, message: 'Title and message are required for broadcast.' });
            }

            const result = await DataStore.broadcastAlert({
                title,
                message,
                target_blood_groups,
                drive_id
            });

            await DataStore.logAudit({
                user_id: req.user.id,
                action: 'BROADCAST_ALERT_SENT',
                details: { title, target_blood_groups, sent_count: result.sent_count },
                ip_address: req.ip
            });

            return res.status(200).json({
                success: true,
                message: `Broadcast message sent to ${result.sent_count} registered donors!`,
                sent_count: result.sent_count
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = NotificationController;
