'use client';

import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    title: string;
    subtitle?: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    wide?: boolean;
}

/* The one dialog shell every modal shares: a head with the title and the close button, a body, and
   an optional footer row of buttons. Esc closes it; a click on the backdrop does too. */
export default function Modal({ title, subtitle, onClose, children, footer, wide }: ModalProps) {
    const titleId = useId();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="modal" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`modal__panel ${wide ? 'modal__panel--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="modal__head">
                    <div className="grid gap-1">
                        <h2 id={titleId} className="app-h3">{title}</h2>
                        {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
                    </div>
                    <button type="button" className="icon-btn -mr-3 -mt-2" onClick={onClose} aria-label="Close">
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>
                <div className="modal__body">{children}</div>
                {footer && <div className="modal__foot">{footer}</div>}
            </div>
        </div>
    );
}

/* A yes-or-no question as two pressed buttons (used by the pre-screen). */
export function YesNo({ question, hint, value, onChange }: { question: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="choice">
            <div className="grid gap-1">
                <span className="font-medium">{question}</span>
                {hint && <span className="text-sm text-muted">{hint}</span>}
            </div>
            <div className="seg shrink-0" role="group" aria-label={question}>
                <button type="button" aria-pressed={value} onClick={() => onChange(true)}>Yes</button>
                <button type="button" aria-pressed={!value} onClick={() => onChange(false)}>No</button>
            </div>
        </div>
    );
}
