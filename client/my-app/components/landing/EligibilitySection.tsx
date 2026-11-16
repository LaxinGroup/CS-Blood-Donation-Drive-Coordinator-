/* eslint-disable @next/next/no-img-element -- the kit's responsive <img>, as photos.mjs printed it */

/* The rules the server's pre-screen applies (appointmentController.evaluatePreScreening). */
const RULES: { name: string; value: string }[] = [
    { name: 'Age', value: '16 or older' },
    { name: 'Weight', value: 'At least 50 kg' },
    { name: 'Since your last donation', value: '56 days' },
    { name: 'After a tattoo or piercing', value: '3 months' },
    { name: 'After a course of antibiotics', value: '48 hours' },
];

/* split-text-left, with the dealt moment (liquid-hover) on its photograph. */
export default function EligibilitySection() {
    return (
        <section className="section g2m" id="eligibility" aria-labelledby="eligibility-h">
            <div className="wrap">
                <div className="grid">
                    <div className="span-5 stack-6">
                        <h2 id="eligibility-h">Who can give blood, and how often</h2>
                        <p>
                            The booking form asks five questions before it shows a time. If one rule stops you today, it
                            tells you which one and the date you can come back.
                        </p>
                        <ul className="rows">
                            {RULES.map((r) => (
                                <li key={r.name}>
                                    <span className="rows__name">{r.name}</span>
                                    <span className="rows__value">{r.value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <figure
                        className="frame frame--photo span-6 start-7"
                        data-moment="liquid-hover"
                        data-moment-opts='{"strength": 0.8}'
                    >
                        {/* stand-in photograph (Wikimedia Commons, public domain): replace with the client's medical staff at a drive */}
                        <img
                            className="frame__img"
                            src="/assets/img/photo-f40700568-960.jpg"
                            srcSet="/assets/img/photo-f40700568-500.jpg 500w, /assets/img/photo-f40700568-960.jpg 960w"
                            sizes="(max-width: 1023px) 100vw, 50vw"
                            width={960}
                            height={1440}
                            alt="A phlebotomist in a face shield and gloves checks the label on a full blood bag"
                            loading="lazy"
                            decoding="async"
                            data-source="stand-in"
                            data-subject="blood donation"
                        />
                    </figure>
                </div>
            </div>
        </section>
    );
}
