# Implementation Prompt: South African Law Notice Page (/legal)

## Context & Objectives
South African law is strict on blood donation, health information and rewards for donors. The user wants the
web app to quote the relevant laws word for word as **educational information** that warns against
unauthorised use of the information the platform collects (pre-screening answers, blood group, donation
history).

Rule from the user: **nothing guessed.** Every quote below was taken from the official gazetted Acts on gov.za
and checked line by line:
- National Health Act 61 of 2003, Government Gazette No. 26595, 23 July 2004:
  https://www.gov.za/sites/default/files/gcis_document/201409/a61-03.pdf
- Protection of Personal Information Act 4 of 2013, Government Gazette No. 37067, 26 November 2013:
  https://www.gov.za/sites/default/files/gcis_document/201409/3706726-11act4of2013protectionofpersonalinforcorrect.pdf

The National Health Act PDF is a scan, so the extracted text has broken spacing (e.g. "otherewardfosruchdonatione,xcepftotrhe"
in s60(4)(a)). Only spacing and letter order were restored; no words were added or changed. A secondary copy on
Acts Online agrees with the restored wording.

User decisions:
- Quote every verified provision below. **Leave out NHA s17**, because its scanned text could not be verified.
- Show the gazette source with each quote, plus a disclaimer that this is the text **as enacted**, for
  education only, not legal advice, and may have been amended later.
- Placement: **one dedicated public `/legal` page only**, linked from both footers. No banners or modal notices.

## Exact text to render (do not edit wording)

### National Health Act 61 of 2003

**Section 14: Confidentiality**
> 14. (1) All information concerning a user, including information relating to his or her health status,
> treatment or stay in a health establishment, is confidential.
> (2) Subject to section 15, no person may disclose any information contemplated in subsection (1) unless—
> (a) the user consents to that disclosure in writing;
> (b) a court order or any law requires that disclosure; or
> (c) non-disclosure of the information represents a serious threat to public health.

**Section 60(4)–(5): No reward for donation (offence)**
> (4) It is an offence for a person—
> (a) who has donated tissue, a gamete, blood or a blood product to receive any form of financial or other
> reward for such donation, except for the reimbursement of reasonable costs incurred by him or her to provide
> such donation; and
> (b) to sell or trade in tissue, gametes, blood or blood products, except as provided for in this Chapter.
> (5) Any person convicted of an offence in terms of subsection (4) is liable on conviction to a fine or to
> imprisonment for a period not exceeding five years or to both a fine and such imprisonment.

### Protection of Personal Information Act 4 of 2013 (POPIA)

**Section 14(1): Retention and restriction of records** (opening words; the page notes the (a)–(d)
exceptions are left out with "…")
> 14. (1) Subject to subsections (2) and (3), records of personal information must not be retained any longer
> than is necessary for achieving the purpose for which the information was collected or subsequently
> processed, unless— …

**Section 19(1): Security measures on integrity and confidentiality of personal information**
> 19. (1) A responsible party must secure the integrity and confidentiality of personal information in its
> possession or under its control by taking appropriate, reasonable technical and organisational measures to
> prevent—
> (a) loss of, damage to or unauthorised destruction of personal information; and
> (b) unlawful access to or processing of personal information.

**Section 26: Prohibition on processing of special personal information**
> 26. A responsible party may, subject to section 27, not process personal information concerning—
> (a) the religious or philosophical beliefs, race or ethnic origin, trade union membership, political
> persuasion, health or sex life or biometric information of a data subject; or
> (b) the criminal behaviour of a data subject to the extent that such information relates to—
> (i) the alleged commission by a data subject of any offence; or
> (ii) any proceedings in respect of any offence allegedly committed by a data subject or the disposal of such
> proceedings.

**Section 27(1)(a): General authorisation (consent)** (opening words and paragraph (a) only)
> 27. (1) The prohibition on processing personal information, as referred to in section 26, does not apply if
> the—
> (a) processing is carried out with the consent of a data subject referred to in section 26; …

## Scope
1. **New page `app/(app)/legal/page.tsx`** (server component, static, public; the `(app)` group already gives
   it the plain `app-main` layout and `AppFooter`, same as `/credits`).
   - `metadata`: title `Legal notice: CS Blood Drive`, with a one-sentence description.
   - The quotes live in a typed constant (`LAWS: LawSection[]`, each with `act`, `section`, `heading`, `paragraphs: string[]`)
     and are rendered in `blockquote`s inside `app-card`s, matching `/credits`. Small render helpers, no client JS.
   - Page order:
     1. `h1` "Legal notice".
     2. A short warning in plain language: donor information on this platform (pre-screening answers, blood
        group, donation history) is health information protected by South African law, and may be used only
        for donor eligibility and drive operations. Any other use, copying or disclosure is not authorised.
        Donors may not be paid or rewarded for donating (NHA s60(4)).
     3. National Health Act section (s14, s60(4)–(5)).
     4. POPIA section (s14(1), s19(1), s26, s27(1)(a)).
     5. **Sources and disclaimer**: both gazette links above, plus: "Quoted from the Acts as originally
        published in the Government Gazette. They may have been amended since. This page is for education
        only and is not legal advice. Check the current consolidated Act before relying on it."
   - Every quote shows its citation, e.g. "National Health Act 61 of 2003, section 60(4)–(5)".
2. **Footer links**
   - `components/AppFooter.tsx`: add a `Legal notice` link to `/legal` next to "Upcoming drives".
   - `components/landing/Closing.tsx`: in `.footer__legal`, add `<a className="credits" href="/legal">Legal notice</a>`
     beside the existing credits link.
3. Styling uses only existing tokens and classes (`app-title`, `app-card`, `text-muted`, `link`, `border-line`).
   If a `blockquote` needs any style, add one small rule in `app/globals.css`. No new colours.

## Out of Scope
- NHA s17, the Blood Regulations, and any law not listed above (none were verified).
- Banners, modal notices, consent checkboxes, and any server, API or schema change.
- Any reward or incentive feature. The app has none, and NHA s60(4) forbids donor rewards beyond reimbursing reasonable costs.

## Checks
- `npm run lint` in `client/my-app` (zero new warnings; the known AuthContext error is not part of this change).
- `npx next build` succeeds and `/legal` is prerendered as static.
- Compare every rendered quote against this prompt word for word.
- Check at 390px and 1440px: no horizontal scroll, quotes wrap cleanly.

## Test Steps
1. `cd client/my-app && npm run dev`.
2. Open `http://localhost:3000`, scroll to the footer, click **Legal notice** → `/legal` loads.
3. Check the warning, both Acts' quotes, the citations, and the sources and disclaimer block with working gov.za links.
4. Sign in (any role): the app footer has a **Legal notice** link that opens the same page.
5. Narrow the window to phone width: the text wraps and there is no sideways scroll.
