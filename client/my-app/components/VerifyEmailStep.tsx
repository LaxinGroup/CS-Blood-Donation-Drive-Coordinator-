'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth, SelfAssignableRole } from '@/context/AuthContext';
import type { User } from '@/lib/api';

interface VerifyEmailStepProps {
    email: string;
    password: string;
    role?: SelfAssignableRole;
    /** Shown above the form, e.g. why the user landed here. */
    intro: string;
    onVerified: (user: User) => void;
}

function errorText(err: unknown, fallback: string): string {
    return err instanceof Error && err.message ? err.message : fallback;
}

function Spinner({ label }: { label: string }) {
    return (
        <>
            <RefreshCw className="w-4 h-4 spin" aria-hidden="true" />
            {label}
        </>
    );
}

export default function VerifyEmailStep({ email, password, role, intro, onVerified }: VerifyEmailStepProps) {
    const { verifyEmailCode, completeProfile, sendVerificationCode } = useAuth();
    const [code, setCode] = useState('');
    // Codes are single-use: once accepted, retries only repeat the profile step
    const [codeAccepted, setCodeAccepted] = useState(false);
    const [isWorking, setIsWorking] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const finishProfile = async () => {
        try {
            onVerified(await completeProfile(role));
        } catch (err: unknown) {
            setErrorMessage(errorText(err, 'Could not finish setting up your account.'));
            setIsWorking(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isWorking) return;
        setIsWorking(true);
        setErrorMessage(null);
        setStatusMessage(null);
        try {
            await verifyEmailCode({ email, password, code: code.trim() });
        } catch (err: unknown) {
            setErrorMessage(errorText(err, 'That code is invalid or has expired.'));
            setIsWorking(false);
            return;
        }
        setCodeAccepted(true);
        await finishProfile();
    };

    const handleRetryProfile = async () => {
        setIsWorking(true);
        setErrorMessage(null);
        await finishProfile();
    };

    const handleResend = async () => {
        setIsResending(true);
        setErrorMessage(null);
        setStatusMessage(null);
        try {
            await sendVerificationCode(email);
            setStatusMessage(`A new code is on its way to ${email}.`);
        } catch (err: unknown) {
            setErrorMessage(errorText(err, 'Could not send a code. Please try again.'));
        } finally {
            setIsResending(false);
        }
    };

    if (codeAccepted) {
        return (
            <div className="app-card grid gap-5">
                <div className="notice notice--ok" role="status">Your email is verified.</div>
                {errorMessage && <div className="notice notice--bad" role="alert">{errorMessage}</div>}
                <button type="button" onClick={handleRetryProfile} disabled={isWorking} className="btn btn--primary w-full justify-center">
                    {isWorking ? <Spinner label="Setting up your account" /> : 'Try again'}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="app-card grid gap-5">
            <p className="text-sm text-muted">{intro}</p>
            {statusMessage && <div className="notice notice--ok" role="status">{statusMessage}</div>}
            {errorMessage && <div className="notice notice--bad" role="alert">{errorMessage}</div>}

            <div className="field">
                <label htmlFor="verify-code">Verification code</label>
                <input
                    id="verify-code"
                    className="input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    aria-describedby="verify-code-hint"
                />
                <span id="verify-code-hint" className="field__hint">Sent to {email}. Check your spam folder too.</span>
            </div>

            <button type="submit" disabled={isWorking} className="btn btn--primary w-full justify-center">
                {isWorking ? <Spinner label="Verifying" /> : 'Verify email'}
            </button>

            <button type="button" onClick={handleResend} disabled={isResending} className="link text-sm justify-self-start">
                {isResending ? 'Sending a new code' : 'Send a new code'}
            </button>
        </form>
    );
}
