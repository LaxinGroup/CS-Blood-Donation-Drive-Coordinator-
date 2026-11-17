/* footer.closing as dealt: close-word (row 1) on footer-statement (the lit ground, row 2 the links). */
export default function Closing() {
    return (
        <footer className="footer closing footer--statement g2m" id="contact" aria-labelledby="close-h">
            <div className="wrap">
                <div className="closing__cta close--word">
                    <div className="section-head--split">
                        <div>
                            <h2 id="close-h">Book your next donation</h2>
                            <p className="t-lead">A donor account, then an exact time at any open drive.</p>
                        </div>
                        <a className="btn btn--primary" href="#drives">
                            Book a donation slot
                            <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                                <path className="m-arrow__stem" d="M1 6h8" />
                                <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
                            </svg>
                        </a>
                    </div>
                    <p className="close__word" aria-hidden="true">CS Blood Drive</p>
                </div>
                <div className="closing__links">
                    <div className="grid">
                        <div className="span-4">
                            <p className="footer__lede">Blood drive booking for campus donors and drive teams.</p>
                        </div>
                        <div className="span-2 start-7 footer__col">
                            <h3>Donors</h3>
                            <ul>
                                <li><a href="#drives">Drives</a></li>
                                <li><a href="#eligibility">Eligibility</a></li>
                                <li><a href="#faq">Questions</a></li>
                            </ul>
                        </div>
                        <div className="span-2 footer__col">
                            <h3>Teams</h3>
                            <ul>
                                <li><a href="#teams">Drive teams</a></li>
                                <li><a href="#booking">Bookings</a></li>
                            </ul>
                        </div>
                        <div className="span-2 footer__col">
                            <h3>Account</h3>
                            <ul>
                                <li><a href="/login">Sign in</a></li>
                                <li><a href="/register">Create an account</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer__legal">
                        <span>&copy; 2026 CS Blood Donation Drive Coordinator</span>
                        <div className="socials" />
                        <span className="flex flex-wrap gap-x-6">
                            <a className="credits" href="/legal">Legal notice</a>
                            <a className="credits" href="/credits">Photographs via Wikimedia Commons</a>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
