'use client';

import React, { useState } from 'react';
import { api, Drive, DriveSlot, Appointment } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import Modal from './Modal';

interface SlotPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    drive: Drive;
    preScreenAnswers?: Record<string, unknown>;
    onSuccess: (appointment: Appointment) => void;
}

const formatTime = (t: string) => t.substring(0, 5);

export default function SlotPickerModal({ isOpen, onClose, drive, preScreenAnswers, onSuccess }: SlotPickerModalProps) {
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [isBooking, setIsBooking] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const slots = drive.slots || [];
    const selected = slots.find(s => s.id === selectedSlotId);

    const handleBook = async () => {
        if (!selectedSlotId) {
            setErrorMessage('Choose a time with a place left.');
            return;
        }

        setIsBooking(true);
        setErrorMessage(null);

        try {
            // the server books inside a transaction with a row lock on the slot; it alone decides
            const res = await api.bookAppointment({
                drive_id: drive.id,
                slot_id: selectedSlotId,
                pre_screen_answers: preScreenAnswers
            });

            onSuccess(res.appointment);
            onClose();
        } catch (err: unknown) {
            const error = err as { message?: string; status?: number };
            if (error.status === 409 || error.message?.includes('fully booked')) {
                setErrorMessage('Another donor took that slot a moment ago. Choose another time.');
            } else {
                setErrorMessage(error.message || 'The booking did not go through. Try again.');
            }
        } finally {
            setIsBooking(false);
        }
    };

    const date = new Date(drive.drive_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    const footer = (
        <>
            <span className="mr-auto self-center text-sm text-muted tabular-nums">
                {selected ? `${formatTime(selected.start_time)} to ${formatTime(selected.end_time)}` : 'No time chosen yet'}
            </span>
            <button type="button" onClick={onClose} className="btn btn--secondary">Cancel</button>
            <button type="button" onClick={handleBook} disabled={!selectedSlotId || isBooking} className="btn btn--primary">
                {isBooking ? (<><RefreshCw className="w-4 h-4 spin" aria-hidden="true" />Booking</>) : 'Book this time'}
            </button>
        </>
    );

    return (
        <Modal
            title="Choose a time"
            subtitle={<>{drive.title} · {date} · {drive.location_name}{drive.building_room ? `, ${drive.building_room}` : ''}</>}
            onClose={onClose}
            footer={footer}
            wide
        >
            <span className="chip chip--ok justify-self-start">Eligibility check passed</span>

            {errorMessage && <div className="notice notice--bad" role="alert">{errorMessage}</div>}

            {slots.length === 0 ? (
                <div className="empty">
                    <p className="empty__title">No slots set for this drive</p>
                    <p>The coordinator has not published its times yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Times">
                    {slots.map((slot: DriveSlot) => {
                        const available = Math.max(0, slot.max_capacity - slot.current_bookings);
                        const isFull = available === 0;
                        return (
                            <button
                                key={slot.id}
                                type="button"
                                className="slot"
                                disabled={isFull}
                                aria-pressed={selectedSlotId === slot.id}
                                onClick={() => { setSelectedSlotId(slot.id); setErrorMessage(null); }}
                            >
                                <span className="font-medium tabular-nums">{formatTime(slot.start_time)}</span>
                                <span className="text-[13px] text-muted">{isFull ? 'Full' : `${available} left`}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}
