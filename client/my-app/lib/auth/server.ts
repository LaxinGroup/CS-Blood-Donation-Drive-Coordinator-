import { createNeonAuth } from '@neon/auth/next/server';

function requireEnv(name: 'NEON_AUTH_BASE_URL' | 'NEON_AUTH_COOKIE_SECRET'): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set. Add it to client/my-app/.env.local (and Vercel).`);
    }
    return value;
}

// Server-only: the cookie secret must never reach the browser bundle.
export const auth = createNeonAuth({
    baseUrl: requireEnv('NEON_AUTH_BASE_URL'),
    cookies: { secret: requireEnv('NEON_AUTH_COOKIE_SECRET') },
});
