/* eslint-disable @next/next/no-img-element -- the kit's responsive <img> with srcset, as photos.mjs printed it */

const ARROW = (
    <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
        <path className="m-arrow__stem" d="M1 6h8" />
        <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
    </svg>
);

/* The split hero (the user's choice over the dealt product stage): the words on the left, the whole
   photograph on the right at its own shape, so nothing of the scene is cropped on a computer. */
export default function Hero() {
    return (
        <section className="hero hero--split" data-enter aria-labelledby="hero-h">
            <div className="wrap">
                <div className="hero-text grid hero__grid">
                    <div className="hero__text span-5">
                        <h1 id="hero-h">Blood drive booking for campus donors</h1>
                        <p className="hero__lead">
                            Answer the eligibility questions, book an exact time at a campus drive and check in with
                            your booking code. You can give again 56 days later.
                        </p>
                        <div className="btn-row">
                            <a className="btn btn--primary" href="#drives">Book a donation slot{ARROW}</a>
                            <a className="btn btn--secondary" href="#eligibility">See the eligibility rules</a>
                        </div>
                    </div>
                    <div className="hero__media span-6 start-7">
                        {/* stand-in photograph (Wikimedia Commons, CC BY 4.0): replace with a donor at one of the client's own drives */}
                        <img
                            src="/assets/img/photo-f163827093-1280.jpg"
                            srcSet="/assets/img/photo-f163827093-500.jpg 500w, /assets/img/photo-f163827093-960.jpg 960w, /assets/img/photo-f163827093-1280.jpg 1280w"
                            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 100vw, 50vw"
                            width={1280}
                            height={1058}
                            alt="A donor's arm on the chair rest, the needle taped in place and the line running to the collection machine, sample tubes on the table behind"
                            fetchPriority="high"
                            decoding="async"
                            data-source="stand-in"
                            data-subject="blood donation"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
