'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Appointment, Drive } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PreScreenModal from '@/components/PreScreenModal';
import SlotPickerModal from '@/components/SlotPickerModal';
import BookingConfirmationModal from '@/components/BookingConfirmationModal';
import SlotPickerPreview from './SlotPickerPreview';

const MAX_SHOWN = 4;

type LoadState = 'loading' | 'ready' | 'error';

/* The page's split: the live drives from the API on the left, the slot picker they open on the
   right. Booking runs pre-screen, then the slot picker (the server's transactional lock decides the
   slot), then the confirmation. */
export default function DrivesSection() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [drives, setDrives] = useState<Drive[]>([]);
    const [state, setState] = useState<LoadState>('loading');
    const [query, setQuery] = useState('');

    const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
    const [isPreScreenOpen, setIsPreScreenOpen] = useState(false);
    const [isSlotPickerOpen, setIsSlotPickerOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [preScreenAnswers, setPreScreenAnswers] = useState<Record<string, unknown>>({});
    const [confirmed, setConfirmed] = useState<Appointment | null>(null);

    // state is set only in the request's callbacks, never synchronously in the effect
    const loadDrives = useCallback(
        () =>
            api
                .getDrives()
                .then((res) => {
                    setDrives(res.drives || []);
                    setState('ready');
                })
                .catch((e) => {
                    console.warn('Failed to load drives', e);
                    setState('error');
                }),
        []
    );

    useEffect(() => {
        loadDrives();
    }, [loadDrives]);

    const startBooking = (drive: Drive) => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        setSelectedDrive(drive);
        setIsPreScreenOpen(true);
    };

    const q = query.trim().toLowerCase();
    const matches = drives.filter(
        (d) => d.title.toLowerCase().includes(q) || d.location_name.toLowerCase().includes(q)
    );

    return (
        <section className="section" id="drives" aria-labelledby="drives-h" style={{ ['--hm' as string]: state === 'ready' && drives.length > 0 ? 2 : 1 }}>
            <div className="wrap">
                <div className="grid">
                    <div className="span-6 stack-5">
                        <h2 id="drives-h">Upcoming drives on campus</h2>
                        <p>Pick a drive, answer five eligibility questions, then choose a time with a place left.</p>
                        {drives.length > 0 && (
                            <div className="field">
                                <label htmlFor="drive-search">Search by drive or venue</label>
                                <input
                                    id="drive-search"
                                    className="input"
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                        )}
                        <DriveList
                            state={state}
                            total={drives.length}
                            drives={matches.slice(0, MAX_SHOWN)}
                            onBook={startBooking}
                            onRetry={() => {
                                setState('loading');
                                loadDrives();
                            }}
                        />
                    </div>
                    <div className="frame frame--lit span-6 start-7" data-visual="">
                        <SlotPickerPreview />
                    </div>
                </div>
            </div>

            {selectedDrive && (
                <>
                    <PreScreenModal
                        isOpen={isPreScreenOpen}
                        onClose={() => setIsPreScreenOpen(false)}
                        onPassed={(answers) => {
                            setPreScreenAnswers(answers);
                            setIsSlotPickerOpen(true);
                        }}
                    />
                    <SlotPickerModal
                        isOpen={isSlotPickerOpen}
                        onClose={() => setIsSlotPickerOpen(false)}
                        drive={selectedDrive}
                        preScreenAnswers={preScreenAnswers}
                        onSuccess={(appt) => {
                            setConfirmed(appt);
                            setIsConfirmationOpen(true);
                            loadDrives();
                        }}
                    />
                </>
            )}
            <BookingConfirmationModal
                isOpen={isConfirmationOpen}
                onClose={() => setIsConfirmationOpen(false)}
                appointment={confirmed}
            />
        </section>
    );
}

type DriveListProps = {
    state: LoadState;
    total: number;
    drives: Drive[];
    onBook: (drive: Drive) => void;
    onRetry: () => void;
};

/* The list in its four states: loading, could not load, no drives yet, and the drives. */
function DriveList({ state, total, drives, onBook, onRetry }: DriveListProps) {
    if (state === 'loading') {
        return (
            <div className="grid gap-3" aria-busy="true" aria-label="Loading drives">
                {[0, 1, 2].map((n) => <div key={n} className="skeleton" style={{ height: 64 }} />)}
            </div>
        );
    }
    if (state === 'error') {
        return (
            <div className="stack-3">
                <p className="font-medium">The drives could not load.</p>
                <p className="muted">Check your connection, then load them again.</p>
                <button type="button" className="btn btn--secondary" onClick={onRetry}>Load the drives again</button>
            </div>
        );
    }
    if (total === 0) {
        return (
            <div className="stack-3">
                <p className="font-medium">No drives are scheduled yet.</p>
                <p className="muted">New drives show here as soon as a coordinator publishes them.</p>
            </div>
        );
    }
    if (drives.length === 0) {
        return <p className="muted">No drive matches that search. Try the venue’s name.</p>;
    }
    return (
        <ul className="rows">
            {drives.map((drive) => (
                <DriveRow key={drive.id} drive={drive} onBook={() => onBook(drive)} />
            ))}
        </ul>
    );
}

function DriveRow({ drive, onBook }: { drive: Drive; onBook: () => void }) {
    const left = drive.available_spots ?? 0;
    const date = new Date(drive.drive_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    return (
        <li>
            <span className="grid gap-1">
                <span className="rows__name">{drive.title}</span>
                <span className="muted text-sm">
                    {date} · {drive.start_time.substring(0, 5)} to {drive.end_time.substring(0, 5)} · {drive.location_name}
                    {drive.building_room ? `, ${drive.building_room}` : ''}
                    {drive.status === 'ONGOING' ? ' · on now' : ''}
                </span>
            </span>
            <span className="rows__value grid justify-items-end gap-1">
                <button type="button" className="link" onClick={onBook} disabled={left === 0}>
                    {left === 0 ? 'Fully booked' : 'Book this drive'}
                </button>
                <span className="muted text-sm">{left} places left</span>
            </span>
        </li>
    );
}
