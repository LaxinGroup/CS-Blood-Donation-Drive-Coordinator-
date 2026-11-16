'use client';

import React, { useState } from 'react';
import { api, Appointment } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import Modal from './Modal';

interface PhlebotomyModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    onSuccess: () => void;
}

type Outcome = 'COMPLETED' | 'DEFERRED' | 'NO_SHOW';

const OUTCOMES: { value: Outcome; label: string }[] = [
    { value: 'COMPLETED', label: 'Donated' },
    { value: 'DEFERRED', label: 'Deferred' },
    { value: 'NO_SHOW', label: 'No-show' },
];

const DEFERRAL_REASONS: { value: string; label: string }[] = [
    { value: 'Low Hemoglobin (< 12.5 g/dL)', label: 'Low haemoglobin (under 12.5 g/dL)' },
    { value: 'Elevated Blood Pressure', label: 'High blood pressure (over 180/100)' },
    { value: 'Low Pulse / Arrhythmia', label: 'Low or irregular pulse' },
    { value: 'Recent Tattoo / Piercing', label: 'Tattoo or piercing in the last 3 months' },
    { value: 'Active Antibiotic Course', label: 'On a course of antibiotics' },
    { value: 'Vein Access Issue / Difficult Phlebotomy', label: 'Vein access problem' },
    { value: 'Donor Feeling Faint / Vasovagal Reaction', label: 'Felt faint (vasovagal reaction)' },
];

const FORM_ID = 'outcome-form';

export default function PhlebotomyModal({ isOpen, onClose, appointment, onSuccess }: PhlebotomyModalProps) {
    const [outcome, setOutcome] = useState<Outcome>('COMPLETED');
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
            setErrorMessage(error.message || 'The outcome could not be saved.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="btn btn--secondary">Cancel</button>
            <button type="submit" form={FORM_ID} disabled={isSubmitting} className="btn btn--primary">
                {isSubmitting ? (<><RefreshCw className="w-4 h-4 spin" aria-hidden="true" />Saving</>) : 'Save the outcome'}
            </button>
        </>
    );

    return (
        <Modal title="Log the outcome" subtitle={`${appointment.donor_name} · ${appointment.booking_reference}`} onClose={onClose} footer={footer}>
            <form id={FORM_ID} onSubmit={handleSubmit} className="grid gap-5">
                {errorMessage && <div className="notice notice--bad" role="alert">{errorMessage}</div>}

                <fieldset className="grid gap-2">
                    <legend className="field__label mb-2">Result</legend>
                    <div className="seg w-full" role="group" aria-label="Result">
                        {OUTCOMES.map((o) => (
                            <button key={o.value} type="button" className="flex-1" aria-pressed={outcome === o.value} onClick={() => setOutcome(o.value)}>
                                {o.label}
                            </button>
                        ))}
                    </div>
                </fieldset>

                {outcome === 'COMPLETED' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="field">
                            <label htmlFor="po-group">Blood group checked</label>
                            <select id="po-group" className="input" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="po-units">Units collected</label>
                            <input id="po-units" className="input" type="number" inputMode="numeric" min="1" max="3" value={unitsCollected} onChange={(e) => setUnitsCollected(Number(e.target.value))} />
                        </div>
                    </div>
                )}

                {outcome === 'DEFERRED' && (
                    <div className="field">
                        <label htmlFor="po-reason">Reason for the deferral</label>
                        <select id="po-reason" className="input" value={deferralReason} onChange={(e) => setDeferralReason(e.target.value)}>
                            {DEFERRAL_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                )}

                <div className="field">
                    <label htmlFor="po-notes">Notes</label>
                    <textarea id="po-notes" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
            </form>
        </Modal>
    );
}
