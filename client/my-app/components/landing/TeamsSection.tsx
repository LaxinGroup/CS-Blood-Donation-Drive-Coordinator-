import { CHECK_IN_FEED, DRIVE_SETUP, TURNOUT_STAT, URGENT_CALL } from './fragments';

type Tile = { title: string; line: string; visual: React.ReactNode };

/* features-2x2 on the dealt surface band (surface-pairs): the four jobs of a drive team, each with
   its own working fragment on the lit ground. One loop in the group: the drive setup. */
export default function TeamsSection() {
    const tiles: Tile[] = [
        {
            title: 'Makes the slots from your hours',
            line: 'Enter the date, hours, slot length and donors per slot; every slot is made for you.',
            visual: (
                <div className="stage stage--fade-b">
                    <div
                        className="at-rise fit"
                        style={{ ['--fit-max' as string]: '340px', ['--ax' as string]: 'max(24px, 50% - 170px)', ['--ay' as string]: '40px', ['--ay-sm' as string]: '24px' }}
                        data-ui-loop=""
                        dangerouslySetInnerHTML={{ __html: DRIVE_SETUP }}
                    />
                </div>
            ),
        },
        {
            title: 'Checks donors in by booking code',
            line: 'Staff type the code from the donor’s phone, then log the unit when the bag is full.',
            visual: (
                <div className="stage stage--fade-b">
                    <div
                        className="at-rise fit"
                        style={{ ['--fit-max' as string]: '380px', ['--ax' as string]: '32px', ['--ay' as string]: 'calc(100% - 180px)', ['--ay-sm' as string]: 'calc(100% - 180px)' }}
                        dangerouslySetInnerHTML={{ __html: CHECK_IN_FEED }}
                    />
                </div>
            ),
        },
        {
            title: 'Shows turnout by the hour',
            line: 'Check-ins against bookings for each hour, and units collected against the target.',
            visual: (
                <div className="stage stage--fade-b">
                    <div
                        className="at-rise fit to-edge"
                        style={{ ['--fit-max' as string]: '400px', ['--ax' as string]: 'max(24px, 50% - 200px)', ['--ay' as string]: '56px', ['--ay-sm' as string]: '56px' }}
                        data-ui-opts='{"fill":true}'
                        dangerouslySetInnerHTML={{ __html: TURNOUT_STAT }}
                    />
                </div>
            ),
        },
        {
            title: 'Calls one blood group in a hurry',
            line: 'When stock runs short, one message reaches every donor of the groups you pick.',
            visual: (
                <div className="stage stage--fade-b">
                    <div
                        className="at-right to-edge"
                        style={{ ['--ax' as string]: '32px', ['--ay' as string]: '56px', ['--ay-sm' as string]: '24px' }}
                        dangerouslySetInnerHTML={{ __html: URGENT_CALL }}
                    />
                </div>
            ),
        },
    ];

    return (
        <section className="section g2 ground-surface" id="teams" aria-labelledby="teams-h">
            <div className="wrap">
                <div className="group">
                    <div className="section-head">
                        <h2 id="teams-h">
                            Drive teams run the day from one console.{' '}
                            <span className="muted">Plan it, then check donors in.</span>
                        </h2>
                    </div>
                    <div className="grid">
                        {tiles.slice(0, 2).map((t) => <TileCard key={t.title} tile={t} />)}
                    </div>
                </div>
                <div className="grid">
                    {tiles.slice(2).map((t) => <TileCard key={t.title} tile={t} />)}
                </div>
            </div>
        </section>
    );
}

function TileCard({ tile }: { tile: Tile }) {
    return (
        <article className="card card--row card--open m-nolift span-6">
            <h3>{tile.title}</h3>
            <p>{tile.line}</p>
            <div className="panel frame--lit">{tile.visual}</div>
        </article>
    );
}
