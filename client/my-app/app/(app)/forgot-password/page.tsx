'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

const TOO_MANY_REQUESTS = 429;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'forget-password' });
        // Only rate limiting is surfaced; otherwise continue the same way whether or not the
        // account exists, so this form can't be used to discover who is registered.
        if (error?.status === TOO_MANY_REQUESTS) {
            setErrorMessage('Too many attempts. Please wait a few minutes and try again.');
            setIsLoading(false);
            return;
        }
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    };

    return (
        <div className="mx-auto max-w-md grid gap-8 py-8">
            <div className="grid gap-2">
                <h1 className="app-title">Forgot password</h1>
                <p className="text-muted">Enter your account email and we&apos;ll send you a code to set a new password.</p>
            </div>

            <form onSubmit={handleSubmit} className="app-card grid gap-5">
                {errorMessage && <div className="notice notice--bad" role="alert">{errorMessage}</div>}

                <div className="field">
                    <label htmlFor="forgot-email">Email</label>
                    <input
                        id="forgot-email"
                        className="input"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <button type="submit" disabled={isLoading} className="btn btn--primary w-full justify-center">
                    {isLoading ? (
                        <>
                            <RefreshCw className="w-4 h-4 spin" aria-hidden="true" />
                            Sending code
                        </>
                    ) : (
                        'Send reset code'
                    )}
                </button>
            </form>

            <p className="text-sm text-muted">
                Remembered it? <Link href="/login" className="link">Sign in</Link>
            </p>
        </div>
    );
}
