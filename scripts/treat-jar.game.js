// scripts/treat-jar.game.js — canvas render + state machine.
// States: idle -> treat (arc) -> trick -> idle. Nap locks the jar for its duration.
// Idle micro-behaviors (ear twitch, sniff, sit, tail burst, blink) fire on their own clock.
import { pickTrick, pickCaption, pickIdleLine } from './treat-jar.tricks.js';

const INK = '#2b2520';
const ACCENT = '#8b3a1a';
const PAPER = '#fff';
const SKY = '#f1e9d7';
const DIRT = '#e8ddc6';
const FAINT = 'rgba(43, 37, 32, 0.16)';
const SOFT = 'rgba(43, 37, 32, 0.34)';
const TREAT_MS = 400;

const JAR_X = 34;
const DOG_X = 176;

const IDLE_KINDS = [
  { kind: 'earTwitch', duration: 500 },
  { kind: 'sniff', duration: 1300 },
  { kind: 'sit', duration: 2200 },
  { kind: 'tailBurst', duration: 1000 },
  { kind: 'tilt', duration: 900 },
];

export function start(root, { storageKey }) {
  const canvas = root.querySelector('#tj-canvas');
  const ctx = canvas.getContext('2d');
  const jarBtn = root.querySelector('#tj-jar');
  const captionEl = root.querySelector('#tj-caption');
  const counterEl = root.querySelector('#tj-counter');

  const state = {
    phase: 'idle',            // idle | treat | trick
    phaseStart: performance.now(),
    trick: null,
    wiggle: 0,
    hover: false,
    count: readCount(),
    idleAnim: null,           // {kind, start, duration}
    nextIdleAt: performance.now() + 2500,
    blinkUntil: 0,
    nextBlinkAt: performance.now() + 3000,
    nextIdleLineAt: performance.now() + 7000,
  };

  function readCount() {
    try { return parseInt(localStorage.getItem(storageKey), 10) || 0; }
    catch { return 0; }
  }
  function saveCount() {
    try { localStorage.setItem(storageKey, String(state.count)); } catch { /* session-only */ }
  }

  function giveTreat() {
    if (state.phase !== 'idle') { state.wiggle = 350; return; }
    state.phase = 'treat';
    state.phaseStart = performance.now();
    state.trick = pickTrick(Math.random);
    state.idleAnim = null;
    state.count++;
    saveCount();
    counterEl.textContent = `treats given: ${state.count}`;
    captionEl.innerHTML = '&nbsp;';
  }

  jarBtn.addEventListener('click', giveTreat);
  canvas.addEventListener('click', giveTreat);
  canvas.style.cursor = 'pointer';
  jarBtn.addEventListener('mouseenter', () => { state.hover = true; });
  jarBtn.addEventListener('mouseleave', () => { state.hover = false; });
  canvas.addEventListener('mouseenter', () => { state.hover = true; });
  canvas.addEventListener('mouseleave', () => { state.hover = false; });

  function update(now) {
    const t = now - state.phaseStart;
    if (state.wiggle > 0) state.wiggle -= 16;

    if (state.phase === 'treat' && t >= TREAT_MS) {
      state.phase = 'trick';
      state.phaseStart = now;
      captionEl.textContent = pickCaption(state.trick, Math.random);
    } else if (state.phase === 'trick' && t >= state.trick.duration) {
      state.phase = 'idle';
      state.phaseStart = now;
      state.trick = null;
      state.nextIdleAt = now + 2000 + Math.random() * 2000;
      state.nextIdleLineAt = now + 6000;
    }

    // idle micro-behaviors
    if (state.phase === 'idle') {
      if (state.idleAnim && now - state.idleAnim.start > state.idleAnim.duration) {
        state.idleAnim = null;
        state.nextIdleAt = now + 2500 + Math.random() * 3500;
      }
      if (!state.idleAnim && now > state.nextIdleAt) {
        const pick = IDLE_KINDS[(Math.random() * IDLE_KINDS.length) | 0];
        state.idleAnim = { kind: pick.kind, start: now, duration: pick.duration };
      }
      if (now > state.nextBlinkAt) {
        state.blinkUntil = now + 150;
        state.nextBlinkAt = now + 2500 + Math.random() * 4000;
      }
      if (now > state.nextIdleLineAt) {
        captionEl.textContent = pickIdleLine(Math.random);
        state.nextIdleLineAt = now + 9000 + Math.random() * 6000;
      }
    }
  }

  function draw(now) {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = SKY; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = DIRT; ctx.fillRect(0, h - 22, w, 22);

    drawBackground(ctx, w, h, now);

    // ground line
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h - 22); ctx.lineTo(w, h - 22); ctx.stroke();

    drawGrass(ctx, w, h);
    drawJar(now);
    if (state.phase === 'treat') drawTreatArc(now);

    const trickId = state.phase === 'trick' ? state.trick.id : null;
    if (trickId === 'nap') drawSleepSprite(ctx, DOG_X, h, now);
    else drawDog(DOG_X, h, now, trickId);

    drawButterfly(ctx, w, h, now);
  }

  function drawJar(now) {
    const h = canvas.height;
    const wob = state.wiggle > 0 ? Math.sin(now / 25) * 2 : 0;
    const x = JAR_X + wob;
    ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.strokeRect(x, h - 54, 28, 32);
    ctx.fillStyle = INK; ctx.fillRect(x - 2, h - 60, 32, 6);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x + 5, h - 32, 6, 4);
    ctx.fillRect(x + 13, h - 36, 6, 4);
    ctx.fillRect(x + 18, h - 30, 6, 4);
    ctx.fillStyle = INK;
    ctx.font = '8px "Courier New", monospace';
    ctx.fillText('TREATS', x + 1, h - 41);
  }

  function drawTreatArc(now) {
    const h = canvas.height;
    const p = Math.min(1, (now - state.phaseStart) / TREAT_MS);
    const x = JAR_X + 28 + (DOG_X - JAR_X - 42) * p;
    const y = (h - 56) - Math.sin(p * Math.PI) * 30;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x, y, 5, 4);
  }

  function drawDog(x, h, now, trickId) {
    // The sprite is authored facing right; the jar sits to the LEFT of the
    // dog, so mirror the whole dog around its own center to face the jar.
    ctx.save();
    ctx.translate((x + 13) * 2, 0);
    ctx.scale(-1, 1);
    drawDogRightFacing(x, h, now, trickId);
    ctx.restore();
  }

  function drawDogRightFacing(x, h, now, trickId) {
    ctx.fillStyle = INK;
    const idle = state.phase === 'idle' ? state.idleAnim : null;
    const tp = trickId ? (now - state.phaseStart) / state.trick.duration : 0;

    let dx = 0;             // whole-dog x offset (zoomies, shake)
    let bodyY = h - 38;
    let headY = h - 46;
    let headDX = 0;
    let bodyW = 26;
    let flipped = false;    // rollover mid-phase: legs up
    let sitting = false;
    let sniffing = false;

    if (!trickId) bodyY += Math.round(Math.sin(now / 600)); // breathing

    if (trickId === 'spin') {
      bodyW = Math.max(8, 26 * Math.abs(Math.cos((now - state.phaseStart) / 150)));
    } else if (trickId === 'bow' || trickId === 'playbow') {
      headY += 10; bodyY += trickId === 'playbow' ? 4 : 2;
    } else if (trickId === 'zoomies') {
      dx = Math.sin(tp * Math.PI * 2) * 52;
      // speed lines behind the dog
      ctx.fillStyle = SOFT;
      const dir = Math.cos(tp * Math.PI * 2) >= 0 ? -1 : 1;
      for (let i = 0; i < 3; i++) ctx.fillRect(x + dx + dir * (34 + i * 8), bodyY + 3 + i * 4, 6, 1);
      ctx.fillStyle = INK;
    } else if (trickId === 'shake') {
      dx = Math.sin(now / 18) * 3;
      // shake dust
      ctx.fillStyle = SOFT;
      ctx.fillRect(x - 10, bodyY - 8, 2, 2);
      ctx.fillRect(x + 34, bodyY - 12, 2, 2);
      ctx.fillRect(x + 12, bodyY - 16, 2, 2);
      ctx.fillStyle = INK;
    } else if (trickId === 'rollover') {
      flipped = tp > 0.3 && tp < 0.7;
      if (flipped) bodyY += 6;
    }

    if (idle) {
      if (idle.kind === 'sniff') { sniffing = true; headY += 12; headDX = 4; }
      if (idle.kind === 'sit') { sitting = true; }
      if (idle.kind === 'tilt') { headY -= 2; headDX = 2; }
    }

    const bx = x + dx;

    // body
    if (sitting) {
      ctx.fillRect(bx, bodyY - 4, bodyW, 8);          // chest up
      ctx.fillRect(bx - 2, bodyY + 2, 14, 12);        // haunches
    } else {
      ctx.fillRect(bx, bodyY, bodyW, 14);
    }
    // head
    ctx.fillRect(bx + bodyW - 6 + headDX, headY, 14, 12);
    // snout
    ctx.fillRect(bx + bodyW + 6 + headDX, headY + (sniffing ? 8 : 4), 4, 4);
    // floppy ear (twitches)
    const earLift = idle && idle.kind === 'earTwitch' && ((now / 90) | 0) % 2 ? 2 : 0;
    ctx.fillRect(bx + bodyW - 6 + headDX, headY - 4 - earLift, 5, 6);

    // tail
    const tailFast = state.hover || trickId || (idle && idle.kind === 'tailBurst');
    const wag = Math.sin(now / (tailFast ? 55 : 220)) * 4;
    if (flipped) {
      ctx.fillRect(bx - 4, bodyY + 8 + wag, 6, 3);
    } else {
      ctx.fillRect(bx - 4, bodyY + (sitting ? 8 : -2) + wag, 6, 3);
      ctx.fillRect(bx - 6, bodyY + (sitting ? 6 : -4) + wag * 1.3, 3, 3);
    }

    // legs
    if (flipped) {
      // rollover: legs in the air
      ctx.fillRect(bx + 4, bodyY - 6, 3, 6);
      ctx.fillRect(bx + 11, bodyY - 7, 3, 7);
      ctx.fillRect(bx + 18, bodyY - 6, 3, 6);
    } else if (sitting) {
      ctx.fillRect(bx + 2, bodyY + 14, 4, 2);
      ctx.fillRect(bx + bodyW - 6, bodyY + 4, 4, 10);
    } else if (trickId === 'highfive') {
      ctx.fillRect(bx + 2, bodyY + 14, 4, 4);
      ctx.fillRect(bx + 12, bodyY + 14, 4, 4);
      ctx.fillRect(bx + bodyW + 2, headY + 10, 8, 3);   // raised paw
    } else if (trickId === 'catch') {
      const hop = Math.sin(Math.min(1, tp) * Math.PI) * 8;
      ctx.fillRect(bx + 2, bodyY + 14 - hop * 0.2, 4, 4);
      ctx.fillRect(bx + 12, bodyY + 14 - hop * 0.2, 4, 4);
      ctx.fillRect(bx + 20, bodyY + 14 - hop * 0.2, 4, 4);
    } else if (trickId === 'zoomies') {
      // galloping legs
      const g = ((now / 70) | 0) % 2;
      ctx.fillRect(bx + (g ? 0 : 4), bodyY + 14, 4, 4);
      ctx.fillRect(bx + (g ? 20 : 16), bodyY + 14, 4, 4);
    } else {
      ctx.fillRect(bx + 2, bodyY + 14, 4, 4);
      ctx.fillRect(bx + 12, bodyY + 14, 4, 4);
      ctx.fillRect(bx + 20, bodyY + 14, 4, 4);
    }

    // sniff dust
    if (sniffing) {
      ctx.fillStyle = SOFT;
      ctx.fillRect(bx + bodyW + 12, h - 26, 2, 2);
      ctx.fillRect(bx + bodyW + 16, h - 30, 2, 2);
      ctx.fillStyle = INK;
    }

    // eye (blinks; wide double-eye on stare)
    const blinking = now < state.blinkUntil && !trickId;
    if (!blinking && !flipped) {
      ctx.fillStyle = PAPER;
      if (trickId === 'stare') {
        ctx.fillRect(bx + bodyW + 2 + headDX, headY + 2, 2, 2);
        ctx.fillRect(bx + bodyW + 5 + headDX, headY + 2, 2, 2);
      } else {
        ctx.fillRect(bx + bodyW + 2 + headDX, headY + 2, 2, 2);
      }
      ctx.fillStyle = INK;
    }
  }

  function updateHudNoop() {}

  let raf;
  function loop(now) {
    update(now);
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  const obs = new MutationObserver(() => {
    if (!document.body.contains(canvas)) { cancelAnimationFrame(raf); obs.disconnect(); }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

/* ---------- shared scene pieces ---------- */

function drawBackground(ctx, w, h, now) {
  // sun, top right
  ctx.fillStyle = 'rgba(139, 58, 26, 0.35)';
  ctx.fillRect(w - 34, 10, 12, 12);
  ctx.fillRect(w - 38, 14, 4, 4);
  ctx.fillRect(w - 22, 14, 4, 4);
  ctx.fillRect(w - 30, 6, 4, 4);
  ctx.fillRect(w - 30, 22, 4, 4);

  // drifting clouds
  ctx.fillStyle = FAINT;
  const c1 = ((now * 0.006) % (w + 90)) - 45;
  const c2 = ((now * 0.004 + 180) % (w + 90)) - 45;
  cloud(ctx, c1, 16);
  cloud(ctx, c2, 32);

  // back fence
  ctx.fillStyle = FAINT;
  for (let fx = 8; fx < w; fx += 34) ctx.fillRect(fx, h - 60, 3, 16);
  ctx.fillRect(0, h - 56, w, 2);

  // small tree, far right
  ctx.fillStyle = SOFT;
  ctx.fillRect(w - 18, h - 46, 3, 24);
  ctx.fillStyle = FAINT;
  ctx.fillRect(w - 28, h - 62, 22, 18);
  ctx.fillRect(w - 24, h - 68, 14, 8);
}

function cloud(ctx, x, y) {
  ctx.fillRect(x, y, 26, 6);
  ctx.fillRect(x + 5, y - 4, 14, 5);
}

function drawGrass(ctx, w, h) {
  ctx.fillStyle = SOFT;
  for (const gx of [14, 62, 96, 148, 210, 252, 292]) {
    ctx.fillRect(gx, h - 26, 1, 4);
    ctx.fillRect(gx + 2, h - 25, 1, 3);
  }
}

function drawButterfly(ctx, w, h, now) {
  const bx = w * 0.42 + Math.sin(now / 900) * 60;
  const by = h - 66 + Math.sin(now / 430) * 9;
  const open = ((now / 130) | 0) % 2;
  ctx.fillStyle = 'rgba(139, 58, 26, 0.55)';
  if (open) {
    ctx.fillRect(bx - 3, by, 3, 3);
    ctx.fillRect(bx + 1, by, 3, 3);
  } else {
    ctx.fillRect(bx - 1, by - 1, 3, 4);
  }
}

/* ---------- sleeping dog (nap trick + reduced-motion frame) ---------- */

function drawSleepSprite(ctx, x, h, now) {
  // body mirrored so the sleeping head faces the jar; z's drawn unmirrored
  ctx.save();
  ctx.translate((x + 13) * 2, 0);
  ctx.scale(-1, 1);
  ctx.fillStyle = INK;
  ctx.fillRect(x - 4, h - 32, 34, 10);
  ctx.fillRect(x + 22, h - 38, 12, 8);
  ctx.fillRect(x + 22, h - 41, 4, 4);
  ctx.fillRect(x - 8, h - 30, 6, 4);
  ctx.restore();
  ctx.fillStyle = INK;
  ctx.font = '10px "Courier New", monospace';
  const drift = now ? (now / 40) % 14 : 0;
  ctx.fillText('z', x - 18, h - 44 - drift * 0.5);
  ctx.fillText('z', x - 12, h - 52 - drift * 0.3);
}

export function drawSleepFrame(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = SKY; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = DIRT; ctx.fillRect(0, h - 22, w, 22);
  drawBackground(ctx, w, h, 0);
  ctx.strokeStyle = INK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h - 22); ctx.lineTo(w, h - 22); ctx.stroke();
  drawGrass(ctx, w, h);
  drawSleepSprite(ctx, DOG_X, h, 0);
}
