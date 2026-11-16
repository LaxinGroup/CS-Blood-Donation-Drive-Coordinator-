'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw } from 'lucide-react';
import Modal, { YesNo } from './Modal';

interface PreScreenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPassed: (answers: Record<string, unknown>) => void;
}

type Evaluation = {
    eligible: boolean;
    reasons: string[];
    next_eligible_date?: string | null;
    guidelines: string;
};

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
    const [evaluationError, setEvaluationError] = useState<string | null>(null);
    const [evaluationResult, setEvaluationResult] = useState<Evaluation | null>(null);

    if (!isOpen) return null;

    const handleEvaluate = async () => {
        setIsEvaluating(true);
        setEvaluationError(null);
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
            console.warn('Pre-screening evaluation failed', e);
            setEvaluationError('Your answers could not be checked. Try again in a moment.');
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

    const footer = (
        <>
            {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="btn btn--secondary mr-auto">Back</button>
            )}
            {step === 1 && (
                <button type="button" onClick={() => setStep(2)} className="btn btn--primary">Continue to the health questions</button>
            )}
            {step === 2 && (
                <button type="button" onClick={handleEvaluate} disabled={isEvaluating} className="btn btn--primary">
                    {isEvaluating ? (<><RefreshCw className="w-4 h-4 spin" aria-hidden="true" />Checking</>) : 'Check my eligibility'}
                </button>
            )}
            {step === 3 && (
                <>
                    <button type="button" onClick={() => setStep(1)} className="btn btn--secondary mr-auto">Answer again</button>
                    {evaluationResult?.eligible ? (
                        <button type="button" onClick={handleConfirmAndProceed} className="btn btn--primary">Choose a time</button>
                    ) : (
                        <button type="button" onClick={onClose} className="btn btn--secondary">Close</button>
                    )}
                </>
            )}
        </>
    );

    return (
        <Modal title="Eligibility check" subtitle={`Step ${step} of 3`} onClose={onClose} footer={footer}>
            <div className="meter" role="img" aria-label={`Step ${step} of 3`}>
                <i style={{ ['--k' as string]: step / 3 }} />
            </div>

            {step === 1 && (
                <div className="grid gap-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="field">
                            <label htmlFor="ps-age">Age</label>
                            <input id="ps-age" className="input" type="number" inputMode="numeric" min="14" max="80" value={age} onChange={(e) => setAge(Number(e.target.value))} aria-describedby="ps-age-hint" />
                            <span id="ps-age-hint" className="field__hint">16 or older</span>
                        </div>
                        <div className="field">
                            <label htmlFor="ps-weight">Weight in kg</label>
                            <input id="ps-weight" className="input" type="number" inputMode="numeric" min="30" max="200" value={weight} onChange={(e) => setWeight(Number(e.target.value))} aria-describedby="ps-weight-hint" />
                            <span id="ps-weight-hint" className="field__hint">At least 50 kg</span>
                        </div>
                    </div>
                    <div className="field">
                        <label htmlFor="ps-last">Your last whole-blood donation</label>
                        <input id="ps-last" className="input" type="date" value={lastDonationDate} onChange={(e) => setLastDonationDate(e.target.value)} aria-describedby="ps-last-hint" />
                        <span id="ps-last-hint" className="field__hint">Leave it empty if this is your first donation. You can give again 56 days after the last one.</span>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="grid gap-3">
                    <YesNo question="Are you feeling well today?" hint="No fever, flu or other illness" value={feelingWell} onChange={setFeelingWell} />
                    <YesNo question="A new tattoo or piercing in the last 3 months?" value={hasTattoos} onChange={setHasTattoos} />
                    <YesNo question="Taking antibiotics for an infection?" value={onAntibiotics} onChange={setOnAntibiotics} />
                    <YesNo question="Pregnant, or given birth in the last 6 weeks?" value={pregnant} onChange={setPregnant} />
                    {evaluationError && <div className="notice notice--bad" role="alert">{evaluationError}</div>}
                </div>
            )}

            {step === 3 && evaluationResult && (
                evaluationResult.eligible ? (
                    <div className="grid gap-4">
                        <div className="notice notice--ok" role="status">You can donate. Choose a time next.</div>
                        <ul className="grid gap-2 text-sm">
                            <li>Drink at least 500 ml of water in the 2 hours before your slot.</li>
                            <li>Eat a proper meal or a snack before you come in.</li>
                        </ul>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <div className="notice notice--warn" role="status">
                            <div className="grid gap-2">
                                <span className="font-medium">You can’t donate just yet</span>
                                <ul className="grid gap-1 list-disc pl-5">
                                    {evaluationResult.reasons.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        </div>
                        {evaluationResult.next_eligible_date && (
                            <p className="text-sm">You can book again from <strong className="font-medium">{evaluationResult.next_eligible_date}</strong>.</p>
                        )}
                    </div>
                )
            )}
        </Modal>
    );
}
