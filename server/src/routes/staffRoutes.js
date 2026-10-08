const express = require('express');
const router = express.Router();
const StaffController = require('../controllers/staffController');
const { authenticate, authorizeRole } = require('../middleware/auth');

// All staff routes require STAFF, COORDINATOR, or ADMIN role
router.use(authenticate, authorizeRole(['STAFF', 'COORDINATOR', 'ADMIN']));

router.get('/drives/:drive_id/queue', StaffController.getDriveQueue);
router.post('/drives/:drive_id/walkin', StaffController.registerWalkIn);
router.put('/appointments/:id/checkin', StaffController.checkInDonor);
router.put('/appointments/:id/status', StaffController.updateQueueStatus);
router.post('/appointments/:id/complete', StaffController.recordDonationOutcome);

module.exports = router;
