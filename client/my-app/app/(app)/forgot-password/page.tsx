'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sentMessage, setSentMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const res = await api.forgotPassword(email);
            setSentMessage(res.message);
        } catch (err: unknown) {
            const error = err as { message?: string };
            setErrorMessage(error.message || 'Could not send a reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-md grid gap-8 py-8">
            <div className="grid gap-2">
                <h1 className="app-title">Forgot password</h1>
                <p className="text-muted">Enter your account email and we&apos;ll send you a link to set a new password.</p>
            </div>

            {sentMessage ? (
                <div className="app-card grid gap-4">
                    <div className="notice notice--ok" role="status">{sentMessage}</div>
                    <p className="text-sm text-muted">
                        The link expires in 30 minutes and works once. Check your spam folder if it doesn&apos;t arrive.
                    </p>
                </div>
            ) : (
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
                                Sending link
                            </>
                        ) : (
                            'Send reset link'
                        )}
                    </button>
                </form>
            )}

            <p className="text-sm text-muted">
                Remembered it? <Link href="/login" className="link">Sign in</Link>
            </p>
        </div>
    );
}
