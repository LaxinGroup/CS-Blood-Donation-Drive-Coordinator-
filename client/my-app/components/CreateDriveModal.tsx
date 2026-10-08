'use client';

import React, { useState } from 'react';
import { api, Drive } from '@/lib/api';
import { PlusCircle, Calendar, Clock, MapPin, Users, Target, X, RefreshCw, Sparkles, Layers } from 'lucide-react';

interface CreateDriveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (drive: Drive) => void;
}

export default function CreateDriveModal({ isOpen, onClose, onCreated }: CreateDriveModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [locationName, setLocationName] = useState('Campus Student Union Hall');
    const [buildingRoom, setBuildingRoom] = useState('Ground Floor, Foyer B');
    const [driveDate, setDriveDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('15:00');
    const [slotDuration, setSlotDuration] = useState(30);
    const [capacityPerSlot, setCapacityPerSlot] = useState(4);
    const [targetUnits, setTargetUnits] = useState(50);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    // Real-Time Dynamic Slot Generator Calculator
    const calculateSlotsPreview = () => {
        if (!startTime || !endTime) return { count: 0, totalCapacity: 0, slots: [] };
        const [sH, sM] = startTime.split(':').map(Number);
        const [eH, eM] = endTime.split(':').map(Number);

        let current = sH * 60 + sM;
        const end = eH * 60 + eM;
        const slots: string[] = [];

        while (current + slotDuration <= end) {
            const h = Math.floor(current / 60);
            const m = current % 60;
            const nextH = Math.floor((current + slotDuration) / 60);
            const nextM = (current + slotDuration) % 60;

            const format = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            slots.push(`${format(h, m)} - ${format(nextH, nextM)}`);
            current += slotDuration;
        }

        return {
            count: slots.length,
            totalCapacity: slots.length * capacityPerSlot,
            slots
        };
    };

    const preview = calculateSlotsPreview();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !locationName.trim() || !driveDate || !startTime || !endTime) {
            setErrorMessage('Please complete all required fields.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await api.createDrive({
                title,
                description,
                location_name: locationName,
                building_room: buildingRoom,
                drive_date: driveDate,
                start_time: `${startTime}:00`,
                end_time: `${endTime}:00`,
                slot_duration_minutes: slotDuration,
                capacity_per_slot: capacityPerSlot,
                target_units: targetUnits
            });

            onCreated(res.drive);
            onClose();
        } catch (err: unknown) {
            const error = err as { message?: string };
            setErrorMessage(error.message || 'Failed to create drive.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-3xl rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-5 border-b border-white/10 bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
                            <PlusCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">Schedule New Blood Donation Drive</h3>
                            <p className="text-xs text-slate-400">Dynamic Slot Generation & Capacity Allocation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
                    {errorMessage && (
                        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200">
                            {errorMessage}
                        </div>
                    )}

                    {/* Section 1: Campaign Details */}
                    <div className="space-y-4">
                        <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">1. Drive Information</h4>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Drive Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Faculty of Science Mid-Term Blood Drive"
                                className="w-full p-2.5 rounded-xl glass-input text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Location / Venue <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    placeholder="e.g. Student Union Atrium"
                                    className="w-full p-2.5 rounded-xl glass-input text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Building & Room / Booth
                                </label>
                                <input
                                    type="text"
                                    value={buildingRoom}
                                    onChange={(e) => setBuildingRoom(e.target.value)}
                                    placeholder="e.g. Building 2, Room 104"
                                    className="w-full p-2.5 rounded-xl glass-input text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Donor Instructions</label>
                            <textarea
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Important details, partner blood service, refreshments offered..."
                                className="w-full p-2.5 rounded-xl glass-input text-xs"
                            />
                        </div>
                    </div>

                    {/* Section 2: Scheduling & Dynamic Slot Parameters */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">2. Schedule & Slot Generator Parameters</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Drive Date <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={driveDate}
                                    onChange={(e) => setDriveDate(e.target.value)}
                                    className="w-full p-2.5 rounded-xl glass-input text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Start Time <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full p-2.5 rounded-xl glass-input text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    End Time <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full p-2.5 rounded-xl glass-input text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Slot Duration</label>
                                <select
                                    value={slotDuration}
                                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                                    className="w-full p-2.5 rounded-xl glass-input text-sm"
                                >
                                    <option value={15}>15 Minutes</option>
                                    <option value={30}>30 Minutes (Recommended)</option>
                                    <option value={45}>45 Minutes</option>
                                    <option value={60}>60 Minutes</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Capacity per Slot (Beds)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={capacityPerSlot}
                                    onChange={(e) => setCapacityPerSlot(Number(e.target.value))}
                                    className="w-full p-2.5 rounded-xl glass-input text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Units Goal</label>
                                <input
                                    type="number"
                                    min="10"
                                    max="500"
                                    value={targetUnits}
                                    onChange={(e) => setTargetUnits(Number(e.target.value))}
                                    className="w-full p-2.5 rounded-xl glass-input text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Live Slot Preview & Calculated Capacity Box */}
                    <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Dynamic Slot Engine Preview</span>
                            </div>
                            <span className="text-xs text-red-400 font-semibold">{preview.count} Discrete Slots Generated</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div className="p-2 rounded-lg bg-slate-800/80">
                                <span className="text-slate-400 block text-[10px]">Total Slots</span>
                                <strong className="text-white text-base">{preview.count}</strong>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-800/80">
                                <span className="text-slate-400 block text-[10px]">Concurrent Beds</span>
                                <strong className="text-white text-base">{capacityPerSlot}</strong>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-800/80">
                                <span className="text-slate-400 block text-[10px]">Max Donor Capacity</span>
                                <strong className="text-red-400 text-base">{preview.totalCapacity}</strong>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-800/80">
                                <span className="text-slate-400 block text-[10px]">Target Units</span>
                                <strong className="text-emerald-400 text-base">{targetUnits}</strong>
                            </div>
                        </div>

                        {preview.slots.length > 0 && (
                            <div className="pt-2">
                                <span className="text-[11px] text-slate-400 block mb-1.5">Interval Slices Preview:</span>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                    {preview.slots.map((s, idx) => (
                                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                                            {s} ({capacityPerSlot} beds)
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Actions */}
                    <div className="p-4 -mx-6 -mb-6 border-t border-white/10 bg-slate-900/90 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl btn-secondary text-xs font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || preview.count === 0}
                            className="px-6 py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center space-x-1.5"
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Generating Slots & Creating...</span>
                                </>
                            ) : (
                                <>
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>Launch Blood Drive</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
