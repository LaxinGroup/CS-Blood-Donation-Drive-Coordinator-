const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const { authenticate, authorizeRole } = require('../middleware/auth');

// Public or general overview
router.get('/overview', AnalyticsController.getSystemOverview);

// Protected Coordinator / Staff / Admin analytics
router.get('/drives/:id', authenticate, authorizeRole(['COORDINATOR', 'STAFF', 'ADMIN']), AnalyticsController.getDriveAnalytics);
router.get('/drives/:id/export/csv', authenticate, authorizeRole(['COORDINATOR', 'STAFF', 'ADMIN']), AnalyticsController.exportCsv);

module.exports = router;
