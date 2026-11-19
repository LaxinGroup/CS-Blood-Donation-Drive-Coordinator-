const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate, requireIdentity } = require('../middleware/auth');

// Neon Auth handles sign-up/sign-in/sign-out/reset. Express only needs a verified identity.
router.post('/profile', requireIdentity, AuthController.syncProfile);

// Protected routes
router.get('/me', authenticate, AuthController.getMe);
router.put('/me', authenticate, AuthController.updateMe);

module.exports = router;
