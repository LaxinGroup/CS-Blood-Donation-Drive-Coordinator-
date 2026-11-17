'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        try {
            await login(email, password);
            router.push('/');
        } catch (err: unknown) {
            const error = err as { message?: string };
            setErrorMessage(error.message || 'Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-md grid gap-8 py-8">
            <div className="grid gap-2">
                <h1 className="app-title">Sign in</h1>
                <p className="text-muted">Your bookings, donation history and drive tools.</p>
            </div>

            <form onSubmit={handleSubmit} className="app-card grid gap-5">
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

            <p className="text-sm text-muted">
                New here? <Link href="/register" className="link">Create a donor account</Link>
            </p>
        </div>
    );
}
