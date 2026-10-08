'use client';

import React, { useState } from 'react';
import { api, Drive, DriveSlot } from '@/lib/api';
import { UserPlus, Clock, Check, X, RefreshCw, AlertCircle } from 'lucide-react';

interface WalkInModalProps {
    isOpen: boolean;
    onClose: () => void;
    drive: Drive;
    onSuccess: () => void;
}

export default function WalkInModal({ isOpen, onClose, drive, onSuccess }: WalkInModalProps) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bloodGroup, setBloodGroup] = useState('O+');
    const [slotId, setSlotId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const slots = drive.slots || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !email.trim()) {
            setErrorMessage('Donor full name and email are required.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            await api.registerWalkIn(drive.id, {
                full_name: fullName,
                email,
                phone,
                blood_group: bloodGroup,
                slot_id: slotId || undefined
            });

            onSuccess();
            onClose();
        } catch (err: unknown) {
            const error = err as { message?: string };
            setErrorMessage(error.message || 'Failed to register walk-in donor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-white/10 bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">Rapid Walk-In Donor Intake</h3>
                            <p className="text-xs text-slate-400">On-Site Immediate Check-In</p>
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

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Donor Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Sipho Sithole"
                            className="w-full p-2.5 rounded-xl glass-input text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. sipho@student.campus.ac.za"
                            className="w-full p-2.5 rounded-xl glass-input text-xs"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 082 123 4567"
                                className="w-full p-2.5 rounded-xl glass-input text-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Blood Group</label>
                            <select
                                value={bloodGroup}
                                onChange={(e) => setBloodGroup(e.target.value)}
                                className="w-full p-2.5 rounded-xl glass-input text-xs font-bold text-red-400"
                            >
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Assign to Time Slot</label>
                        <select
                            value={slotId}
                            onChange={(e) => setSlotId(e.target.value)}
                            className="w-full p-2.5 rounded-xl glass-input text-xs"
                        >
                            <option value="">Next Available Slot (Automatic)</option>
                            {slots.map((s: DriveSlot) => (
                                <option key={s.id} value={s.id}>
                                    {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)} ({s.max_capacity - s.current_bookings} spots remaining)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-2 flex items-center justify-end space-x-3">
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
                            className="px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center space-x-1.5"
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Registering...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Register & Check In</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
