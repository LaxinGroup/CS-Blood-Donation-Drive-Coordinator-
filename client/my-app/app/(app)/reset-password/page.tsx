'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { clearAuthToken } from '@/lib/api';
import PasswordInput from '@/components/PasswordInput';

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordForm({ initialEmail }: { initialEmail: string }) {
    const router = useRouter();
    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setErrorMessage('The two passwords do not match.');
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        const { error } = await authClient.emailOtp.resetPassword({ email, otp: code.trim(), password });
        if (error) {
            setErrorMessage(error.message || 'That code is invalid or has expired.');
            setIsLoading(false);
            return;
        }
        clearAuthToken();
        router.push('/login?reset=1');
    };

    return (
        <form onSubmit={handleSubmit} className="app-card grid gap-5">
            {errorMessage && (
                <div className="notice notice--bad" role="alert">
                    {errorMessage}{' '}
                    <Link href="/forgot-password" className="link">Send a new code</Link>
                </div>
            )}

            <div className="field">
                <label htmlFor="reset-email">Email</label>
                <input
                    id="reset-email"
                    className="input"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="field">
                <label htmlFor="reset-code">Reset code</label>
                <input
                    id="reset-code"
                    className="input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    aria-describedby="reset-code-hint"
                />
                <span id="reset-code-hint" className="field__hint">
                    If an account exists for this email, we sent it a code. Check your spam folder too.
                </span>
            </div>

            <div className="field">
                <label htmlFor="reset-password">New password</label>
                <PasswordInput
                    id="reset-password"
                    autoComplete="new-password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    describedBy="reset-password-hint"
                    value={password}
                    onChange={setPassword}
                />
                <span id="reset-password-hint" className="field__hint">At least {MIN_PASSWORD_LENGTH} characters</span>
            </div>

            <div className="field">
                <label htmlFor="reset-password-confirm">Confirm new password</label>
                <PasswordInput
                    id="reset-password-confirm"
                    autoComplete="new-password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                />
            </div>

            <button type="submit" disabled={isLoading} className="btn btn--primary w-full justify-center">
                {isLoading ? (
                    <>
                        <RefreshCw className="w-4 h-4 spin" aria-hidden="true" />
                        Updating password
                    </>
                ) : (
                    'Set new password'
                )}
            </button>
        </form>
    );
}

function ResetPasswordContent() {
    const email = useSearchParams().get('email') ?? '';
    return <ResetPasswordForm initialEmail={email} />;
}

export default function ResetPasswordPage() {
    return (
        <div className="mx-auto max-w-md grid gap-8 py-8">
            <div className="grid gap-2">
                <h1 className="app-title">Set a new password</h1>
                <p className="text-muted">Enter the code from your email and choose a new password.</p>
            </div>

            <Suspense fallback={<div className="app-card" aria-busy="true" />}>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
