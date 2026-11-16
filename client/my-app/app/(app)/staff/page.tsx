'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Drive, Appointment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UserPlus } from 'lucide-react';
import WalkInModal from '@/components/WalkInModal';
import PhlebotomyModal from '@/components/PhlebotomyModal';
import StatusChip from '@/components/StatusChip';

const FILTERS: { value: string; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'CONFIRMED', label: 'Booked' },
    { value: 'CHECKED_IN', label: 'Waiting' },
    { value: 'IN_CHAIR', label: 'In the chair' },
    { value: 'COMPLETED', label: 'Donated' },
    { value: 'DEFERRED', label: 'Deferred' },
];

export default function StaffConsolePage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [drives, setDrives] = useState<Drive[]>([]);
    const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
    const [queue, setQueue] = useState<Appointment[]>([]);
    const [activeDrive, setActiveDrive] = useState<Drive | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [isWalkInOpen, setIsWalkInOpen] = useState(false);
    const [selectedAppointmentForLog, setSelectedAppointmentForLog] = useState<Appointment | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // state is set only in the requests' callbacks (isLoading starts true)
    const loadDrives = () => {
        api.getDrives()
            .then((res) => {
                const list = res.drives || [];
                setDrives(list);
                if (list.length > 0 && !selectedDriveId) {
                    // Default to ongoing or first drive
                    const ongoing = list.find(d => d.status === 'ONGOING') || list[0];
                    setSelectedDriveId(ongoing.id);
                }
            })
            .catch((e) => {
                console.warn('Failed to load drives', e);
                setLoadError('The drives could not load. Check your connection and reload the page.');
            })
            .finally(() => setIsLoading(false));
    };

    const loadQueue = (driveId: string) => {
        api.getDriveQueue(driveId)
            .then((res) => {
                setQueue(res.queue || []);
                setActiveDrive(res.drive || null);
                setLoadError(null);
            })
            .catch((e) => {
                console.warn('Failed to load drive queue', e);
                setLoadError('The queue could not refresh. It tries again every 8 seconds.');
            });
    };

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        loadDrives();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        if (selectedDriveId) {
            loadQueue(selectedDriveId);
            const interval = setInterval(() => loadQueue(selectedDriveId), 8000);
            return () => clearInterval(interval);
        }
    }, [selectedDriveId]);

    const flash = (message: string) => {
        setActionMessage(message);
        setTimeout(() => setActionMessage(null), 3500);
    };

    const handleCheckIn = async (appointmentId: string) => {
        try {
            await api.checkInDonor(appointmentId);
            flash('Donor checked in and added to the queue.');
            if (selectedDriveId) loadQueue(selectedDriveId);
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

    const q = searchQuery.toLowerCase();
    const filteredQueue = queue.filter(item => {
        const matchesQuery =
            (item.donor_name || '').toLowerCase().includes(q) ||
            (item.donor_email || '').toLowerCase().includes(q) ||
            (item.booking_reference || '').toLowerCase().includes(q);

        if (statusFilter === 'ALL') return matchesQuery;
        return matchesQuery && item.status === statusFilter;
    });

    const countOf = (status: string) => queue.filter(item => item.status === status).length;
    const tiles: { status: string; label: string; line: string }[] = [
        { status: 'CONFIRMED', label: 'Booked', line: 'Not arrived yet' },
        { status: 'CHECKED_IN', label: 'Waiting', line: 'Checked in' },
        { status: 'IN_CHAIR', label: 'In the chair', line: 'Donating now' },
        { status: 'COMPLETED', label: 'Donated', line: 'Units logged' },
        { status: 'DEFERRED', label: 'Deferred', line: 'Stopped at the check' },
    ];

    return (
        <div className="grid gap-8">
            {actionMessage && <div className="notice notice--ok" role="status">{actionMessage}</div>}
            {loadError && <div className="notice notice--bad" role="alert">{loadError}</div>}

            <header className="flex flex-wrap items-end justify-between gap-6">
                <div className="grid gap-2">
                    <p className="app-label">Medical staff</p>
                    <h1 className="app-title">Check-in desk</h1>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="field min-w-64">
                        <label htmlFor="desk-drive">Drive</label>
                        {isLoading ? (
                            <div className="skeleton h-12" />
                        ) : (
                            <select
                                id="desk-drive"
                                className="input"
                                value={selectedDriveId || ''}
                                onChange={(e) => setSelectedDriveId(e.target.value)}
                                disabled={drives.length === 0}
                            >
                                {drives.length === 0 ? (
                                    <option value="">No drives yet</option>
                                ) : (
                                    drives.map(d => (
                                        <option key={d.id} value={d.id}>{d.title} · {d.drive_date}</option>
                                    ))
                                )}
                            </select>
                        )}
                    </div>
                    {activeDrive && (
                        <button type="button" onClick={() => setIsWalkInOpen(true)} className="btn btn--primary">
                            <UserPlus className="w-4 h-4" aria-hidden="true" />
                            Add a walk-in donor
                        </button>
                    )}
                </div>
            </header>

            {/* Counts, each a filter */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {tiles.map((t) => (
                    <button
                        key={t.status}
                        type="button"
                        onClick={() => setStatusFilter(t.status)}
                        aria-pressed={statusFilter === t.status}
                        className={`app-card grid gap-1 text-left cursor-pointer ${statusFilter === t.status ? 'border-ink' : ''}`}
                    >
                        <span className="app-label">{t.label}</span>
                        <span className="app-figure">{countOf(t.status)}</span>
                        <span className="text-sm text-muted">{t.line}</span>
                    </button>
                ))}
            </div>

            {/* The queue */}
            <section className="app-card app-card--flush" aria-labelledby="queue-h">
                <div className="flex flex-wrap items-end justify-between gap-4 p-6">
                    <div className="grid gap-1">
                        <h2 id="queue-h" className="app-h3">Queue</h2>
                        <span className="text-sm text-muted">{filteredQueue.length} donors · refreshes every 8 seconds</span>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="tabs" role="group" aria-label="Show">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    type="button"
                                    className="tabs__tab"
                                    aria-pressed={statusFilter === f.value}
                                    onClick={() => setStatusFilter(f.value)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="field w-64">
                            <label htmlFor="queue-search">Search by code, name or email</label>
                            <input
                                id="queue-search"
                                className="input"
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto border-t border-line">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Donor</th>
                                <th>Group</th>
                                <th>Slot</th>
                                <th>Status</th>
                                <th>Arrived</th>
                                <th className="text-right">Next step</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQueue.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center text-muted py-10">
                                        {queue.length === 0 ? 'No donors booked for this drive yet.' : 'No donors with this status.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredQueue.map((appt) => (
                                    <tr key={appt.id}>
                                        <td className="font-mono">{appt.booking_reference}</td>
                                        <td>
                                            <span className="block font-medium">{appt.donor_name}</span>
                                            <span className="text-muted">{appt.donor_email}</span>
                                        </td>
                                        <td className="font-mono">{appt.blood_group_collected || appt.donor_blood_group || '–'}</td>
                                        <td className="tabular-nums">{appt.slot_start_time?.substring(0, 5)} to {appt.slot_end_time?.substring(0, 5)}</td>
                                        <td><StatusChip status={appt.status} /></td>
                                        <td className="text-muted tabular-nums">
                                            {appt.check_in_time
                                                ? new Date(appt.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : 'Not yet'}
                                        </td>
                                        <td className="text-right">
                                            <RowActions
                                                appt={appt}
                                                onCheckIn={() => handleCheckIn(appt.id)}
                                                onToChair={() => handleUpdateStatus(appt.id, 'IN_CHAIR')}
                                                onLog={() => setSelectedAppointmentForLog(appt)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Modals */}
            {activeDrive && (
                <WalkInModal
                    isOpen={isWalkInOpen}
                    onClose={() => setIsWalkInOpen(false)}
                    drive={activeDrive}
                    onSuccess={() => {
                        flash('Walk-in donor registered and checked in.');
                        if (selectedDriveId) loadQueue(selectedDriveId);
                    }}
                />
            )}

            {selectedAppointmentForLog && (
                <PhlebotomyModal
                    isOpen={!!selectedAppointmentForLog}
                    onClose={() => setSelectedAppointmentForLog(null)}
                    appointment={selectedAppointmentForLog}
                    onSuccess={() => {
                        flash('Donation outcome recorded.');
                        if (selectedDriveId) loadQueue(selectedDriveId);
                    }}
                />
            )}
        </div>
    );
}

type RowActionsProps = { appt: Appointment; onCheckIn: () => void; onToChair: () => void; onLog: () => void };

/* The one or two steps a row can take next, in queue order. */
function RowActions({ appt, onCheckIn, onToChair, onLog }: RowActionsProps) {
    const isCheckedIn = appt.status === 'CHECKED_IN';
    const isInChair = appt.status === 'IN_CHAIR';
    return (
        <div className="flex items-center justify-end gap-2">
            {appt.status === 'CONFIRMED' && (
                <button type="button" onClick={onCheckIn} className="btn btn--secondary btn--sm">Check in</button>
            )}
            {isCheckedIn && (
                <button type="button" onClick={onToChair} className="btn btn--secondary btn--sm">Seat in a chair</button>
            )}
            {(isCheckedIn || isInChair) && (
                <button type="button" onClick={onLog} className="btn btn--primary btn--sm">Log the outcome</button>
            )}
            {appt.status === 'COMPLETED' && (
                <span className="text-sm text-muted">{appt.units_collected || 1} unit logged</span>
            )}
        </div>
    );
}
