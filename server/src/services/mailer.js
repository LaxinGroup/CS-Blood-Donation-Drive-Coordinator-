// Transactional email via Brevo's HTTPS API (Render free instances block outbound SMTP).
require('dotenv').config();

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildResetEmail({ name, resetUrl, expiresMinutes }) {
    const safeName = escapeHtml(name || 'there');
    const safeUrl = escapeHtml(resetUrl);
    return {
        subject: 'Reset your password',
        textContent:
            `Hi ${name || 'there'},\n\n` +
            `Use this link to set a new password. It expires in ${expiresMinutes} minutes and works once:\n` +
            `${resetUrl}\n\n` +
            'If you did not ask for this, you can ignore this email. Your password will not change.',
        htmlContent:
            `<p>Hi ${safeName},</p>` +
            `<p>Use the link below to set a new password. It expires in ${expiresMinutes} minutes and works once.</p>` +
            `<p><a href="${safeUrl}">Reset your password</a></p>` +
            '<p>If you did not ask for this, you can ignore this email. Your password will not change.</p>',
    };
}

async function postToBrevo(payload) {
    const response = await fetch(BREVO_ENDPOINT, {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
            accept: 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Brevo responded ${response.status}: ${body.slice(0, 300)}`);
    }
}

async function sendPasswordResetEmail({ to, name, resetUrl, expiresMinutes }) {
    if (!process.env.BREVO_API_KEY) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[mailer] BREVO_API_KEY not set. Password reset link for ${to}: ${resetUrl}`);
            return;
        }
        throw new Error('BREVO_API_KEY is not configured; password reset email not sent.');
    }

    const { subject, textContent, htmlContent } = buildResetEmail({ name, resetUrl, expiresMinutes });
    await postToBrevo({
        sender: {
            email: process.env.MAIL_FROM_EMAIL,
            name: process.env.MAIL_FROM_NAME || 'CS Blood Donation Drive',
        },
        to: [{ email: to, name: name || undefined }],
        subject,
        textContent,
        htmlContent,
    });
}

module.exports = { sendPasswordResetEmail };
