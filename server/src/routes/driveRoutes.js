const express = require('express');
const router = express.Router();
const DriveController = require('../controllers/driveController');
const { authenticate, authorizeRole } = require('../middleware/auth');

// Public drive browsing
router.get('/', DriveController.getAllDrives);
router.get('/:id', DriveController.getDriveById);

// Protected Coordinator / Admin actions
router.post('/', authenticate, authorizeRole(['COORDINATOR', 'ADMIN']), DriveController.createDrive);
router.put('/:id', authenticate, authorizeRole(['COORDINATOR', 'ADMIN']), DriveController.updateDrive);
router.delete('/:id', authenticate, authorizeRole(['COORDINATOR', 'ADMIN']), DriveController.deleteDrive);

module.exports = router;
