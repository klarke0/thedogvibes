// scripts/tips.js — daily rotating tip, deterministic per UTC day
const MOUNT = document.getElementById('tip-mount');
if (MOUNT) {
  try {
    const res = await fetch('data/tips.json', { cache: 'no-store' });
    const tips = await res.json();
    const daysSinceEpoch = Math.floor(Date.now() / 86400000);
    const t = tips[daysSinceEpoch % tips.length];
    const linkHTML = t.link ? ` <a href="${t.link}">read more →</a>` : '';
    MOUNT.innerHTML = `${escapeHTML(t.tip)}${linkHTML}`;
  } catch (e) {
    MOUNT.textContent = 'tip unavailable today';
    console.warn('tips.js:', e);
  }
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}
