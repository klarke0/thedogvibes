// scripts/guestbook-render.js — renders moderated entries from JSON.
// Supports two modes via data-mode on the script tag:
//   "home" — show only the count, populate #guestbook-count
//   "page" — render full list into #gb-entries (default if data-mode missing)
// In ES modules, document.currentScript is null. Locate our script tag by src.
const scriptEl = document.querySelector('script[src*="guestbook-render.js"]');
const mode = (scriptEl && scriptEl.dataset.mode) || 'page';

try {
  const res = await fetch('data/guestbook-entries.json', { cache: 'no-store' });
  const entries = await res.json();

  if (mode === 'home') {
    const el = document.getElementById('guestbook-count');
    if (el) el.innerHTML = `${entries.length} message${entries.length === 1 ? '' : 's'} · <a href="guestbook.html">leave one</a>`;
  } else {
    const el = document.getElementById('gb-entries');
    if (el) {
      if (!entries.length) {
        el.innerHTML = '<p>no entries yet. you could be the first.</p>';
      } else {
        el.innerHTML = entries.slice().reverse().map(e => `
          <div class="v3-gb-entry">
            <div>${escapeHTML(e.message)}</div>
            <div class="meta">— ${escapeHTML(e.name)} · ${escapeHTML(e.date || '')}</div>
          </div>
        `).join('');
      }
    }
  }
} catch (e) {
  console.warn('guestbook-render:', e);
}

function escapeHTML(s) {
  return String(s || '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}
