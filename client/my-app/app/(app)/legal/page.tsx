import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Legal notice: CS Blood Drive',
    description:
        'South African law on donor health information and rewards for blood donation, quoted from the Government Gazette.',
};

type LawSection = {
    citation: string;
    heading: string;
    paragraphs: string[];
};

type Act = {
    name: string;
    sections: LawSection[];
};

type Source = {
    label: string;
    url: string;
};

const NHA = 'National Health Act 61 of 2003';
const POPIA = 'Protection of Personal Information Act 4 of 2013';

const ACTS: Act[] = [
    {
        name: NHA,
        sections: [
            {
                citation: `${NHA}, section 14`,
                heading: 'Confidentiality',
                paragraphs: [
                    '14. (1) All information concerning a user, including information relating to his or her health status, treatment or stay in a health establishment, is confidential.',
                    '(2) Subject to section 15, no person may disclose any information contemplated in subsection (1) unless—',
                    '(a) the user consents to that disclosure in writing;',
                    '(b) a court order or any law requires that disclosure; or',
                    '(c) non-disclosure of the information represents a serious threat to public health.',
                ],
            },
            {
                citation: `${NHA}, section 60(4)–(5)`,
                heading: 'Payment in connection with the importation, acquisition or supply of tissue, blood, blood products or gametes',
                paragraphs: [
                    '(4) It is an offence for a person—',
                    '(a) who has donated tissue, a gamete, blood or a blood product to receive any form of financial or other reward for such donation, except for the reimbursement of reasonable costs incurred by him or her to provide such donation; and',
                    '(b) to sell or trade in tissue, gametes, blood or blood products, except as provided for in this Chapter.',
                    '(5) Any person convicted of an offence in terms of subsection (4) is liable on conviction to a fine or to imprisonment for a period not exceeding five years or to both a fine and such imprisonment.',
                ],
            },
        ],
    },
    {
        name: POPIA,
        sections: [
            {
                citation: `${POPIA}, section 14(1), opening words`,
                heading: 'Retention and restriction of records',
                paragraphs: [
                    '14. (1) Subject to subsections (2) and (3), records of personal information must not be retained any longer than is necessary for achieving the purpose for which the information was collected or subsequently processed, unless— …',
                ],
            },
            {
                citation: `${POPIA}, section 19(1)`,
                heading: 'Security measures on integrity and confidentiality of personal information',
                paragraphs: [
                    '19. (1) A responsible party must secure the integrity and confidentiality of personal information in its possession or under its control by taking appropriate, reasonable technical and organisational measures to prevent—',
                    '(a) loss of, damage to or unauthorised destruction of personal information; and',
                    '(b) unlawful access to or processing of personal information.',
                ],
            },
            {
                citation: `${POPIA}, section 26`,
                heading: 'Prohibition on processing of special personal information',
                paragraphs: [
                    '26. A responsible party may, subject to section 27, not process personal information concerning—',
                    '(a) the religious or philosophical beliefs, race or ethnic origin, trade union membership, political persuasion, health or sex life or biometric information of a data subject; or',
                    '(b) the criminal behaviour of a data subject to the extent that such information relates to—',
                    '(i) the alleged commission by a data subject of any offence; or',
                    '(ii) any proceedings in respect of any offence allegedly committed by a data subject or the disposal of such proceedings.',
                ],
            },
            {
                citation: `${POPIA}, section 27(1)(a)`,
                heading: 'General authorisation concerning special personal information',
                paragraphs: [
                    '27. (1) The prohibition on processing personal information, as referred to in section 26, does not apply if the—',
                    '(a) processing is carried out with the consent of a data subject referred to in section 26; …',
                ],
            },
        ],
    },
];

const SOURCES: Source[] = [
    {
        label: `${NHA}, Government Gazette No. 26595, 23 July 2004`,
        url: 'https://www.gov.za/sites/default/files/gcis_document/201409/a61-03.pdf',
    },
    {
        label: `${POPIA}, Government Gazette No. 37067, 26 November 2013`,
        url: 'https://www.gov.za/sites/default/files/gcis_document/201409/3706726-11act4of2013protectionofpersonalinforcorrect.pdf',
    },
];

function Quote({ section }: { section: LawSection }) {
    return (
        <li className="grid gap-3 p-6 border-b border-line last:border-b-0">
            <h3 className="font-medium">{section.heading}</h3>
            <blockquote className="legal-quote">
                {section.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                ))}
            </blockquote>
            <p className="text-sm text-muted">{section.citation}</p>
        </li>
    );
}

function ActBlock({ act }: { act: Act }) {
    return (
        <section className="grid gap-4" aria-label={act.name}>
            <h2 className="text-xl font-medium">{act.name}</h2>
            <ul className="app-card app-card--flush">
                {act.sections.map((s) => (
                    <Quote key={s.citation} section={s} />
                ))}
            </ul>
        </section>
    );
}

export default function LegalPage() {
    return (
        <div className="max-w-3xl grid gap-10">
            <div className="grid gap-4">
                <h1 className="app-title">Legal notice</h1>
                <p>
                    The donor information on this platform, including pre-screening answers, blood group and
                    donation history, is health information protected by South African law. It may be used only
                    to check donor eligibility and to run blood drives. Any other use, copying or disclosure is
                    not authorised.
                </p>
                <p>
                    Donors may not be paid or rewarded for donating blood. Only reasonable costs incurred to donate
                    may be reimbursed (National Health Act, section 60(4)).
                </p>
            </div>

            {ACTS.map((act) => (
                <ActBlock key={act.name} act={act} />
            ))}

            <section className="grid gap-3" aria-labelledby="sources-h">
                <h2 id="sources-h" className="text-xl font-medium">Sources and disclaimer</h2>
                <ul className="grid gap-2">
                    {SOURCES.map((s) => (
                        <li key={s.url}>
                            <a className="link" href={s.url}>{s.label}</a>
                        </li>
                    ))}
                </ul>
                <p className="text-muted">
                    Quoted from the Acts as originally published in the Government Gazette. They may have been
                    amended since. This page is for education only and is not legal advice. Check the current
                    consolidated Act before relying on it.
                </p>
            </section>
        </div>
    );
}
