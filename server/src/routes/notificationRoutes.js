const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticate, authorizeRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', NotificationController.getMyNotifications);
router.put('/:id/read', NotificationController.markAsRead);
router.put('/read-all', NotificationController.markAllAsRead);
router.post('/broadcast', authorizeRole(['COORDINATOR', 'ADMIN']), NotificationController.broadcastAlert);

module.exports = router;
