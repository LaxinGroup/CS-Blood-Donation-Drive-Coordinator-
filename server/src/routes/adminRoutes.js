const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticate, authorizeRole } = require('../middleware/auth');

router.use(authenticate, authorizeRole(['ADMIN']));

router.get('/users', AdminController.getUsers);
router.put('/users/:id/role', AdminController.updateUserRole);
router.get('/audit-logs', AdminController.getAuditLogs);

module.exports = router;
