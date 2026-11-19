import { auth } from '@/lib/auth/server';

// Signed-out visitors to the tool pages go to /login. Roles are still enforced by the Express API.
export default auth.middleware({
    loginUrl: '/login',
});

export const config = {
    matcher: ['/donor/:path*', '/coordinator/:path*', '/staff/:path*', '/admin/:path*'],
};
