/* The product's own slot picker, drawn as live HTML in the kit's UI tokens: the step a donor reaches
   after the five questions. The picture holds still; the real one opens from "Book this drive". */

type PreviewSlot = { time: string; left: number; selected?: boolean };

const SLOTS: PreviewSlot[] = [
    { time: '09:00', left: 0 },
    { time: '09:15', left: 1 },
    { time: '09:30', left: 2, selected: true },
    { time: '09:45', left: 3 },
    { time: '10:00', left: 0 },
    { time: '10:15', left: 2 },
    { time: '10:30', left: 3 },
    { time: '10:45', left: 1 },
    { time: '11:00', left: 3 },
];

export default function SlotPickerPreview() {
    return (
        <div
            className="ui ui-panel sp"
            role="img"
            aria-label="The slot picker for the Main Library drive on Tuesday 17 November: nine 15-minute times from 09:00, two of them full, 09:30 chosen with 2 places left"
        >
            <div className="sp__head">
                <span className="sp__title">Choose a time</span>
                <span className="sp__sub">Main Library drive · Tue 17 Nov · Ground floor</span>
            </div>
            <div className="sp__passed">Eligibility check passed</div>
            <div className="sp__grid">
                {SLOTS.map((s) => (
                    <span key={s.time} className={`sp__slot${s.selected ? ' is-on' : ''}${s.left === 0 ? ' is-full' : ''}`}>
                        <b>{s.time}</b>
                        <i>{s.left === 0 ? 'Full' : `${s.left} left`}</i>
                    </span>
                ))}
            </div>
            <div className="sp__foot">
                <span className="sp__sel">09:30 to 09:45</span>
                <span className="ui-btn sp__btn">Confirm this time</span>
            </div>
        </div>
    );
}
