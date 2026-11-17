'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('DONOR');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        try {
            await register({
                full_name: fullName,
                email,
                password,
                role
            });

            if (role === 'COORDINATOR') router.push('/coordinator');
            else if (role === 'STAFF') router.push('/staff');
            else router.push('/donor');
        } catch (err: unknown) {
            const error = err as { message?: string };
            setErrorMessage(error.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-md grid gap-8 py-8">
            <div className="grid gap-2">
                <h1 className="app-title">Create an account</h1>
                <p className="text-muted">Donors book drive slots; coordinators and medical staff run the drives.</p>
            </div>

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
                    <select id="reg-role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
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
                        minLength={6}
                        value={password}
                        onChange={setPassword}
                        describedBy="reg-password-hint"
                    />
                    <span id="reg-password-hint" className="field__hint">At least 6 characters</span>
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

            <p className="text-sm text-muted">
                Already registered? <Link href="/login" className="link">Sign in</Link>
            </p>
        </div>
    );
}
