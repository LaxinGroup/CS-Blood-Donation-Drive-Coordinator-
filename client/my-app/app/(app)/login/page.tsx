'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthFlowError, EMAIL_NOT_VERIFIED, useAuth } from '@/context/AuthContext';
import { RefreshCw } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import VerifyEmailStep from '@/components/VerifyEmailStep';

function LoginForm() {
    const { login, sendVerificationCode } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const passwordWasReset = searchParams.get('reset') === '1';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [awaitingCode, setAwaitingCode] = useState(false);

    const startVerification = async () => {
        try {
            await sendVerificationCode(email);
        } catch {
            // The step itself offers "Send a new code" if this one failed
        }
        setAwaitingCode(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        try {
            await login(email, password);
            router.push('/');
        } catch (err: unknown) {
            if (err instanceof AuthFlowError && err.code === EMAIL_NOT_VERIFIED) {
                await startVerification();
            } else {
                setErrorMessage(err instanceof Error && err.message ? err.message : 'Invalid email or password.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (awaitingCode) {
        return (
            <VerifyEmailStep
                email={email}
                password={password}
                intro="Your email isn't verified yet. Enter the code we just emailed you to finish signing in."
                onVerified={() => router.push('/')}
            />
        );
    }

    return (
        <form onSubmit={handleSubmit} className="app-card grid gap-5">
            {passwordWasReset && !errorMessage && (
                <div className="notice notice--ok" role="status">Password updated. Sign in with your new password.</div>
            )}
            {errorMessage && <div className="notice notice--bad" role="alert">{errorMessage}</div>}

            <div className="field">
                <label htmlFor="login-email">Email</label>
                <input
                    id="login-email"
                    className="input"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="field">
                <label htmlFor="login-password">Password</label>
                <PasswordInput
                    id="login-password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={setPassword}
                />
                <Link href="/forgot-password" className="link text-sm justify-self-end">Forgot password?</Link>
            </div>

            <button type="submit" disabled={isLoading} className="btn btn--primary w-full justify-center">
                {isLoading ? (
                    <>
                        <RefreshCw className="w-4 h-4 spin" aria-hidden="true" />
                        Signing in
                    </>
                ) : (
                    'Sign in'
                )}
            </button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="mx-auto max-w-md grid gap-8 py-8">
            <div className="grid gap-2">
                <h1 className="app-title">Sign in</h1>
                <p className="text-muted">Your bookings, donation history and drive tools.</p>
            </div>

            <Suspense fallback={<div className="app-card" aria-busy="true" />}>
                <LoginForm />
            </Suspense>

            <p className="text-sm text-muted">
                New here? <Link href="/register" className="link">Create a donor account</Link>
            </p>
        </div>
    );
}
