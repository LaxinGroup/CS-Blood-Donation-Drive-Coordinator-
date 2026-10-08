const cors = require('cors');

// Dynamic CORS policy matching localhost, Vercel deployments, Render servers, and custom env configs
function createCorsMiddleware() {
    const allowedEnvOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

    if (process.env.FRONTEND_URL) {
        allowedEnvOrigins.push(process.env.FRONTEND_URL.trim());
    }

    const isOriginAllowed = (origin) => {
        if (!origin) return true; // Allow non-browser requests (mobile apps, curl, Postman)

        // 1. Explicit environment-configured origins
        if (allowedEnvOrigins.includes(origin)) return true;

        // 2. Localhost & local network dev servers
        if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
        if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;

        // 3. Vercel deployments (production, branch previews, and staging)
        // Matches: https://*.vercel.app and custom domains
        if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) return true;
        if (/^https:\/\/.*-.*\.vercel\.app$/.test(origin)) return true;

        // 4. Render backend/frontend origins
        // Matches: https://*.onrender.com
        if (/^https:\/\/[a-zA-Z0-9_-]+\.onrender\.com$/.test(origin)) return true;

        return false;
    };

    return cors({
        origin: (origin, callback) => {
            if (isOriginAllowed(origin)) {
                callback(null, true);
            } else {
                console.warn(`[CORS Blocked] Origin not in allowed whitelist: ${origin}`);
                callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
    });
}

module.exports = createCorsMiddleware;
