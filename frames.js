/* frames.js — site-wide "locked frames" (board 21)
 *
 * Any screen at least 520px tall (phones in portrait, desktops, tablets) gets
 * html.frames: every section is a full-screen frame, alternating white / black.
 * Short landscape phones keep plain scrolling.
 *
 * The page picks how frames scroll with <html data-frames="...">:
 *   (none)  snap  — scroll-snap mandatory, one frame (or piece) per swipe / wheel step
 *   loose         — scroll-snap proximity (Book: the Tally form scrolls freely)
 *   read          — no snap; frame look with normal reading scroll (posts, legal)
 *
 * All the moving is native scroll + CSS scroll-snap + sticky. This file never
 * moves anything in response to scroll position. On load / width change only:
 *  1. Per [data-frame] section with .frame-pieces: if the content needs more
 *     than ~85% of the visible screen, the section becomes .is-pinned: heading
 *     band held by sticky, each piece its own full-screen stop sliding up under
 *     it. .frame-group children count as pieces (lets nested markup flatten).
 *  2. Measures the band (--hb) and the optional .frame-tail (--th).
 *  3. Adds 1-of-N dots and lights the one on screen (IntersectionObserver).
 *  4. A piece still too tall for one screen gets .is-tall (grows, scrolls
 *     through inside its frame) instead of being clipped.
 */
(function () {
  var MQ = '(min-height: 520px)';
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

  function piecesOf(sec) {
    var out = [];
    [].forEach.call(sec.querySelector('.frame-pieces').children, function (c) {
      if (c.classList.contains('frame-group')) [].push.apply(out, c.children);
      else out.push(c);
    });
    return out;
  }

  function unpin(sec) {
    sec.classList.remove('is-pinned');
    sec.style.removeProperty('--hb');
    sec.style.removeProperty('--th');
    [].forEach.call(sec.querySelectorAll('.is-first, .is-last, .is-tall'), function (p) { p.classList.remove('is-first', 'is-last', 'is-tall'); });
    var dots = sec.querySelector('.frame-dots');
    if (dots) dots.parentNode.removeChild(dots);
  }

  function pin(sec) {
    var band = sec.querySelector('.frame-band');
    var pieces = piecesOf(sec);
    var tail = sec.querySelector('.frame-tail');
    var h = sec.querySelector('h1, h2, h3');
    var label = sec.getAttribute('aria-label') || (h ? h.textContent.trim() : 'Section');
    sec.classList.add('is-pinned');
    pieces[0].classList.add('is-first');
    pieces[pieces.length - 1].classList.add('is-last');

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
    pieces.forEach(function (p) { if (p.scrollHeight > p.clientHeight + 2) p.classList.add('is-tall'); });

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
    var header = document.querySelector('.header');
    var hh = header ? header.offsetHeight : 0;
    sections.forEach(function (sec) {
      if (!sec.querySelector('.frame-pieces')) return;
      // Pin when the content needs more than ~85% of the visible screen: a frame
      // packed edge to edge reads as cramped. data-frame="pin" always pins
      // (testimonials: one quote shows at a time, so it never "overflows").
      var avail = sec.hasAttribute('data-frame-first') ? h - hh : h;
      var box = sec.firstElementChild;           // the .container
      box.style.minHeight = '0';
      var natural = box.offsetHeight;
      box.style.minHeight = '';
      // First frames (header + hero) are designed to fill the screen, so they
      // only pin when they truly don't fit.
      var limit = sec.hasAttribute('data-frame-first') ? avail : avail * 0.85;
      if (sec.getAttribute('data-frame') === 'pin' || natural > limit + 2) pin(sec);
    });
  }

  // Re-run only when the layout width changes (rotation, desktop resize) or the
  // mode flips, not when Safari's toolbar shows/hides mid-scroll.
  var lastW = window.innerWidth, timer;
  function onResize() {
    if (window.innerWidth === lastW && mq.matches === root.classList.contains('frames')) return;
    lastW = window.innerWidth;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var anchor = null;   // keep the frame the reader is on after the reflow
      sections.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= 1 && r.bottom > 1) anchor = s; });
      layout();
      if (anchor && root.classList.contains('frames')) anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 150);
  }

  /* ---- Desktop wheel / trackpad: one gesture = one frame ----
   * CSS snap alone is unreliable with wheels: Chrome treats each pixel-delta
   * wheel event as its own scroll and snaps it back, and a trackpad's momentum
   * tail can carry a second frame. On mouse/trackpad devices only (never
   * touch, so iPhone stays pure native snap), a wheel gesture is turned into
   * one native smooth scroll to the next stop, and the rest of that gesture
   * (momentum) is swallowed. Keyboard, scrollbar and touch stay native. */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var lastT = 0, lastAbs = 0, stepT = 0, stepAbs = 0, locked = false;
  function stopsY() {
    var ys = [0], max = document.documentElement.scrollHeight - window.innerHeight;
    [].forEach.call(document.querySelectorAll('.header, [data-frame], .frame-pieces > *, .frame-group > *, .frame-free, footer.footer'), function (el) {
      var cs = getComputedStyle(el), a = cs.scrollSnapAlign;
      if (!a || a === 'none' || cs.display === 'contents') return;
      var r = el.getBoundingClientRect(), y = r.top + window.scrollY;
      ys.push(a.indexOf('end') === 0 ? y + r.height - window.innerHeight : y);
    });
    return ys.map(function (y) { return Math.max(0, Math.min(max, Math.round(y))); })
             .sort(function (x, y) { return x - y; });
  }
  function inTall() {
    var t = document.querySelectorAll('.is-tall');
    for (var i = 0; i < t.length; i++) {
      var r = t[i].getBoundingClientRect();
      if (r.top < -2 && r.bottom > window.innerHeight + 2) return true;
    }
    return false;
  }
  window.addEventListener('wheel', function (e) {
    var mode = root.getAttribute('data-frames');
    if (!fine.matches || !root.classList.contains('frames') || mode === 'read' || mode === 'loose') return;
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaY || inTall()) return;
    e.preventDefault();
    var now = Date.now(), abs = Math.abs(e.deltaY);
    var gap = now - lastT;
    // A new gesture: a real pause, a fresh push much stronger than the decaying
    // momentum, or a mouse wheel still turning at full strength (momentum has
    // decayed to a fraction by then, so it never qualifies).
    var fresh = gap > 300 ||
                (abs > lastAbs * 2.5 && abs > 30 && now - stepT > 600) ||
                (now - stepT > 800 && abs >= stepAbs * 0.7);
    lastT = now; lastAbs = abs;
    if (locked && !fresh) return;
    if (now - stepT < 350) return;
    var y = window.scrollY, dir = e.deltaY > 0 ? 1 : -1, ys = stopsY(), target = null;
    for (var i = 0; i < ys.length; i++) {
      var k = dir > 0 ? i : ys.length - 1 - i;
      if (dir > 0 ? ys[k] > y + 2 : ys[k] < y - 2) { target = ys[k]; break; }
    }
    locked = true; stepT = now; stepAbs = abs;
    if (target !== null) window.scrollTo({ top: target, behavior: rm.matches ? 'auto' : 'smooth' });
  }, { passive: false });

  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('resize', onResize);
  if (location.hash) {
    var t = document.getElementById(location.hash.slice(1));
    if (t) window.addEventListener('load', function () { t.scrollIntoView({ behavior: 'auto', block: 'start' }); });
  }
})();
