# Dog Vibes v3 Design System — "Zine"

Accurate as of 2026-07-14. This replaces the v2 "Exaggerated Minimalism" doc, which described a design that never shipped. The live site is deliberately playful; nothing in here forbids that.

## Direction
Zine + pixel-cafe retro. Warm newsprint, cream paper, ink stamps, polaroids, pixel-art widgets. Voice: dry, cutesy, funny, warm. Lowercase in nav/captions/microcopy; sentence case in body. No em dashes anywhere (use periods, commas, or "·").

## Tokens (source of truth: styles.css `:root`)
- `--paper: #f3ede0` cream background
- `--ink: #2b2520` near-black text/borders
- `--accent: #8b3a1a` warm rust (links, treats, stamps)
- `--muted: #6b5d4f` captions, metas
- Fonts: `--font-display` Fraunces (headings/wordmark), `--font-body` Georgia, `--font-mono` Courier New (metas, captions, HUDs, labels)
- Spacing scale: `--space-xs` 4 → `--space-2xl` 48

## Components (all in styles.css)
- `.v3-ribbon` — masthead ribbon ("★ Vol. II · Issue IV · Portland, OR ★")
- `.v3-nav` — bracketed lowercase nav; canonical order: home · about · services · faq · blog · guestbook · book
- `.v3-wordmark` + `.v3-page-title` — Fraunces display; page titles use the utility class, not inline clamps
- `.v3-page` / `.v3-page--wide` — standard content wrappers (720px / 780px)
- `.v3-divider` — pixel divider
- `.v3-stamp` + `.v3-stamp-meta` — postage-stamp CTA button and its mono meta line
- `.v3-polaroid` (+ `.tilt-l/.tilt-r`, `--lg`, `.v3-float-r/.v3-float-l`) — photo frames with italic captions; floats unfloat below 600px
- `.v3-clippings` / `.v3-clipping` — testimonial cards (dashed border, slight rotation, `.who` mono byline); degrades from 1 to 3 quotes
- `.v3-widget` — homepage sidebar boxes (treat jar, tip of the day, now reading, guestbook count)
- `.v3-faq` — `<details>`-based Q&A with ▸/▾ markers
- `.v3-legal` — terms/privacy layout with bordered tables
- Treat jar: scripts/treat-jar*.js, canvas pixel toy, localStorage counter, reduced-motion fallback

## Page shell (every page)
Skip link → ribbon → nav → masthead (`v3-wordmark v3-page-title`) → sub-mast → divider → `main.v3-page` → footer (`.v3-footer` with contact line + faq/guestbook/terms/privacy links). Head: favicon.png + apple-touch-icon.png, canonical, OG tags, GA4 (G-K26LZ4ZPDF, anonymize_ip).

## Content facts (canonical)
- Hybrid: in-home across the Portland metro (primary) + remote video coaching anywhere (same prices)
- "free consult" (first mention: "free 30-minute consult"), video call, no contracts
- $125 Standard (75 min) / $175 Premium (90 min)
- Booking flow: Tally intake on book.html → Kevin emails Calendly link → Meet consult
- Evenings/weekends are the normal session times

## Accessibility invariants
Skip link on every page; `prefers-reduced-motion` disables all animation (treat jar shows sleeping dog); aria-live for dynamic captions; alt text on all photos; focus-visible styles.
