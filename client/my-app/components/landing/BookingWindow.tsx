import { BOOKINGS_WINDOW, DRIVE_CALENDAR } from './fragments';

/* app-frame: the product big, the bookings list beside the month's drive dates in one window. */
export default function BookingWindow() {
    return (
        <section className="section" id="booking" aria-labelledby="booking-h">
            <div className="wrap">
                <div className="grid">
                    <h2 id="booking-h" className="span-5">Bookings and drive dates in one window</h2>
                    <div className="span-6 start-7 stack-4">
                        <p>
                            Each booking carries its venue, its time and a code for the desk. The month beside it marks
                            every drive day, so donors and staff read the same schedule.
                        </p>
                        <a className="link" href="#drives">See upcoming drives</a>
                    </div>
                </div>
                <div
                    className="ui app fill"
                    role="img"
                    aria-label="The bookings list with each donor's blood group, venue, slot and booking code, beside a November calendar marking the Main Library drive from the 17th to the 19th"
                    data-ui-pause-host=""
                >
                    <div className="app__pane app__pane--list" dangerouslySetInnerHTML={{ __html: BOOKINGS_WINDOW }} />
                    <div className="app__pane app__pane--open" data-ui-loop="" dangerouslySetInnerHTML={{ __html: DRIVE_CALENDAR }} />
                </div>
            </div>
        </section>
    );
}
