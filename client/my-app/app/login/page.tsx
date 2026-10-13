'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Heart, Lock, Mail, ArrowRight, RefreshCw } from 'lucide-react';

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
        <div className="max-w-md mx-auto py-12 animate-fade-in">
            <div className="rounded-3xl glass-panel border border-white/10 p-8 space-y-6 shadow-2xl bg-slate-900/80">
                <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
                        <Heart className="w-7 h-7 text-white fill-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Welcome Back</h2>
                    <p className="text-xs text-slate-400">Access your Campus Blood Donation Portal</p>
                </div>

                {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@campus.edu"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl btn-primary text-xs font-bold flex items-center justify-center space-x-2 shadow-lg"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center text-xs text-slate-400 pt-2">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-red-400 font-bold hover:underline">
                        Register as Donor
                    </Link>
                </div>
            </div>
        </div>
    );
}
