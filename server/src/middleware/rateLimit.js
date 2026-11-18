const { rateLimit } = require('express-rate-limit');

// Forgot/reset password: stop inbox spamming and token guessing
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password reset attempts. Please wait 15 minutes and try again.',
    },
});

module.exports = { passwordResetLimiter };
