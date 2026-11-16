'use client';

import React, { useState } from 'react';
import { api, Drive, DriveSlot } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import Modal from './Modal';

interface WalkInModalProps {
    isOpen: boolean;
    onClose: () => void;
    drive: Drive;
    onSuccess: () => void;
}

const FORM_ID = 'walk-in-form';

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
            setErrorMessage('Write the donor’s full name and email.');
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
            setErrorMessage(error.message || 'The walk-in donor could not be added.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="btn btn--secondary">Cancel</button>
            <button type="submit" form={FORM_ID} disabled={isSubmitting} className="btn btn--primary">
                {isSubmitting ? (<><RefreshCw className="w-4 h-4 spin" aria-hidden="true" />Adding</>) : 'Add and check in'}
            </button>
        </>
    );

    return (
        <Modal title="Add a walk-in donor" subtitle={`${drive.title} · checked in as soon as they are added`} onClose={onClose} footer={footer}>
            <form id={FORM_ID} onSubmit={handleSubmit} className="grid gap-5">
                {errorMessage && <div className="notice notice--bad" role="alert">{errorMessage}</div>}

                <div className="field">
                    <label htmlFor="wi-name">Full name</label>
                    <input id="wi-name" className="input" type="text" autoComplete="off" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="wi-email">Email</label>
                    <input id="wi-email" className="input" type="email" autoComplete="off" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="field">
                        <label htmlFor="wi-phone">Phone</label>
                        <input id="wi-phone" className="input" type="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="field">
                        <label htmlFor="wi-group">Blood group</label>
                        <select id="wi-group" className="input" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>
                <div className="field">
                    <label htmlFor="wi-slot">Slot</label>
                    <select id="wi-slot" className="input" value={slotId} onChange={(e) => setSlotId(e.target.value)}>
                        <option value="">The next slot with a place</option>
                        {slots.map((s: DriveSlot) => (
                            <option key={s.id} value={s.id}>
                                {s.start_time.substring(0, 5)} to {s.end_time.substring(0, 5)} · {s.max_capacity - s.current_bookings} places left
                            </option>
                        ))}
                    </select>
                </div>
            </form>
        </Modal>
    );
}
