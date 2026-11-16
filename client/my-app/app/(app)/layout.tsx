import AppFooter from '@/components/AppFooter';

/* The signed-in tool pages: one plain main on the page's .wrap, no screen-height sections. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <main id="top" className="app-main">
                <div className="wrap">{children}</div>
            </main>
            <AppFooter />
        </>
    );
}
