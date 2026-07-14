# Treat Jar Widget — Design Spec

Date: 2026-07-14
Status: approved by Kevin (replaces "Walk the Dog — Threshold Edition")

## Why

The walk-the-dog game was a timing reflex game dressed in training vocabulary. Kevin's verdict: feels fake, not like actual training. Decision: replace with an honest, charming toy with zero instructional pretension. Concept chosen: **The Treat Jar**.

## What it is

A sidebar widget on `index.html`: a pixel dog and a treat jar. Click the jar, a treat arcs to the dog, the dog does a random trick with a dry caption. No score, no win state, no timer, no lesson.

## Scope

### index.html
- Widget `#widget-game` keeps its slot and mount div (id stays `walk-the-dog-mount` → renamed `treat-jar-mount`).
- Title: `the treat jar`. Help line: `click the jar. that's it. that's the game.`
- Static "book a free consult ►" stamp remains below the widget as plain copy (no win modal anywhere).

### New files
- `scripts/treat-jar.js` — boot module: mount check, reduced-motion fallback, DOM scaffold (canvas + jar `<button>` + caption `<p aria-live="polite">` + counter), lazy-imports the game module. Mirrors old walk-the-dog.js structure.
- `scripts/treat-jar.game.js` — canvas render + state machine (idle → treat-arc → trick → idle).
- `scripts/treat-jar.tricks.js` — pure module: `pickTrick(rand)` weighted selection + caption pools. No DOM. Testable.
- `treat-jar.test.html` — manual harness: renders widget standalone, plus a button that runs 1000 `pickTrick` draws and prints the observed distribution vs expected weights.

### Deleted files
- `scripts/walk-the-dog.js`, `scripts/walk-the-dog.game.js`, `scripts/walk-the-dog.threshold.js`, `walk-the-dog.test.html`.

## Mechanics

- Jar is a `<button>` (keyboard focus, Enter/Space native). Click → treat sprite arcs jar→dog over ~400ms → trick animation ~800ms → caption shows → back to idle. Total lockout ≈1.2s; clicks during lockout make the jar wiggle (no queue).
- Trick pool (weights):
  - spin — 20
  - bow — 20
  - high-five — 20
  - play-bow — 15
  - midair catch — 15
  - just stares and eats it — 8 (caption: "he's a dog, not a vending machine.")
  - falls asleep — 2 (dog curls up ~10s, jar clicks during nap wiggle only; caption: "you fed him into a nap.")
- Each common trick has 2–3 caption variants, dry zine voice, lowercase.
- Counter: `treats given: N`, persisted in `localStorage` key `dv-treats-given`. Fails silently to session-only if storage unavailable.

## Art

- Existing pixel style: ink `#2b2520` on `#fff`, warm accent `#8b3a1a` for treats/jar label. Canvas 380×120.
- Dog reuses the current sprite proportions (body/head/snout/floppy ear/tail wag) — NO mailman hat, NO handler sprite, NO mailbox.
- Idle: subtle breathing (1px body bob), occasional ear twitch, tail wag when cursor hovers the jar.

## Accessibility / edge cases

- `prefers-reduced-motion: reduce` → static sleeping-dog frame + caption "reduced motion is on — he's napping." plus the counter. Jar button hidden.
- Caption element is `aria-live="polite"`; canvas has `role="img"` + aria-label "pixel dog waiting near a treat jar".
- No `Date.now` dependency for logic beyond animation timing; `pickTrick` takes injected `rand` for testability.

## Out of scope

- No sound. No global counters/backend. No changes to other widgets or pages. No training content — that stays with the Dog Training Consultant's actual materials.

## Verification

1. `treat-jar.test.html` distribution check ≈ weights (±3% on 1000 draws).
2. Manual: click through all tricks (temporarily force each), verify lockout wiggle, counter persistence across reload, reduced-motion fallback via macOS setting or DevTools emulation.
3. Deploy preview → confirm on thedogvibes.com after Kevin/production deploy.
