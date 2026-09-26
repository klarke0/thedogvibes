// scripts/treat-jar.game.js — canvas render + state machine.
// States: idle -> treat (arc) -> trick -> idle. Nap locks the jar for its duration.
// Idle micro-behaviors (ear twitch, sniff, sit, tail burst, blink) fire on their own clock.
import { pickTrick, pickCaption, pickIdleLine, pickHighCountCaption, pickPetCaption, pickBallCaption, TRICKS } from './treat-jar.tricks.js';

const INK    = '#2b2520';
const ACCENT = '#8b3a1a';
const PAPER  = '#fff';
const SKY    = '#f1e9d7';
const DIRT   = '#e8ddc6';
const FAINT  = 'rgba(43, 37, 32, 0.16)';
const SOFT   = 'rgba(43, 37, 32, 0.34)';
const TREAT_MS = 400;

const JAR_X = 34;
const DOG_X = 176;

// Pet and ball trick objects (weight 0 — triggered by buttons only)
const PET_TRICK  = TRICKS.find(t => t.id === 'pet');
const BALL_TRICK = TRICKS.find(t => t.id === 'ball');

const IDLE_KINDS = [
  { kind: 'earTwitch',  duration: 500  },
  { kind: 'sniff',      duration: 1300 },
  { kind: 'sit',        duration: 2200 },
  { kind: 'tailBurst',  duration: 1000 },
  { kind: 'tilt',       duration: 900  },
  { kind: 'pottyBreak', duration: 2000 },
];

const POTTY_CAPTIONS = [
  'nature calls.',
  'doing important business.',
  'this is a private moment.',
  'he calls this multitasking.',
];

const SQUIRREL_SPEED        = 60;   // px/s
const SQUIRREL_INTERVAL_MIN = 45000;
const SQUIRREL_INTERVAL_MAX = 90000;

function randBetween(min, max) { return min + Math.random() * (max - min); }
function easeOut(t) { return 1 - (1 - t) * (1 - t); }

