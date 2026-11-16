'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Appointment, Drive } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, MapPin, Download } from 'lucide-react';
import PreScreenModal from '@/components/PreScreenModal';
import SlotPickerModal from '@/components/SlotPickerModal';
import BookingConfirmationModal from '@/components/BookingConfirmationModal';
import StatusChip from '@/components/StatusChip';

export default function DonorDashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [drives, setDrives] = useState<Drive[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Modals
    const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
    const [isPreScreenOpen, setIsPreScreenOpen] = useState(false);
    const [isSlotPickerOpen, setIsSlotPickerOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [preScreenAnswers, setPreScreenAnswers] = useState<Record<string, unknown>>({});
    const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

    // state is set only in the request's callbacks (isLoading starts true)
    const loadDonorData = () => {
        if (!isAuthenticated) return;
        Promise.all([api.getMyAppointments(), api.getDrives('UPCOMING')])
            .then(([apptsRes, drivesRes]) => {
                setAppointments(apptsRes.appointments || []);
                setDrives(drivesRes.drives || []);
                setLoadError(null);
            })
            .catch((e) => {
                console.warn('Failed to load donor data', e);
                setLoadError('Your bookings could not load. Check your connection and reload the page.');
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        loadDonorData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, authLoading]);

    // Next Eligible Date Calculation (56 days cooldown)
    const calculateEligibilityCountdown = () => {
        if (!user?.last_donation_date) {
            return { isEligibleNow: true, daysLeft: 0, nextDateString: 'Eligible Today' };
        }
        const lastDonation = new Date(user.last_donation_date);
        const nextEligible = new Date(lastDonation.getTime() + 56 * 24 * 60 * 60 * 1000);
        const today = new Date();

        if (today >= nextEligible) {
            return { isEligibleNow: true, daysLeft: 0, nextDateString: 'Eligible Today' };
        } else {
            const diffTime = nextEligible.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
                isEligibleNow: false,
                daysLeft,
                nextDateString: nextEligible.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            };
        }
    };

    const eligibility = calculateEligibilityCountdown();

    const handleCancelAppointment = async (id: string) => {
        if (!confirm('Cancel this booking? Your time slot goes back to the drive.')) return;
        try {
            await api.cancelAppointment(id);
            setActionMessage('Booking cancelled. The slot is open for someone else.');
            loadDonorData();
            setTimeout(() => setActionMessage(null), 4000);
        } catch (e: unknown) {
            const error = e as { message?: string };
            alert(error.message || 'The booking could not be cancelled.');
        }
    };

    const handleStartBooking = (drive: Drive) => {
        setSelectedDrive(drive);
        setIsPreScreenOpen(true);
    };

    const handlePreScreenPassed = (answers: Record<string, unknown>) => {
        setPreScreenAnswers(answers);
        setIsSlotPickerOpen(true);
    };

    const handleBookingSuccess = (appt: Appointment) => {
        setConfirmedAppointment(appt);
        setIsConfirmationOpen(true);
        loadDonorData();
    };

    const activeAppointments = appointments.filter(a => ['CONFIRMED', 'CHECKED_IN', 'IN_CHAIR'].includes(a.status));
    const completedHistory = appointments.filter(a => a.status === 'COMPLETED');

    return (
        <div className="grid gap-12">
            {actionMessage && <div className="notice notice--ok" role="status">{actionMessage}</div>}
            {loadError && <div className="notice notice--bad" role="alert">{loadError}</div>}

            {/* Profile and eligibility */}
            <header className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="grid gap-2">
                    <p className="app-label">Donor portal</p>
                    <h1 className="app-title">{user?.full_name || 'Your donations'}</h1>
                    <p className="text-muted">
                        {user?.email}
                        {user?.blood_group ? ` · Blood group ${user.blood_group}` : ''}
                        {` · ${completedHistory.length} ${completedHistory.length === 1 ? 'donation' : 'donations'}`}
                    </p>
                </div>
                <div className="app-card grid gap-1 md:min-w-72">
                    <span className="app-label">Next donation</span>
                    {eligibility.isEligibleNow ? (
                        <span className="app-figure text-ok">You can give today</span>
                    ) : (
                        <span className="app-figure">
                            {eligibility.daysLeft} days <span className="text-muted text-base">· {eligibility.nextDateString}</span>
                        </span>
                    )}
                    <span className="text-sm text-muted">56 days after your last donation</span>
                </div>
            </header>

            {/* Active bookings */}
            <section className="grid gap-5" aria-labelledby="bookings-h">
                <div className="flex items-baseline justify-between gap-4">
                    <h2 id="bookings-h" className="app-h3">Your bookings</h2>
                    <span className="text-sm text-muted">{activeAppointments.length} active</span>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="skeleton h-48" />
                        <div className="skeleton h-48" />
                    </div>
                ) : activeAppointments.length === 0 ? (
                    <div className="app-card empty">
                        <p className="empty__title">No upcoming bookings</p>
                        <p>Pick a drive below to book your next slot.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {activeAppointments.map((appt) => (
                            <article key={appt.id} className="app-card grid gap-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="grid gap-1">
                                        <span className="font-mono text-sm text-muted">{appt.booking_reference}</span>
                                        <h3 className="app-h3">{appt.drive_title}</h3>
                                    </div>
                                    <StatusChip status={appt.status} />
                                </div>
                                <ul className="grid gap-2 text-sm">
                                    <li className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted" aria-hidden="true" />{appt.drive_date}</li>
                                    <li className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted" aria-hidden="true" />
                                        {appt.slot_start_time?.substring(0, 5)} to {appt.slot_end_time?.substring(0, 5)}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted" aria-hidden="true" />
                                        {appt.location_name}{appt.building_room ? `, ${appt.building_room}` : ''}
                                    </li>
                                </ul>
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                                    <a href={api.getIcsUrl(appt.id)} download className="btn btn--secondary btn--sm">
                                        <Download className="w-4 h-4" aria-hidden="true" />
                                        Add to calendar
                                    </a>
                                    <button type="button" onClick={() => handleCancelAppointment(appt.id)} className="link text-bad">
                                        Cancel this booking
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Drives open for booking */}
            <section className="grid gap-5" aria-labelledby="drives-h">
                <h2 id="drives-h" className="app-h3">Book your next donation</h2>
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-3">
                        {[0, 1, 2].map((n) => <div key={n} className="skeleton h-44" />)}
                    </div>
                ) : drives.length === 0 ? (
                    <div className="app-card empty">
                        <p className="empty__title">No drives open for booking</p>
                        <p>New drives show here as soon as a coordinator publishes them.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                        {drives.map((drive) => (
                            <article key={drive.id} className="app-card grid gap-4 content-between">
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="chip">{drive.status === 'ONGOING' ? 'On now' : 'Upcoming'}</span>
                                        <span className="text-sm text-muted tabular-nums">{drive.available_spots ?? 0} places left</span>
                                    </div>
                                    <h3 className="app-h3">{drive.title}</h3>
                                    <p className="text-sm text-muted">{drive.drive_date} · {drive.location_name}</p>
                                </div>
                                <button type="button" onClick={() => handleStartBooking(drive)} className="btn btn--primary w-full justify-center">
                                    Book a slot
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Donation history */}
            <section className="grid gap-5" aria-labelledby="history-h">
                <h2 id="history-h" className="app-h3">Donation history</h2>
                {isLoading ? (
                    <div className="skeleton h-24" />
                ) : completedHistory.length === 0 ? (
                    <div className="app-card empty">
                        <p className="empty__title">No donations recorded yet</p>
                        <p>Each donation the medical staff log shows here.</p>
                    </div>
                ) : (
                    <ul className="app-card app-card--flush">
                        {completedHistory.map((rec) => (
                            <li key={rec.id} className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 last:border-b-0">
                                <div className="grid gap-1">
                                    <span className="font-medium">{rec.drive_title || 'Campus blood drive'}</span>
                                    <span className="text-sm text-muted">{rec.drive_date} · {rec.booking_reference}</span>
                                </div>
                                <span className="text-sm tabular-nums">1 unit</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Modals */}
            {selectedDrive && (
                <>
                    <PreScreenModal
                        isOpen={isPreScreenOpen}
                        onClose={() => setIsPreScreenOpen(false)}
                        onPassed={handlePreScreenPassed}
                    />

                    <SlotPickerModal
                        isOpen={isSlotPickerOpen}
                        onClose={() => setIsSlotPickerOpen(false)}
                        drive={selectedDrive}
                        preScreenAnswers={preScreenAnswers}
                        onSuccess={handleBookingSuccess}
                    />
                </>
            )}

            <BookingConfirmationModal
                isOpen={isConfirmationOpen}
                onClose={() => setIsConfirmationOpen(false)}
                appointment={confirmedAppointment}
            />
        </div>
    );
}

