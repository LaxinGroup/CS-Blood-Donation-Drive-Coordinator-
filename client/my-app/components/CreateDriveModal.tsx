'use client';

import React, { useState } from 'react';
import { api, Drive } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import Modal from './Modal';

interface CreateDriveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (drive: Drive) => void;
}

const FORM_ID = 'create-drive-form';

/* The default drive date, a week out (a lazy initial state, read once when the form opens). */
function oneWeekFromToday(): string {
    return new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
}

export default function CreateDriveModal({ isOpen, onClose, onCreated }: CreateDriveModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [locationName, setLocationName] = useState('Campus Student Union Hall');
    const [buildingRoom, setBuildingRoom] = useState('Ground Floor, Foyer B');
    const [driveDate, setDriveDate] = useState(oneWeekFromToday);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('15:00');
    const [slotDuration, setSlotDuration] = useState(30);
    const [capacityPerSlot, setCapacityPerSlot] = useState(4);
    const [targetUnits, setTargetUnits] = useState(50);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    // The slots the server will generate, previewed from the same inputs
    const calculateSlotsPreview = () => {
        if (!startTime || !endTime) return { count: 0, totalCapacity: 0, slots: [] as string[] };
        const [sH, sM] = startTime.split(':').map(Number);
        const [eH, eM] = endTime.split(':').map(Number);

        let current = sH * 60 + sM;
        const end = eH * 60 + eM;
        const slots: string[] = [];
        const format = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        while (current + slotDuration <= end) {
            const next = current + slotDuration;
            slots.push(`${format(Math.floor(current / 60), current % 60)} to ${format(Math.floor(next / 60), next % 60)}`);
            current = next;
        }

        return { count: slots.length, totalCapacity: slots.length * capacityPerSlot, slots };
    };

    const preview = calculateSlotsPreview();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !locationName.trim() || !driveDate || !startTime || !endTime) {
            setErrorMessage('Fill in the drive name, venue, date and hours.');
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
            setErrorMessage(error.message || 'The drive could not be created.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="btn btn--secondary">Cancel</button>
            <button type="submit" form={FORM_ID} disabled={isSubmitting || preview.count === 0} className="btn btn--primary">
                {isSubmitting ? (<><RefreshCw className="w-4 h-4 spin" aria-hidden="true" />Creating the drive</>) : 'Publish the drive'}
            </button>
        </>
    );

    return (
        <Modal title="Schedule a drive" subtitle="The slots are made from the hours and slot length you set." onClose={onClose} footer={footer} wide>
            <form id={FORM_ID} onSubmit={handleSubmit} className="grid gap-6">
                {errorMessage && <div className="notice notice--bad" role="alert">{errorMessage}</div>}

                <fieldset className="grid gap-4">
                    <legend className="app-label mb-3">The drive</legend>
                    <div className="field">
                        <label htmlFor="cd-title">Drive name</label>
                        <input id="cd-title" className="input" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="field">
                            <label htmlFor="cd-venue">Venue</label>
                            <input id="cd-venue" className="input" type="text" required value={locationName} onChange={(e) => setLocationName(e.target.value)} />
                        </div>
                        <div className="field">
                            <label htmlFor="cd-room">Building and room</label>
                            <input id="cd-room" className="input" type="text" value={buildingRoom} onChange={(e) => setBuildingRoom(e.target.value)} />
                        </div>
                    </div>
                    <div className="field">
                        <label htmlFor="cd-desc">Notes for donors</label>
                        <textarea id="cd-desc" className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </fieldset>

                <fieldset className="grid gap-4 border-t border-line pt-6">
                    <legend className="app-label mb-3">Date, hours and slots</legend>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="field">
                            <label htmlFor="cd-date">Date</label>
                            <input id="cd-date" className="input" type="date" required value={driveDate} onChange={(e) => setDriveDate(e.target.value)} />
                        </div>
                        <div className="field">
                            <label htmlFor="cd-start">Opens at</label>
                            <input id="cd-start" className="input" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                        </div>
                        <div className="field">
                            <label htmlFor="cd-end">Closes at</label>
                            <input id="cd-end" className="input" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="field">
                            <label htmlFor="cd-len">Slot length</label>
                            <select id="cd-len" className="input" value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))}>
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>60 minutes</option>
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="cd-cap">Donors per slot</label>
                            <input id="cd-cap" className="input" type="number" inputMode="numeric" min="1" max="20" value={capacityPerSlot} onChange={(e) => setCapacityPerSlot(Number(e.target.value))} />
                        </div>
                        <div className="field">
                            <label htmlFor="cd-target">Target in units</label>
                            <input id="cd-target" className="input" type="number" inputMode="numeric" min="10" max="500" value={targetUnits} onChange={(e) => setTargetUnits(Number(e.target.value))} />
                        </div>
                    </div>
                </fieldset>

                <div className="grid gap-3 rounded-md bg-surface p-5">
                    <p className="text-sm">
                        <span className="font-medium">{preview.count} slots</span>
                        <span className="text-muted"> · room for {preview.totalCapacity} donors · target {targetUnits} units</span>
                    </p>
                    {preview.slots.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                            {preview.slots.map((s) => (
                                <span key={s} className="chip chip--plain font-mono">{s}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted">The hours are shorter than one slot. Widen them or pick a shorter slot.</p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
