# LogisticsEdge — Design Direction ("Highway")

| | |
|---|---|
| **Date** | 2026-10-18 |
| **Scope** | Visual language, login, app shell, dashboard. The marketing site follows in its own pass (§8). |
| **Status** | Tokens, login, app shell and dashboard implemented. |

## 1. Why change

The product looked like a default AI-generated app rather than a logistics tool:

| Tell | Where it showed up |
|---|---|
| One saturated blue (`#0057FF`) for everything: buttons, icons, IDs, alerts, the "all systems normal" tick | `globals.css`, the dashboard. A critical alert and a success message looked the same. |
| Inter for every word, with uppercase letter-spaced micro-labels | Root layout, the login page's "FLEET INTELLIGENCE SYSTEM", every section label |
| Glow shadows (`--brand-glow`), radial blobs, gradient headline text, pill badges | Login background, logo tile, the marketing hero ("Wherever Cargo Takes You" in an amber→teal gradient) |
| Cards that lift on hover even when they are not clickable | `.card:hover { transform: translateY(-1px) }` |
| Placeholder social proof and unbacked claims | "JD MK AS" avatar stack; "SOC-2 Type II Certified" on the login page |
| Two brands | The marketing site is navy + amber; the app is blue + porcelain |
| Controls that do nothing | The "Keep me signed in" toggle was never sent to the server |

