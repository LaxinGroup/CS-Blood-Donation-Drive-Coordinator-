'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Drive, DriveAnalytics } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FileSpreadsheet, Megaphone, Plus, Printer } from 'lucide-react';
import CreateDriveModal from '@/components/CreateDriveModal';
import BroadcastModal from '@/components/BroadcastModal';
import StatusChip from '@/components/StatusChip';

export default function CoordinatorDashboardPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [drives, setDrives] = useState<Drive[]>([]);
    const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
    const [analytics, setAnalytics] = useState<DriveAnalytics | null>(null);
    const [isLoadingDrives, setIsLoadingDrives] = useState(true);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

    // state is set only in the requests' callbacks; the loading flags are raised by the event that asks
    const loadDrives = () => {
        api.getDrives()
            .then((res) => {
                const allDrives = res.drives || [];
                setDrives(allDrives);
                if (allDrives.length > 0 && !selectedDriveId) {
                    setIsLoadingAnalytics(true);
                    setSelectedDriveId(allDrives[0].id);
                }
            })
            .catch((e) => {
                console.warn('Failed to load drives', e);
                setLoadError('The drives could not load. Check your connection and reload the page.');
            })
            .finally(() => setIsLoadingDrives(false));
    };

    const loadAnalytics = (driveId: string) => {
        api.getDriveAnalytics(driveId)
            .then((res) => setAnalytics(res.analytics))
            .catch((e) => {
                console.warn('Failed to load analytics', e);
                setLoadError('The turnout figures for this drive could not load.');
            })
            .finally(() => setIsLoadingAnalytics(false));
    };

    const selectDrive = (driveId: string) => {
        setIsLoadingAnalytics(true);
        setSelectedDriveId(driveId);
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
            loadAnalytics(selectedDriveId);
        }
    }, [selectedDriveId]);

    const handleDriveCreated = (newDrive: Drive) => {
        loadDrives();
        selectDrive(newDrive.id);
    };

    return (
        <div className="grid gap-10">
            <header className="flex flex-wrap items-end justify-between gap-6">
                <div className="grid gap-2">
                    <p className="app-label">Coordinator</p>
                    <h1 className="app-title">Drives and turnout</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => setIsBroadcastOpen(true)} className="btn btn--secondary">
                        <Megaphone className="w-4 h-4" aria-hidden="true" />
                        Send an urgent call
                    </button>
                    <button type="button" onClick={() => setIsCreateOpen(true)} className="btn btn--primary">
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        Schedule a drive
                    </button>
                </div>
            </header>

            {loadError && <div className="notice notice--bad" role="alert">{loadError}</div>}

            {/* Drive picker */}
            <div className="field max-w-md">
                <label htmlFor="drive-pick">Drive</label>
                {isLoadingDrives ? (
                    <div className="skeleton h-12" />
                ) : (
                    <select
                        id="drive-pick"
                        className="input"
                        value={selectedDriveId ?? ''}
                        onChange={(e) => selectDrive(e.target.value)}
                        disabled={drives.length === 0}
                    >
                        {drives.length === 0 && <option value="">No drives yet</option>}
                        {drives.map((d) => (
                            <option key={d.id} value={d.id}>{d.title} · {d.drive_date}</option>
                        ))}
                    </select>
                )}
            </div>

            {!isLoadingDrives && drives.length === 0 ? (
                <div className="app-card empty">
                    <p className="empty__title">No drives scheduled yet</p>
                    <p>Schedule a drive and its slots are made from the hours you set.</p>
                </div>
            ) : isLoadingAnalytics || !analytics ? (
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[0, 1, 2, 3, 4].map((n) => <div key={n} className="skeleton h-32" />)}
                    </div>
                    <div className="skeleton h-72" />
                </div>
            ) : (
                <div className="grid gap-6">
                    <Metrics analytics={analytics} />
                    <HourlyChart hourly={analytics.hourly_distribution} />
                    <DonorTable analytics={analytics} />
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

/* Five stat tiles: the figure in ink, its context in muted text; the target meter in the accent. */
function Metrics({ analytics }: { analytics: DriveAnalytics }) {
    const m = analytics.metrics;
    const tiles: { label: string; value: React.ReactNode; line: string }[] = [
        {
            label: 'Units collected',
            value: <>{m.total_units_collected}<span className="text-muted text-base"> of {m.target_units}</span></>,
            line: `${m.target_progress_percentage}% of the target`,
        },
        { label: 'Turnout', value: `${m.turnout_rate_percentage}%`, line: `${m.completed_count} donated of ${m.total_booked} booked` },
        { label: 'Checked in', value: m.checked_in_count, line: 'Donors seen at the desk' },
        { label: 'Deferred', value: m.deferred_count, line: 'Stopped at the medical check' },
        { label: 'No-shows', value: m.no_show_count, line: 'Booked and did not come' },
    ];
    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {tiles.map((t, i) => (
                <div key={t.label} className={`app-card grid gap-2 content-start ${i === 0 ? 'col-span-2 lg:col-span-1' : ''}`}>
                    <span className="app-label">{t.label}</span>
                    <span className="app-figure">{t.value}</span>
                    {i === 0 && (
                        <div className="meter" role="img" aria-label={`${m.target_progress_percentage}% of the target collected`}>
                            <i style={{ ['--k' as string]: Math.min(100, m.target_progress_percentage) / 100 }} />
                        </div>
                    )}
                    <span className="text-sm text-muted">{t.line}</span>
                </div>
            ))}
        </div>
    );
}

