// scripts/walk-the-dog.threshold.js — pure logic for the threshold zones.
// distance: normalized 0..1, where 1 = distraction far, 0 = at the dog.

export const ZONE = Object.freeze({
  UNAWARE: 'unaware',
  AWARE: 'aware',
  OVER: 'over',
});

export function evaluateMark(distance) {
  const d = Math.max(0, Math.min(1, distance));
  if (d > 0.7) return ZONE.UNAWARE;
  if (d >= 0.3) return ZONE.AWARE;
  return ZONE.OVER;
}
