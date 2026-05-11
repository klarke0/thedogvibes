// scripts/walk-the-dog.game.js — canvas render + game state.
import { evaluateMark, ZONE } from './walk-the-dog.threshold.js';

const WIN_ROUNDS = 5;
const SESSION_MS = 60_000;
const DISTRACTION_SPEED = 0.0006; // normalized units per ms

export function start(root) {
  const canvas = root.querySelector('#wtd-canvas');
  const ctx = canvas.getContext('2d');
  const streakEl = root.querySelector('#wtd-streak');
  const scoreEl = root.querySelector('#wtd-score');
  const treatBtn = root.querySelector('#wtd-treat');

  const state = {
    score: 0,
    streak: 0,
    sessionStart: performance.now(),
    distraction: spawnDistraction(),
    feedback: null, // {text, color, expires}
    over: false,
  };

  function spawnDistraction() {
    const kinds = ['squirrel', 'dog', 'bike', 'box'];
    return {
      distance: 1.0,
      kind: kinds[(Math.random() * kinds.length) | 0],
      resolved: false,
    };
  }

  function mark() {
    if (state.over || state.distraction.resolved) return;
    const z = evaluateMark(state.distraction.distance);
    state.distraction.resolved = true;
    if (z === ZONE.AWARE) {
      state.score++; state.streak++;
      state.feedback = { text: 'good mark!', color: '#3a7d3a', expires: performance.now() + 800 };
      if (state.score >= WIN_ROUNDS) state.over = 'win';
    } else if (z === ZONE.UNAWARE) {
      state.streak = 0;
      state.feedback = { text: 'too early — wasted treat', color: '#a07a3a', expires: performance.now() + 800 };
    } else {
      state.streak = 0;
      state.feedback = { text: 'too late — over threshold', color: '#a83a3a', expires: performance.now() + 1200 };
    }
    setTimeout(() => {
      if (!state.over) state.distraction = spawnDistraction();
    }, 1100);
  }

  treatBtn.addEventListener('click', mark);
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && document.activeElement !== treatBtn) {
      e.preventDefault(); mark();
    }
  });

  function update(dtMs) {
    const elapsed = performance.now() - state.sessionStart;
    if (elapsed > SESSION_MS && !state.over) state.over = state.score >= 3 ? 'win' : 'time';
    if (!state.distraction.resolved) {
      state.distraction.distance -= DISTRACTION_SPEED * dtMs;
      if (state.distraction.distance <= 0) {
        state.distraction.resolved = true;
        state.streak = 0;
        state.feedback = { text: 'distraction passed — no mark', color: '#666', expires: performance.now() + 800 };
        setTimeout(() => { if (!state.over) state.distraction = spawnDistraction(); }, 900);
      }
    }
  }

  function drawHandler(x, h) {
    const ink = '#2b2520';
    ctx.fillStyle = ink;
    // body (coat)
    ctx.fillRect(x, h - 50, 12, 26);
    // head
    ctx.fillRect(x + 1, h - 60, 10, 10);
    // hat brim
    ctx.fillRect(x - 1, h - 60, 14, 2);
    // hat top
    ctx.fillRect(x + 2, h - 64, 8, 4);
    // arm holding leash (extends toward dog)
    ctx.fillRect(x + 12, h - 46, 8, 2);
    // legs
    ctx.fillRect(x + 1, h - 24, 4, 4);
    ctx.fillRect(x + 7, h - 24, 4, 4);
    // beard pixel
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 7, h - 53, 2, 1);
    ctx.fillStyle = ink;
  }

  function drawDog(x, h) {
    const ink = '#2b2520';
    ctx.fillStyle = ink;
    // body
    ctx.fillRect(x, h - 40, 28, 14);
    // head
    ctx.fillRect(x + 22, h - 48, 14, 12);
    // snout
    ctx.fillRect(x + 34, h - 44, 4, 4);
    // ear (flopped)
    ctx.fillRect(x + 22, h - 52, 5, 6);
    // tail (animated wag when in AWARE zone)
    const inAware = state.distraction
      && !state.distraction.resolved
      && evaluateMark(state.distraction.distance) === ZONE.AWARE;
    const wag = inAware ? Math.sin(performance.now() / 70) * 4 : 0;
    ctx.fillRect(x - 4, h - 42 + wag, 6, 3);
    // tail tip
    ctx.fillRect(x - 6, h - 44 + wag * 1.3, 3, 3);
    // legs
    ctx.fillRect(x + 2, h - 26, 4, 4);
    ctx.fillRect(x + 12, h - 26, 4, 4);
    ctx.fillRect(x + 22, h - 26, 4, 4);
    // eye (white pixel)
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 30, h - 46, 2, 2);
    // leash (thin line from handler arm to dog collar)
    ctx.strokeStyle = ink; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 18, h - 44);
    ctx.lineTo(x + 26, h - 42);
    ctx.stroke();
    ctx.fillStyle = ink;
  }

  function drawDistraction(d, w, h) {
    if (!d) return;
    const dx = 60 + (w - 100) * d.distance;
    const baseY = h - 28;
    ctx.fillStyle = '#8b3a1a';
    if (d.kind === 'squirrel') {
      // body
      ctx.fillRect(dx, baseY - 8, 10, 8);
      // bushy tail (taller)
      ctx.fillRect(dx + 9, baseY - 14, 5, 12);
      ctx.fillRect(dx + 11, baseY - 16, 3, 4);
      // head
      ctx.fillRect(dx - 3, baseY - 10, 5, 6);
      // ear
      ctx.fillRect(dx - 2, baseY - 12, 2, 2);
      // legs
      ctx.fillRect(dx + 1, baseY, 2, 2);
      ctx.fillRect(dx + 6, baseY, 2, 2);
    } else if (d.kind === 'dog') {
      // other dog — bigger, ears up
      ctx.fillRect(dx, baseY - 10, 14, 10);
      ctx.fillRect(dx - 5, baseY - 12, 6, 8);
      ctx.fillRect(dx - 5, baseY - 15, 2, 3); // ear up
      ctx.fillRect(dx - 1, baseY - 15, 2, 3); // ear up
      ctx.fillRect(dx + 13, baseY - 8, 3, 3); // tail
      ctx.fillRect(dx + 1, baseY, 2, 2);
      ctx.fillRect(dx + 10, baseY, 2, 2);
    } else if (d.kind === 'bike') {
      // bike — frame + 2 wheels
      ctx.fillRect(dx, baseY - 6, 14, 2);            // frame
      ctx.fillRect(dx + 6, baseY - 12, 2, 6);        // seat post
      ctx.fillRect(dx + 4, baseY - 14, 6, 2);        // seat
      // wheels
      ctx.fillStyle = '#2b2520';
      ctx.fillRect(dx, baseY - 2, 5, 2);
      ctx.fillRect(dx + 1, baseY, 3, 2);
      ctx.fillRect(dx + 10, baseY - 2, 5, 2);
      ctx.fillRect(dx + 11, baseY, 3, 2);
      ctx.fillStyle = '#8b3a1a';
    } else {
      // box / mailbox
      ctx.fillRect(dx, baseY - 12, 14, 12);
      ctx.fillStyle = '#2b2520';
      ctx.fillRect(dx + 5, baseY - 8, 4, 2); // slot
      ctx.fillRect(dx + 6, baseY - 16, 2, 4); // flag pole
      ctx.fillStyle = '#a83a3a';
      ctx.fillRect(dx + 7, baseY - 16, 4, 2); // flag
    }
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

    // Ground line
    ctx.strokeStyle = '#2b2520'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h - 24); ctx.lineTo(w, h - 24); ctx.stroke();

    drawHandler(28, h);
    drawDog(58, h);
    drawDistraction(state.distraction, w, h);

    // Threshold meter (top)
    const meterY = 8, meterH = 8;
    const wMeter = w - 20;
    ctx.fillStyle = '#eee'; ctx.fillRect(10, meterY, wMeter, meterH);
    // zones (left = unaware, mid = aware sweet spot, right = over)
    ctx.fillStyle = '#cfd8c0'; ctx.fillRect(10, meterY, wMeter * 0.3, meterH);                    // unaware
    ctx.fillStyle = '#a8c08c'; ctx.fillRect(10 + wMeter * 0.3, meterY, wMeter * 0.4, meterH);     // aware
    ctx.fillStyle = '#dca0a0'; ctx.fillRect(10 + wMeter * 0.7, meterY, wMeter * 0.3, meterH);     // over
    // marker (distance 1 = leftmost, 0 = rightmost)
    const markX = 10 + wMeter * (1 - state.distraction.distance);
    ctx.fillStyle = '#2b2520'; ctx.fillRect(markX - 1, meterY - 2, 2, meterH + 4);

    // Feedback text
    if (state.feedback && performance.now() < state.feedback.expires) {
      ctx.fillStyle = state.feedback.color;
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText(state.feedback.text, 10, h - 4);
    }
  }

  function updateHud() {
    streakEl.textContent = `streak: ${state.streak}`;
    scoreEl.textContent = `score: ${state.score} / ${WIN_ROUNDS}`;
  }

  let modalShown = false;
  function showWinModal() {
    if (modalShown) return;
    modalShown = true;
    const win = state.over === 'win';
    const node = document.createElement('div');
    node.className = 'wtd-win';
    node.innerHTML = win
      ? `<p>You just trained yourself. Imagine what we can do with your actual dog.</p>
         <p><a class="v3-stamp" href="book.html">book a free consult ►</a></p>`
      : `<p>Session ended. Want a real one with a real dog?</p>
         <p><a class="v3-stamp" href="book.html">book a free consult ►</a></p>`;
    root.appendChild(node);
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last; last = now;
    if (!state.over) update(dt);
    draw();
    updateHud();
    if (state.over) { showWinModal(); return; }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
