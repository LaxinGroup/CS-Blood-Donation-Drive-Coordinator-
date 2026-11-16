'use client';

import React from 'react';
import { api, NotificationItem } from '@/lib/api';
import Modal from './Modal';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: NotificationItem[];
    onRefresh: () => void;
}

const TYPE: Record<NotificationItem['type'], { label: string; tone: string }> = {
    URGENT_BROADCAST: { label: 'Urgent', tone: 'chip--bad' },
    CONFIRMATION: { label: 'Booking', tone: 'chip--ok' },
    REMINDER: { label: 'Reminder', tone: '' },
    INFO: { label: 'Update', tone: '' },
};

export default function NotificationModal({ isOpen, onClose, notifications, onRefresh }: NotificationModalProps) {
    if (!isOpen) return null;

    const unread = notifications.filter(n => !n.is_read).length;

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.markNotificationRead(id);
            onRefresh();
        } catch (e) {
            console.warn('Failed to mark read', e);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.markAllNotificationsRead();
            onRefresh();
        } catch (e) {
            console.warn('Failed to mark all read', e);
        }
    };

    const footer = unread > 0 ? (
        <button type="button" onClick={handleMarkAllAsRead} className="btn btn--secondary">Mark all as read</button>
    ) : undefined;

    return (
        <Modal title="Notifications" subtitle={unread > 0 ? `${unread} unread` : 'All read'} onClose={onClose} footer={footer}>
            {notifications.length === 0 ? (
                <div className="empty">
                    <p className="empty__title">No notifications yet</p>
                    <p>Booking confirmations and urgent calls show here.</p>
                </div>
            ) : (
                <ul className="grid gap-3">
                    {notifications.map((notif) => {
                        const type = TYPE[notif.type] ?? TYPE.INFO;
                        const when = new Date(notif.created_at);
                        return (
                            <li key={notif.id} className={`choice items-start ${notif.is_read ? 'opacity-70' : 'border-line-strong'}`}>
                                <div className="grid gap-1 min-w-0">
                                    <span className="flex flex-wrap items-center gap-2">
                                        <span className={`chip ${type.tone}`}>{type.label}</span>
                                        <span className="font-medium">{notif.title}</span>
                                    </span>
                                    <span className="text-sm">{notif.message}</span>
                                    <span className="text-[13px] text-muted">
                                        {when.toLocaleDateString()} at {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {!notif.is_read && (
                                    <button type="button" onClick={() => handleMarkAsRead(notif.id)} className="link text-sm shrink-0">
                                        Mark as read
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </Modal>
    );
}