export function start(root, { storageKey }) {
  const canvas    = root.querySelector('#tj-canvas');
  const ctx       = canvas.getContext('2d');
  const jarBtn    = root.querySelector('#tj-jar');
  const petBtn    = root.querySelector('#tj-pet');
  const ballBtn   = root.querySelector('#tj-ball');
  const captionEl = root.querySelector('#tj-caption');
  const counterEl = root.querySelector('#tj-counter');
  const bookCtaEl = root.querySelector('#tj-book-cta');
  // Show CTA immediately if returning visitor already hit the threshold
  if (bookCtaEl && readCount() >= 20) bookCtaEl.style.display = '';

  // ── state ────────────────────────────────────────────────────────────────
  const state = {
    phase:     'idle',   // idle | treat | trick
    phaseStart: performance.now(),
    trick:      null,
    wiggle:     0,
    hover:      false,
    count:      readCount(),
    idleAnim:   null,    // {kind, start, duration}
    nextIdleAt: performance.now() + 2500,
    blinkUntil: 0,
    nextBlinkAt:    performance.now() + 3000,
    nextIdleLineAt: performance.now() + 7000,
    // ball arc
    ball:     null,      // {startX, landX, startY, landY, start, duration} | null
    dogChase: null,      // {startX, targetX, start, duration} | null
    // squirrel
    squirrel:        null,   // {x, dir, start} | null
    nextSquirrelAt:  performance.now() + randBetween(SQUIRREL_INTERVAL_MIN, SQUIRREL_INTERVAL_MAX),
    // dog chasing squirrel — separate from ball chase
    dogSquirrelX:    DOG_X,  // current rendered x while chasing/returning
    dogSquirrelTarget: DOG_X,
    _lastNow:        performance.now(),
  };

  // ── storage ───────────────────────────────────────────────────────────────
  function readCount() {
    try { return parseInt(localStorage.getItem(storageKey), 10) || 0; }
    catch { return 0; }
  }
  function saveCount() {
    try { localStorage.setItem(storageKey, String(state.count)); } catch { /* session-only */ }
    if (bookCtaEl) bookCtaEl.style.display = state.count >= 20 ? '' : 'none';
  }

  // ── caption helper ────────────────────────────────────────────────────────
  function setCaption(text) { captionEl.textContent = text; }

  function maybeSelfAwareCaption(fallbackFn) {
    const hc = pickHighCountCaption(state.count);
    if (hc && Math.random() < 0.35) { setCaption(hc); } else { setCaption(fallbackFn()); }
  }

  // ── actions ───────────────────────────────────────────────────────────────
  function giveTreat() {
    if (state.phase !== 'idle') { state.wiggle = 350; return; }
    state.phase = 'treat';
    state.phaseStart = performance.now();
    state.trick = pickTrick(Math.random);
    state.idleAnim = null;
    state.ball = null;
    state.dogChase = null;
    state.count++;
    saveCount();
    counterEl.textContent = `treats given: ${state.count}`;
    captionEl.innerHTML = '&nbsp;';
  }

  function givePet() {
    if (state.phase !== 'idle') return;
    state.phase = 'trick';
    state.phaseStart = performance.now();
    state.trick = PET_TRICK;
    state.idleAnim = null;
    state.ball = null;
    state.dogChase = null;
    captionEl.innerHTML = '&nbsp;';
    setTimeout(() => {
      if (state.trick && state.trick.id === 'pet') setCaption(pickPetCaption(Math.random));
    }, 300);
  }

  function throwBall() {
    if (state.phase !== 'idle') return;
    const h = canvas.height;
    state.phase = 'trick';
    state.phaseStart = performance.now();
    state.trick = BALL_TRICK;
    state.idleAnim = null;
    captionEl.innerHTML = '&nbsp;';

    const landX = 160 + Math.random() * 80;
    state.ball = {
      startX:   JAR_X + 28,
      landX,
      startY:   h - 56,
      landY:    h - 24,
      start:    performance.now(),
      duration: 800,
    };

    const chaseDelay  = 400;
    state.dogChase = {
      startX:   DOG_X,
      targetX:  landX - 30,
      start:    performance.now() + chaseDelay,
      duration: BALL_TRICK.duration - chaseDelay,
    };

    setTimeout(() => {
      if (state.trick && state.trick.id === 'ball') setCaption(pickBallCaption(Math.random));
    }, 300);
  }

  // ── event listeners ───────────────────────────────────────────────────────
  jarBtn.addEventListener('click', giveTreat);
  canvas.addEventListener('click', giveTreat);
  canvas.style.cursor = 'pointer';
  if (petBtn)  petBtn.addEventListener('click', givePet);
  if (ballBtn) ballBtn.addEventListener('click', throwBall);

  [jarBtn, canvas].forEach(el => {
    el.addEventListener('mouseenter', () => { state.hover = true; });
    el.addEventListener('mouseleave', () => { state.hover = false; });
  });

  // ── update ────────────────────────────────────────────────────────────────
  function update(now) {
    const dt = now - state._lastNow;
    state._lastNow = now;
    const t = now - state.phaseStart;
    if (state.wiggle > 0) state.wiggle -= 16;

    // phase transitions
    if (state.phase === 'treat' && t >= TREAT_MS) {
      state.phase = 'trick';
      state.phaseStart = now;
      maybeSelfAwareCaption(() => pickCaption(state.trick, Math.random));
    } else if (state.phase === 'trick' && t >= state.trick.duration) {
      state.phase = 'idle';
      state.phaseStart = now;
      state.trick = null;
      state.ball = null;
      state.dogChase = null;
      state.nextIdleAt = now + 2000 + Math.random() * 2000;
      state.nextIdleLineAt = now + 6000;
    }

    // idle micro-behaviors
    if (state.phase === 'idle') {
      if (state.idleAnim && now - state.idleAnim.start > state.idleAnim.duration) {
        if (state.idleAnim.kind === 'pottyBreak') captionEl.innerHTML = '&nbsp;';
        // squirrelAlert clears when squirrel leaves, not by timer
        if (state.idleAnim.kind !== 'squirrelAlert') {
          state.idleAnim = null;
          state.nextIdleAt = now + 2500 + Math.random() * 3500;
        }
      }
      if (!state.idleAnim && now > state.nextIdleAt) {
        const candidates = state.squirrel
          ? IDLE_KINDS.filter(k => k.kind !== 'pottyBreak')
          : IDLE_KINDS;
        const pick = candidates[(Math.random() * candidates.length) | 0];
        state.idleAnim = { kind: pick.kind, start: now, duration: pick.duration };
        if (pick.kind === 'pottyBreak') {
          setCaption(POTTY_CAPTIONS[(Math.random() * POTTY_CAPTIONS.length) | 0]);
        }
      }
      if (now > state.nextBlinkAt) {
        state.blinkUntil = now + 150;
        state.nextBlinkAt = now + 2500 + Math.random() * 4000;
      }
      if (now > state.nextIdleLineAt) {
        const hc = pickHighCountCaption(state.count);
        if (hc && Math.random() < 0.4) { setCaption(hc); }
        else { setCaption(pickIdleLine(Math.random)); }
        state.nextIdleLineAt = now + 9000 + Math.random() * 6000;
      }
    }

    // squirrel lifecycle
    if (!state.squirrel && now > state.nextSquirrelAt) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const w = canvas.width;
      state.squirrel = { x: dir === 1 ? -12 : w + 12, dir, start: now };
      if (state.phase === 'idle') {
        state.idleAnim = { kind: 'squirrelAlert', start: now, duration: 999999 };
      }
    }
    if (state.squirrel) {
      state.squirrel.x += state.squirrel.dir * SQUIRREL_SPEED * dt / 1000;

      // Dog chases squirrel — gallop toward its x position while it's on screen
      if (state.phase === 'idle') {
        // Target = squirrel x minus a gap so dog doesn't overlap
        const chaseTarget = Math.max(30, Math.min(canvas.width - 40, state.squirrel.x - 20));
        state.dogSquirrelTarget = chaseTarget;
        // Move dog at ~100px/s toward target
        const diff = chaseTarget - state.dogSquirrelX;
        const step = Math.sign(diff) * Math.min(Math.abs(diff), 100 * dt / 1000);
        state.dogSquirrelX += step;
      }

      const w = canvas.width;
      const gone = state.squirrel.dir === 1 ? state.squirrel.x > w + 12 : state.squirrel.x < -12;
      if (gone) {
        state.squirrel = null;
        state.dogSquirrelTarget = DOG_X; // trot back
        if (state.idleAnim && state.idleAnim.kind === 'squirrelAlert') {
          state.idleAnim = null;
          state.nextIdleAt = now + 1500 + Math.random() * 2000;
        }
        state.nextSquirrelAt = now + randBetween(SQUIRREL_INTERVAL_MIN, SQUIRREL_INTERVAL_MAX);
      }
    } else {
      // Squirrel gone — return dog to home position at trot speed (~60px/s)
      if (state.dogSquirrelX !== DOG_X) {
        const diff = DOG_X - state.dogSquirrelX;
        const step = Math.sign(diff) * Math.min(Math.abs(diff), 60 * dt / 1000);
        state.dogSquirrelX += step;
        if (Math.abs(state.dogSquirrelX - DOG_X) < 1) state.dogSquirrelX = DOG_X;
      }
    }
  }

  // ── draw ──────────────────────────────────────────────────────────────────
  function draw(now) {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = SKY;  ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = DIRT; ctx.fillRect(0, h - 22, w, 22);

    drawBackground(now);

    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h - 22); ctx.lineTo(w, h - 22); ctx.stroke();

    drawGrass(w, h);
    drawJar(now);
    if (state.phase === 'treat') drawTreatArc(now);
    if (state.ball) drawBall(now);
    if (state.squirrel) drawSquirrel(now);

    const trickId = state.phase === 'trick' ? state.trick.id : null;

    // Dog X: chase ball toward landing spot, or chase squirrel in idle
    let dogX = DOG_X;
    if (trickId === 'ball' && state.dogChase) {
      const elapsed = now - state.dogChase.start;
      if (elapsed > 0) {
        const p = Math.min(1, elapsed / state.dogChase.duration);
        dogX = state.dogChase.startX + (state.dogChase.targetX - state.dogChase.startX) * easeOut(p);
      }
    } else if (state.phase === 'idle') {
      dogX = state.dogSquirrelX;
    }

    // When chasing squirrel, face toward it.
    // squirrel.dir 1 = moving right (squirrel is ahead to the right → dog faces right)
    // squirrel.dir -1 = moving left (squirrel is ahead to the left → dog faces left = default)
    const chasingSquirrel = state.phase === 'idle' && state.squirrel !== null;
    const dogFacingRight = chasingSquirrel && state.squirrel.dir === 1;

    if (trickId === 'nap') {
      drawSleepSprite(dogX, h, now);
    } else {
      drawDog(dogX, h, now, trickId, dogFacingRight);
    }

    drawButterfly(w, h, now);
  }

  // ── jar ───────────────────────────────────────────────────────────────────
  function drawJar(now) {
    const h = canvas.height;
    const wob = state.wiggle > 0 ? Math.sin(now / 25) * 2 : 0;
    const x = JAR_X + wob;
    ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.strokeRect(x, h - 54, 28, 32);
    ctx.fillStyle = INK; ctx.fillRect(x - 2, h - 60, 32, 6);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x + 5,  h - 32, 6, 4);
    ctx.fillRect(x + 13, h - 36, 6, 4);
    ctx.fillRect(x + 18, h - 30, 6, 4);
    ctx.fillStyle = INK;
    ctx.font = '8px "Courier New", monospace';
    ctx.fillText('TREATS', x + 1, h - 41);
  }

  // ── treat arc ─────────────────────────────────────────────────────────────
  function drawTreatArc(now) {
    const h = canvas.height;
    const p = Math.min(1, (now - state.phaseStart) / TREAT_MS);
    const x = JAR_X + 28 + (DOG_X - JAR_X - 42) * p;
    const y = (h - 56) - Math.sin(p * Math.PI) * 30;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x, y, 5, 4);
  }

  // ── ball arc ──────────────────────────────────────────────────────────────
  function drawBall(now) {
    const b = state.ball;
    const elapsed = now - b.start;
    const p = Math.min(1, elapsed / b.duration);

    let bx, by;
    if (p < 1) {
      bx = b.startX + (b.landX - b.startX) * p;
      by = b.startY + (b.landY - b.startY) * p - Math.sin(p * Math.PI) * 40;
    } else {
      // Small bounce after landing
      const bp = Math.min(1, (elapsed - b.duration) / 200);
      bx = b.landX;
      by = b.landY - Math.sin(bp * Math.PI) * 6;
    }

    // 7-px round ball
    ctx.fillStyle = ACCENT;
    ctx.fillRect(bx + 2, by,     3, 1);
    ctx.fillRect(bx + 1, by + 1, 5, 1);
    ctx.fillRect(bx,     by + 2, 7, 3);
    ctx.fillRect(bx + 1, by + 5, 5, 1);
    ctx.fillRect(bx + 2, by + 6, 3, 1);
    ctx.fillStyle = PAPER;
    ctx.fillRect(bx + 1, by + 1, 2, 1);
  }

  // ── squirrel ──────────────────────────────────────────────────────────────
  // Pixel squirrel: round head, compact body, BIG bushy tail that curls UP and over.
  // dir 1 = moving right (head right, tail left-and-up)
  // dir -1 = moving left (head left, tail right-and-up)
  // Origin x = leftmost pixel of the whole sprite (~14px wide including tail).
  function drawSquirrel(now) {
    const sq = state.squirrel;
    const h = canvas.height;
    const groundY = h - 22;
    const legPhase = ((now / 90) | 0) % 2;

    // Anchor at sprite center-bottom; body is the reference.
    // For dir=1 (→): body at [x,x+6], head protrudes right, tail arcs left+up over body.
    // For dir=-1 (←): mirror: body at [x,x+6], head protrudes left, tail arcs right+up over body.
    const ox = Math.round(sq.x); // left edge of sprite bounding box

    ctx.fillStyle = INK;

    if (sq.dir === 1) {
      // Moving right: head on the right side
      // --- compact body ---
      ctx.fillRect(ox + 4, groundY - 8, 6, 5);   // body
      // --- round head (slightly larger than body width) ---
      ctx.fillRect(ox + 8, groundY - 12, 6, 6);  // head block
      ctx.fillRect(ox + 9, groundY - 13, 4, 1);  // top round
      // --- pointed ear ---
      ctx.fillRect(ox + 10, groundY - 15, 2, 3); // ear
      // --- eye ---
      ctx.fillStyle = PAPER;
      ctx.fillRect(ox + 11, groundY - 11, 1, 1);
      ctx.fillStyle = INK;
      // --- bushy tail: rises from behind body (left), curves UP and arcs OVER ---
      // Base of tail at body left
      ctx.fillRect(ox + 2, groundY - 7, 3, 4);   // base stub
      // Rises up
      ctx.fillRect(ox + 1, groundY - 11, 4, 3);  // lower rise
      ctx.fillRect(ox,     groundY - 14, 5, 3);  // mid rise
      // Curves over and to the right (top arc)
      ctx.fillRect(ox + 1, groundY - 16, 6, 3);  // top arc left
      ctx.fillRect(ox + 5, groundY - 17, 5, 2);  // top arc center
      ctx.fillRect(ox + 8, groundY - 16, 4, 2);  // top arc right (tips over body)
      // --- running legs ---
      if (legPhase === 0) {
        ctx.fillRect(ox + 4, groundY - 3, 2, 3);
        ctx.fillRect(ox + 8, groundY - 3, 2, 3);
      } else {
        ctx.fillRect(ox + 5, groundY - 3, 2, 3);
        ctx.fillRect(ox + 9, groundY - 2, 2, 2);
      }
    } else {
      // Moving left: mirror — head on left, tail arcs up from right side
      // --- compact body ---
      ctx.fillRect(ox + 4, groundY - 8, 6, 5);
      // --- round head (left side) ---
      ctx.fillRect(ox,     groundY - 12, 6, 6);
      ctx.fillRect(ox + 1, groundY - 13, 4, 1);
      // --- pointed ear ---
      ctx.fillRect(ox + 2, groundY - 15, 2, 3);
      // --- eye ---
      ctx.fillStyle = PAPER;
      ctx.fillRect(ox + 2, groundY - 11, 1, 1);
      ctx.fillStyle = INK;
      // --- bushy tail: rises from right side of body, curves UP and over ---
      ctx.fillRect(ox + 9,  groundY - 7, 3, 4);   // base stub
      ctx.fillRect(ox + 9,  groundY - 11, 4, 3);  // lower rise
      ctx.fillRect(ox + 9,  groundY - 14, 5, 3);  // mid rise
      ctx.fillRect(ox + 7,  groundY - 16, 6, 3);  // top arc right
      ctx.fillRect(ox + 4,  groundY - 17, 5, 2);  // top arc center
      ctx.fillRect(ox + 2,  groundY - 16, 4, 2);  // top arc left (tips over body)
      // --- running legs ---
      if (legPhase === 0) {
        ctx.fillRect(ox + 4, groundY - 3, 2, 3);
        ctx.fillRect(ox + 8, groundY - 3, 2, 3);
      } else {
        ctx.fillRect(ox + 5, groundY - 3, 2, 3);
        ctx.fillRect(ox + 3, groundY - 2, 2, 2);
      }
    }
  }

  // ── dog ───────────────────────────────────────────────────────────────────
  // facingRight: true = render as-authored (facing right), false/undefined = mirror to face left (jar)
  function drawDog(x, h, now, trickId, facingRight) {
    const fr = facingRight || trickId === 'ball';
    if (fr) {
      drawDogFacing(x, h, now, trickId, false);
    } else {
      ctx.save();
      ctx.translate((x + 13) * 2, 0);
      ctx.scale(-1, 1);
      drawDogFacing(x, h, now, trickId, false);
      ctx.restore();
    }
  }

  function drawDogFacing(x, h, now, trickId, _unused) {
    ctx.fillStyle = INK;
    const idle = state.phase === 'idle' ? state.idleAnim : null;
    const tp = trickId ? (now - state.phaseStart) / state.trick.duration : 0;

    let dx = 0;
    let bodyY = h - 38;
    let headY = h - 46;
    let headDX = 0;
    let bodyW = 26;
    let flipped = false;
    let sitting = false;
    let sniffing = false;
    let squatting = false;  // pottyBreak

    if (!trickId) bodyY += Math.round(Math.sin(now / 600)); // breathing

    if (trickId === 'spin') {
      bodyW = Math.max(8, 26 * Math.abs(Math.cos((now - state.phaseStart) / 150)));
    } else if (trickId === 'bow' || trickId === 'playbow') {
      headY += 10; bodyY += trickId === 'playbow' ? 4 : 2;
    } else if (trickId === 'zoomies') {
      dx = Math.sin(tp * Math.PI * 2) * 52;
      ctx.fillStyle = SOFT;
      const dir = Math.cos(tp * Math.PI * 2) >= 0 ? -1 : 1;
      for (let i = 0; i < 3; i++) ctx.fillRect(x + dx + dir * (34 + i * 8), bodyY + 3 + i * 4, 6, 1);
      ctx.fillStyle = INK;
    } else if (trickId === 'shake') {
      dx = Math.sin(now / 18) * 3;
      ctx.fillStyle = SOFT;
      ctx.fillRect(x - 10, bodyY - 8, 2, 2);
      ctx.fillRect(x + 34, bodyY - 12, 2, 2);
      ctx.fillRect(x + 12, bodyY - 16, 2, 2);
      ctx.fillStyle = INK;
    } else if (trickId === 'rollover') {
      flipped = tp > 0.3 && tp < 0.7;
      if (flipped) bodyY += 6;
    } else if (trickId === 'pet') {
      // Lean slightly into hand — head tilted, body shifted
      headDX = 4;
      headY -= 2;
      bodyY += 1;
    } else if (trickId === 'ball') {
      // Chasing: galloping pose (same as zoomies but forward only)
      dx = 0; // position handled by dogChase at call site
    }

    if (idle) {
      if (idle.kind === 'sniff')       { sniffing = true; headY += 12; headDX = 4; }
      if (idle.kind === 'sit')         { sitting = true; }
      if (idle.kind === 'tilt')        { headY -= 2; headDX = 2; }
      if (idle.kind === 'pottyBreak')  { squatting = true; }
      if (idle.kind === 'squirrelAlert') {
        // ears up (earLift forced), head raised, facing squirrel direction
        headY -= 4;
      }
    }

    const bx = x + dx;

    // body
    if (sitting) {
      ctx.fillRect(bx, bodyY - 4, bodyW, 8);
      ctx.fillRect(bx - 2, bodyY + 2, 14, 12);
    } else if (squatting) {
      // Lower back end, bent rear legs
      ctx.fillRect(bx,     bodyY + 4, bodyW, 10);  // body lower
      ctx.fillRect(bx + bodyW - 6 + headDX, headY, 14, 12); // head
    } else {
      ctx.fillRect(bx, bodyY, bodyW, 14);
    }

    // head (skip if already drawn in squatting branch)
    if (!squatting) {
      ctx.fillRect(bx + bodyW - 6 + headDX, headY, 14, 12);
    }

    // snout
    ctx.fillRect(bx + bodyW + 6 + headDX, headY + (sniffing ? 8 : 4), 4, 4);

    // floppy ear
    const alertEar = (idle && idle.kind === 'squirrelAlert');
    const twitching = idle && idle.kind === 'earTwitch' && ((now / 90) | 0) % 2;
    const earLift = (alertEar ? 4 : 0) + (twitching ? 2 : 0);
    ctx.fillRect(bx + bodyW - 6 + headDX, headY - 4 - earLift, 5, 6);

    // tail
    const tailFast = state.hover || trickId === 'pet' || trickId || (idle && idle.kind === 'tailBurst');
    const wagSpeed = trickId === 'pet' ? 35 : tailFast ? 55 : 220;
    const wag = Math.sin(now / wagSpeed) * 4;
    if (flipped) {
      ctx.fillRect(bx - 4, bodyY + 8 + wag, 6, 3);
    } else {
      ctx.fillRect(bx - 4, bodyY + (sitting ? 8 : -2) + wag, 6, 3);
      ctx.fillRect(bx - 6, bodyY + (sitting ? 6 : -4) + wag * 1.3, 3, 3);
    }

    // legs
    if (flipped) {
      ctx.fillRect(bx + 4,  bodyY - 6, 3, 6);
      ctx.fillRect(bx + 11, bodyY - 7, 3, 7);
      ctx.fillRect(bx + 18, bodyY - 6, 3, 6);
    } else if (sitting) {
      ctx.fillRect(bx + 2, bodyY + 14, 4, 2);
      ctx.fillRect(bx + bodyW - 6, bodyY + 4, 4, 10);
    } else if (squatting) {
      // back legs bent/lowered
      ctx.fillRect(bx + 2,  bodyY + 14, 4, 4);
      ctx.fillRect(bx + 12, bodyY + 16, 4, 2);  // bent back
      ctx.fillRect(bx + 20, bodyY + 14, 4, 4);
    } else if (trickId === 'highfive') {
      ctx.fillRect(bx + 2,  bodyY + 14, 4, 4);
      ctx.fillRect(bx + 12, bodyY + 14, 4, 4);
      ctx.fillRect(bx + bodyW + 2, headY + 10, 8, 3);
    } else if (trickId === 'catch') {
      const hop = Math.sin(Math.min(1, tp) * Math.PI) * 8;
      ctx.fillRect(bx + 2,  bodyY + 14 - hop * 0.2, 4, 4);
      ctx.fillRect(bx + 12, bodyY + 14 - hop * 0.2, 4, 4);
      ctx.fillRect(bx + 20, bodyY + 14 - hop * 0.2, 4, 4);
    } else if (trickId === 'zoomies' || trickId === 'ball' || (idle && idle.kind === 'squirrelAlert')) {
      // galloping legs — also used when chasing squirrel
      const g = ((now / 70) | 0) % 2;
      ctx.fillRect(bx + (g ? 0 : 4),  bodyY + 14, 4, 4);
      ctx.fillRect(bx + (g ? 20 : 16), bodyY + 14, 4, 4);
    } else {
      ctx.fillRect(bx + 2,  bodyY + 14, 4, 4);
      ctx.fillRect(bx + 12, bodyY + 14, 4, 4);
      ctx.fillRect(bx + 20, bodyY + 14, 4, 4);
    }

    // potty dots
    if (squatting) {
      ctx.fillStyle = SOFT;
      ctx.fillRect(bx + 2, h - 23, 2, 2);
      ctx.fillRect(bx + 6, h - 23, 2, 2);
      // tiny steam puff
      ctx.fillRect(bx + 4, h - 26, 1, 2);
      ctx.fillRect(bx + 7, h - 27, 1, 2);
      ctx.fillStyle = INK;
    }

    // sniff dust
    if (sniffing) {
      ctx.fillStyle = SOFT;
      ctx.fillRect(bx + bodyW + 12, h - 26, 2, 2);
      ctx.fillRect(bx + bodyW + 16, h - 30, 2, 2);
      ctx.fillStyle = INK;
    }

    // eye
    const blinking = now < state.blinkUntil && !trickId;
    if (!blinking && !flipped) {
      ctx.fillStyle = PAPER;
      if (trickId === 'stare') {
        ctx.fillRect(bx + bodyW + 2 + headDX, headY + 2, 2, 2);
        ctx.fillRect(bx + bodyW + 5 + headDX, headY + 2, 2, 2);
      } else if (trickId === 'pet') {
        // eyes half-closed (smaller, blissful)
        ctx.fillRect(bx + bodyW + 3 + headDX, headY + 4, 2, 1);
      } else {
        ctx.fillRect(bx + bodyW + 2 + headDX, headY + 2, 2, 2);
      }
      ctx.fillStyle = INK;
    }
  }

  // ── background ────────────────────────────────────────────────────────────
  function drawBackground(now) {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(139, 58, 26, 0.35)';
    ctx.fillRect(w - 34, 10, 12, 12);
    ctx.fillRect(w - 38, 14, 4, 4);
    ctx.fillRect(w - 22, 14, 4, 4);
    ctx.fillRect(w - 30, 6,  4, 4);
    ctx.fillRect(w - 30, 22, 4, 4);

    ctx.fillStyle = FAINT;
    const c1 = ((now * 0.006) % (w + 90)) - 45;
    const c2 = ((now * 0.004 + 180) % (w + 90)) - 45;
    cloud(c1, 16);
    cloud(c2, 32);

    ctx.fillStyle = FAINT;
    for (let fx = 8; fx < w; fx += 34) ctx.fillRect(fx, h - 60, 3, 16);
    ctx.fillRect(0, h - 56, w, 2);

    ctx.fillStyle = SOFT;
    ctx.fillRect(w - 18, h - 46, 3, 24);
    ctx.fillStyle = FAINT;
    ctx.fillRect(w - 28, h - 62, 22, 18);
    ctx.fillRect(w - 24, h - 68, 14, 8);
  }

  function cloud(x, y) {
    ctx.fillRect(x, y, 26, 6);
    ctx.fillRect(x + 5, y - 4, 14, 5);
  }

  function drawGrass(w, h) {
    ctx.fillStyle = SOFT;
    for (const gx of [14, 62, 96, 148, 210, 252, 292]) {
      ctx.fillRect(gx, h - 26, 1, 4);
      ctx.fillRect(gx + 2, h - 25, 1, 3);
    }
  }

  function drawButterfly(w, h, now) {
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

  // ── sleep sprite ──────────────────────────────────────────────────────────
  function drawSleepSprite(x, h, now) {
    ctx.save();
    ctx.translate((x + 13) * 2, 0);
    ctx.scale(-1, 1);
    ctx.fillStyle = INK;
    ctx.fillRect(x - 4,  h - 32, 34, 10);
    ctx.fillRect(x + 22, h - 38, 12, 8);
    ctx.fillRect(x + 22, h - 41, 4, 4);
    ctx.fillRect(x - 8,  h - 30, 6, 4);
    ctx.restore();
    ctx.fillStyle = INK;
    ctx.font = '10px "Courier New", monospace';
    const drift = now ? (now / 40) % 14 : 0;
    ctx.fillText('z', x - 18, h - 44 - drift * 0.5);
    ctx.fillText('z', x - 12, h - 52 - drift * 0.3);
  }

  // ── loop ──────────────────────────────────────────────────────────────────
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

/* ---------- static sleep frame (reduced-motion path) ---------- */

const INK2  = '#2b2520';
const SKY2  = '#f1e9d7';
const DIRT2 = '#e8ddc6';
const FAINT2 = 'rgba(43, 37, 32, 0.16)';
const SOFT2  = 'rgba(43, 37, 32, 0.34)';

export function drawSleepFrame(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = SKY2;  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = DIRT2; ctx.fillRect(0, h - 22, w, 22);

  // minimal background
  ctx.fillStyle = 'rgba(139, 58, 26, 0.35)';
  ctx.fillRect(w - 34, 10, 12, 12);
  ctx.fillRect(w - 38, 14, 4, 4);
  ctx.fillRect(w - 22, 14, 4, 4);
  ctx.fillRect(w - 30, 6,  4, 4);
  ctx.fillRect(w - 30, 22, 4, 4);
  ctx.fillStyle = FAINT2;
  for (let fx = 8; fx < w; fx += 34) ctx.fillRect(fx, h - 60, 3, 16);
  ctx.fillRect(0, h - 56, w, 2);
  ctx.fillStyle = SOFT2;
  ctx.fillRect(w - 18, h - 46, 3, 24);
  ctx.fillStyle = FAINT2;
  ctx.fillRect(w - 28, h - 62, 22, 18);
  ctx.fillRect(w - 24, h - 68, 14, 8);

  ctx.strokeStyle = INK2; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h - 22); ctx.lineTo(w, h - 22); ctx.stroke();

  // grass
  ctx.fillStyle = SOFT2;
  for (const gx of [14, 62, 96, 148, 210, 252, 292]) {
    ctx.fillRect(gx, h - 26, 1, 4);
    ctx.fillRect(gx + 2, h - 25, 1, 3);
  }

  // sleeping dog
  const x = DOG_X;
  ctx.save();
  ctx.translate((x + 13) * 2, 0);
  ctx.scale(-1, 1);
  ctx.fillStyle = INK2;
  ctx.fillRect(x - 4,  h - 32, 34, 10);
  ctx.fillRect(x + 22, h - 38, 12, 8);
  ctx.fillRect(x + 22, h - 41, 4, 4);
  ctx.fillRect(x - 8,  h - 30, 6, 4);
  ctx.restore();
}