Community write-ups on "AI slop" list the same tells: an indigo or purple-to-blue gradient, Inter, three equal cards, and placeholder names ([prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website), [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells)). Banning one default often leads to the next one, such as cream with terracotta or near-black with neon green ([Capital and Compute](https://capitalandcompute.net/blog/fix-ai-slop-design/)). So the fix is a direction taken from the domain, not a different trendy palette.

## 2. What the logistics leaders do (reviewed 2026-10-18)

**Sign-in pages**

| Product | Pattern | Colour |
|---|---|---|
| Samsara (`cloud.samsara.com`) | Email first, then **Continue** (routes to SSO or password). Sign-up, reset and help links; one product-news panel. | White page, one blue button, no card |
| Motive (`auth.gomotive.com`) | Region selector (data residency), labels above fields, "Log in with SSO", a session-expired banner, a support phone number. Capability list beside the form. | Black wordmark, cyan button |
| Flexport (`login.flexport.com`) | Email first, Continue with Google. Flat port illustration (crane, ship). | Slate bands, one indigo button |
| Delhivery One | Email first, Continue with Google, "Read FAQs / Raise a ticket". | Brand red only in the logo; near-black button |
| Shiprocket | Google, Shopify **and phone OTP**, then email and password. | Their own purple |
| FourKites | Email first, language picker, privacy notice, network figures in the footer. | Blue band |
| project44 Movement | Email first on a dark page. | Their blue→violet brand gradient on one button only |

What they share:
- the brand appears once;
- one primary action;
- labels sit above fields;
- help is reachable from the sign-in page;
- no security claims;
- nothing animated.

**Dashboards**
- **Flexport** (live tour on its homepage) opens with *"Hello, Thomas! There are 3 overdue tasks and 1 due today."*
  - Left rail: counts per object, each with a red-dot exception line ("4 with exceptions", "1 PO missed CRD").
  - A world map, and a "Search or ask" box.
  - Colour is reserved for exceptions.
- **Samsara**: warm off-white canvas, near-black buttons, real road photography with the product UI laid on top. The one bright accent is safety yellow.
- **Ambry**: leads with the customer's pain ("Too many calls? Too many emails? No visibility?") rather than buzzwords.

## 3. What the references say

| Source | Principle we apply |
|---|---|
| Stephen Few, *Information Dashboard Design* | Make the dashboard readable at a glance: summarise, show exceptions, strip non-data ink, and highlight only what matters ([UXmatters review](https://uxmatters.com/mt/archives/2007/04/book-review-information-dashboard-design.php)). |
| IBM Carbon | Neutral greys dominate; one blue family is the action colour; red, orange, yellow and green are reserved for severity. Use shape plus colour plus a label for status in dense tables ([colour](https://carbondesignsystem.com/elements/color/overview/), [status indicators](https://www.carbondesignsystem.com/patterns/status-indicator-pattern)). |
| Wathan & Schoger, *Refactoring UI* | Define 8–10 greys and 5–10 shades per colour up front. Avoid true black. Tint greys towards the brand ([palette chapter](https://refactoringui.com/previews/building-your-color-palette)). |
| Jon Yablonski, *Laws of UX* (Doherty threshold) | Respond in under 400 ms; if work takes longer, show a loading state within that window ([O'Reilly](https://www.oreilly.com/library/view/laws-of-ux/9781098146955/ch10.html)). |
| NIST SP 800-63B | No composition rules or forced rotation; allow paste (password managers); screen new passwords against breached lists ([summary](https://jumpcloud.com/blog/nist-800-63-password-guidelines)). |
| Nielsen on password masking | Masking causes failed logins, especially on mobile; mask by default and offer "show password" ([A List Apart](https://alistapart.com/article/the-problem-with-passwords/)). |
| Steve Krug, *Don't Make Me Think*; Don Norman, *The Design of Everyday Things* | Every control on screen must do what it says; remove the ones that don't. Show system status. |
| Material Design 3 motion | Short, purposeful durations (≈100–300 ms) with standard easing; motion explains change and never blocks work. |
| WCAG 2.2 AA | 4.5:1 for text, 3:1 for control boundaries and focus indicators; respect `prefers-reduced-motion`. |
| Stanford CS147 (HCI) | Design, prototype and evaluate with real users. The first real-user tests should be dispatchers on a shift ([course](https://hci.stanford.edu/courses/cs147/2025/au/)). |

**Backend and database references** (they guide `HLD.md` and `LLD.md`):
- Martin Kleppmann & Chris Riccomini, *Designing Data-Intensive Applications*, 2nd ed. ([2026](https://martin.kleppmann.com/2026/03/24/designing-data-intensive-applications-2e.html)). Transactions, the outbox pattern and change data capture all come from here.
- CMU 15-445 *Database Systems* (Andy Pavlo; [course notes](https://csdiy.wiki/en/%E6%95%B0%E6%8D%AE%E5%BA%93%E7%B3%BB%E7%BB%9F/15445/)). Indexing, concurrency control, recovery.

## 4. Direction: "Highway"

Indian road freight is the subject. The palette comes from the road:
- **Signboard green:** the green direction boards common on Indian highways.
- **Asphalt:** the frame.
- **Road-marking amber:** caution.

Green also reads as "moving / on track", which is what a dispatcher wants to see. It keeps us clear of the blue every other logistics brand uses.

### 4.1 Colour tokens (`src/app/globals.css`)

| Role | Token | Value | Contrast |
|---|---|---|---|
| Canvas | `--surface` | `#F3F4F1` | — |
| Card | `--surface-1` | `#FFFFFF` | — |
| Inset / table head | `--surface-2` | `#ECEEEA` | — |
| Text, high | `--text-high` | `#111614` | 16.6:1 on canvas |
| Text, body | `--text-mid` | `#3F4945` | 9.3:1 on white |
| Text, meta | `--text-low` | `#5F6964` | ≥ 4.5:1 on white, canvas and inset |
| Control border | `--border-control` | `#8D9691` | 3.0:1 (WCAG 1.4.11) |
| Primary action | `--brand` | `#0B6B4E` signboard green | 6.5:1 with white text |
| Primary hover | `--brand-dark` | `#07523C` | 9.2:1 |
| Frame (sidebar) | `--asphalt` | `#141A17` | sidebar text 9.8:1, muted 4.9:1 |
| Accent on dark | `--brand-on-dark` | `#4FC79A` | 8.4:1 on asphalt |
| Caution | `--status-warn` | `#8A5A00` (text), `#F2B01E` (marking) | 5.9:1 on white |
| In transit / info | `--status-active` | `#1D5FB8` | 6.2:1 |
| Exception | `--status-error` | `#B42318` | 6.6:1 |

Rules:
1. Green is for the primary action, the current place in the navigation, and "done / on track". Nothing else is green.
2. Red, amber and blue appear only for status, and always with a label or icon, never colour alone.
3. IDs, numbers and plain icons are neutral ink. A table cell isn't brand-coloured just because it holds an ID.
4. No glows, gradient text or decorative blobs. Shadows are a 1 px border plus a soft drop for overlays only.

### 4.2 Type

| Use | Face | Why |
|---|---|---|
| Interface and body | **IBM Plex Sans** (400/500/600/700) | An engineered grotesk with true tabular figures, unlike the Inter default. A Devanagari companion exists for Hindi. |
| Figures and display (KPI values, page titles on the login panel) | **Barlow Condensed** (500/600/700) | Its letterforms come from highway signage; condensed figures fit more numbers in a strip. |
| IDs, vehicle numbers, codes | **IBM Plex Mono** | Distinguishes `0`/`O` and `1`/`l` in `MH12AB1234` and `ORD-1001`. |

Sentence case everywhere. Uppercase only for tiny column headers, with no extra letter-spacing.

### 4.3 Shape and density
- Radius: 6 px for controls, 8 px for cards and menus. Badges are 4 px "labels", not pills.
- Spacing: a 4 px grid; tables at 40 px rows (comfortable) with a compact option later.
- Cards don't move on hover. Only clickable rows and tiles get a hover state, and it's a background tint.

### 4.4 Motion
- `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`; `--dur-1: 120ms` (press, hover), `--dur-2: 200ms` (menus, tabs), `--dur-3: 280ms` (drawers, sheets).
- A pressed button scales to 0.98; focus rings appear instantly.
- `prefers-reduced-motion: reduce` turns transitions and animations off app-wide.
- Never block the page behind an intro animation. The home page keeps its 249-frame scroll film, but the first frame is painted by the server and the rest stream in behind it (§8.3).
- **Cues that help read a screen (2026-10-20, `globals.css` "APP MOTION"):**
  - a page settles in when it opens (`--dur-3`, 6 px rise);
  - the green current-page bar in the sidebar draws in from its middle;
  - progress bars fill from empty when they first appear;
  - the Today strip's figures count up from 0 once their data arrives (`CountUp.tsx`, 480 ms).

  All use fill mode `backwards`, so no transform is left on a page once they have played. None of them adds a glow or moves a card on hover (§4.1 rule 4, §4.3).
- **Loading:** list pages show placeholder rows (`Skeleton`) until the first load, never an empty-state message that isn't true yet. Orders and Knowledge Base did this; Today already did.

## 5. Sign-in page

- **Layout:** two panes on desktop, one column on phones.
- **Left pane (form):**
  - wordmark, then "Sign in to your workspace";
  - work email, then password, each with its label above;
  - show-password toggle; paste allowed;
  - **Sign in** button;
  - "Forgot password?" says exactly what happens today: an Operations Director resets it from Team & Roles. No fake "email sent".
- **Right pane (2026-10-20):** a still photo, `public/media/login-highway.webp` (960×720, 28 KB). It's a frame from the home page's closing film (§8.5): white trucks heading into a golden-hour sun on an expressway.
  - The frame was cropped from the film's centre, which leaves out the generator's mark in the corner.
  - It's cropped to the pane from the centre, so the road's vanishing point and the sun stay in view.
  - Three lines say what the workspace is for (book, dispatch, deliver and bill), with no metrics we can't back up. They sit on a dark fade at the foot of the photo.
  - The owner turned down both the earlier signboard illustration and a video in this pane, so it stays a still.
- **Motion:** the photo fades in, and the form and the panel's lines settle in one after another when the page opens. All of it is still with reduced motion.
- **Errors:** inline under the form, with `role="alert"`; the rate-limit message comes from the server.
- **Removed:** "Keep me signed in" (it did nothing), "SSL Encrypted", "SOC-2 Type II Certified", "Enterprise Security … All sessions monitored".
- **Next:** phone OTP, which Indian fleets expect (Shiprocket offers it), and SSO; both fit an email-first step later.

## 6. App shell and dashboard

- **Sidebar:** asphalt frame, with a signboard-green bar marking the current page and neutral icons. The workspace name sits at the top; navigation counts are neutral chips.
- **Header:** plain white bar, page title in sentence case.
- **Dashboard ("Today"):**
  1. A greeting plus **one sentence of what needs attention**, worked out from live data, e.g. "3 orders are waiting for a truck and 1 alert needs a look."
  2. **A status strip, not five floating cards.** Each figure has a context line from real data, e.g. "of 6 in fleet" or "need a truck". It turns amber or red only when something is wrong.
  3. A **Needs attention** list: critical and warning alerts in their own colours, the oldest unallocated orders, and drivers with unverified documents. Each item links to where it gets fixed.
  4. Trips table with status chips (shape + colour + label).
- **Removed:** the duplicated recent-orders list, blue-on-everything icons, and the identical styling for critical and warning alerts.

## 7. Local development database

The dev server used to talk to the production database. `DATABASE_URL=pglite:./.pglite` now runs Postgres in-process (PGlite, with the same migrations and RLS), and `npm run db:local` fills it with the fictional demo workspace. See `README.md`.

## 8. Marketing site: "Golden hour"

The first marketing pass (2026-10-18) dropped the scroll film for a static, product-led hero with asphalt bands. The owner rejected it the same day:
- keep the scroll film;
- use a light, warm palette that matches it, not dark sections;
- use card-scroll sections;
- base the design on what current startups do.

This section records that research and the direction that came out of it.

### 8.1 What current startup sites do (reviewed 2026-10-18)

Measured in the browser: computed background and text colours weighted by area, fonts, `<video>`/`<canvas>` counts and sticky elements on each homepage.

| Site | Canvas | Ink | Brand / accent | Hero | Motion |
|---|---|---|---|---|---|
| Samsara | `#F5F4F1`, `#EAE8E3` warm stone | `#1C1917` | amber `#FEAE0F` (12 buttons) | Golden-hour runway video | 3 videos |
| Loop (logistics data) | `#F6F6F4`, `#E9E8E3` | `#212121` | deep teal `#005959`, amber `#FFBC1D` | Rounded hero card inset on the page | 3 sticky |
| Augment (freight AI) | white, `#F4F4F5` | `#131313` | forest `#003725` / `#046D4A`, mint `#C8EFC1` | Golden-hour warehouse photo | 5 sticky |
| Granola | `#F7F7F2` | `#292929` | olive `#B2C248` | Serif display headline | 6 canvases |
| Ramp | `#F4F2EF` | `#1F1F1D` | chartreuse CTA | Product UI | 3 videos, 9 canvases |
| Notion | `#F9F9F8`, `#F6F5F4` | `#000`, `#615D59` | amber `#FFB110` | Product UI | 1 video |
| Locus (Indian TMS) | `#FAF5F2` | `#290A38` | purple | — | 1 video |
| Shiprocket | `#F4F4F6` | `#141413` | lime `#D1FF00` | — | — |
| Flexport | white, `#EAF1F6` | `#39414D` | indigo `#566AE5` | Ship photo above the live product ("Hello, Thomas!") | map canvases |
| Attio | white | `#242629` | blue | Product UI | 6 sticky |
| Mercury | dark `#171721` | — | `#5266EB` | Cinematic mountain video | 4 sticky |
| Motive | black / white | — | blue | Video | 12 videos |
| Stord, Porter | white | black | blue / purple | — | — |

What they share:
1. **Warm off-white canvas.** 8 of 13 sit between `#F4F2EF` and `#FAF5F2`, not pure white and not cold grey.
2. **Warm near-black ink** (`#1C1917`–`#292929`), never `#000` for body text.
3. **One deep brand hue plus one bright accent.** Amber or yellow is the most common accent in logistics (Samsara, Loop, Notion, Porter).
4. **Cinematic golden-hour imagery** in the hero (Samsara, Augment, Mercury), or the product itself (Flexport, Ramp). Flexport does both: the photo, then the product under it.
5. **Problem-first section titles** (Loop: "Your supply chain runs on incomplete data").
6. **Sticky, scroll-linked sections** (Attio, Augment, Mercury, Loop).

Trend write-ups agree:
- warm "digital neutrals" are replacing cold greys ([Davey & Krista](https://daveyandkrista.com/2026-brand-color-trends/), [Webpo](https://webpo.space/blog/website-color-trends));
- scroll-driven storytelling and sticky cards are current ([Stan Vision](https://www.stan.vision/journal/saas-website-design), [SaaSFrame](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples));
- looping hero videos only pay off when they don't delay the page ([Transloadit](https://transloadit.com/guides/video-on-landing-pages/)).

### 8.2 Palette (`.mk` scope in `marketing.css`)

Taken from the film's own frames:
- warehouse slate `#2D383D`;
- dock-door cream `#FAF0DC`;
- cloud peach `#F0E1D8`;
- sunset apricot `#E7C5A5`.

Signboard green stays the action colour, so the site and the app are one brand.

| Role | Token | Value | Notes |
|---|---|---|---|
| Canvas | `--mk-canvas` | `#F7F3EC` | warm ivory |
| Card | `--mk-paper` | `#FFFDF9` | |
| Inset / alternate section | `--mk-sand` | `#EFE8DC` | |
| Cloud tint | `--mk-peach` | `#F6E4D4` | stacked card 1, quote band |
| Sage tint | `--mk-sage` | `#DFEADF` | stacked card 2 |
| Dusk tint | `--mk-dusk` | `#E3E7EA` | stacked card 3 (warehouse slate, lightened) |
| Sunset | `--mk-sun` | `#E9A15B` | decorative only: rails, underlines, step numbers on dark |
| Ink | `--mk-ink` | `#1F1C17` | 15:1 on canvas |
| Body | `--mk-ink-2` | `#4B453C` | 8.6:1 on canvas |
| Meta | `--mk-ink-3` | `#6E665A` | 5.1:1 on canvas, 4.7:1 on sand |
| Action | `--brand` | `#0B6B4E` | unchanged from the app |

No dark sections. The only dark pixels on the page are the film itself.

**Layout.** Content is fluid up to `--mk-max` (1560 px). The side gutter, `--mk-gutter`, grows from 16 px on phones to 72 px with `clamp(16px, 4.5vw, 72px)`, so the page uses the screen at every size instead of sitting in a fixed column:

| Screen | Margin each side |
|---|---|
| 1920 px | 178 px |
| 1366 px | 61 px |
| 768 px | 35 px |
| 375 px | 17 px |

The film and the module rail run edge to edge. The rail's first card lines up with the content column through `--mk-edge`.

### 8.3 The scroll film

The film is 249 WebP frames at 1280×720, about 12 MB in total. It runs warehouse aisle → dock door → golden-hour yard → clouds → city → a van leaving a parcel at the door. Five chapters ride on it: Book, Allocate, Track, Deliver, Bill. The film is the "how a load moves" story.

- The server renders frame 0 as an `<img fetchpriority="high">`, so the hero is visible on first paint without JavaScript. No loader screen.
- Frames stream in two passes: every 8th frame first, then the rest. The canvas draws the nearest frame already loaded.
- With Save-Data, a 2G connection or a small screen, only every 2nd frame is fetched.
- `requestAnimationFrame` runs only while the eased progress is catching up with the scroll, not forever. React re-renders only when the chapter changes; the per-frame work is a canvas draw and one CSS variable.
- `prefers-reduced-motion`: nothing is pinned or scrubbed. The five chapters are a plain list beside a still frame.
- The stage is a rounded card inset on the ivory canvas (as Loop does), so the page still reads light around the film.

### 8.4 Card-scroll sections

- **Problems:** four sticky cards that stack as you scroll, each in its own tint. Where `animation-timeline: view()` is supported (Chrome, Edge, Safari 26), cards below the top one shrink slightly. Elsewhere they simply stack. Firefox still has the feature behind a flag (2026), so it is wrapped in `@supports`.
- **Modules:** a horizontal rail with scroll snap and previous/next buttons. Each card uses a still from the film, so no new imagery is needed.

### 8.5 Closing band video
- `public/media/highway-loop.mp4`: 10 s, 1280×720, 2.8 MB, generated with Veo in Gemini (2026-10-18). Modern unbranded white trucks drive forward on a golden-hour expressway, with the camera following at their speed.
- A first take with hand-painted trucks was rejected for two reasons: the motion read as reversing, and the owner wanted modern trucks.
- It plays muted and looped behind the "Where to next?" sign (`ClosingVideo.tsx`). It is fetched only when the band nears the screen, and never with reduced motion or Save-Data.
- The film's frame 85 sits underneath and stays visible until the video is actually playing, then the video fades in over it.
- Matching stills (expressway, truck yard, dock handover) were generated too, but not downloaded, so the module cards still use film frames.

### 8.6 Section patterns from scrolltide.co (2026-10-18)

The owner pointed at [scrolltide.co](https://www.scrolltide.co/), a library of scroll-driven templates, components and sections, and asked for its patterns ("like them, not exactly"). Everything below is redrawn in this palette and makes only claims the product backs.

| Scrolltide pattern | Here | File |
|---|---|---|
| Pill eyebrow; one highlighted word in the headline | Hero pill. A sunset marker (`.mk-mark`) under key words, not gradient text (§4.1 rule 4). | `Hero.tsx`, `.mk-mark` |
| Tech marquee | What a workspace handles, on an endless strip. Pauses on hover; still with reduced motion. | `Marquee.tsx` |
| Mono uppercase kickers over headings | `.mk-kicker`: green, with a dot. A marketing-only exception to §4.2's "sentence case everywhere". | `.mk-kicker` |
| Focus Reveal | A statement whose words come into focus as you scroll, under a viewfinder frame that stretches word to word. Hover moves the frame. No frame and all words sharp without script or with reduced motion. | `FocusStatement.tsx` |
| Stats row that counts up | Product facts only: 1 record per load, 5 stops, 30 days' licence warning, 0 GPS boxes. No customer counts we can't back. | `StatsRow.tsx` |
| Expanded Cards | "What's in a workspace" on ≥1024 px: slivers with vertical names; the hovered or focused card widens. The caption is laid out at the open width so it never rewraps. Phones and tablets keep the snap rail. | `ModuleRail.tsx` |
| Numbered workflow "01 / 03" with ghost numerals | Three getting-started steps; the one crossing the middle of the screen is lit and the counter follows it. | `Workflow.tsx` |
| Route Booking section | Rate calculator: heading row, form beside a tall photo card, three contact tiles (phone, tracking page, sign in). | `QuoteRequest.tsx` |
| Wordmark Bleed footer | A giant "LogisticsEdge" running off the footer's bottom edge, plus a mono tagline. | `SiteFooter.tsx` |
| Zoom Reveal (2026-10-20) | The Today mock tilts up and grows to full size as it scrolls in. Pure CSS (`animation-timeline: view()` in `@supports`), so nothing runs per frame; flat without support or with reduced motion. | `.mk-zoom` |
| Hover List (2026-10-20) | "Which one are you?": fleet owners, transporters and 3PLs, each a link to its `/for` page. With a mouse, a tilted picture follows the pointer and the other rows dim; keyboard focus places it beside the row. Touch screens show a thumbnail in each row instead. | `AudienceList.tsx` |
| Fan Deck (2026-10-20) | "The paperwork, already done": mocks of the GST invoice, e-POD record, tracking page and Tally XML, with fictional data that isn't in the demo workspace (ORD-2041). Stacked until it scrolls in, then fanned; the hovered card lifts. Server-rendered fanned; a swipe row below 1024 px. | `PaperworkDeck.tsx` |
| Glow Ring Button (2026-10-20) | The "Start a workspace" buttons (hero, header, and the closing band on subpages) get a green-to-sunset ring that runs round them on hover and keyboard focus. Static ring with reduced motion. Marketing only: the app keeps §4.1 rule 4. | `.mk-glow` |
| Subpage hero and reveals (2026-10-20) | `/for` pages get a tilted module still beside the headline, using the same picture per audience as the home page's hover list. On every subpage, the hero text settles in line by line, and cards, screen lists and comparison rows rise in as they scroll into view (view timeline, flat without it). | `Page.tsx` (`PageHero` `image`), `.mk-page-hero-split` |

Not taken:
- the promo countdown bar;
- avatar social proof (no named customers yet);
- shader backgrounds (the film and the video already carry the motion).

**Header (2026-10-18).** A floating glass bar (`SiteHeader.tsx`, `--mk-header-h: 74px`):
- it firms up and lifts with a shadow once the page scrolls;
- a sand pill slides behind whichever link is hovered or focused;
- **Product** opens a panel of shortcuts into the page (`#how`, `#product`, `#modules`, `#start`, `#quote`, `/track`) with a featured pricing card;
- a green-to-sunset line along the bar's bottom edge shows scroll progress. It is a transform, so it never re-renders React.

Below 960 px the links fold into a sheet with staggered entries. In-page anchors land below the bar through `scroll-margin-top`.

**Module images.** `public/media/modules/*.webp` (1400 px wide, 33–119 KB each) were generated with Gemini in one prompt style:
- golden hour;
- modern unbranded white trucks;
- the film's palette;
- no text, logos or recognisable faces;
- subject centred for the sliver crop.

All eight cards use them (downloads approved one by one, 2026-10-18/19).

### 8.8 Still open
- Real Indian road footage or photography. The current film is generated and shows a generic city, not an Indian highway.
- Social proof only once there are customers who agree to be named.
