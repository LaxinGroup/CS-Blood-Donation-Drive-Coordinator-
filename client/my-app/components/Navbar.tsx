'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, NotificationItem } from '@/lib/api';
import { 
    Heart, 
    Calendar, 
    BarChart3, 
    ClipboardCheck, 
    ShieldCheck, 
    Bell, 
    User as UserIcon, 
    LogOut, 
    Sparkles,
    ChevronDown,
    Menu,
    X,
    Activity
} from 'lucide-react';
import NotificationModal from './NotificationModal';

export default function Navbar() {
    const { user, isAuthenticated, logout, quickLoginAs } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

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

    const handleRoleSwitch = async (role: 'DONOR' | 'COORDINATOR' | 'STAFF' | 'ADMIN') => {
        try {
            await quickLoginAs(role);
            setIsRoleDropdownOpen(false);
            if (role === 'DONOR') router.push('/donor');
            else if (role === 'COORDINATOR') router.push('/coordinator');
            else if (role === 'STAFF') router.push('/staff');
            else if (role === 'ADMIN') router.push('/admin');
        } catch (e) {
            console.error('Quick login failed', e);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
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

                        {/* Desktop Navigation Links */}
                        <nav className="hidden md:flex items-center space-x-1">
                            <Link
                                href="/"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    pathname === '/' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Home
                            </Link>

                            {/* Role-Specific Portal Links */}
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

                        {/* Right Section: Quick Role Switcher, Notification, Auth */}
                        <div className="hidden md:flex items-center space-x-3">
                            {/* Role Switcher Demo Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center space-x-1.5 transition-colors"
                                    title="Switch Role for Testing"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Demo Switch: <strong className="text-red-400">{user?.role || 'Guest'}</strong></span>
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                </button>

                                {isRoleDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel p-1.5 border border-white/10 shadow-2xl z-50">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Instant Demo Switch</div>
                                        <button
                                            onClick={() => handleRoleSwitch('DONOR')}
                                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-red-500/10 hover:text-red-400 text-slate-300 flex items-center justify-between"
                                        >
                                            <span>Donor (Thabo)</span>
                                            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">O-</span>
                                        </button>
                                        <button
                                            onClick={() => handleRoleSwitch('COORDINATOR')}
                                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-blue-500/10 hover:text-blue-400 text-slate-300 flex items-center justify-between"
                                        >
                                            <span>Coordinator (Nkululeko)</span>
                                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Admin</span>
                                        </button>
                                        <button
                                            onClick={() => handleRoleSwitch('STAFF')}
                                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300 flex items-center justify-between"
                                        >
                                            <span>Medical Staff (Mary)</span>
                                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Desk</span>
                                        </button>
                                        <button
                                            onClick={() => handleRoleSwitch('ADMIN')}
                                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-amber-500/10 hover:text-amber-400 text-slate-300 flex items-center justify-between"
                                        >
                                            <span>System Admin (Sarah)</span>
                                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Root</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Notifications Bell */}
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

                            {/* User Profile / Auth State */}
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

                        {/* Mobile Menu Button */}
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

                {/* Mobile Menu Drawer */}
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
                        <div className="pt-3 border-t border-white/10">
                            <p className="text-xs text-slate-400 mb-2 font-semibold">Switch Demo Role:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => { handleRoleSwitch('DONOR'); setIsMobileMenuOpen(false); }}
                                    className="p-2 rounded bg-slate-800 text-xs text-left text-slate-200 hover:bg-slate-700"
                                >
                                    Donor (Thabo)
                                </button>
                                <button
                                    onClick={() => { handleRoleSwitch('COORDINATOR'); setIsMobileMenuOpen(false); }}
                                    className="p-2 rounded bg-slate-800 text-xs text-left text-slate-200 hover:bg-slate-700"
                                >
                                    Coordinator (Nkululeko)
                                </button>
                                <button
                                    onClick={() => { handleRoleSwitch('STAFF'); setIsMobileMenuOpen(false); }}
                                    className="p-2 rounded bg-slate-800 text-xs text-left text-slate-200 hover:bg-slate-700"
                                >
                                    Staff (Sister Mary)
                                </button>
                                <button
                                    onClick={() => { handleRoleSwitch('ADMIN'); setIsMobileMenuOpen(false); }}
                                    className="p-2 rounded bg-slate-800 text-xs text-left text-slate-200 hover:bg-slate-700"
                                >
                                    Admin (Dr. Sarah)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Notification Drawer Modal */}
            <NotificationModal
                isOpen={isNotifOpen}
                onClose={() => { setIsNotifOpen(false); fetchNotifications(); }}
                notifications={notifications}
                onRefresh={fetchNotifications}
            />
        </>
    );
}
