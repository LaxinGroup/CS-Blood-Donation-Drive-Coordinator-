const { createRemoteJWKSet, jwtVerify } = require('jose');
const DataStore = require('../db/store');
require('dotenv').config({ quiet: true });

// Neon Auth (Managed Better Auth) issues EdDSA JWTs; iss and aud are both the Auth URL's origin.
let verifierConfig = null;

function getVerifierConfig() {
    if (verifierConfig) return verifierConfig;
    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    if (!baseUrl) {
        throw new Error('NEON_AUTH_BASE_URL is not configured.');
    }
    const jwksUrl = process.env.NEON_AUTH_JWKS_URL || `${baseUrl.replace(/\/+$/, '')}/.well-known/jwks.json`;
    const origin = new URL(baseUrl).origin;
    // Keys are cached and refetched automatically when an unknown key id appears
    verifierConfig = { jwks: createRemoteJWKSet(new URL(jwksUrl)), issuer: origin, audience: origin };
    return verifierConfig;
}

async function verifyNeonToken(token) {
    const { jwks, issuer, audience } = getVerifierConfig();
    const { payload } = await jwtVerify(token, jwks, { algorithms: ['EdDSA'], issuer, audience });
    return payload;
}

function readBearerToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length).trim() || null;
    }
    return null;
}

function unauthorized(res, message) {
    return res.status(401).json({ success: false, message });
}

// Verifies the Neon Auth token only. Sets req.identity. Used by the profile-sync route,
// where the app's users row may not exist yet.
async function requireIdentity(req, res, next) {
    const token = readBearerToken(req);
    if (!token) {
        return unauthorized(res, 'Authentication required. No token provided.');
    }

    let claims;
    try {
        claims = await verifyNeonToken(token);
    } catch (err) {
        if (err.code === 'ERR_JWT_EXPIRED') {
            return unauthorized(res, 'Session expired. Please sign in again.');
        }
        if (err.message === 'NEON_AUTH_BASE_URL is not configured.') {
            return next(err);
        }
        // Reason only (e.g. ERR_JWT_CLAIM_VALIDATION_FAILED "iss"), never the token itself
        console.warn(`[auth] Token rejected: ${err.code || err.name}${err.claim ? ` (claim: ${err.claim})` : ''}`);
        return unauthorized(res, 'Invalid authentication token.');
    }

    if (typeof claims.sub !== 'string' || typeof claims.email !== 'string') {
        return unauthorized(res, 'Invalid authentication token.');
    }
    // Linking accounts by email is only safe for verified emails; fail closed otherwise
    if (claims.emailVerified !== true) {
        return res.status(403).json({
            success: false,
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Verify your email address to continue.'
        });
    }

    req.identity = {
        sub: claims.sub,
        email: claims.email,
        name: typeof claims.name === 'string' ? claims.name : null
    };
    return next();
}

// Verified identity + the app's users row (role lives there, not in the Neon token)
async function loadAppUser(req, res, next) {
    try {
        const user = await DataStore.findUserByAuthId(req.identity.sub);
        if (!user) {
            return res.status(403).json({
                success: false,
                code: 'PROFILE_REQUIRED',
                message: 'Finish setting up your account to continue.'
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            blood_group: user.blood_group
        };
        return next();
    } catch (err) {
        return next(err);
    }
}

function authenticate(req, res, next) {
    return requireIdentity(req, res, (err) => {
        if (err) return next(err);
        return loadAppUser(req, res, next);
    });
}

// Role Authorization Middleware (RBAC)
function authorizeRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role is ${req.user.role}.`
                });
            }
        }

        next();
    };
}

module.exports = {
    authenticate,
    requireIdentity,
    authorizeRole
};
