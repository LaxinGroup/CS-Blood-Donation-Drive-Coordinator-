/*
  type: software (site-kind software)
  deal: hero split (the user chose it over the dealt product stage so the whole photograph shows on a computer), nav nav-mega, close close-word,
        footer footer-statement, rhythm surface-pairs (#teams), buttons arrow, mark initial,
        ground sand, palette mint-pink-accounts ground and ink with the client's crimson accent
        (start.mjs brand: the dealt green clashed with the client's crimson identity), type schibsted
        (Schibsted Grotesk + JetBrains Mono; the second pairing failed hero-lines at 390 as well, so the first stays), radius soft
  moments: liquid-hover on the eligibility photograph (the pointer moves the one photograph a
        donor looks at before booking; rests on phones and under reduced motion)
  plan, in screens at 1440x900:
    hero         words left, the whole stand-in photograph right (object)             1
    booking      app-frame: bookings list beside the month's drive dates (ui)          1
    drives       the live drives from the API, booking entry (ui)                       1, 2 with 4+
    teams        features-2x2: setup, check-in, turnout, urgent call (ui, diagram)     2
    faq          five questions, every answer open                                      1
    eligibility  the five pre-screen rules beside a photograph (use) + the moment      1
    closing      close-word on footer-statement                                         1
*/
import Hero from '@/components/landing/Hero';
import BookingWindow from '@/components/landing/BookingWindow';
import DrivesSection from '@/components/landing/DrivesSection';
import TeamsSection from '@/components/landing/TeamsSection';
import EligibilitySection from '@/components/landing/EligibilitySection';
import FaqSection from '@/components/landing/FaqSection';
import Closing from '@/components/landing/Closing';

export default function HomePage() {
    return (
        <>
            <main id="top">
                <Hero />
                <BookingWindow />
                <DrivesSection />
                <TeamsSection />
                <FaqSection />
                <EligibilitySection />
            </main>
            <Closing />
            {/* the phone bar: system.js shows it once the hero's button has scrolled away */}
            <nav className="actionbar" aria-label="Quick actions">
                <a className="btn btn--primary" href="#drives">Book a donation slot</a>
            </nav>
        </>
    );
}
