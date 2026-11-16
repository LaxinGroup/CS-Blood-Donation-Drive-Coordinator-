'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api, NotificationItem, User } from '@/lib/api';
import NotificationModal from './NotificationModal';

const MAIN_ACTION = 'Book a donation slot';

/* The dealt nav-mega: one fixed, opaque bar on the page's .wrap (system.md, Nav). system.js wires
   the phone sheet, the menu toggle's state and Esc; nothing here duplicates that. */
export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const pathname = usePathname();
    const isLanding = pathname === '/';
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const fetchNotifications = useCallback(() => {
        if (!isAuthenticated) return;
        api.getNotifications()
            .then((res) => {
                setUnreadCount(res.unread_count);
                setNotifications(res.notifications);
            })
            .catch(() => {
                // signed out or the API is away: the bell simply shows no count
            });
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchNotifications]);

    return (
        <>
            <header className="nav">
                <div className="wrap nav__bar">
                    <a className="skip-link" href="#top">Skip to content</a>
                    <a className="nav__logo" href={isLanding ? '#top' : '/'}>
                        <span className="mark mark--initial" aria-hidden="true">C</span>CS Blood Drive
                    </a>
                    <nav className="nav__links" aria-label="Main">
                        {isLanding ? <LandingLinks /> : <RoleLinks user={user} pathname={pathname} />}
                    </nav>
                    <div className="nav__actions">
                        {isAuthenticated && user ? (
                            <>
                                <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => setIsNotifOpen(true)}
                                    aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                                >
                                    <Bell className="w-5 h-5" aria-hidden="true" />
                                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                                </button>
                                <span className="hidden xl:grid text-right leading-tight">
                                    <span className="text-sm font-medium">{user.full_name}</span>
                                    <span className="text-[13px] text-muted">
                                        {roleName(user.role)}
                                        {user.blood_group ? ` · ${user.blood_group}` : ''}
                                    </span>
                                </span>
                                <button type="button" className="icon-btn" onClick={logout} aria-label="Sign out">
                                    <LogOut className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </>
                        ) : (
                            isLanding ? (
                                <>
                                    <Link className="nav__link" href="/login">Sign in</Link>
                                    <a className="btn btn--primary" href="#drives">{MAIN_ACTION}</a>
                                </>
                            ) : pathname === '/login' || pathname === '/register' ? null : (
                                <Link className="btn btn--primary" href="/login">Sign in</Link>
                            )
                        )}
                    </div>
                    <button className="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
                        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                            <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </header>

            <NotificationModal
                isOpen={isNotifOpen}
                onClose={() => {
                    setIsNotifOpen(false);
                    fetchNotifications();
                }}
                notifications={notifications}
                onRefresh={fetchNotifications}
            />
        </>
    );
}

function roleName(role: User['role']): string {
    return { DONOR: 'Donor', COORDINATOR: 'Coordinator', STAFF: 'Medical staff', ADMIN: 'Admin' }[role];
}

const CHEV = (
    <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* The landing's words, each to its section; Booking opens the mega panel. */
function LandingLinks() {
    return (
        <>
            <div className="nav__item">
                <a className="nav__link" href="#booking">Booking {CHEV}</a>
                <div className="nav__menu">
                    <div className="wrap grid">
                        <div className="menu-col span-3">
                            <p className="t-label">For donors</p>
                            <a href="#drives">Upcoming drives<span>Pick a drive and a time</span></a>
                            <a href="#eligibility">Eligibility<span>Who can give, and when</span></a>
                            <a href="#booking">Your bookings<span>Codes, dates and history</span></a>
                        </div>
                        <div className="menu-col span-3">
                            <p className="t-label">For drive teams</p>
                            <a href="#teams">Drive setup<span>Slots made from your hours</span></a>
                            <a href="#teams">Check-in desk<span>The queue by booking code</span></a>
                            <a href="#teams">Turnout<span>Units and no-shows by hour</span></a>
                        </div>
                        <a className="menu-card span-3 start-10" href="#teams">
                            <div className="panel">
                                <div className="stage stage--fade-br">
                                    <div className="at-corner">
                                        <div className="ui ui-notify" data-ui="notify">
                                            <ul className="ui-notify__list">
                                                <li className="ui-note">
                                                    <span className="ui-avatar ui-note__av" data-tone="2">O−</span>
                                                    <span className="ui-note__text">
                                                        <span className="ui-note__title">O− donors needed<time>now</time></span>
                                                        <span className="ui-note__body">Science Block drive, open until 15:00</span>
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <span className="t-card">Urgent calls</span>
                            <span className="t-small muted">Message the donors of one blood group</span>
                        </a>
                    </div>
                </div>
            </div>
            <div className="nav__item"><a className="nav__link" href="#drives">Drives</a></div>
            <div className="nav__item"><a className="nav__link" href="#teams">Teams</a></div>
            <div className="nav__item"><a className="nav__link" href="#eligibility">Eligibility</a></div>
            <div className="nav__item"><a className="nav__link" href="#faq">Questions</a></div>
        </>
    );
}

/* On the tool pages: the portals this role may open, the current one marked. */
function RoleLinks({ user, pathname }: { user: User | null; pathname: string }) {
    const role = user?.role;
    const items: { href: string; label: string; show: boolean }[] = [
        { href: '/donor', label: 'Donor portal', show: !user || role === 'DONOR' },
        { href: '/coordinator', label: 'Coordinator', show: !user || role === 'COORDINATOR' || role === 'ADMIN' },
        { href: '/staff', label: 'Check-in desk', show: !user || role === 'STAFF' || role === 'ADMIN' },
        { href: '/admin', label: 'Admin', show: role === 'ADMIN' },
    ];
    return (
        <>
            <div className="nav__item"><Link className="nav__link" href="/">Drives</Link></div>
            {items
                .filter((item) => item.show)
                .map((item) => (
                    <div className="nav__item" key={item.href}>
                        <Link
                            className="nav__link"
                            href={item.href}
                            aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                        >
                            {item.label}
                        </Link>
                    </div>
                ))}
        </>
    );
}
