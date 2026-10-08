'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Drive, SystemOverview, Appointment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
    Heart, 
    Calendar, 
    Clock, 
    MapPin, 
    Users, 
    CheckCircle2, 
    ShieldCheck, 
    Sparkles, 
    ArrowRight, 
    Activity, 
    Search,
    ChevronRight,
    AlertCircle,
    Award
} from 'lucide-react';
import PreScreenModal from '@/components/PreScreenModal';
import SlotPickerModal from '@/components/SlotPickerModal';
import BookingConfirmationModal from '@/components/BookingConfirmationModal';

export default function HomePage() {
    const { isAuthenticated, user, quickLoginAs } = useAuth();
    const [drives, setDrives] = useState<Drive[]>([]);
    const [overview, setOverview] = useState<SystemOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Booking Flow State
    const [isPreScreenOpen, setIsPreScreenOpen] = useState(false);
    const [isSlotPickerOpen, setIsSlotPickerOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
    const [preScreenAnswers, setPreScreenAnswers] = useState<Record<string, unknown>>({});
    const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

    const loadData = async () => {
        try {
            const [drivesRes, overviewRes] = await Promise.all([
                api.getDrives(),
                api.getSystemOverview()
            ]);
            setDrives(drivesRes.drives || []);
            setOverview(overviewRes.overview || null);
        } catch (e) {
            console.error('Failed to load home data', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStartBooking = async (drive: Drive) => {
        setSelectedDrive(drive);
        // If not logged in, auto-login as donor for smooth demo experience
        if (!isAuthenticated) {
            await quickLoginAs('DONOR');
        }
        setIsPreScreenOpen(true);
    };

    const handlePreScreenPassed = (answers: Record<string, unknown>) => {
        setPreScreenAnswers(answers);
        setIsSlotPickerOpen(true);
    };

    const handleBookingSuccess = (appt: Appointment) => {
        setConfirmedAppointment(appt);
        setIsConfirmationOpen(true);
        loadData(); // Refresh slot numbers
    };

    const filteredDrives = drives.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.location_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-16 py-4 animate-fade-in">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden rounded-3xl glass-panel border border-white/10 p-8 sm:p-14 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-red-950/40">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl space-y-6">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Empowering Campus Lifesavers • Concurrency-Protected Engine</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                        Every Drop Counts. <br />
                        <span className="bg-gradient-to-r from-red-500 via-rose-400 to-red-300 bg-clip-text text-transparent">
                            Coordinate Campus Blood Drives.
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
                        Replace messy paper sign-up sheets with digital slot reservations, instant pre-donation eligibility checks, on-site check-in desks, and live turnout analytics.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <a
                            href="#drives-section"
                            className="px-6 py-3.5 rounded-xl btn-primary text-sm font-bold flex items-center space-x-2"
                        >
                            <span>Browse Campus Drives</span>
                            <ArrowRight className="w-4 h-4" />
                        </a>

                        <Link
                            href="/donor"
                            className="px-6 py-3.5 rounded-xl btn-secondary text-sm font-bold flex items-center space-x-2"
                        >
                            <Calendar className="w-4 h-4 text-red-400" />
                            <span>My Donor Portal</span>
                        </Link>
                    </div>
                </div>

                {/* Real-Time Impact Metric Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5">
                        <span className="text-xs text-slate-400 font-medium">Registered Donors</span>
                        <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                            {overview?.total_donors || 148}+
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5">
                        <span className="text-xs text-slate-400 font-medium">Units Collected</span>
                        <div className="text-2xl sm:text-3xl font-black text-red-400 mt-1">
                            {overview?.total_units_collected_all_time || 92}
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5">
                        <span className="text-xs text-slate-400 font-medium">Estimated Lives Saved</span>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                            {overview?.lives_impacted_estimate || 276}
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5">
                        <span className="text-xs text-slate-400 font-medium">Active Campus Drives</span>
                        <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-1">
                            {overview?.total_drives || drives.length}
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS (4-STEP WORKFLOW) */}
            <section className="space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                    <h2 className="text-xs uppercase font-bold text-red-400 tracking-widest">Frictionless Experience</h2>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white">How Campus Blood Drive Works</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-6 rounded-2xl glass-card space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-lg">
                            1
                        </div>
                        <h4 className="font-bold text-white text-base">Digital Pre-Screen</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Complete a 60-second health & eligibility questionnaire before booking to prevent on-site deferrals.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl glass-card space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-lg">
                            2
                        </div>
                        <h4 className="font-bold text-white text-base">Reserve Exact Slot</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Pick an exact 30-minute time slot. Protected by database row locks so you never get double-booked.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl glass-card space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
                            3
                        </div>
                        <h4 className="font-bold text-white text-base">1-Click Check-In</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Show your booking code or student ID at the medical desk. Medical staff manage the live queue seamlessly.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl glass-card space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-lg">
                            4
                        </div>
                        <h4 className="font-bold text-white text-base">Track History & Cooldown</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            View units collected, blood group badge, and an automated 56-day countdown to your next eligible date.
                        </p>
                    </div>
                </div>
            </section>

            {/* UPCOMING DRIVES SECTION */}
            <section id="drives-section" className="space-y-6 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xs uppercase font-bold text-red-400 tracking-widest">Campus Schedule</h2>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white">Upcoming Blood Drives</h3>
                    </div>

                    {/* Search Filter */}
                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search venue or drive title..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-64 rounded-2xl glass-panel animate-pulse" />
                        ))}
                    </div>
                ) : filteredDrives.length === 0 ? (
                    <div className="text-center py-16 glass-panel rounded-2xl">
                        <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                        <p className="text-slate-300 font-semibold">No drives matched your search.</p>
                        <p className="text-xs text-slate-500 mt-1">Check back soon or ask your campus coordinator.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDrives.map((drive) => {
                            const availableSpots = drive.available_spots ?? 0;
                            const isOngoing = drive.status === 'ONGOING';

                            return (
                                <div
                                    key={drive.id}
                                    className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between space-y-4"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                                isOngoing
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                                {drive.status}
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">
                                                {availableSpots} spots left
                                            </span>
                                        </div>

                                        <h4 className="text-lg font-bold text-white leading-snug line-clamp-2">
                                            {drive.title}
                                        </h4>

                                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                            {drive.description}
                                        </p>

                                        <div className="space-y-1.5 pt-2 text-xs text-slate-300">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                <span>{new Date(drive.drive_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                <span>{drive.start_time.substring(0, 5)} - {drive.end_time.substring(0, 5)} ({drive.slot_duration_minutes}m slots)</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                <span className="truncate">{drive.location_name} {drive.building_room ? `(${drive.building_room})` : ''}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleStartBooking(drive)}
                                            className="w-full py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center justify-center space-x-1.5"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>Pre-Screen & Book Slot</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
