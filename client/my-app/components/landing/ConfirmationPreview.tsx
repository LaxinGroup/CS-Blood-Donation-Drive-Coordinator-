/* The product's own booking confirmation, drawn as live HTML in the kit's UI tokens: the code the FAQ
   tells donors to show at the check-in desk. */
export default function ConfirmationPreview() {
    return (
        <div
            className="ui ui-panel sp"
            role="img"
            aria-label="A booking confirmation: code BDC-482113 for the Main Library drive on Tuesday 17 November, 09:15 to 09:30"
        >
            <div className="sp__head">
                <span className="sp__title">Booking confirmed</span>
                <span className="sp__sub">Show this code at the check-in desk</span>
            </div>
            <div className="sp__code">BDC-482113</div>
            <dl className="sp__rows">
                <div><dt>Drive</dt><dd>Main Library</dd></div>
                <div><dt>Date</dt><dd>Tue 17 Nov</dd></div>
                <div><dt>Time</dt><dd>09:15 to 09:30</dd></div>
            </dl>
            <div className="sp__foot">
                <span className="sp__sel">Next donation from 12 Jan</span>
                <span className="ui-btn">Add to calendar</span>
            </div>
        </div>
    );
}
