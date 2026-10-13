'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, NotificationItem } from '@/lib/api';
import { 
    Heart, 
    Calendar, 
    BarChart3, 
    ClipboardCheck, 
    ShieldCheck, 
    Bell, 
    LogOut, 
    Menu,
    X,
} from 'lucide-react';
import NotificationModal from './NotificationModal';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const pathname = usePathname();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const fetchNotifications = async () => {
        if (!isAuthenticated) return;
        try {
            const res = await api.getNotifications();
            setUnreadCount(res.unread_count);
            setNotifications(res.notifications);
        } catch {
            // Silently handle if unauthenticated
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 15000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
                                <Heart className="w-5 h-5 text-white fill-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-lg text-white tracking-tight leading-none group-hover:text-red-400 transition-colors">
                                    Campus<span className="text-red-500">Blood</span>
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                                    Drive Coordinator
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center space-x-1">
                            <Link
                                href="/"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    pathname === '/' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Home
                            </Link>

                            {(!user || user.role === 'DONOR') && (
                                <Link
                                    href="/donor"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                                        pathname.startsWith('/donor') ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-slate-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>Donor Portal</span>
                                </Link>
                            )}

                            {(!user || user.role === 'COORDINATOR' || user.role === 'ADMIN') && (
                                <Link
                                    href="/coordinator"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                                        pathname.startsWith('/coordinator') ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-slate-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    <span>Coordinator</span>
                                </Link>
                            )}

                            {(!user || user.role === 'STAFF' || user.role === 'ADMIN') && (
                                <Link
                                    href="/staff"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                                        pathname.startsWith('/staff') ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-slate-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <ClipboardCheck className="w-4 h-4" />
                                    <span>Staff Console</span>
                                </Link>
                            )}

                            {user?.role === 'ADMIN' && (
                                <Link
                                    href="/admin"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                                        pathname.startsWith('/admin') ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 'text-slate-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Admin</span>
                                </Link>
                            )}
                        </nav>

                        <div className="hidden md:flex items-center space-x-3">
                            {isAuthenticated && (
                                <button
                                    onClick={() => setIsNotifOpen(true)}
                                    className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label="Notifications"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {isAuthenticated && user ? (
                                <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
                                    <div className="flex flex-col text-right">
                                        <span className="text-xs font-semibold text-slate-200">{user.full_name}</span>
                                        <span className="text-[10px] text-red-400 font-mono">{user.role} {user.blood_group ? `• ${user.blood_group}` : ''}</span>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Log out"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Link
                                        href="/login"
                                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold btn-primary"
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="flex md:hidden items-center space-x-2">
                            {isAuthenticated && (
                                <button
                                    onClick={() => setIsNotifOpen(true)}
                                    className="relative p-2 text-slate-300"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 text-slate-300 hover:text-white"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden glass-panel border-b border-white/10 px-4 pt-2 pb-6 space-y-3">
                        <Link
                            href="/"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/10"
                        >
                            Home
                        </Link>
                        <Link
                            href="/donor"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/10"
                        >
                            Donor Portal
                        </Link>
                        <Link
                            href="/coordinator"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/10"
                        >
                            Coordinator Dashboard
                        </Link>
                        <Link
                            href="/staff"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/10"
                        >
                            Staff Live Console
                        </Link>
                        {user?.role === 'ADMIN' && (
                            <Link
                                href="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-lg text-base font-medium text-amber-400 hover:bg-white/10"
                            >
                                Admin Panel
                            </Link>
                        )}
                        {!isAuthenticated && (
                            <div className="pt-3 border-t border-white/10 flex gap-2">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-semibold text-slate-200 hover:bg-white/10"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-semibold btn-primary"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </header>

            <NotificationModal
                isOpen={isNotifOpen}
                onClose={() => { setIsNotifOpen(false); fetchNotifications(); }}
                notifications={notifications}
                onRefresh={fetchNotifications}
            />
        </>
    );
}
