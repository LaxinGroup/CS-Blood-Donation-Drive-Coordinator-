'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/* How long a revealed password stays readable before it hides itself again. */
const REVEAL_MS = 5000;

type PasswordInputProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: 'current-password' | 'new-password';
    required?: boolean;
    minLength?: number;
    describedBy?: string;
};

/* Hides the password again after REVEAL_MS, or as soon as the tab is hidden. */
function useAutoHide(visible: boolean, hide: () => void) {
    useEffect(() => {
        if (!visible) return;

        const timer = window.setTimeout(hide, REVEAL_MS);
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') hide();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [visible, hide]);
}

export default function PasswordInput({
    id,
    value,
    onChange,
    autoComplete,
    required,
    minLength,
    describedBy,
}: PasswordInputProps) {
    const [visible, setVisible] = useState(false);
    const hide = useCallback(() => setVisible(false), []);

    useAutoHide(visible, hide);

    const Icon = visible ? EyeOff : Eye;

    return (
        <div className="password-field">
            <input
                id={id}
                className="input"
                type={visible ? 'text' : 'password'}
                autoComplete={autoComplete}
                required={required}
                minLength={minLength}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-describedby={describedBy}
            />
            <button
                type="button"
                className="icon-btn password-field__toggle"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                aria-controls={id}
            >
                <Icon className="w-4 h-4" aria-hidden="true" />
            </button>
        </div>
    );
}
