import type { User } from '@/lib/api';

/** Landing page for each role after sign-in. */
export function homePathFor(role: User['role']): string {
    if (role === 'COORDINATOR') return '/coordinator';
    if (role === 'STAFF') return '/staff';
    if (role === 'ADMIN') return '/admin';
    return '/donor';
}
