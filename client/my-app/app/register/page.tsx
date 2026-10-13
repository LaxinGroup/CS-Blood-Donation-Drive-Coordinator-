'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Heart, Lock, Mail, User, RefreshCw, ShieldCheck } from 'lucide-react';

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
        <div className="max-w-md mx-auto py-10 animate-fade-in">
            <div className="rounded-3xl glass-panel border border-white/10 p-8 space-y-6 shadow-2xl bg-slate-900/80">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
                        <Heart className="w-7 h-7 text-white fill-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Create Account</h2>
                    <p className="text-xs text-slate-400">Join the campus blood donation lifesaver network</p>
                </div>

                {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g. Lerato Khumalo"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Campus Email <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="lerato@students.campus.ac.za"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2.5 rounded-xl glass-input text-xs font-semibold"
                        >
                            <option value="DONOR">Donor (Student / Staff)</option>
                            <option value="COORDINATOR">Drive Coordinator</option>
                            <option value="STAFF">Medical Phlebotomist</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Create Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl btn-primary text-xs font-bold flex items-center justify-center space-x-2 shadow-lg pt-3"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>Complete Registration</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center text-xs text-slate-400 pt-2">
                    Already have an account?{' '}
                    <Link href="/login" className="text-red-400 font-bold hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
