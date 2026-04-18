/* animations.js — Dog Vibes shared animation module
 * Handles: hero entrance, scroll-triggered reveals, staggered children
 * Usage:
 *   data-hero          — entrance animation on page load (staggered by DOM order)
 *   data-reveal        — fade in on scroll (IntersectionObserver)
 *   data-reveal-delay="0.3"  — optional extra delay in seconds
 *   data-stagger       — parent: children reveal sequentially on scroll
 *   data-stagger-delay="0.1" — override gap between stagger children (default 0.15s)
 */
(function () {
  // Mark JS as loaded — enables hidden state CSS
  document.documentElement.classList.add('js-loaded');

  /* ── Hero entrance ────────────────────────────────────── */
  function initHeroEntrance() {
    var heroEls = document.querySelectorAll('[data-hero]');
    if (!heroEls.length) return;

    heroEls.forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', '0s');
      setTimeout(function () {
        el.classList.add('is-visible');
      }, 120 + i * 220);
    });
  }

  /* ── Collect scroll-reveal targets ───────────────────── */
  function collectTargets() {
    var targets = [];

    // Direct data-reveal elements
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      var delay = parseFloat(el.dataset.revealDelay) || 0;
      el.style.setProperty('--reveal-delay', delay + 's');
      targets.push(el);
    });

    // Stagger parents — apply sequential delay to each direct child
    document.querySelectorAll('[data-stagger]').forEach(function (parent) {
      var gap = parseFloat(parent.dataset.staggerDelay) || 0.15;
      Array.from(parent.children).forEach(function (child, i) {
        child.style.setProperty('--reveal-delay', (i * gap) + 's');
        targets.push(child);
      });
    });

    return targets;
  }

  /* ── Check if element is in viewport ─────────────────── */
  function isInViewport(el, scrollContainer) {
    var rect = el.getBoundingClientRect();
    if (scrollContainer) {
      var containerRect = scrollContainer.getBoundingClientRect();
      return rect.top < containerRect.bottom && rect.bottom > containerRect.top;
    }
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  /* ── Scroll reveals via IntersectionObserver ─────────── */
  function initScrollReveals() {
    var targets = collectTargets();
    if (!targets.length) return;

    var scrollContainer = document.querySelector('.scroll-container');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: scrollContainer || null,
      threshold: 0.05
    });

    targets.forEach(function (el) {
      // Immediately reveal elements already in viewport on load
      if (isInViewport(el, scrollContainer)) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });

    // Safety net: reveal anything still hidden after 1.2s
    // Handles short pages where items never scroll into view
    setTimeout(function () {
      targets.forEach(function (el) {
        if (!el.classList.contains('is-visible')) {
          el.classList.add('is-visible');
        }
      });
    }, 1200);
  }

  /* ── Init ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initHeroEntrance();
    initScrollReveals();
  });
})();
