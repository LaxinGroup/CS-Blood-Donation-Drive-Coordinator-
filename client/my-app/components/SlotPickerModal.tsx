'use client';

import React, { useState } from 'react';
import { api, Drive, DriveSlot, Appointment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Clock, Calendar, MapPin, Users, Check, AlertTriangle, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface SlotPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    drive: Drive;
    preScreenAnswers?: Record<string, unknown>;
    onSuccess: (appointment: Appointment) => void;
}

export default function SlotPickerModal({ isOpen, onClose, drive, preScreenAnswers, onSuccess }: SlotPickerModalProps) {
    const { user, isAuthenticated } = useAuth();
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [bloodGroup, setBloodGroup] = useState<string>(user?.blood_group || 'O+');
    const [isBooking, setIsBooking] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const slots = drive.slots || [];

    const handleBook = async () => {
        if (!selectedSlotId) {
            setErrorMessage('Please select an available time slot.');
            return;
        }

        setIsBooking(true);
        setErrorMessage(null);

        try {
            const res = await api.bookAppointment({
                drive_id: drive.id,
                slot_id: selectedSlotId,
                pre_screen_answers: preScreenAnswers,
                blood_group: bloodGroup
            });

            onSuccess(res.appointment);
            onClose();
        } catch (err: unknown) {
            const error = err as { message?: string; status?: number };
            if (error.status === 409 || error.message?.includes('fully booked')) {
                setErrorMessage('⚠️ Race condition alert: That slot was just claimed by another donor! Please select another open time slot.');
            } else {
                setErrorMessage(error.message || 'Failed to complete booking. Please try again.');
            }
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-2xl rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-white/10 bg-slate-900/80 flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-red-500" />
                            <h3 className="font-bold text-white text-base">Select Your Donation Time Slot</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{drive.title}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Drive Meta Strip */}
                <div className="bg-slate-900/40 px-5 py-3 border-b border-white/5 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                    <div className="flex items-center space-x-1.5 text-slate-200">
                        <Calendar className="w-4 h-4 text-red-400" />
                        <span>{new Date(drive.drive_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-200">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span>{drive.location_name} {drive.building_room ? `(${drive.building_room})` : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-200 ml-auto">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">Pre-Screen Passed</span>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200 flex items-start space-x-2.5 animate-shake">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Donor Blood Group Verification */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <label className="text-xs font-semibold text-white block">Your Blood Group</label>
                            <span className="text-[11px] text-slate-400">Helps organizers prepare collection supplies</span>
                        </div>
                        <select
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                            className="p-2 rounded-lg glass-input text-xs font-bold text-red-400 border border-white/10"
                        >
                            <option value="O+">O Positive (O+)</option>
                            <option value="O-">O Negative (O-) Universal</option>
                            <option value="A+">A Positive (A+)</option>
                            <option value="A-">A Negative (A-)</option>
                            <option value="B+">B Positive (B+)</option>
                            <option value="B-">B Negative (B-)</option>
                            <option value="AB+">AB Positive (AB+)</option>
                            <option value="AB-">AB Negative (AB-)</option>
                            <option value="UNKNOWN">Don&apos;t Know / First Time</option>
                        </select>
                    </div>

                    {/* Discrete Time Slots Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Available Time Intervals (30 min)</h4>
                            <span className="text-[11px] text-slate-400">Real-time concurrency synced</span>
                        </div>

                        {slots.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs">
                                No slots configured for this drive.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {slots.map((slot: DriveSlot) => {
                                    const available = Math.max(0, slot.max_capacity - slot.current_bookings);
                                    const isFull = available === 0;
                                    const isSelected = selectedSlotId === slot.id;

                                    const formatTime = (t: string) => t.substring(0, 5);

                                    return (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            disabled={isFull}
                                            onClick={() => { setSelectedSlotId(slot.id); setErrorMessage(null); }}
                                            className={`p-3 rounded-xl border text-left transition-all relative ${
                                                isFull
                                                    ? 'bg-slate-900/30 border-white/5 opacity-40 cursor-not-allowed'
                                                    : isSelected
                                                    ? 'bg-red-950/60 border-red-500 shadow-lg shadow-red-950/40 ring-2 ring-red-500/40'
                                                    : 'bg-slate-800/60 border-white/10 hover:border-red-500/40 hover:bg-slate-800/90'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                                    {formatTime(slot.start_time)}
                                                </span>
                                                {isSelected && (
                                                    <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">
                                                        <Check className="w-3 h-3" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px]">
                                                <span className="text-slate-400">
                                                    to {formatTime(slot.end_time)}
                                                </span>
                                                <span
                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                                        isFull
                                                            ? 'bg-slate-800 text-slate-500'
                                                            : available === 1
                                                            ? 'bg-amber-500/20 text-amber-300'
                                                            : 'bg-emerald-500/20 text-emerald-300'
                                                    }`}
                                                >
                                                    {isFull ? 'Full' : `${available} left`}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                        {selectedSlotId ? (
                            <span className="text-white font-medium">Slot Selected: {slots.find(s => s.id === selectedSlotId)?.start_time.substring(0, 5)}</span>
                        ) : (
                            <span>Please choose a time slot to continue</span>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl btn-secondary text-xs font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleBook}
                            disabled={!selectedSlotId || isBooking}
                            className="px-6 py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isBooking ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Locking Slot...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Confirm Reservation</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
