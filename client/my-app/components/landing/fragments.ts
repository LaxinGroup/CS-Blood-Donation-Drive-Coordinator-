/*
  The landing's UI fragments, pasted from public/assets/ui/<name>/fragment.html and rewritten to this
  product's own subject: bookings, drive dates, check-in, turnout. Static, trusted markup; ui.js
  (loaded by system.js) runs each one's loop.
*/

const DROP_ICON =
    '<svg class="ui-brand" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7"/></svg>';

type BookingRow = { group: string; tone: number; venue: string; slot: string; status: string; cls?: string; age: string };

const BOOKINGS: BookingRow[] = [
    { group: 'O+', tone: 1, venue: 'Main Library', slot: 'Tue 17 Nov · 09:15 · BDC-482113', status: 'Booked', age: '2m' },
    { group: 'A−', tone: 3, venue: 'Main Library', slot: 'Tue 17 Nov · 09:30 · BDC-560274', status: 'Booked', age: '5m' },
    { group: 'B+', tone: 4, venue: 'Main Library', slot: 'Tue 17 Nov · 09:45 · BDC-318806', status: 'Booked', age: '9m' },
    { group: 'O−', tone: 2, venue: 'Main Library', slot: 'Tue 17 Nov · 10:00 · BDC-907451', status: 'Booked', age: '14m' },
    { group: 'AB+', tone: 5, venue: 'Main Library', slot: 'Wed 18 Nov · 11:15 · BDC-245690', status: 'Checked in', cls: 'is-done', age: '21m' },
    { group: 'A+', tone: 3, venue: 'Main Library', slot: 'Wed 18 Nov · 11:30 · BDC-731548', status: 'Checked in', cls: 'is-done', age: '26m' },
    { group: 'O+', tone: 1, venue: 'Main Library', slot: 'Thu 19 Nov · 13:00 · BDC-664027', status: 'Checked in', cls: 'is-done', age: '34m' },
    { group: 'B−', tone: 4, venue: 'Science Block', slot: 'Thu 26 Nov · 09:00 · BDC-158392', status: 'Checked in', cls: 'is-done', age: '41m' },
    { group: 'A+', tone: 5, venue: 'Science Block', slot: 'Thu 26 Nov · 09:15 · BDC-470615', status: 'Checked in', cls: 'is-done', age: '48m' },
    { group: 'O+', tone: 2, venue: 'Science Block', slot: 'Thu 26 Nov · 09:30 · BDC-893174', status: 'Checked in', cls: 'is-done', age: '55m' },
];

function bookingRow(r: BookingRow): string {
    return (
        `<li class="ui-win__row" data-row><span class="ui-avatar" data-tone="${r.tone}">${r.group}</span>` +
        `<span class="ui-win__who">${r.venue}</span><span class="ui-win__sub">${r.slot}</span>` +
        `<span class="ui-win__st${r.cls ? ` ${r.cls}` : ''}" data-st>${r.status}</span><span class="ui-win__age">${r.age}</span></li>`
    );
}

/* The list pane: the bookings window (window fragment). */
export const BOOKINGS_WINDOW = `
<div class="ui ui-panel ui-win" data-ui="window" data-open="Booked" data-work="Checking in" data-done="Checked in">
  <div class="ui-win__bar">
    <span class="ui-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="ui-win__crumb">${DROP_ICON}Drives <i>/</i> <b>Bookings</b></span>
    <span class="ui-spacer"></span>
    <span class="ui-win__search" aria-hidden="true"><svg class="ui-icon" viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg><span class="ui-win__ph">Search</span><span class="ui-kbd">/</span></span>
  </div>
  <div class="ui-win__body">
    <nav class="ui-win__side" aria-hidden="true">
      <span class="ui-win__nav is-on"><svg class="ui-icon" viewBox="0 0 16 16"><path d="M2.5 9h3l1 1.5h3l1-1.5h3"/><path d="M2.5 9 4 3.5h8L13.5 9v3.5h-11z"/></svg>Booked<em>96</em></span>
      <span class="ui-win__nav"><svg class="ui-icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></svg>Today<em>24</em></span>
      <span class="ui-win__nav"><svg class="ui-icon" viewBox="0 0 16 16"><path d="m3.5 8.4 2.8 2.8 6.2-6.4"/></svg>Checked in<em>31</em></span>
      <span class="ui-win__nav"><svg class="ui-icon" viewBox="0 0 16 16"><circle cx="8" cy="6" r="2.5"/><path d="M3.5 13.5c.6-2.3 2.4-3.5 4.5-3.5s3.9 1.2 4.5 3.5"/></svg>Donated</span>
      <span class="ui-win__label">Drives</span>
      <span class="ui-win__nav"><span class="ui-win__hash">#</span>Main Library</span>
      <span class="ui-win__nav"><span class="ui-win__hash">#</span>Science Block</span>
    </nav>
    <div class="ui-win__main">
      <div class="ui-win__cols" aria-hidden="true"><span>Venue</span><span>Slot</span><span>Status</span><span>Booked</span></div>
      <ul class="ui-win__rows">${BOOKINGS.map(bookingRow).join('')}</ul>
    </div>
  </div>
</div>`;

