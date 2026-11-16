import Link from 'next/link';

/* The quiet footer under the signed-in tool pages: the name, the year and the way home. */
export default function AppFooter() {
    return (
        <footer className="border-t border-line">
            <div className="wrap flex flex-wrap items-center justify-between gap-4 py-6 text-sm text-muted">
                <span>&copy; {new Date().getFullYear()} CS Blood Donation Drive Coordinator</span>
                <Link className="link" href="/">Upcoming drives</Link>
            </div>
        </footer>
    );
}
