'use client';

import React, { useState, useEffect } from 'react';
import { api, User } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Users, Lock, ShieldAlert, Check, RefreshCw, KeyRound, Terminal, AlertCircle } from 'lucide-react';

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

export default function AdminPage() {
    const { user, isAuthenticated, quickLoginAs } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const loadAdminData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, logsRes] = await Promise.all([
                api.getUsers(),
                api.getAuditLogs()
            ]);
            setUsers(usersRes.users || []);
            setLogs((logsRes.logs as AuditLog[]) || []);
        } catch (e) {
            console.error('Failed to load admin data', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            quickLoginAs('ADMIN');
        } else {
            loadAdminData();
        }
    }, [isAuthenticated, user?.role]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await api.updateUserRole(userId, newRole);
            setActionMessage(`Role updated to ${newRole}.`);
            loadAdminData();
            setTimeout(() => setActionMessage(null), 3500);
        } catch (e: unknown) {
            const err = e as { message?: string };
            alert(err.message || 'Failed to update role');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in py-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-white/10 bg-slate-900/80">
                <div>
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-6 h-6 text-amber-500" />
                        <h1 className="text-xl sm:text-2xl font-black text-white">System Administration & Audit</h1>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Role-Based Access Control, Security Hardening & Platform Audit Logs</p>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                        PostgreSQL ACID Mode Active
                    </span>
                </div>
            </div>

            {actionMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{actionMessage}</span>
                </div>
            )}

            {/* USERS MANAGEMENT */}
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-amber-500" />
                        <h2 className="font-bold text-white text-base">User Directory & Role Elevation</h2>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{users.length} registered accounts</span>
                </div>

                <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                            <tr>
                                <th className="p-3">User Name</th>
                                <th className="p-3">Email Address</th>
                                <th className="p-3">Blood Group</th>
                                <th className="p-3">Current Role</th>
                                <th className="p-3 text-right">Assign Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-semibold text-white">{u.full_name}</td>
                                    <td className="p-3 font-mono text-slate-400">{u.email}</td>
                                    <td className="p-3 font-bold text-red-400 font-mono">{u.blood_group || 'N/A'}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' :
                                            u.role === 'COORDINATOR' ? 'bg-blue-500/20 text-blue-400' :
                                            u.role === 'STAFF' ? 'bg-emerald-500/20 text-emerald-400' :
                                            'bg-slate-800 text-slate-300'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            className="p-1.5 rounded-lg glass-input text-xs font-semibold bg-slate-800 border-white/10"
                                        >
                                            <option value="DONOR">DONOR</option>
                                            <option value="COORDINATOR">COORDINATOR</option>
                                            <option value="STAFF">STAFF</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AUDIT LOGS TRAIL */}
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Terminal className="w-5 h-5 text-amber-500" />
                        <h2 className="font-bold text-white text-base">Security & Transaction Audit Trail</h2>
                    </div>
                    <span className="text-xs text-slate-400">Latest immutable actions</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs">
                    {logs.length === 0 ? (
                        <p className="text-slate-500 text-center py-6">No audit records logged yet.</p>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-amber-400 font-bold">{log.action}</span>
                                        <span className="text-slate-400 text-[11px]">• Actor: {log.full_name || log.email || 'System'}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        {JSON.stringify(log.details || {})}
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-500 shrink-0">
                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
