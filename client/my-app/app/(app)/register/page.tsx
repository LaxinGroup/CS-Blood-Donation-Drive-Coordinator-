'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, SelfAssignableRole } from '@/context/AuthContext';
import { RefreshCw } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import VerifyEmailStep from '@/components/VerifyEmailStep';
import type { User } from '@/lib/api';
import { homePathFor } from '@/lib/roles';

const MIN_PASSWORD_LENGTH = 8;

function isSelfAssignableRole(value: string): value is SelfAssignableRole {
    return value === 'DONOR' || value === 'COORDINATOR' || value === 'STAFF';
}

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<SelfAssignableRole>('DONOR');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [awaitingCode, setAwaitingCode] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        try {
            await register({ full_name: fullName, email, password });
            setAwaitingCode(true);
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error && err.message ? err.message : 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    // A linked older account keeps its original role, so route by the returned profile
    const handleVerified = (profile: User) => router.push(homePathFor(profile.role));

    return (
        <div className="mx-auto max-w-md grid gap-8 py-8">
            <div className="grid gap-2">
                <h1 className="app-title">{awaitingCode ? 'Check your email' : 'Create an account'}</h1>
                <p className="text-muted">Donors book drive slots; coordinators and medical staff run the drives.</p>
            </div>

            {awaitingCode ? (
                <VerifyEmailStep
                    email={email}
                    password={password}
                    role={role}
                    intro="Enter the code we emailed you to finish creating your account. If you registered before the sign-in change, your bookings and history come back once you verify."
                    onVerified={handleVerified}
                />
            ) : (
                <form onSubmit={handleSubmit} className="app-card grid gap-5">
                    {errorMessage && <div className="notice notice--bad" role="alert">{errorMessage}</div>}

                    <div className="field">
                        <label htmlFor="reg-name">Full name</label>
                        <input
                            id="reg-name"
                            className="input"
                            type="text"
                            autoComplete="name"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="reg-email">Campus email</label>
                        <input
                            id="reg-email"
                            className="input"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="reg-role">Account type</label>
                        <select
                            id="reg-role"
                            className="input"
                            value={role}
                            onChange={(e) => { if (isSelfAssignableRole(e.target.value)) setRole(e.target.value); }}
                        >
                            <option value="DONOR">Donor (student or staff)</option>
                            <option value="COORDINATOR">Drive coordinator</option>
                            <option value="STAFF">Medical staff (phlebotomist)</option>
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="reg-password">Password</label>
                        <PasswordInput
                            id="reg-password"
                            autoComplete="new-password"
                            required
                            minLength={MIN_PASSWORD_LENGTH}
                            value={password}
                            onChange={setPassword}
                            describedBy="reg-password-hint"
                        />
                        <span id="reg-password-hint" className="field__hint">At least {MIN_PASSWORD_LENGTH} characters</span>
                    </div>

                    <button type="submit" disabled={isLoading} className="btn btn--primary w-full justify-center">
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-4 h-4 spin" aria-hidden="true" />
                                Creating your account
                            </>
                        ) : (
                            'Create an account'
                        )}
                    </button>
                </form>
            )}

            <p className="text-sm text-muted">
                Already registered? <Link href="/login" className="link">Sign in</Link>
                {' · '}
                <Link href="/forgot-password" className="link">Forgot your password?</Link>
            </p>
        </div>
    );
}
