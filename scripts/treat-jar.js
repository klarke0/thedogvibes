// scripts/treat-jar.js — the treat jar. Vanilla ES module, no deps.
// Mounts into #treat-jar-mount.

const MOUNT_ID = 'treat-jar-mount';
const STORAGE_KEY = 'dv-treats-given';

const mount = document.getElementById(MOUNT_ID);
if (!mount) {
  // not on this page
} else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  mount.innerHTML = `
    <div class="tj-polaroid">
      <canvas id="tj-canvas" width="300" height="130" role="img"
              aria-label="pixel dog asleep in a backyard"></canvas>
      <p class="caption">reduced motion is on. he's napping.</p>
    </div>
    <p class="tj-counter">treats given: ${readCount()}</p>
  `;
  import('./treat-jar.game.js').then(m => m.drawSleepFrame(mount.querySelector('#tj-canvas')));
} else {
  boot(mount);
}

function readCount() {
  try { return parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0; }
  catch { return 0; }
}

function boot(root) {
  root.innerHTML = `
    <div class="tj-polaroid">
      <canvas id="tj-canvas" width="300" height="130" role="img"
              aria-label="pixel dog waiting near a treat jar in a backyard"></canvas>
      <p id="tj-caption" class="caption" aria-live="polite">he knows the jar is there.</p>
    </div>
    <div class="tj-hud">
      <button id="tj-jar" type="button">give a treat</button>
      <span id="tj-counter">treats given: ${readCount()}</span>
    </div>
    <p class="tj-help">click the jar. that's it. that's the game.</p>
  `;
  import('./treat-jar.game.js').then(m => m.start(root, { storageKey: STORAGE_KEY }));
}
