// scripts/walk-the-dog.js — Walk-the-Dog Threshold Edition
// Vanilla ES module. No deps. Mounts into #walk-the-dog-mount.

const MOUNT_ID = 'walk-the-dog-mount';
const WIN_ROUNDS = 5;

const mount = document.getElementById(MOUNT_ID);
if (!mount) {
  // not on this page
} else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  mount.innerHTML = `
    <p>This is a game where you treat the dog right before it goes over threshold.
       Reduced-motion is on, so it's paused. Want the full version? Toggle reduced-motion off.</p>
    <p><a class="v3-stamp" href="book.html">book a free consult ►</a></p>
  `;
} else {
  bootGame(mount);
}

function bootGame(root) {
  root.innerHTML = `
    <canvas id="wtd-canvas" width="380" height="120" role="img"
            aria-label="Walk-the-dog threshold mini-game"></canvas>
    <div class="wtd-hud">
      <span id="wtd-streak">streak: 0</span>
      <span id="wtd-score">score: 0 / ${WIN_ROUNDS}</span>
      <button id="wtd-treat" type="button">treat (space)</button>
    </div>
    <p class="wtd-help">treat right when the dog notices, before it locks in. SPACE or click.</p>
  `;
  import('./walk-the-dog.game.js').then(m => m.start(root));
}