/* The open pane: November's drive dates (calendar fragment). 1 November 2026 is a Sunday. */
function calendarDays(): string {
    const cells: string[] = [];
    for (let d = 26; d <= 31; d++) cells.push(`<span class="ui-cal__d is-out"><b>${d}</b></span>`);
    for (let d = 1; d <= 30; d++) {
        const cls = d === 15 ? ' is-today' : d === 17 ? ' is-start' : d === 18 ? ' is-in' : d === 19 ? ' is-end' : d === 26 ? ' is-mark' : '';
        cells.push(`<span class="ui-cal__d${cls}" data-d="${d}"><b>${d}</b></span>`);
    }
    for (let d = 1; d <= 6; d++) cells.push(`<span class="ui-cal__d is-out"><b>${d}</b></span>`);
    return cells.join('');
}

export const DRIVE_CALENDAR = `
<div class="ui ui-panel ui-calendar" data-ui="calendar" data-start="17" data-end="19" data-month="Nov">
  <div class="ui-cal__head">
    <div class="ui-cal__month">November <span>2026</span></div>
    <span class="ui-spacer"></span>
    <span class="ui-chip ui-chip--plain ui-chip--ink" data-cal-range>Nov 17 – 19</span>
    <span class="ui-cal__nav" aria-hidden="true"><svg class="ui-icon" viewBox="0 0 16 16"><path d="M10 4 6 8l4 4"/></svg></span>
    <span class="ui-cal__nav" aria-hidden="true"><svg class="ui-icon" viewBox="0 0 16 16"><path d="m6 4 4 4-4 4"/></svg></span>
  </div>
  <div class="ui-cal__dow" aria-hidden="true"><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span></div>
  <div class="ui-cal__days">${calendarDays()}</div>
  <div class="ui-cal__events">
    <div class="ui-cal__ev" data-ev="17">
      <span class="ui-cal__date"><b>17</b><i>Nov</i></span>
      <span class="ui-cal__evtext"><span class="ui-cal__evtitle">Main Library drive opens</span><span class="ui-cal__evsub">Slots every 15 minutes, 09:00 to 15:00</span></span>
    </div>
    <div class="ui-cal__ev" data-ev="19">
      <span class="ui-cal__date"><b>19</b><i>Nov</i></span>
      <span class="ui-cal__evtext"><span class="ui-cal__evtitle">Last slot at 14:45</span><span class="ui-cal__evsub">Three donors per slot</span></span>
    </div>
    <div class="ui-cal__ev" data-ev="26">
      <span class="ui-cal__date"><b>26</b><i>Nov</i></span>
      <span class="ui-cal__evtext"><span class="ui-cal__evtitle">Science Block drive</span><span class="ui-cal__evsub">Booking opens on the 19th</span></span>
    </div>
  </div>
</div>`;

const TICK = '<span class="ui-check__box"><svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5"/></svg></span>';

/* Drive setup (checklist fragment): the slot generator's inputs. */
export const DRIVE_SETUP = `
<div class="ui ui-panel ui-checks" data-ui="checklist">
  <div class="ui-checks__head">
    <div class="ui-title">New drive · Science Block</div>
    <span class="ui-spacer"></span>
    <div class="ui-meta" data-checks-count>2 of 5</div>
  </div>
  <div class="ui-checks__bar"><i data-checks-bar style="--k:0.4"></i></div>
  <ul class="ui-checks__list">
    <li class="ui-check is-done">${TICK}<span class="ui-check__label">Date: Thursday 26 November</span></li>
    <li class="ui-check is-done">${TICK}<span class="ui-check__label">Hours: 09:00 to 15:00</span></li>
    <li class="ui-check">${TICK}<span class="ui-check__label">Slot length: 15 minutes</span></li>
    <li class="ui-check">${TICK}<span class="ui-check__label">Donors per slot: 3</span></li>
    <li class="ui-check">${TICK}<span class="ui-check__label">Publish 24 slots</span></li>
  </ul>
</div>`;

