'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError, clearAuthToken, User } from '@/lib/api';
import { authClient } from '@/lib/auth/client';

export type SelfAssignableRole = 'DONOR' | 'COORDINATOR' | 'STAFF';

/** Thrown by auth actions. `code` lets pages switch to the verify-email step. */
export class AuthFlowError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = 'AuthFlowError';
    }
}

export const EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED';

interface RegisterPayload {
    full_name: string;
    email: string;
    password: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (payload: RegisterPayload) => Promise<void>;
    sendVerificationCode: (email: string) => Promise<void>;
    /** Step 1: checks the code and makes sure there is a Neon session. Codes are single-use. */
    verifyEmailCode: (input: { email: string; password: string; code: string }) => Promise<void>;
    /** Step 2: links/creates the app profile. Safe to retry without a new code. */
    completeProfile: (role?: SelfAssignableRole) => Promise<User>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface BetterAuthError {
    code?: string;
    message?: string;
}

function toFlowError(error: BetterAuthError, fallback: string): AuthFlowError {
    return new AuthFlowError(error.message || fallback, error.code);
}

// Loads the app profile for the current Neon session. A first sign-in (or an old account
// signing in for the first time) has no linked row yet, so link or create it.
async function loadProfile(): Promise<User | null> {
    try {
        return (await api.getMe()).user;
    } catch (err) {
        if (err instanceof ApiError && err.code === 'PROFILE_REQUIRED') {
            return (await api.syncProfile()).user;
        }
        if (err instanceof ApiError && (err.status === 401 || err.code === EMAIL_NOT_VERIFIED)) {
            return null;
        }
        throw err;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const { data: session } = await authClient.getSession();
            setUser(session?.user ? await loadProfile() : null);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        authClient.getSession()
            .then(async ({ data: session }) => (session?.user ? loadProfile() : null))
            .then((profile) => { if (!cancelled) setUser(profile); })
            .catch(() => { if (!cancelled) setUser(null); })
            .finally(() => { if (!cancelled) setIsLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const finishSignIn = async (role?: SelfAssignableRole): Promise<User> => {
        clearAuthToken();
        const { user: profile } = await api.syncProfile(role);
        setUser(profile);
        return profile;
    };

    const login = async (email: string, password: string): Promise<User> => {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw toFlowError(error, 'Invalid email or password.');
        return finishSignIn();
    };

    const register = async ({ full_name, email, password }: RegisterPayload): Promise<void> => {
        const { error } = await authClient.signUp.email({ email, password, name: full_name });
        if (error) throw toFlowError(error, 'Registration failed.');
    };

    const sendVerificationCode = async (email: string): Promise<void> => {
        const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
        if (error) throw toFlowError(error, 'Could not send a code. Please try again.');
    };

    const verifyEmailCode = async (
        { email, password, code }: { email: string; password: string; code: string }
    ): Promise<void> => {
        const verified = await authClient.emailOtp.verifyEmail({ email, otp: code });
        const { data: session } = await authClient.getSession();
        // A rejected code is fine if this email was already verified (e.g. a repeated submit)
        if (verified.error && !session?.user?.emailVerified) {
            throw toFlowError(verified.error, 'That code is invalid or has expired.');
        }

        if (!session?.user) {
            const signedIn = await authClient.signIn.email({ email, password });
            if (signedIn.error) throw toFlowError(signedIn.error, 'Email verified. Please sign in.');
        }
    };

    const completeProfile = (role?: SelfAssignableRole): Promise<User> => finishSignIn(role);

    const logout = async (): Promise<void> => {
        await authClient.signOut();
        clearAuthToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                sendVerificationCode,
                verifyEmailCode,
                completeProfile,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
