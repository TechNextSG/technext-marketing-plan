/* TechNext Brand Hub — shared behaviour.
   Every block guards for missing elements, since each page uses only some of them. */
(function () {
  "use strict";

  /* ---------- clipboard ---------- */
  // `ok` controls the green success styling — a "Press Ctrl+C" fallback is not a
  // success, so it must not look like one.
  function flash(btn, label, ok) {
    var old = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', old);
    btn.textContent = label || 'Copied ✓';
    if (ok !== false) btn.classList.add('ok');
    setTimeout(function () { btn.textContent = old; btn.classList.remove('ok'); }, 1700);
  }

  // execCommand needs neither a secure context nor focus, so it is the fallback
  // for file:// and for when the async API rejects (e.g. unfocused window).
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text, btn) {
    function fallback() {
      var ok = legacyCopy(text);
      flash(btn, ok ? 'Copied ✓' : 'Press Ctrl+C', ok);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { flash(btn); }, fallback);
    } else { fallback(); }
  }

  // code blocks
  document.querySelectorAll('.codewrap .cbtn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var code = btn.parentElement.querySelector('code');
      if (code) copyText(code.textContent, btn);
    });
  });

  // boilerplate blocks
  document.querySelectorAll('.bp .cbtn2').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = btn.parentElement.querySelector('p');
      if (p) copyText(p.textContent.trim().replace(/\s+/g, ' '), btn);
    });
  });

  /* ---------- colour swatches ---------- */
  document.querySelectorAll('.sw .chip-c').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var hex = chip.getAttribute('data-hex');
      var label = chip.parentNode.querySelector('.h');
      if (!hex || !label) return;
      var restore = hex;
      function done(msg) {
        label.textContent = msg;
        setTimeout(function () { label.textContent = restore; }, 1200);
      }
      function fallback() {
        if (legacyCopy(hex)) { done('Copied ✓'); return; }
        // Last resort: select the value so Ctrl+C works.
        label.textContent = hex;
        try {
          var r = document.createRange();
          r.selectNodeContents(label);
          var s = window.getSelection();
          s.removeAllRanges();
          s.addRange(r);
        } catch (e) { /* nothing more we can do */ }
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(hex).then(function () { done('Copied ✓'); }, fallback);
      } else { fallback(); }
    });
  });

  /* ---------- collateral finder ---------- */
  var fInput = document.getElementById('fsearch');
  var fTable = document.getElementById('fbody');
  if (fTable) {
    var rows = [].slice.call(fTable.querySelectorAll('tr')).map(function (tr) {
      return { el: tr, hay: tr.textContent.toLowerCase(), cat: tr.getAttribute('data-cat') || '' };
    });
    var fCount = document.getElementById('fcount');
    var fNone = document.getElementById('fnone');
    var filter = 'all';

    function applyFilter() {
      var q = fInput ? fInput.value.trim().toLowerCase() : '';
      var shown = 0;
      rows.forEach(function (r) {
        var okCat = filter === 'all' || r.cat === filter;
        var okQ = !q || r.hay.indexOf(q) > -1;
        var vis = okCat && okQ;
        r.el.classList.toggle('hid', !vis);
        if (vis) shown++;
      });
      if (fCount) fCount.textContent = shown + ' of ' + rows.length + ' items';
      if (fNone) fNone.style.display = shown ? 'none' : 'block';
    }

    if (fInput) fInput.addEventListener('input', applyFilter);
    document.querySelectorAll('.chips .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        document.querySelectorAll('.chips .chip').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        filter = c.getAttribute('data-f') || 'all';
        applyFilter();
      });
    });
    applyFilter();
  }

  /* ---------- TOC active state ----------
     Measures live rects on scroll rather than using IntersectionObserver, so
     images finishing loading can't leave the highlight pointing at the wrong
     section. Exposed for testing. */
  var links = [].slice.call(document.querySelectorAll('.toc a'));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function syncToc() {
    if (!links.length) return;
    var cur = 0;
    secs.forEach(function (s, i) {
      if (s && s.getBoundingClientRect().top <= 130) cur = i;
    });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
  }

  window.addEventListener('scroll', syncToc, { passive: true });
  window.addEventListener('resize', syncToc);
  window.addEventListener('load', syncToc);
  links.forEach(function (a, i) {
    a.addEventListener('click', function () {
      links.forEach(function (b, j) { b.classList.toggle('on', i === j); });
    });
  });
  syncToc();
  window.__hubSyncToc = syncToc;
})();
