import { Appointment } from '@/lib/api';

type Status = Appointment['status'];

const LABEL: Record<Status, string> = {
    CONFIRMED: 'Booked',
    CHECKED_IN: 'Checked in',
    IN_CHAIR: 'In the chair',
    COMPLETED: 'Donated',
    DEFERRED: 'Deferred',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No-show',
};

const TONE: Partial<Record<Status, string>> = {
    COMPLETED: 'chip--ok',
    CHECKED_IN: 'chip--ok',
    IN_CHAIR: 'chip--ok',
    DEFERRED: 'chip--warn',
    NO_SHOW: 'chip--bad',
    CANCELLED: 'chip--bad',
};

/* One appointment status, as a label with its state colour (never colour alone). */
export default function StatusChip({ status }: { status: Status }) {
    return <span className={`chip ${TONE[status] ?? ''}`}>{LABEL[status] ?? status}</span>;
}

export function statusLabel(status: Status): string {
    return LABEL[status] ?? status;
}
