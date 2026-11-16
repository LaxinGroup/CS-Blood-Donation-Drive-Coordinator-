'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, User } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface AuditLog {
    id: string;
    user_id?: string;
    action: string;
    details?: Record<string, unknown>;
    ip_address?: string;
    created_at: string;
    full_name?: string;
    email?: string;
    role?: string;
}

const ROLE_NAME: Record<User['role'], string> = {
    DONOR: 'Donor',
    COORDINATOR: 'Coordinator',
    STAFF: 'Medical staff',
    ADMIN: 'Admin',
};

export default function AdminPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // state is set only in the request's callbacks (isLoading starts true)
    const loadAdminData = () => {
        Promise.all([api.getUsers(), api.getAuditLogs()])
            .then(([usersRes, logsRes]) => {
                setUsers(usersRes.users || []);
                setLogs((logsRes.logs as AuditLog[]) || []);
                setLoadError(null);
            })
            .catch((e) => {
                console.warn('Failed to load admin data', e);
                setLoadError('Users and the audit log could not load. Check your connection and reload the page.');
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (user?.role !== 'ADMIN') {
            router.push('/');
            return;
        }
        loadAdminData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.role, authLoading]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await api.updateUserRole(userId, newRole);
            setActionMessage(`Role changed to ${ROLE_NAME[newRole as User['role']] ?? newRole}.`);
            loadAdminData();
            setTimeout(() => setActionMessage(null), 3500);
        } catch (e: unknown) {
            const err = e as { message?: string };
            alert(err.message || 'Failed to update role');
        }
    };

    return (
        <div className="grid gap-10">
            <header className="grid gap-2">
                <p className="app-label">Admin</p>
                <h1 className="app-title">Users and audit log</h1>
            </header>

            {actionMessage && <div className="notice notice--ok" role="status">{actionMessage}</div>}
            {loadError && <div className="notice notice--bad" role="alert">{loadError}</div>}

            {/* Users */}
            <section className="app-card app-card--flush" aria-labelledby="users-h">
                <div className="flex flex-wrap items-baseline justify-between gap-2 p-6">
                    <h2 id="users-h" className="app-h3">Users</h2>
                    <span className="text-sm text-muted">{users.length} accounts</span>
                </div>
                <div className="overflow-x-auto border-t border-line">
                    {isLoading ? (
                        <div className="grid gap-3 p-6">{[0, 1, 2].map((n) => <div key={n} className="skeleton h-10" />)}</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Group</th>
                                    <th className="text-right">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center text-muted py-10">No accounts yet.</td>
                                    </tr>
                                ) : users.map((u) => (
                                    <tr key={u.id}>
                                        <td className="font-medium">{u.full_name}</td>
                                        <td className="text-muted">{u.email}</td>
                                        <td className="font-mono">{u.blood_group || '–'}</td>
                                        <td className="text-right">
                                            <label className="sr-only" htmlFor={`role-${u.id}`}>Role for {u.full_name}</label>
                                            <select
                                                id={`role-${u.id}`}
                                                className="input w-44 h-10"
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            >
                                                <option value="DONOR">Donor</option>
                                                <option value="COORDINATOR">Coordinator</option>
                                                <option value="STAFF">Medical staff</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {/* Audit log */}
            <section className="app-card app-card--flush" aria-labelledby="audit-h">
                <div className="flex flex-wrap items-baseline justify-between gap-2 p-6">
                    <h2 id="audit-h" className="app-h3">Audit log</h2>
                    <span className="text-sm text-muted">Newest first</span>
                </div>
                <div className="max-h-96 overflow-y-auto border-t border-line">
                    {isLoading ? (
                        <div className="grid gap-3 p-6">{[0, 1, 2].map((n) => <div key={n} className="skeleton h-12" />)}</div>
                    ) : logs.length === 0 ? (
                        <p className="empty">No actions recorded yet.</p>
                    ) : (
                        <ul>
                            {logs.map((log) => (
                                <li key={log.id} className="flex items-start justify-between gap-4 border-b border-line px-6 py-4 last:border-b-0">
                                    <div className="grid gap-1 min-w-0">
                                        <span className="text-sm">
                                            <span className="font-mono font-medium">{log.action}</span>
                                            <span className="text-muted"> · {log.full_name || log.email || 'System'}</span>
                                        </span>
                                        <span className="font-mono text-[13px] text-muted break-all">{JSON.stringify(log.details || {})}</span>
                                    </div>
                                    <span className="text-[13px] text-muted tabular-nums shrink-0">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
