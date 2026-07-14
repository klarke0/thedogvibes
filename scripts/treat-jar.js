// scripts/treat-jar.js — the treat jar. Vanilla ES module, no deps.
// Mounts into #treat-jar-mount.

const MOUNT_ID = 'treat-jar-mount';
const STORAGE_KEY = 'dv-treats-given';

const mount = document.getElementById(MOUNT_ID);
if (!mount) {
  // not on this page
} else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  mount.innerHTML = `
    <canvas id="tj-canvas" width="380" height="120" role="img"
            aria-label="pixel dog, asleep"></canvas>
    <p class="tj-caption">reduced motion is on — he's napping.</p>
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
    <canvas id="tj-canvas" width="380" height="120" role="img"
            aria-label="pixel dog waiting near a treat jar"></canvas>
    <div class="tj-hud">
      <button id="tj-jar" type="button">give a treat</button>
      <span id="tj-counter">treats given: ${readCount()}</span>
    </div>
    <p id="tj-caption" class="tj-caption" aria-live="polite">&nbsp;</p>
    <p class="tj-help">click the jar. that's it. that's the game.</p>
  `;
  import('./treat-jar.game.js').then(m => m.start(root, { storageKey: STORAGE_KEY }));
}
