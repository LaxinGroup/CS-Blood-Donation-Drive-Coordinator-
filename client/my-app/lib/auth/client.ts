'use client';

import { createAuthClient } from '@neon/auth/next';

// Talks to the same-origin proxy at /api/auth, which forwards to Neon Auth.
export const authClient = createAuthClient();
