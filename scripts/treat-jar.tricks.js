// scripts/treat-jar.tricks.js — pure trick selection. No DOM.

export const TRICKS = Object.freeze([
  { id: 'spin', weight: 15, duration: 900, captions: [
    'a full rotation. majestic.',
    'spin executed. treat earned, honestly.',
    'that was 360 degrees of dog.',
    'he calls this one "the tornado."',
  ]},
  { id: 'bow', weight: 12, duration: 800, captions: [
    'a formal bow. very dignified.',
    'he bows. you may clap quietly.',
    'raised by wolves, mannered by butlers.',
  ]},
  { id: 'highfive', weight: 15, duration: 800, captions: [
    'high-five. good hustle out there.',
    'paw meets hand. commerce complete.',
    'that paw has never worked a day in its life.',
  ]},
  { id: 'playbow', weight: 10, duration: 900, captions: [
    'play bow. he thinks you have more treats.',
    'front half down, back half optimistic.',
    'this is dog for "run it back."',
  ]},
  { id: 'catch', weight: 12, duration: 700, captions: [
    'caught it midair. no notes.',
    'snap. gone. like it never existed.',
    'the jaws of a predator, the heart of a lap dog.',
  ]},
  { id: 'shake', weight: 10, duration: 800, captions: [
    'the full-body shake. resets the dog.',
    'shook it off like it never happened.',
    'that shake started at the nose and ended in another zip code.',
  ]},
  { id: 'rollover', weight: 10, duration: 1200, captions: [
    'a full roll. gravity assisted.',
    'belly displayed. do not fall for it.',
    'rolled over like the treat asked nicely.',
  ]},
  { id: 'zoomies', weight: 8, duration: 1800, captions: [
    'zoomies. it means he liked it.',
    'one lap of the invisible racetrack.',
    'we do not know where he goes. he always comes back.',
  ]},
  { id: 'stare', weight: 6, duration: 1400, captions: [
    "he's a dog, not a vending machine.",
    'he ate it while maintaining eye contact. bold.',
  ]},
  { id: 'nap', weight: 2, duration: 10000, captions: [
    'you fed him into a nap.',
    'treat achieved. consciousness optional.',
  ]},
]);

export const IDLE_LINES = Object.freeze([
  'he knows the jar is there.',
  'no thoughts. just jar.',
  'currently guarding the jar with his eyes.',
  'he can hear you scrolling.',
  'patience level: professional.',
  'somewhere, a squirrel is safe. for now.',
  'the butterfly is not a treat. he checked.',
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

export function pickIdleLine(rand) {
  return IDLE_LINES[(rand() * IDLE_LINES.length) | 0];
}
