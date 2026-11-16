import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Photograph credits: CS Blood Drive',
    description: 'The photographers and licences of the photographs on the CS Blood Drive home page.',
};

const CREDITS = [
    {
        what: 'A donor giving platelets (home page, top)',
        by: 'R. Henrik Nilsson',
        licence: 'CC BY 4.0',
        licenceUrl: 'https://creativecommons.org/licenses/by/4.0',
        page: 'https://commons.wikimedia.org/wiki/File:Donating_platelets_at_Swedish_blood_donation_center_April_2025.jpg',
    },
    {
        what: 'A phlebotomist checking a blood bag (eligibility)',
        by: 'Lance Cpl. Erica Kirsop',
        licence: 'Public domain',
        licenceUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
        page: 'https://commons.wikimedia.org/wiki/File:Marines,_sailors_shed_blood_for_others_120327-M-UP717-029.jpg',
    },
];

export default function CreditsPage() {
    return (
        <div className="max-w-3xl grid gap-8">
            <h1 className="app-title">Photograph credits</h1>
            <ul className="app-card app-card--flush">
                {CREDITS.map((c) => (
                    <li key={c.page} className="grid gap-1 p-6 border-b border-line last:border-b-0">
                        <span className="font-medium">{c.what}</span>
                        <span className="text-muted">
                            {c.by}, <a className="link" href={c.licenceUrl}>{c.licence}</a>, via{' '}
                            <a className="link" href={c.page}>Wikimedia Commons</a>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
