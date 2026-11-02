/* frames.js — Home "locked frames" on phones (board 21)
 *
 * Phones (portrait, <= 768px wide, >= 520px tall) get html.frames: every section
 * is a full-screen snap point and the page alternates white / black. All the
 * moving is native scroll + CSS scroll-snap; this file never moves anything
 * in response to scroll position.
 *
 * What it does, on load / width change only:
 *  1. Decides per [data-frame] section whether its content fits one screen.
 *     If not, the section becomes .is-pinned: heading band held by CSS sticky,
 *     each child of .frame-pieces is its own full-screen snap stop that scrolls
 *     up under the band ("pinned frame").
 *  2. Measures the band (--hb) and the optional .frame-tail (--th) so pieces
 *     sit between the band and Safari's toolbar.
 *  3. Adds 1-of-N dots and lights the one on screen (IntersectionObserver).
 *
 * Desktop / landscape: removes everything; the page scrolls normally.
 */
(function () {
  var MQ = '(max-width: 768px) and (min-height: 520px)';
  var root = document.documentElement;
  var mq = window.matchMedia(MQ);
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var sections = [].slice.call(document.querySelectorAll('[data-frame]'));
  var observers = [];
  var probe;

  function svh() {
    if (!probe) {
      probe = document.createElement('div');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
      document.body.appendChild(probe);
    }
    return probe.offsetHeight;
  }

  function unpin(sec) {
    sec.classList.remove('is-pinned');
    sec.style.removeProperty('--hb');
    sec.style.removeProperty('--th');
    var dots = sec.querySelector('.frame-dots');
    if (dots) dots.parentNode.removeChild(dots);
  }

  function pin(sec) {
    var band = sec.querySelector('.frame-band');
    var pieces = [].slice.call(sec.querySelector('.frame-pieces').children);
    var tail = sec.querySelector('.frame-tail');
    var label = (band.textContent || '').trim();
    sec.classList.add('is-pinned');

    var dots = document.createElement('div');
    dots.className = 'frame-dots';
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', label + ': ' + pieces.length + ' parts');
    pieces.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Part ' + (i + 1) + ' of ' + pieces.length);
      b.addEventListener('click', function () {
        p.scrollIntoView({ behavior: rm.matches ? 'auto' : 'smooth', block: 'start' });
      });
      dots.appendChild(b);
    });
    band.appendChild(dots);

    sec.style.setProperty('--hb', band.offsetHeight + 'px');
    sec.style.setProperty('--th', (tail ? tail.offsetHeight : 0) + 'px');

    function show(i) {
      [].forEach.call(dots.children, function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    show(0);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) show(pieces.indexOf(e.target)); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    pieces.forEach(function (p) { io.observe(p); });
    observers.push(io);
  }

  function layout() {
    observers.forEach(function (o) { o.disconnect(); });
    observers = [];
    sections.forEach(unpin);
    if (!mq.matches) { root.classList.remove('frames'); return; }
    root.classList.add('frames');
    var h = svh();
    sections.forEach(function (sec) {
      if (!sec.querySelector('.frame-pieces')) return;
      // Pin when the content needs more than ~85% of the visible screen: a frame
      // packed edge to edge reads as cramped. data-frame="pin" always pins
      // (testimonials: one quote shows at a time, so it never "overflows").
      var box = sec.firstElementChild;           // the .container
      box.style.minHeight = '0';
      var natural = box.offsetHeight;
      box.style.minHeight = '';
      if (sec.getAttribute('data-frame') === 'pin' || natural > h * 0.85) pin(sec);
    });
  }

  // Re-run only when the layout width changes (rotation, desktop resize), not when
  // Safari's toolbar shows/hides, which would reshuffle the page mid-scroll.
  var lastW = window.innerWidth, timer;
  function onResize() {
    if (window.innerWidth === lastW && mq.matches === root.classList.contains('frames')) return;
    lastW = window.innerWidth;
    clearTimeout(timer);
    timer = setTimeout(function () {
      // keep the frame the reader is on after the page reflows
      var anchor = null;
      sections.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= 1 && r.bottom > 1) anchor = s; });
      layout();
      if (anchor) anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 150);
  }

  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('resize', onResize);
  if (location.hash) {
    var t = document.getElementById(location.hash.slice(1));
    if (t) window.addEventListener('load', function () { t.scrollIntoView({ behavior: 'auto', block: 'start' }); });
  }
})();
