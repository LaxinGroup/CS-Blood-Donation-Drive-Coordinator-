import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
    title: 'CS Blood Drive: donation booking for campus donors',
    description:
        'Book an exact time at a campus blood drive, pass the eligibility check online and check in at the desk with your booking code.',
    openGraph: {
        type: 'website',
        title: 'CS Blood Drive: donation booking for campus donors',
        description: 'Book an exact donation time at a campus blood drive and check in with your booking code.',
        images: ['/share.jpg'],
    },
    twitter: { card: 'summary_large_image' },
    other: { 'site-kind': 'software', 'page-type': 'software' },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#f8f8f8',
};

/* The hero's words wait for motion.js instead of flashing (motion.md); the 700ms mark shows them anyway. */
const ENTER_GUARD =
    "document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700);" +
    "document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500);";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            data-type="software"
            data-radius="soft"
            data-ground="sand"
            data-buttons="arrow"
            data-motion=""
            suppressHydrationWarning
        >
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                {/* eslint-disable-next-line @next/next/no-page-custom-font -- the dealt pairing, loaded once for every page from the root layout */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400..700&family=JetBrains+Mono:wght@400..500&display=swap"
                    rel="stylesheet"
                />
                {/* eslint-disable-next-line @next/next/no-css-tags -- the design kit ships as plain files in public/assets */}
                <link rel="stylesheet" href="/kit.css" />
                {/* the motion layer stands on its own link (the checker looks for it); it only adds hover, press and entrance */}
                {/* eslint-disable-next-line @next/next/no-css-tags -- a kit file in public/assets */}
                <link rel="stylesheet" href="/assets/motion/motion.css" />
                <script dangerouslySetInnerHTML={{ __html: ENTER_GUARD }} />
                <link rel="modulepreload" href="/assets/moments/moments.js" />
                <link rel="modulepreload" href="/assets/moments/lib.js" />
                <link rel="modulepreload" href="/assets/moments/liquid-hover/moment.js" />
            </head>
            <body>
                <AuthProvider>
                    <Navbar />
                    {children}
                </AuthProvider>
                {/* nav sheet, fragments, moments: system.js; hover and the hero's entrance: motion.js;
                    the hero's own layout: layout.js. Loaded after hydration so they never race React. */}
                <Script src="/assets/backgrounds/backgrounds.js" strategy="afterInteractive" />
                <Script src="/assets/system.js" type="module" strategy="afterInteractive" />
                <Script src="/assets/motion/motion.js" type="module" strategy="afterInteractive" />
                <Script src="/assets/layout/layout.js" type="module" strategy="afterInteractive" />
            </body>
        </html>
    );
}
