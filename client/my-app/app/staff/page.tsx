'use client';

import React, { useState, useEffect } from 'react';
import { api, Drive, Appointment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
    ClipboardCheck, 
    Search, 
    UserPlus, 
    CheckCircle, 
    Activity, 
    Clock, 
    UserCheck, 
    Heart, 
    RefreshCw, 
    AlertCircle,
    MapPin,
    Calendar,
    ChevronRight,
    Users
} from 'lucide-react';
import WalkInModal from '@/components/WalkInModal';
import PhlebotomyModal from '@/components/PhlebotomyModal';

export default function StaffConsolePage() {
    const { user, isAuthenticated, quickLoginAs } = useAuth();
    const [drives, setDrives] = useState<Drive[]>([]);
    const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
    const [queue, setQueue] = useState<Appointment[]>([]);
    const [activeDrive, setActiveDrive] = useState<Drive | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [isWalkInOpen, setIsWalkInOpen] = useState(false);
    const [selectedAppointmentForLog, setSelectedAppointmentForLog] = useState<Appointment | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const loadDrives = async () => {
        setIsLoading(true);
        try {
            const res = await api.getDrives();
            const list = res.drives || [];
            setDrives(list);
            if (list.length > 0 && !selectedDriveId) {
                // Default to ongoing or first drive
                const ongoing = list.find(d => d.status === 'ONGOING') || list[0];
                setSelectedDriveId(ongoing.id);
            }
        } catch (e) {
            console.error('Failed to load drives', e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadQueue = async (driveId: string) => {
        try {
            const res = await api.getDriveQueue(driveId);
            setQueue(res.queue || []);
            setActiveDrive(res.drive || null);
        } catch (e) {
            console.error('Failed to load drive queue', e);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            quickLoginAs('STAFF');
        } else {
            loadDrives();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (selectedDriveId) {
            loadQueue(selectedDriveId);
            const interval = setInterval(() => loadQueue(selectedDriveId), 8000);
            return () => clearInterval(interval);
        }
    }, [selectedDriveId]);

    const handleCheckIn = async (appointmentId: string) => {
        try {
            await api.checkInDonor(appointmentId);
            setActionMessage('Donor checked in successfully and added to queue.');
            if (selectedDriveId) loadQueue(selectedDriveId);
            setTimeout(() => setActionMessage(null), 3500);
        } catch (e: unknown) {
            const err = e as { message?: string };
            alert(err.message || 'Check-in failed');
        }
    };

    const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
        try {
            await api.updateQueueStatus(appointmentId, newStatus);
            if (selectedDriveId) loadQueue(selectedDriveId);
        } catch (e: unknown) {
            const err = e as { message?: string };
            alert(err.message || 'Status update failed');
        }
    };

    const filteredQueue = queue.filter(item => {
        const matchesQuery = 
            (item.donor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.donor_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.booking_reference || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (statusFilter === 'ALL') return matchesQuery;
        return matchesQuery && item.status === statusFilter;
    });

    const bookedCount = queue.filter(q => q.status === 'CONFIRMED').length;
    const waitingCount = queue.filter(q => q.status === 'CHECKED_IN').length;
    const inChairCount = queue.filter(q => q.status === 'IN_CHAIR').length;
    const completedCount = queue.filter(q => q.status === 'COMPLETED').length;
    const deferredCount = queue.filter(q => q.status === 'DEFERRED').length;

    return (
        <div className="space-y-6 animate-fade-in py-2">
            {/* Action Feedback Banner */}
            {actionMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{actionMessage}</span>
                </div>
            )}

            {/* TOP HEADER & DRIVE SELECTOR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-white/10 bg-slate-900/80">
                <div>
                    <div className="flex items-center space-x-2">
                        <ClipboardCheck className="w-6 h-6 text-red-500" />
                        <h1 className="text-xl sm:text-2xl font-black text-white">Medical Staff Live Desk</h1>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Day-of-drive on-site donor check-ins, phlebotomy chairs & walk-in intake</p>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Drive Selection Dropdown */}
                    <select
                        value={selectedDriveId || ''}
                        onChange={(e) => setSelectedDriveId(e.target.value)}
                        className="p-2.5 rounded-xl glass-input text-xs font-bold text-slate-200 border border-white/10"
                    >
                        {drives.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.title} ({d.drive_date})
                            </option>
                        ))}
                    </select>

                    {activeDrive && (
                        <button
                            type="button"
                            onClick={() => setIsWalkInOpen(true)}
                            className="px-4 py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center space-x-1.5 shadow-lg shrink-0"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Rapid Walk-In</span>
                        </button>
                    )}
                </div>
            </div>

            {/* LIVE STATUS SUMMARY TILES */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                    type="button"
                    onClick={() => setStatusFilter('CONFIRMED')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        statusFilter === 'CONFIRMED' ? 'bg-slate-700/80 border-slate-400 ring-2 ring-slate-400/30' : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/60'
                    }`}
                >
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Upcoming / Booked</span>
                    <strong className="text-2xl font-black text-slate-200 mt-1 block">{bookedCount}</strong>
                    <span className="text-[10px] text-slate-400">Awaiting arrival</span>
                </button>

                <button
                    type="button"
                    onClick={() => setStatusFilter('CHECKED_IN')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        statusFilter === 'CHECKED_IN' ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-400/30' : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/60'
                    }`}
                >
                    <span className="text-[10px] uppercase font-bold text-sky-400 block">Checked-In / Waiting</span>
                    <strong className="text-2xl font-black text-sky-300 mt-1 block">{waitingCount}</strong>
                    <span className="text-[10px] text-sky-400/80">In waiting lounge</span>
                </button>

                <button
                    type="button"
                    onClick={() => setStatusFilter('IN_CHAIR')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        statusFilter === 'IN_CHAIR' ? 'bg-rose-950/80 border-rose-400 ring-2 ring-rose-400/30' : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/60'
                    }`}
                >
                    <span className="text-[10px] uppercase font-bold text-rose-400 block">In Phlebotomy Chair</span>
                    <strong className="text-2xl font-black text-rose-300 mt-1 block">{inChairCount}</strong>
                    <span className="text-[10px] text-rose-400/80">Donating now</span>
                </button>

                <button
                    type="button"
                    onClick={() => setStatusFilter('COMPLETED')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        statusFilter === 'COMPLETED' ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/30' : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/60'
                    }`}
                >
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Completed</span>
                    <strong className="text-2xl font-black text-emerald-300 mt-1 block">{completedCount}</strong>
                    <span className="text-[10px] text-emerald-400/80">Units logged</span>
                </button>

                <button
                    type="button"
                    onClick={() => setStatusFilter('DEFERRED')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        statusFilter === 'DEFERRED' ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/30' : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/60'
                    }`}
                >
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">Deferred</span>
                    <strong className="text-2xl font-black text-amber-300 mt-1 block">{deferredCount}</strong>
                    <span className="text-[10px] text-amber-400/80">Clinical deferrals</span>
                </button>
            </div>

            {/* QUEUE TABLE WITH FILTERS & SEARCH */}
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-red-500" />
                        <h3 className="font-bold text-white text-base">Live Attendance & Phlebotomy Queue</h3>
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-mono">
                            {filteredQueue.length} donors
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Status Filter Tab Pills */}
                        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-white/5 text-xs">
                            {['ALL', 'CONFIRMED', 'CHECKED_IN', 'IN_CHAIR', 'COMPLETED', 'DEFERRED'].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                                        statusFilter === st ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {st === 'CONFIRMED' ? 'Booked' : st}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-48 sm:w-64">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search ref, donor name..."
                                className="w-full pl-8 pr-3 py-2 rounded-xl glass-input text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* Queue Table */}
                <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                            <tr>
                                <th className="p-3">Ref Code</th>
                                <th className="p-3">Donor Info</th>
                                <th className="p-3">Blood Group</th>
                                <th className="p-3">Slot Time</th>
                                <th className="p-3">Queue Status</th>
                                <th className="p-3">Check-In Arrival</th>
                                <th className="p-3 text-right">Desk Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredQueue.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        No donors in this filter category.
                                    </td>
                                </tr>
                            ) : (
                                filteredQueue.map((appt) => {
                                    const isBooked = appt.status === 'CONFIRMED';
                                    const isCheckedIn = appt.status === 'CHECKED_IN';
                                    const isInChair = appt.status === 'IN_CHAIR';

                                    return (
                                        <tr key={appt.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-mono font-bold text-red-400">
                                                {appt.booking_reference}
                                            </td>
                                            <td className="p-3">
                                                <span className="font-bold text-white block">{appt.donor_name}</span>
                                                <span className="text-[11px] text-slate-400">{appt.donor_email}</span>
                                            </td>
                                            <td className="p-3">
                                                <span className="px-2 py-0.5 rounded font-mono font-bold bg-red-500/20 text-red-300 text-xs">
                                                    {appt.blood_group_collected || appt.donor_blood_group || 'O+'}
                                                </span>
                                            </td>
                                            <td className="p-3 font-mono">
                                                {appt.slot_start_time?.substring(0, 5)} - {appt.slot_end_time?.substring(0, 5)}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    appt.status === 'COMPLETED'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : appt.status === 'IN_CHAIR'
                                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                                                        : appt.status === 'CHECKED_IN'
                                                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                                        : appt.status === 'DEFERRED'
                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {appt.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-400">
                                                {appt.check_in_time 
                                                    ? new Date(appt.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Not Arrived'}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {isBooked && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCheckIn(appt.id)}
                                                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center space-x-1 shadow"
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5" />
                                                            <span>Check In</span>
                                                        </button>
                                                    )}

                                                    {isCheckedIn && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateStatus(appt.id, 'IN_CHAIR')}
                                                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1 shadow"
                                                        >
                                                            <Activity className="w-3.5 h-3.5" />
                                                            <span>To Chair</span>
                                                        </button>
                                                    )}

                                                    {(isCheckedIn || isInChair) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedAppointmentForLog(appt)}
                                                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 shadow"
                                                        >
                                                            <Heart className="w-3.5 h-3.5 fill-current" />
                                                            <span>Log Outcome</span>
                                                        </button>
                                                    )}

                                                    {appt.status === 'COMPLETED' && (
                                                        <span className="text-emerald-400 font-bold text-xs flex items-center space-x-1">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            <span>Done ({appt.units_collected || 1} unit)</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {activeDrive && (
                <WalkInModal
                    isOpen={isWalkInOpen}
                    onClose={() => setIsWalkInOpen(false)}
                    drive={activeDrive}
                    onSuccess={() => {
                        setActionMessage('Walk-in donor registered and checked in!');
                        if (selectedDriveId) loadQueue(selectedDriveId);
                        setTimeout(() => setActionMessage(null), 3500);
                    }}
                />
            )}

            {selectedAppointmentForLog && (
                <PhlebotomyModal
                    isOpen={!!selectedAppointmentForLog}
                    onClose={() => setSelectedAppointmentForLog(null)}
                    appointment={selectedAppointmentForLog}
                    onSuccess={() => {
                        setActionMessage('Phlebotomy outcome recorded successfully.');
                        if (selectedDriveId) loadQueue(selectedDriveId);
                        setTimeout(() => setActionMessage(null), 3500);
                    }}
                />
            )}
        </div>
    );
}
