'use client';

import React, { useState, useEffect } from 'react';
import { api, Appointment, Drive } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
    Heart, 
    Calendar, 
    Clock, 
    MapPin, 
    ShieldCheck, 
    Download, 
    XCircle, 
    RefreshCw, 
    Plus, 
    Award, 
    CheckCircle2, 
    AlertCircle, 
    Hourglass,
    ChevronRight,
    Activity
} from 'lucide-react';
import PreScreenModal from '@/components/PreScreenModal';
import SlotPickerModal from '@/components/SlotPickerModal';
import BookingConfirmationModal from '@/components/BookingConfirmationModal';

export default function DonorDashboardPage() {
    const { user, isAuthenticated, quickLoginAs } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [drives, setDrives] = useState<Drive[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Modals
    const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
    const [isPreScreenOpen, setIsPreScreenOpen] = useState(false);
    const [isSlotPickerOpen, setIsSlotPickerOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [preScreenAnswers, setPreScreenAnswers] = useState<Record<string, unknown>>({});
    const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

    const loadDonorData = async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const [apptsRes, drivesRes] = await Promise.all([
                api.getMyAppointments(),
                api.getDrives('UPCOMING')
            ]);
            setAppointments(apptsRes.appointments || []);
            setDrives(drivesRes.drives || []);
        } catch (e) {
            console.error('Failed to load donor data', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            quickLoginAs('DONOR');
        } else {
            loadDonorData();
        }
    }, [isAuthenticated]);

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
        if (!confirm('Are you sure you want to cancel this booking? Your time slot will be released.')) return;
        try {
            await api.cancelAppointment(id);
            setActionMessage('Appointment cancelled and slot capacity released.');
            loadDonorData();
            setTimeout(() => setActionMessage(null), 4000);
        } catch (e: unknown) {
            const error = e as { message?: string };
            alert(error.message || 'Failed to cancel appointment.');
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
        <div className="space-y-10 animate-fade-in py-2">
            {/* Action Feedback Banner */}
            {actionMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{actionMessage}</span>
                </div>
            )}

            {/* DONOR HERO PROFILE CARD */}
            <div className="rounded-3xl glass-panel border border-white/10 p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-red-950/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-2xl bg-red-600/20 border-2 border-red-500/40 flex items-center justify-center text-red-500 shadow-xl shadow-red-950/40">
                            <Heart className="w-8 h-8 fill-red-500" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xl sm:text-2xl font-black text-white">{user?.full_name || 'Student Donor'}</h1>
                                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold font-mono">
                                    {user?.blood_group || 'O+'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                            <div className="flex items-center space-x-2 text-xs text-slate-300 mt-2">
                                <Award className="w-4 h-4 text-amber-400" />
                                <span>{completedHistory.length} Donations Completed • Saves up to {completedHistory.length * 3} lives</span>
                            </div>
                        </div>
                    </div>

                    {/* Eligibility Countdown Gauge Card */}
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center space-x-4 shrink-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            eligibility.isEligibleNow ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                            <Hourglass className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Donation Eligibility</span>
                            <div className="text-sm font-bold text-white mt-0.5">
                                {eligibility.isEligibleNow ? (
                                    <span className="text-emerald-400 font-extrabold flex items-center space-x-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Ready to Donate Today</span>
                                    </span>
                                ) : (
                                    <span className="text-amber-300 font-extrabold">
                                        {eligibility.daysLeft} Days Remaining ({eligibility.nextDateString})
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">56-day standard clinical interval</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTIVE APPOINTMENTS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-red-400" />
                        <span>My Active Bookings</span>
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">{activeAppointments.length} Active</span>
                </div>

                {isLoading ? (
                    <div className="h-36 rounded-2xl glass-panel animate-pulse" />
                ) : activeAppointments.length === 0 ? (
                    <div className="p-8 rounded-2xl glass-panel border border-white/5 text-center space-y-3">
                        <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-slate-300 text-sm font-semibold">You have no upcoming donation bookings.</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">Browse upcoming campus blood drives below, take the 60-second pre-screen, and pick your time slot.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeAppointments.map((appt) => (
                            <div key={appt.id} className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 relative">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-mono font-bold">
                                            REF: {appt.booking_reference}
                                        </span>
                                        <h3 className="font-bold text-white text-base mt-2">{appt.drive_title}</h3>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        {appt.status}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-xs text-slate-300">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-3.5 h-3.5 text-red-400" />
                                        <span>{appt.drive_date}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="w-3.5 h-3.5 text-red-400" />
                                        <span>Slot: {appt.slot_start_time?.substring(0, 5)} - {appt.slot_end_time?.substring(0, 5)}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                                        <span>{appt.location_name} {appt.building_room ? `(${appt.building_room})` : ''}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                                    <a
                                        href={api.getIcsUrl(appt.id)}
                                        download
                                        className="px-3 py-1.5 rounded-lg btn-secondary text-xs font-semibold flex items-center space-x-1"
                                    >
                                        <Download className="w-3 h-3" />
                                        <span>Calendar (.ics)</span>
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => handleCancelAppointment(appt.id)}
                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-1"
                                    >
                                        <XCircle className="w-3 h-3" />
                                        <span>Cancel Slot</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* UPCOMING CAMPUS DRIVES TO BOOK */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-red-400" />
                        <span>Schedule Your Next Donation</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {drives.map((drive) => (
                        <div key={drive.id} className="p-5 rounded-2xl glass-card border border-white/10 flex flex-col justify-between space-y-4">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded">
                                        {drive.status}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">{drive.available_spots ?? 0} spots</span>
                                </div>

                                <h3 className="font-bold text-white text-sm line-clamp-2">{drive.title}</h3>
                                <div className="text-xs text-slate-300 space-y-1 pt-1">
                                    <div className="flex items-center space-x-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-red-400" />
                                        <span>{drive.drive_date}</span>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                                        <span className="truncate">{drive.location_name}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleStartBooking(drive)}
                                className="w-full py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center justify-center space-x-1.5"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>Pre-Screen & Book</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* DONATION HISTORY TIMELINE */}
            <div className="space-y-4 pt-4">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <span>Donation History & Impact Log</span>
                </h2>

                {completedHistory.length === 0 ? (
                    <div className="p-6 rounded-2xl glass-panel text-center text-xs text-slate-400">
                        No completed donations recorded yet. Your impact journey starts with your first campus booking!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {completedHistory.map((rec) => (
                            <div key={rec.id} className="p-4 rounded-xl glass-card border border-white/5 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                        <Heart className="w-5 h-5 fill-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{rec.drive_title || 'Campus Blood Drive'}</h4>
                                        <p className="text-xs text-slate-400">{rec.drive_date} • Ref: {rec.booking_reference}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-emerald-400 block">+1 Whole Blood Unit</span>
                                    <span className="text-[10px] text-slate-400">3 Lives Impacted</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
