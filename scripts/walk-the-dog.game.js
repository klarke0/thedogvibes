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

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

    // Ground line
    ctx.strokeStyle = '#2b2520'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h - 24); ctx.lineTo(w, h - 24); ctx.stroke();

    // Handler (kevin) — rect block left of dog
    ctx.fillStyle = '#2b2520';
    ctx.fillRect(30, h - 60, 14, 36);

    // Dog — simple rect sprite
    ctx.fillRect(60, h - 44, 28, 20);  // body
    ctx.fillRect(82, h - 50, 14, 14);  // head
    ctx.fillRect(60, h - 24, 4, 6);    // back leg
    ctx.fillRect(82, h - 24, 4, 6);    // front leg

    // Distraction sprite
    const dx = 60 + (w - 100) * state.distraction.distance;
    ctx.fillStyle = '#8b3a1a';
    ctx.fillRect(dx, h - 38, 14, 14);

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