/* The check-in desk (notify fragment): what the staff console shows as donors arrive. */
export const CHECK_IN_FEED = `
<div class="ui ui-notify" data-ui="notify">
  <ul class="ui-notify__list" data-notify-list>
    <li class="ui-note"><span class="ui-avatar ui-note__av" data-tone="1">O+</span><span class="ui-note__text"><span class="ui-note__title">BDC-482113 checked in<time>now</time></span><span class="ui-note__body">09:15 slot, sent to the waiting area</span></span><span class="ui-btn ui-btn--sm ui-note__btn">Seat</span></li>
    <li class="ui-note"><span class="ui-avatar ui-note__av" data-tone="3">A−</span><span class="ui-note__text"><span class="ui-note__title">BDC-560274 in the chair<time>4m</time></span><span class="ui-note__body">Bed 2, started 09:31</span></span></li>
    <li class="ui-note"><span class="ui-note__ico"><svg class="ui-icon" viewBox="0 0 16 16"><path d="m3.5 8.4 2.8 2.8 6.2-6.4"/></svg></span><span class="ui-note__text"><span class="ui-note__title">BDC-318806 donated<time>12m</time></span><span class="ui-note__body">1 unit logged, next date 12 January</span></span></li>
  </ul>
</div>`;

/* Turnout (stat fragment): checked-in donors against bookings, by hour. */
export const TURNOUT_STAT = `
<div class="ui ui-panel ui-stat" data-ui="stat" data-from="74" data-to="82" data-suffix="%" data-values="4,7,9,11,10,12,9,8,11,10,7,5" data-prev="3,6,8,9,9,10,8,8,9,9,6,4">
  <div class="ui-stat__head">
    <div class="ui-stat__top">
      <span class="ui-stat__label">Turnout, Main Library</span>
      <span class="ui-stat__range">Today<svg class="ui-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 6.5 3.5 3.5 3.5-3.5"/></svg></span>
    </div>
    <div class="ui-stat__line">
      <span class="ui-stat__num" data-stat-num>82%</span>
      <span class="ui-chip ui-chip--plain ui-stat__delta"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 9.5v-7M3 5.5l3-3 3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>8 pts</span>
      <span class="ui-stat__sub">of 96 booked donors</span>
    </div>
  </div>
  <div class="ui-stat__chart">
    <svg class="ui-stat__svg" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true"><path class="ui-stat__grid" d="M0 30.5H400M0 60.5H400M0 90.5H400"/><path class="ui-stat__cover" fill-rule="evenodd" d=""/><g class="ui-stat__bars"></g></svg>
    <div class="ui-stat__axis" aria-hidden="true"><span>09:00</span><span>12:00</span><span>15:00</span></div>
  </div>
</div>`;

/* The urgent call (toggles fragment): the blood groups a coordinator's broadcast goes to. */
function bloodGroup(label: string, sub: string, on: boolean): string {
    return (
        `<li class="ui-tg"><span class="ui-tg__text"><span class="ui-tg__label">${label}</span><span class="ui-tg__sub">${sub}</span></span>` +
        `<button class="ui-switch${on ? ' is-on' : ''}" type="button" role="switch" aria-checked="${on}" aria-label="Alert ${label} donors" tabindex="-1"><i></i></button></li>`
    );
}

export const URGENT_CALL = `
<div class="ui ui-panel ui-toggles" data-ui="toggles">
  <div class="ui-head">
    <svg class="ui-icon ui-toggles__ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14a4.7 4.7 0 0 0 4.7-4.7c0-1.3-.7-2.6-2-3.7S8.4 2.9 8 1.3c-.3 1.6-1.4 3.2-2.7 4.3S3.3 8 3.3 9.3A4.7 4.7 0 0 0 8 14"/></svg>
    <div class="ui-title">Urgent call · groups</div>
    <span class="ui-spacer"></span>
    <div class="ui-meta" data-tg-count>3 of 5 on</div>
  </div>
  <ul class="ui-toggles__list">${[
      bloodGroup('O−', 'Red cells any patient can take', true),
      bloodGroup('A−', 'Rhesus negative', true),
      bloodGroup('B−', 'Rhesus negative', true),
      bloodGroup('O+', 'The most common group', false),
      bloodGroup('AB−', 'The rarest group', false),
  ].join('')}</ul>
</div>`;
