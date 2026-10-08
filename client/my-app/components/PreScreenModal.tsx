'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, CheckCircle2, XCircle, Heart, ArrowRight, ArrowLeft, RefreshCw, X, AlertCircle } from 'lucide-react';

interface PreScreenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPassed: (answers: Record<string, unknown>) => void;
}

export default function PreScreenModal({ isOpen, onClose, onPassed }: PreScreenModalProps) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [age, setAge] = useState<number>(20);
    const [weight, setWeight] = useState<number>(65);
    const [feelingWell, setFeelingWell] = useState<boolean>(true);
    const [hasTattoos, setHasTattoos] = useState<boolean>(false);
    const [onAntibiotics, setOnAntibiotics] = useState<boolean>(false);
    const [pregnant, setPregnant] = useState<boolean>(false);
    const [lastDonationDate, setLastDonationDate] = useState<string>(user?.last_donation_date || '');

    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<{
        eligible: boolean;
        reasons: string[];
        next_eligible_date?: string | null;
        guidelines: string;
    } | null>(null);

    if (!isOpen) return null;

    const handleEvaluate = async () => {
        setIsEvaluating(true);
        try {
            const answers = {
                age: Number(age),
                weight_kg: Number(weight),
                feeling_well: feelingWell,
                has_tattoos_recent: hasTattoos,
                on_antibiotics: onAntibiotics,
                pregnant: pregnant,
                last_donation_date: lastDonationDate || null
            };

            const res = await api.evaluatePreScreening(answers);
            setEvaluationResult(res);
            setStep(3); // Result view
        } catch (e) {
            console.error('Pre-screening evaluation failed', e);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleConfirmAndProceed = () => {
        if (evaluationResult?.eligible) {
            onPassed({
                age,
                weight_kg: weight,
                feeling_well: feelingWell,
                has_tattoos_recent: hasTattoos,
                on_antibiotics: onAntibiotics,
                pregnant,
                last_donation_date: lastDonationDate,
                pre_screen_passed: true,
                evaluated_at: new Date().toISOString()
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-xl rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-white/10 bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
                            <Heart className="w-5 h-5 fill-red-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">Digital Pre-Donation Screening</h3>
                            <p className="text-xs text-slate-400">Step {step} of 3 • Quick Medical Eligibility Check</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-1">
                    <div
                        className="bg-gradient-to-r from-red-600 to-rose-500 h-1 transition-all duration-300"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 flex items-start space-x-2.5">
                                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <span>Pre-screening ensures safety for both donor and recipient before booking a slot. Minimal data is collected and privacy is strictly guarded.</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Your Age (Years) <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="14"
                                        max="80"
                                        value={age}
                                        onChange={(e) => setAge(Number(e.target.value))}
                                        className="w-full p-2.5 rounded-xl glass-input text-sm"
                                        placeholder="e.g. 21"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">Must be 16 or older</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Weight (kg) <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="30"
                                        max="200"
                                        value={weight}
                                        onChange={(e) => setWeight(Number(e.target.value))}
                                        className="w-full p-2.5 rounded-xl glass-input text-sm"
                                        placeholder="e.g. 65"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">Must be at least 50 kg</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Date of Last Whole Blood Donation (If applicable)
                                </label>
                                <input
                                    type="date"
                                    value={lastDonationDate}
                                    onChange={(e) => setLastDonationDate(e.target.value)}
                                    className="w-full p-2.5 rounded-xl glass-input text-sm"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Leave blank if you are a first-time donor. Standard cooldown is 56 days (+8 weeks).
                                </span>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3.5">
                            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Day-of-Drive Wellness Questions</h4>

                            {/* Q1 */}
                            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-xs font-semibold text-white">Are you feeling well, hydrated, and in good health today?</p>
                                    <p className="text-[11px] text-slate-400">Free from fever, flu, or active illness.</p>
                                </div>
                                <div className="flex space-x-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setFeelingWell(true)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            feelingWell ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFeelingWell(false)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            !feelingWell ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>

                            {/* Q2 */}
                            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-xs font-semibold text-white">Have you received a new tattoo or body piercing in the last 3 months?</p>
                                    <p className="text-[11px] text-slate-400">Requires temporary safety cooldown.</p>
                                </div>
                                <div className="flex space-x-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setHasTattoos(true)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            hasTattoos ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHasTattoos(false)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            !hasTattoos ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>

                            {/* Q3 */}
                            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-xs font-semibold text-white">Are you currently taking antibiotics for an active infection?</p>
                                </div>
                                <div className="flex space-x-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setOnAntibiotics(true)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            onAntibiotics ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOnAntibiotics(false)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            !onAntibiotics ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>

                            {/* Q4 */}
                            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-xs font-semibold text-white">Are you currently pregnant or given birth in the last 6 weeks?</p>
                                </div>
                                <div className="flex space-x-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setPregnant(true)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            pregnant ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPregnant(false)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            !pregnant ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && evaluationResult && (
                        <div className="space-y-4 text-center py-2">
                            {evaluationResult.eligible ? (
                                <div className="space-y-3">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h4 className="text-lg font-bold text-white">You Are Eligible to Donate! 🎉</h4>
                                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                        You have successfully passed the digital pre-screening questionnaire. You may now proceed to choose your preferred time slot.
                                    </p>
                                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 text-left">
                                        <p className="font-semibold mb-1">Pre-Donation Prep Tips:</p>
                                        <p>• Drink at least 500ml of water 1-2 hours before your appointment.</p>
                                        <p>• Eat a protein-rich or carbohydrate snack before coming in.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 text-red-400 flex items-center justify-center mx-auto">
                                        <XCircle className="w-10 h-10" />
                                    </div>
                                    <h4 className="text-lg font-bold text-white">Temporary Deferral</h4>
                                    <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-200 text-left space-y-2">
                                        <p className="font-semibold text-red-300">Reason(s) for temporary postponement:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            {evaluationResult.reasons.map((r, i) => (
                                                <li key={i}>{r}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    {evaluationResult.next_eligible_date && (
                                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
                                            <span>Next Eligible Donation Date: </span>
                                            <strong className="text-amber-400">{evaluationResult.next_eligible_date}</strong>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-between">
                    {step > 1 && step < 3 && (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="px-4 py-2 rounded-xl btn-secondary text-xs font-semibold flex items-center space-x-1.5"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back</span>
                        </button>
                    )}
                    {step === 1 && <div />}

                    {step === 1 && (
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center space-x-1.5 ml-auto"
                        >
                            <span>Continue to Health Check</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {step === 2 && (
                        <button
                            type="button"
                            onClick={handleEvaluate}
                            disabled={isEvaluating}
                            className="px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center space-x-1.5 ml-auto"
                        >
                            {isEvaluating ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Evaluating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Submit & Check Eligibility</span>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    )}

                    {step === 3 && (
                        <div className="flex items-center space-x-3 w-full justify-end">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2 rounded-xl btn-secondary text-xs font-semibold"
                            >
                                Retake
                            </button>
                            {evaluationResult?.eligible ? (
                                <button
                                    type="button"
                                    onClick={handleConfirmAndProceed}
                                    className="px-6 py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center space-x-1.5"
                                >
                                    <span>Select Time Slot</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl btn-secondary text-xs font-semibold"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
