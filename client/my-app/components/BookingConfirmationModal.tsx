'use client';

import React from 'react';
import { Appointment, api } from '@/lib/api';
import { CheckCircle2, Calendar, Clock, MapPin, Download, QrCode, X, Heart, Shield } from 'lucide-react';
import Link from 'next/link';

interface BookingConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
}

export default function BookingConfirmationModal({ isOpen, onClose, appointment }: BookingConfirmationModalProps) {
    if (!isOpen || !appointment) return null;

    const icsUrl = api.getIcsUrl(appointment.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                {/* Header Graphic */}
                <div className="bg-gradient-to-br from-red-600 to-rose-700 p-6 text-center text-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-16 h-16 rounded-full bg-white text-red-600 flex items-center justify-center mx-auto mb-3 shadow-xl">
                        <Heart className="w-9 h-9 fill-red-600" />
                    </div>
                    <h3 className="text-xl font-extrabold tracking-tight">Appointment Confirmed!</h3>
                    <p className="text-xs text-red-100 mt-1">Thank you for stepping up to save lives on campus.</p>
                </div>

                {/* Booking Code Card */}
                <div className="p-6 space-y-5 bg-slate-900/90">
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-white/10 text-center relative overflow-hidden">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Your Booking Reference Code</span>
                        <div className="text-2xl font-mono font-extrabold text-red-400 tracking-wider">
                            {appointment.booking_reference}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">Present this code or your student ID at the check-in desk on arrival.</span>
                    </div>

                    {/* Drive Details Summary */}
                    <div className="space-y-2.5 text-xs text-slate-300">
                        <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-white/5">
                            <Calendar className="w-4 h-4 text-red-400 shrink-0" />
                            <div>
                                <span className="text-slate-400 block text-[10px]">Drive Date</span>
                                <span className="font-semibold text-white">{appointment.drive_date || 'Drive Day'}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-white/5">
                            <Clock className="w-4 h-4 text-red-400 shrink-0" />
                            <div>
                                <span className="text-slate-400 block text-[10px]">Reserved Time Slot</span>
                                <span className="font-semibold text-white">
                                    {appointment.slot_start_time?.substring(0, 5) || 'Scheduled'} - {appointment.slot_end_time?.substring(0, 5) || ''}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-white/5">
                            <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                            <div>
                                <span className="text-slate-400 block text-[10px]">Location</span>
                                <span className="font-semibold text-white">{appointment.location_name || 'Campus Venue'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pre-donation reminders */}
                    <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-200 space-y-1">
                        <p className="font-semibold text-blue-300">Before you arrive:</p>
                        <p>💧 Drink 500ml of water 1 hour prior to donation.</p>
                        <p>🥪 Have a healthy breakfast/lunch before your appointment.</p>
                        <p>🪪 Bring your student/staff or national ID card.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-white/10 bg-slate-900 flex items-center justify-between gap-3">
                    <a
                        href={icsUrl}
                        download
                        className="px-4 py-2.5 rounded-xl btn-secondary text-xs font-semibold flex items-center space-x-1.5 flex-1 justify-center"
                    >
                        <Download className="w-3.5 h-3.5 text-red-400" />
                        <span>Add to Calendar (.ics)</span>
                    </a>

                    <Link
                        href="/donor"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold flex-1 text-center"
                    >
                        View in My Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}
