import ConfirmationPreview from './ConfirmationPreview';

const QUESTIONS: { q: string; a: string }[] = [
    {
        q: 'Do I need an account to book?',
        a: 'Yes. Create a donor account with your campus email, then book any open slot.',
    },
    {
        q: 'What if two donors book the last slot?',
        a: 'The first booking the database records gets it. The other donor is told the slot just filled and picks another time.',
    },
    {
        q: 'Can I cancel a booking?',
        a: 'Yes, from your donor page. The place goes straight back to the drive for someone else.',
    },
    {
        q: 'Where do I find my booking code?',
        a: 'On the confirmation and on your donor page. It starts with BDC; show it at the check-in desk.',
    },
    {
        q: 'When is my next donation date?',
        a: '56 days after your last donation. Your donor page shows the exact date.',
    },
];

/* faq: the page's split, every answer open; the confirmation the answers point to beside them. */
export default function FaqSection() {
    return (
        <section className="section g2m" id="faq" aria-labelledby="faq-h">
            <div className="wrap">
                <div className="grid">
                    <div className="span-6 faq-side">
                        <div className="stack-4">
                            <h2 id="faq-h">Questions</h2>
                            <p>What donors ask before their first booking.</p>
                            <a className="link" href="/register">Create a donor account</a>
                        </div>
                        <div className="frame frame--lit" data-visual="">
                            <ConfirmationPreview />
                        </div>
                    </div>
                    <div className="faq span-6 start-7">
                        {QUESTIONS.map((item) => (
                            <div className="faq__item" key={item.q}>
                                <h3>{item.q}</h3>
                                <p>{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
