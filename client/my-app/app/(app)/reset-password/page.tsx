'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import PasswordInput from '@/components/PasswordInput';

const MIN_PASSWORD_LENGTH = 6;

function MissingTokenNotice() {
    return (
        <div className="app-card grid gap-4">
            <div className="notice notice--warn" role="status">This page needs the link from your reset email.</div>
            <p className="text-sm text-muted">
                <Link href="/forgot-password" className="link">Request a new reset link</Link>
            </p>
        </div>
    );
}

function ResetPasswordForm({ token }: { token: string }) {
    const router = useRouter();
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
        try {
            await api.resetPassword({ token, password });
            // Any session stored on this device is now invalid on the server
            localStorage.removeItem('token');
            router.push('/login?reset=1');
        } catch (err: unknown) {
            const error = err as { message?: string };
            setErrorMessage(error.message || 'Could not reset your password. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="app-card grid gap-5">
            {errorMessage && (
                <div className="notice notice--bad" role="alert">
                    {errorMessage}{' '}
                    <Link href="/forgot-password" className="link">Request a new link</Link>
                </div>
            )}

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
    const token = useSearchParams().get('token');
    return token ? <ResetPasswordForm token={token} /> : <MissingTokenNotice />;
}

export default function ResetPasswordPage() {
    return (
        <div className="mx-auto max-w-md grid gap-8 py-8">
            <div className="grid gap-2">
                <h1 className="app-title">Set a new password</h1>
                <p className="text-muted">Choosing a new password signs you out on every other device.</p>
            </div>

            <Suspense fallback={<div className="app-card" aria-busy="true" />}>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
