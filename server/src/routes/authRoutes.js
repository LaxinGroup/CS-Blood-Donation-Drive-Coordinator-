const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { passwordResetLimiter } = require('../middleware/rateLimit');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, AuthController.resetPassword);

// Protected routes
router.get('/me', authenticate, AuthController.getMe);
router.put('/me', authenticate, AuthController.updateMe);

module.exports = router;
