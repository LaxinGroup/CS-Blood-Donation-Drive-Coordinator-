'use client';

import React, { useState } from 'react';
import { api, Appointment } from '@/lib/api';
import { Activity, Check, X, RefreshCw, Heart, AlertOctagon, UserX } from 'lucide-react';

interface PhlebotomyModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    onSuccess: () => void;
}

export default function PhlebotomyModal({ isOpen, onClose, appointment, onSuccess }: PhlebotomyModalProps) {
    const [outcome, setOutcome] = useState<'COMPLETED' | 'DEFERRED' | 'NO_SHOW'>('COMPLETED');
    const [unitsCollected, setUnitsCollected] = useState(1);
    const [bloodGroup, setBloodGroup] = useState(appointment.donor_blood_group || 'O+');
    const [deferralReason, setDeferralReason] = useState('Low Hemoglobin (< 12.5 g/dL)');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            await api.recordDonationOutcome(appointment.id, {
                outcome,
                units_collected: outcome === 'COMPLETED' ? Number(unitsCollected) : 0,
                blood_group_collected: bloodGroup,
                deferral_reason: outcome === 'DEFERRED' ? deferralReason : undefined,
                notes
            });

            onSuccess();
            onClose();
        } catch (err: unknown) {
            const error = err as { message?: string };
            setErrorMessage(error.message || 'Failed to log phlebotomy outcome.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-white/10 bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">Phlebotomy Outcome Log</h3>
                            <p className="text-xs text-slate-400">Donor: {appointment.donor_name} ({appointment.booking_reference})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {errorMessage && (
                        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200">
                            {errorMessage}
                        </div>
                    )}

                    {/* Outcome Mode Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Select Donation Result</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setOutcome('COMPLETED')}
                                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                                    outcome === 'COMPLETED'
                                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                                        : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
                                }`}
                            >
                                <Heart className="w-4 h-4 fill-current" />
                                <span>Completed</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setOutcome('DEFERRED')}
                                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                                    outcome === 'DEFERRED'
                                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40'
                                        : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
                                }`}
                            >
                                <AlertOctagon className="w-4 h-4" />
                                <span>Deferred</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setOutcome('NO_SHOW')}
                                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                                    outcome === 'NO_SHOW'
                                        ? 'bg-slate-600 text-white border-slate-500'
                                        : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
                                }`}
                            >
                                <UserX className="w-4 h-4" />
                                <span>No-Show</span>
                            </button>
                        </div>
                    </div>

                    {outcome === 'COMPLETED' && (
                        <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Blood Group Verified</label>
                                    <select
                                        value={bloodGroup}
                                        onChange={(e) => setBloodGroup(e.target.value)}
                                        className="w-full p-2.5 rounded-xl glass-input text-xs font-bold text-red-400"
                                    >
                                        <option value="O+">O+</option>
                                        <option value="O-">O- (Universal)</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Units Collected</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="3"
                                        value={unitsCollected}
                                        onChange={(e) => setUnitsCollected(Number(e.target.value))}
                                        className="w-full p-2.5 rounded-xl glass-input text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {outcome === 'DEFERRED' && (
                        <div className="space-y-2 pt-2">
                            <label className="block text-xs font-semibold text-slate-300">Clinical Deferral Reason</label>
                            <select
                                value={deferralReason}
                                onChange={(e) => setDeferralReason(e.target.value)}
                                className="w-full p-2.5 rounded-xl glass-input text-xs"
                            >
                                <option value="Low Hemoglobin (< 12.5 g/dL)">Low Hemoglobin (&lt; 12.5 g/dL)</option>
                                <option value="Elevated Blood Pressure">Elevated Blood Pressure (&gt; 180/100)</option>
                                <option value="Low Pulse / Arrhythmia">Low Pulse / Arrhythmia</option>
                                <option value="Recent Tattoo / Piercing">Recent Tattoo / Piercing (&lt; 3 months)</option>
                                <option value="Active Antibiotic Course">Active Antibiotic Course</option>
                                <option value="Vein Access Issue / Difficult Phlebotomy">Vein Access Issue / Difficult Phlebotomy</option>
                                <option value="Donor Feeling Faint / Vasovagal Reaction">Donor Feeling Faint / Vasovagal Reaction</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Clinical Phlebotomy Notes</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Standard 450ml whole blood collection, donor rested 10 mins with juice."
                            className="w-full p-2.5 rounded-xl glass-input text-xs"
                        />
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl btn-secondary text-xs font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center space-x-1.5"
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Saving Log...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Record Outcome</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
