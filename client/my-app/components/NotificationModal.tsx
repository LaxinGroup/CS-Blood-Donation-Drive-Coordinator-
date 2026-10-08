'use client';

import React from 'react';
import { api, NotificationItem } from '@/lib/api';
import { Bell, Check, CheckCheck, X, AlertTriangle, Info, CalendarCheck } from 'lucide-react';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: NotificationItem[];
    onRefresh: () => void;
}

export default function NotificationModal({ isOpen, onClose, notifications, onRefresh }: NotificationModalProps) {
    if (!isOpen) return null;

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.markNotificationRead(id);
            onRefresh();
        } catch (e) {
            console.error('Failed to mark read', e);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.markAllNotificationsRead();
            onRefresh();
        } catch (e) {
            console.error('Failed to mark all read', e);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'URGENT_BROADCAST':
                return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
            case 'CONFIRMATION':
                return <CalendarCheck className="w-5 h-5 text-emerald-400 shrink-0" />;
            default:
                return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden mt-14 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
                    <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-red-500" />
                        <h3 className="font-bold text-white text-base">Notifications</h3>
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                            {notifications.filter(n => !n.is_read).length} new
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 px-2 py-1 rounded hover:bg-white/5"
                            title="Mark all as read"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
                    {notifications.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                            <p>No notifications yet.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-3 rounded-xl border transition-all ${
                                    notif.is_read
                                        ? 'bg-slate-900/40 border-white/5 opacity-75'
                                        : 'bg-slate-800/80 border-red-500/30 shadow-md shadow-red-950/20'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start space-x-2.5">
                                        {getIcon(notif.type)}
                                        <div>
                                            <h4 className="text-xs font-bold text-white leading-snug">{notif.title}</h4>
                                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                                            <span className="text-[10px] text-slate-400 mt-1.5 block">
                                                {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    {!notif.is_read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
