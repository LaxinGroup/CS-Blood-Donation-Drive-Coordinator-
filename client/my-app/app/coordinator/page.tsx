'use client';

import React, { useState, useEffect } from 'react';
import { api, Drive, DriveAnalytics } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
    BarChart3, 
    Calendar, 
    Clock, 
    MapPin, 
    Users, 
    PlusCircle, 
    Radio, 
    Download, 
    Printer, 
    Activity, 
    CheckCircle2, 
    AlertTriangle, 
    Target, 
    RefreshCw, 
    TrendingUp,
    FileSpreadsheet,
    Layers,
    ChevronDown
} from 'lucide-react';
import CreateDriveModal from '@/components/CreateDriveModal';
import BroadcastModal from '@/components/BroadcastModal';

export default function CoordinatorDashboardPage() {
    const { user, isAuthenticated, quickLoginAs } = useAuth();
    const [drives, setDrives] = useState<Drive[]>([]);
    const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
    const [analytics, setAnalytics] = useState<DriveAnalytics | null>(null);
    const [isLoadingDrives, setIsLoadingDrives] = useState(true);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

    const loadDrives = async () => {
        setIsLoadingDrives(true);
        try {
            const res = await api.getDrives();
            const allDrives = res.drives || [];
            setDrives(allDrives);
            if (allDrives.length > 0 && !selectedDriveId) {
                setSelectedDriveId(allDrives[0].id);
            }
        } catch (e) {
            console.error('Failed to load drives', e);
        } finally {
            setIsLoadingDrives(false);
        }
    };

    const loadAnalytics = async (driveId: string) => {
        setIsLoadingAnalytics(true);
        try {
            const res = await api.getDriveAnalytics(driveId);
            setAnalytics(res.analytics);
        } catch (e) {
            console.error('Failed to load analytics', e);
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            quickLoginAs('COORDINATOR');
        } else {
            loadDrives();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (selectedDriveId) {
            loadAnalytics(selectedDriveId);
        }
    }, [selectedDriveId]);

    const handleDriveCreated = (newDrive: Drive) => {
        loadDrives();
        setSelectedDriveId(newDrive.id);
    };

    const currentDrive = drives.find(d => d.id === selectedDriveId);

    return (
        <div className="space-y-8 animate-fade-in py-2">
            {/* TOP BAR: Coordinator Header & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-white/10 bg-slate-900/80">
                <div>
                    <div className="flex items-center space-x-2">
                        <BarChart3 className="w-6 h-6 text-red-500" />
                        <h1 className="text-xl sm:text-2xl font-black text-white">Drive Coordinator & Analytics</h1>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Real-time capacity management, dynamic slot allocation & turnout reporting</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setIsBroadcastOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
                    >
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span>Urgent Shortage Broadcast</span>
                    </button>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center space-x-1.5"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Schedule New Drive</span>
                    </button>
                </div>
            </div>

            {/* DRIVE SELECTOR STRIP */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Select Campaign:</span>
                {drives.map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setSelectedDriveId(d.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 border ${
                            selectedDriveId === d.id
                                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/40'
                                : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700'
                        }`}
                    >
                        <span>{d.title}</span>
                        <span className="text-[10px] opacity-75 font-mono">({d.drive_date})</span>
                    </button>
                ))}
            </div>

            {/* MAIN ANALYTICS OVERVIEW */}
            {isLoadingAnalytics || !analytics ? (
                <div className="h-96 rounded-3xl glass-panel animate-pulse" />
            ) : (
                <div className="space-y-6">
                    {/* KEY PERFORMANCE METRIC TILES */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target vs Collected</span>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-3xl font-black text-red-400">{analytics.metrics.total_units_collected}</span>
                                <span className="text-xs text-slate-400">/ {analytics.metrics.target_units} Units</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                                <div
                                    className="bg-red-500 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, analytics.metrics.target_progress_percentage)}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-red-400 font-semibold">{analytics.metrics.target_progress_percentage}% of target goal</span>
                        </div>

                        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Turnout Rate</span>
                            <div className="text-3xl font-black text-emerald-400">
                                {analytics.metrics.turnout_rate_percentage}%
                            </div>
                            <p className="text-[10px] text-slate-400">
                                {analytics.metrics.completed_count} completed of {analytics.metrics.total_booked} booked
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Checked-In On-Site</span>
                            <div className="text-3xl font-black text-sky-400">
                                {analytics.metrics.checked_in_count}
                            </div>
                            <p className="text-[10px] text-slate-400">Donors processed at medical desk</p>
                        </div>

                        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Deferrals</span>
                            <div className="text-3xl font-black text-amber-400">
                                {analytics.metrics.deferred_count}
                            </div>
                            <p className="text-[10px] text-slate-400">Low hemoglobin / wellness checks</p>
                        </div>

                        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">No-Shows</span>
                            <div className="text-3xl font-black text-slate-400">
                                {analytics.metrics.no_show_count}
                            </div>
                            <p className="text-[10px] text-slate-400">Slots released or missed</p>
                        </div>
                    </div>

                    {/* VISUAL CHARTS ROW: Blood Groups & Hourly Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Blood Type Breakdown Chart */}
                        <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                                    <Activity className="w-4 h-4 text-red-500" />
                                    <span>Blood Group Distribution</span>
                                </h3>
                                <span className="text-xs text-slate-400">All registered & collected</span>
                            </div>

                            <div className="grid grid-cols-4 gap-3 pt-2">
                                {Object.entries(analytics.blood_group_distribution).map(([group, count]) => (
                                    <div key={group} className="p-3 rounded-xl bg-slate-800/80 border border-white/5 text-center">
                                        <span className="text-xs font-mono font-bold text-red-400 block">{group}</span>
                                        <strong className="text-lg font-black text-white">{count}</strong>
                                        <span className="text-[10px] text-slate-400 block">donors</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Peak Arrival Hours Chart */}
                        <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-red-500" />
                                    <span>Hourly Arrival & Booking Traffic</span>
                                </h3>
                                <span className="text-xs text-slate-400">Peak interval analysis</span>
                            </div>

                            <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
                                {Object.entries(analytics.hourly_distribution).length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-6">No hourly traffic data yet.</p>
                                ) : (
                                    Object.entries(analytics.hourly_distribution).map(([hour, count]) => {
                                        const maxTraffic = Math.max(...Object.values(analytics.hourly_distribution), 1);
                                        const percentage = Math.round((count / maxTraffic) * 100);
                                        return (
                                            <div key={hour} className="space-y-1">
                                                <div className="flex justify-between text-xs text-slate-300">
                                                    <span className="font-mono">{hour}</span>
                                                    <span>{count} donors</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* EXPORT & DONOR LIST TABLE */}
                    <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="font-bold text-white text-base">Donor Turnout & Phlebotomy Log</h3>
                                <p className="text-xs text-slate-400">Official turnout summary for institutional health compliance</p>
                            </div>

                            {/* Export Buttons */}
                            <div className="flex items-center space-x-2">
                                <a
                                    href={api.getCsvExportUrl(analytics.drive.id)}
                                    download
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                                >
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                    <span>Export CSV</span>
                                </a>

                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                                >
                                    <Printer className="w-4 h-4 text-sky-400" />
                                    <span>Print Report (PDF)</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto pt-2">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                                    <tr>
                                        <th className="p-3">Ref Code</th>
                                        <th className="p-3">Donor Name</th>
                                        <th className="p-3">Blood Group</th>
                                        <th className="p-3">Time Slot</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Units Collected</th>
                                        <th className="p-3">Check-In Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {analytics.donor_list.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-6 text-center text-slate-500">
                                                No donors registered for this drive yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        analytics.donor_list.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-3 font-mono text-red-400 font-bold">{item.booking_reference}</td>
                                                <td className="p-3 font-semibold text-white">{item.donor_name}</td>
                                                <td className="p-3 font-mono font-bold text-red-300">
                                                    {item.blood_group_collected || item.donor_blood_group || 'N/A'}
                                                </td>
                                                <td className="p-3">{item.slot_start_time?.substring(0, 5)} - {item.slot_end_time?.substring(0, 5)}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        item.status === 'COMPLETED'
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : item.status === 'DEFERRED'
                                                            ? 'bg-amber-500/20 text-amber-400'
                                                            : item.status === 'CHECKED_IN'
                                                            ? 'bg-sky-500/20 text-sky-400'
                                                            : 'bg-slate-700 text-slate-300'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-semibold text-white">{item.units_collected || 0}</td>
                                                <td className="p-3 text-slate-400">
                                                    {item.check_in_time ? new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <CreateDriveModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={handleDriveCreated}
            />

            <BroadcastModal
                isOpen={isBroadcastOpen}
                onClose={() => setIsBroadcastOpen(false)}
                driveId={selectedDriveId || undefined}
            />
        </div>
    );
}
