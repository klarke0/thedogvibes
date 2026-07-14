// scripts/treat-jar.tricks.js — pure trick selection. No DOM.

export const TRICKS = Object.freeze([
  { id: 'spin', weight: 20, duration: 900, captions: [
    'a full rotation. majestic.',
    'spin executed. treat earned, honestly.',
    'that was 360 degrees of dog.',
  ]},
  { id: 'bow', weight: 20, duration: 800, captions: [
    'a formal bow. very dignified.',
    'he bows. you may clap quietly.',
  ]},
  { id: 'highfive', weight: 20, duration: 800, captions: [
    'high-five. good hustle out there.',
    'paw meets hand. commerce complete.',
  ]},
  { id: 'playbow', weight: 15, duration: 900, captions: [
    'play bow. he thinks you have more treats.',
    'front half down, back half optimistic.',
  ]},
  { id: 'catch', weight: 15, duration: 700, captions: [
    'caught it midair. no notes.',
    'snap. gone. like it never existed.',
  ]},
  { id: 'stare', weight: 8, duration: 1400, captions: [
    "he's a dog, not a vending machine.",
  ]},
  { id: 'nap', weight: 2, duration: 10000, captions: [
    'you fed him into a nap.',
  ]},
]);

const TOTAL_WEIGHT = TRICKS.reduce((s, t) => s + t.weight, 0);

// rand: () => [0,1). Injected for testability.
export function pickTrick(rand) {
  let r = rand() * TOTAL_WEIGHT;
  for (const t of TRICKS) {
    r -= t.weight;
    if (r < 0) return t;
  }
  return TRICKS[0];
}

export function pickCaption(trick, rand) {
  return trick.captions[(rand() * trick.captions.length) | 0];
}
