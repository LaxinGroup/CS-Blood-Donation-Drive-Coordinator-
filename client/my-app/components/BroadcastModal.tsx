'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import Modal from './Modal';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    driveId?: string;
}

const FORM_ID = 'broadcast-form';
const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function BroadcastModal({ isOpen, onClose, driveId }: BroadcastModalProps) {
    const [title, setTitle] = useState('Urgent: O− and A+ donors needed');
    const [message, setMessage] = useState('The regional blood bank is short of stock. If you are eligible, please book a slot at our next campus drive today.');
    const [selectedGroups, setSelectedGroups] = useState<string[]>(['O-', 'O+', 'A+']);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<{ sent_count: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const allSelected = selectedGroups.length === BLOOD_GROUPS.length;

    const toggleGroup = (bg: string) => {
        setSelectedGroups(selectedGroups.includes(bg) ? selectedGroups.filter(g => g !== bg) : [...selectedGroups, bg]);
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            setErrorMessage('Write a title and a message.');
            return;
        }

        setIsSending(true);
        setErrorMessage(null);

        try {
            const res = await api.broadcastAlert({
                title,
                message,
                target_blood_groups: allSelected ? [] : selectedGroups,
                drive_id: driveId
            });

            setResult(res);
        } catch (err: unknown) {
            const error = err as { message?: string };
            setErrorMessage(error.message || 'The call could not be sent.');
        } finally {
            setIsSending(false);
        }
    };

    if (result) {
        return (
            <Modal
                title="Urgent call sent"
                onClose={onClose}
                footer={<button type="button" onClick={onClose} className="btn btn--primary">Done</button>}
            >
                <div className="notice notice--ok" role="status">
                    {result.sent_count} donors got the message in the app.
                </div>
            </Modal>
        );
    }

    const footer = (
        <>
            <button type="button" onClick={onClose} className="btn btn--secondary">Cancel</button>
            <button type="submit" form={FORM_ID} disabled={isSending} className="btn btn--primary">
                {isSending ? (<><RefreshCw className="w-4 h-4 spin" aria-hidden="true" />Sending</>) : 'Send the call'}
            </button>
        </>
    );

    return (
        <Modal title="Send an urgent call" subtitle="An in-app message to every donor of the groups you pick." onClose={onClose} footer={footer}>
            <form id={FORM_ID} onSubmit={handleBroadcast} className="grid gap-5">
                {errorMessage && <div className="notice notice--bad" role="alert">{errorMessage}</div>}

                <fieldset className="grid gap-3">
                    <div className="flex items-center justify-between">
                        <legend className="field__label">Blood groups</legend>
                        <button type="button" className="link text-sm" onClick={() => setSelectedGroups(allSelected ? [] : [...BLOOD_GROUPS])}>
                            {allSelected ? 'Clear all' : 'Select all'}
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {BLOOD_GROUPS.map((bg) => (
                            <button
                                key={bg}
                                type="button"
                                className="slot justify-items-center font-mono"
                                aria-pressed={selectedGroups.includes(bg)}
                                onClick={() => toggleGroup(bg)}
                            >
                                {bg}
                            </button>
                        ))}
                    </div>
                </fieldset>

                <div className="field">
                    <label htmlFor="bc-title">Title</label>
                    <input id="bc-title" className="input" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="bc-msg">Message</label>
                    <textarea id="bc-msg" className="input" rows={3} required value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
            </form>
        </Modal>
    );
}
