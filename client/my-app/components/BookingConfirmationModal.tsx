'use client';

import React from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Appointment, api } from '@/lib/api';
import Modal from './Modal';

interface BookingConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
}

export default function BookingConfirmationModal({ isOpen, onClose, appointment }: BookingConfirmationModalProps) {
    if (!isOpen || !appointment) return null;

    const icsUrl = api.getIcsUrl(appointment.id);
    const rows: [string, string][] = [
        ['Date', appointment.drive_date || 'Drive day'],
        ['Time', `${appointment.slot_start_time?.substring(0, 5) || 'Scheduled'} to ${appointment.slot_end_time?.substring(0, 5) || ''}`],
        ['Where', appointment.location_name || 'Campus venue'],
    ];

    const footer = (
        <>
            <a href={icsUrl} download className="btn btn--secondary mr-auto">
                <Download className="w-4 h-4" aria-hidden="true" />
                Add to calendar
            </a>
            <Link href="/donor" onClick={onClose} className="btn btn--primary">See your bookings</Link>
        </>
    );

    return (
        <Modal title="Booking confirmed" subtitle="Thank you for giving blood." onClose={onClose} footer={footer}>
            <div className="grid gap-1 rounded-md bg-surface p-5">
                <span className="app-label">Your booking code</span>
                <span className="font-mono text-[28px] leading-tight tracking-wide">{appointment.booking_reference}</span>
                <span className="text-sm text-muted">Show it, or your student ID, at the check-in desk.</span>
            </div>

            <dl className="grid gap-2">
                {rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line pb-2 last:border-b-0">
                        <dt className="text-muted">{k}</dt>
                        <dd className="tabular-nums text-right">{v}</dd>
                    </div>
                ))}
            </dl>

            <div className="grid gap-1 text-sm">
                <span className="font-medium">Before you come</span>
                <span>Drink 500 ml of water an hour before, eat a proper meal, and bring your student, staff or national ID.</span>
            </div>
        </Modal>
    );
}
