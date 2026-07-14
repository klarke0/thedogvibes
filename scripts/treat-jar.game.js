// scripts/treat-jar.game.js — canvas render + state machine.
// States: idle -> treat (arc) -> trick -> idle. Nap locks the jar for its duration.
import { pickTrick, pickCaption } from './treat-jar.tricks.js';

const INK = '#2b2520';
const ACCENT = '#8b3a1a';
const PAPER = '#fff';
const TREAT_MS = 400;

const DOG_X = 220; // dog stands right of center; jar sits left
const JAR_X = 60;

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
    wiggle: 0,                // jar wiggle timer (ms remaining)
    hover: false,
    count: readCount(),
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
    state.count++;
    saveCount();
    counterEl.textContent = `treats given: ${state.count}`;
    captionEl.innerHTML = '&nbsp;';
  }

  jarBtn.addEventListener('click', giveTreat);
  jarBtn.addEventListener('mouseenter', () => { state.hover = true; });
  jarBtn.addEventListener('mouseleave', () => { state.hover = false; });

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
    }
  }

  function draw(now) {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
    // ground
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h - 24); ctx.lineTo(w, h - 24); ctx.stroke();

    drawJar(now);
    if (state.phase === 'treat') drawTreatArc(now);

    const trickId = state.phase === 'trick' ? state.trick.id : null;
    if (trickId === 'nap') drawDogAsleep(DOG_X, h, now);
    else drawDog(DOG_X, h, now, trickId);
  }

  function drawJar(now) {
    const h = canvas.height;
    const wob = state.wiggle > 0 ? Math.sin(now / 25) * 2 : 0;
    const x = JAR_X + wob;
    // jar body
    ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.strokeRect(x, h - 58, 30, 34);
    // lid
    ctx.fillStyle = INK; ctx.fillRect(x - 2, h - 64, 34, 6);
    // treats inside
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x + 5, h - 34, 6, 4);
    ctx.fillRect(x + 14, h - 38, 6, 4);
    ctx.fillRect(x + 20, h - 32, 6, 4);
    // label
    ctx.fillStyle = INK;
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText('TREATS', x + 1, h - 44);
  }

  function drawTreatArc(now) {
    const h = canvas.height;
    const p = Math.min(1, (now - state.phaseStart) / TREAT_MS);
    const x = JAR_X + 30 + (DOG_X - JAR_X - 20) * p;
    const y = (h - 60) - Math.sin(p * Math.PI) * 34;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x, y, 5, 4);
  }

  function drawDog(x, h, now, trickId) {
    ctx.fillStyle = INK;
    const breathe = trickId ? 0 : Math.round(Math.sin(now / 600));
    let bodyY = h - 40 + breathe;
    let headY = h - 48 + breathe;
    let rot = 0; // used only for spin scaling trick

    if (trickId === 'spin') {
      // fake rotation: squash body width over time
      rot = Math.abs(Math.cos((now - state.phaseStart) / 150));
    }
    if (trickId === 'bow' || trickId === 'playbow') {
      headY += 10; bodyY += trickId === 'playbow' ? 4 : 2;
    }

    const bodyW = trickId === 'spin' ? Math.max(8, 28 * rot) : 28;
    // body
    ctx.fillRect(x, bodyY, bodyW, 14);
    // head
    ctx.fillRect(x + bodyW - 6, headY, 14, 12);
    // snout
    ctx.fillRect(x + bodyW + 6, headY + 4, 4, 4);
    // floppy ear
    ctx.fillRect(x + bodyW - 6, headY - 4, 5, 6);
    // tail — wags when hovering the jar, during tricks, always a bit
    const wagSpeed = (state.hover || trickId) ? 70 : 220;
    const wag = Math.sin(now / wagSpeed) * 4;
    ctx.fillRect(x - 4, bodyY - 2 + wag, 6, 3);
    ctx.fillRect(x - 6, bodyY - 4 + wag * 1.3, 3, 3);
    // legs
    if (trickId === 'highfive') {
      ctx.fillRect(x + 2, bodyY + 14, 4, 4);
      ctx.fillRect(x + 12, bodyY + 14, 4, 4);
      // raised front paw
      ctx.fillRect(x + bodyW + 2, headY + 10, 8, 3);
    } else if (trickId === 'catch') {
      // all four off the ground a touch (little hop)
      const hop = Math.sin(Math.min(1, (now - state.phaseStart) / 350) * Math.PI) * 8;
      ctx.fillRect(x + 2, bodyY + 14 - hop * 0.2, 4, 4);
      ctx.fillRect(x + 12, bodyY + 14 - hop * 0.2, 4, 4);
      ctx.fillRect(x + 22, bodyY + 14 - hop * 0.2, 4, 4);
    } else {
      ctx.fillRect(x + 2, bodyY + 14, 4, 4);
      ctx.fillRect(x + 12, bodyY + 14, 4, 4);
      ctx.fillRect(x + 22, bodyY + 14, 4, 4);
    }
    // eye
    ctx.fillStyle = PAPER;
    if (trickId === 'stare') {
      // wide stare: 2 eye pixels
      ctx.fillRect(x + bodyW + 2, headY + 2, 2, 2);
      ctx.fillRect(x + bodyW + 5, headY + 2, 2, 2);
    } else {
      ctx.fillRect(x + bodyW + 2, headY + 2, 2, 2);
    }
    ctx.fillStyle = INK;
  }

  function drawDogAsleep(x, h, now) {
    drawSleepSprite(ctx, x, h, now);
  }

  let raf;
  function loop(now) {
    update(now);
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  // stop the loop if the widget leaves the document (SPA-safe, cheap)
  const obs = new MutationObserver(() => {
    if (!document.body.contains(canvas)) { cancelAnimationFrame(raf); obs.disconnect(); }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

// Shared sleeping-dog sprite (also used by reduced-motion fallback).
function drawSleepSprite(ctx, x, h, now) {
  ctx.fillStyle = INK;
  // curled body (wider, lower)
  ctx.fillRect(x - 4, h - 34, 34, 10);
  // head tucked
  ctx.fillRect(x + 22, h - 40, 12, 8);
  // ear
  ctx.fillRect(x + 22, h - 43, 4, 4);
  // tail curled over
  ctx.fillRect(x - 8, h - 32, 6, 4);
  // zzz
  ctx.font = '10px "Courier New", monospace';
  const drift = now ? (now / 40) % 14 : 0;
  ctx.fillText('z', x + 34, h - 46 - drift * 0.5);
  ctx.fillText('z', x + 40, h - 54 - drift * 0.3);
}

export function drawSleepFrame(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = INK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h - 24); ctx.lineTo(w, h - 24); ctx.stroke();
  drawSleepSprite(ctx, DOG_X, h, 0);
}
