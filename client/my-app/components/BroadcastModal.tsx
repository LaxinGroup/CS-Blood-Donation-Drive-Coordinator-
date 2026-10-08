'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Radio, AlertTriangle, Send, X, RefreshCw, CheckCircle2, Users } from 'lucide-react';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    driveId?: string;
}

export default function BroadcastModal({ isOpen, onClose, driveId }: BroadcastModalProps) {
    const [title, setTitle] = useState('🚨 Urgent Blood Shortage Alert (O- & A+ Needed)');
    const [message, setMessage] = useState('The regional trauma bank has issued a critical shortage notice. If you are eligible, please book a slot at our upcoming campus drive today.');
    const [selectedGroups, setSelectedGroups] = useState<string[]>(['O-', 'O+', 'A+']);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<{ sent_count: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

    const toggleGroup = (bg: string) => {
        if (selectedGroups.includes(bg)) {
            setSelectedGroups(selectedGroups.filter(g => g !== bg));
        } else {
            setSelectedGroups([...selectedGroups, bg]);
        }
    };

    const handleSelectAll = () => {
        if (selectedGroups.length === bloodGroups.length) {
            setSelectedGroups([]);
        } else {
            setSelectedGroups([...bloodGroups]);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            setErrorMessage('Title and message are required.');
            return;
        }

        setIsSending(true);
        setErrorMessage(null);

        try {
            const res = await api.broadcastAlert({
                title,
                message,
                target_blood_groups: selectedGroups.length === bloodGroups.length ? [] : selectedGroups,
                drive_id: driveId
            });

            setResult(res);
        } catch (err: unknown) {
            const error = err as { message?: string };
            setErrorMessage(error.message || 'Failed to send broadcast.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-xl rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-white/10 bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                            <Radio className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">Emergency Blood Broadcast</h3>
                            <p className="text-xs text-slate-400">Push urgent alerts to registered campus donors</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {result ? (
                        <div className="text-center py-6 space-y-3">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-bold text-white">Broadcast Dispatched Successfully!</h4>
                            <p className="text-xs text-slate-300">
                                In-app emergency notifications were delivered to <strong className="text-emerald-400">{result.sent_count} eligible donors</strong>.
                            </p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl btn-primary text-xs font-semibold mt-4"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleBroadcast} className="space-y-4">
                            {errorMessage && (
                                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Target Blood Groups */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-slate-300">Target Blood Groups</label>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
                                    >
                                        {selectedGroups.length === bloodGroups.length ? 'Clear All' : 'Select All Groups'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {bloodGroups.map((bg) => {
                                        const isSelected = selectedGroups.includes(bg);
                                        return (
                                            <button
                                                key={bg}
                                                type="button"
                                                onClick={() => toggleGroup(bg)}
                                                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                                                    isSelected
                                                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/30'
                                                        : 'bg-slate-800/80 text-slate-300 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                {bg}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Broadcast Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-2.5 rounded-xl glass-input text-xs"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Message Content</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full p-2.5 rounded-xl glass-input text-xs"
                                />
                            </div>

                            {/* Actions */}
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
                                    disabled={isSending}
                                    className="px-6 py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center space-x-1.5"
                                >
                                    {isSending ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Dispatch Broadcast</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