/* Arrivals by hour: one series, so one ink hue, no legend; each bar names its value on hover. */
function HourlyChart({ hourly }: { hourly: Record<string, number> }) {
    const entries = Object.entries(hourly);
    const max = Math.max(...Object.values(hourly), 1);
    return (
        <section className="app-card grid gap-5" aria-labelledby="hourly-h">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="hourly-h" className="app-h3">Arrivals by hour</h2>
                <span className="text-sm text-muted">Booked donors per hour of the drive</span>
            </div>
            {entries.length === 0 ? (
                <p className="text-muted">No bookings yet, so no hours to show.</p>
            ) : (
                <ul className="grid gap-3">
                    {entries.map(([hour, count]) => (
                        <li key={hour} className="bar-row" title={`${hour}: ${count} donors`}>
                            <span className="font-mono text-muted">{hour}</span>
                            <span className="bar-row__track">
                                <span className="bar-row__fill block" style={{ width: `${Math.round((count / max) * 100)}%` }} />
                            </span>
                            <span className="text-right tabular-nums">{count}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

/* The turnout log with its two exports. */
function DonorTable({ analytics }: { analytics: DriveAnalytics }) {
    return (
        <section className="app-card app-card--flush" aria-labelledby="log-h">
            <div className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="grid gap-1">
                    <h2 id="log-h" className="app-h3">Turnout log</h2>
                    <p className="text-sm text-muted">Every booking for this drive, with what happened at the desk.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <a href={api.getCsvExportUrl(analytics.drive.id)} download className="btn btn--secondary btn--sm">
                        <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                        Download CSV
                    </a>
                    <button type="button" onClick={() => window.print()} className="btn btn--secondary btn--sm">
                        <Printer className="w-4 h-4" aria-hidden="true" />
                        Print as PDF
                    </button>
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
                            <th>Units</th>
                            <th>Checked in</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analytics.donor_list.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center text-muted py-10">No bookings for this drive yet.</td>
                            </tr>
                        ) : (
                            analytics.donor_list.map((item) => (
                                <tr key={item.id}>
                                    <td className="font-mono">{item.booking_reference}</td>
                                    <td className="font-medium">{item.donor_name}</td>
                                    <td className="font-mono">{item.blood_group_collected || item.donor_blood_group || '–'}</td>
                                    <td className="tabular-nums">{item.slot_start_time?.substring(0, 5)} to {item.slot_end_time?.substring(0, 5)}</td>
                                    <td><StatusChip status={item.status} /></td>
                                    <td className="tabular-nums">{item.units_collected || 0}</td>
                                    <td className="text-muted tabular-nums">
                                        {item.check_in_time ? new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not yet'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
