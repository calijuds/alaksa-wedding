/* =====================================================================
   Alaksa Wedding — main.js
   Header, theme, reveal, featured slider, filterable grid, story pop-up,
   lightbox and the WhatsApp booking form. Content lives in data.js.
   ===================================================================== */
(function () {
  'use strict';

  var D = window.ALAKSA;
  var IMG = '/assets/img/';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var byId = {};
  D.PHOTOS.forEach(function (p) { byId[p.id] = p; });

  function waLink(msg) { return 'https://wa.me/' + D.WA + '?text=' + encodeURIComponent(msg); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- WhatsApp links ---------- */
  $$('.js-wa').forEach(function (a) {
    if (a.dataset.msg) a.href = waLink(a.dataset.msg);
  });
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- header: compact on scroll, active link, mobile menu ---------- */
  var hdr = $('#hdr'), fab = $('.fab');
  var story = $('#story');
  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle('is-compact', y > 40);
    fab.classList.toggle('is-on', y > (story ? story.offsetHeight - window.innerHeight : 400));
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var navLinks = $$('#nav a');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['work', 'layanan', 'paket', 'tentang', 'kontak'].forEach(function (id) { var el = document.getElementById(id); if (el) secObs.observe(el); });
  }

  var menuBtn = $('#menuBtn'), nav = $('#nav');
  menuBtn.addEventListener('click', function () {
    var open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', open); nav.classList.toggle('is-open', open);
  });
  navLinks.forEach(function (a) { a.addEventListener('click', function () { menuBtn.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }); });

  /* ---------- theme ---------- */
  $('#themeBtn').addEventListener('click', function () {
    var root = document.documentElement;
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', next === 'light' ? '#f4f2ee' : '#0a0a0a');
    try { localStorage.setItem('alaksa-theme', next); } catch (e) {}
  });

  /* ---------- reveal on scroll ---------- */
  var revObs = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }) : null;
  function reveal(el, i) {
    if (!revObs) { el.classList.add('in'); return; }
    if (i != null) el.style.transitionDelay = (i % 3) * 90 + 'ms';
    revObs.observe(el);
  }
  $$('.rv').forEach(function (el) { reveal(el); });

  /* ---------- featured slider ---------- */
  var feat = { i: 0, items: D.FEATURED.map(function (id) { return byId[id]; }).filter(Boolean), timer: null, dur: 6500, start: 0 };
  var featStage = $('#featStage');
  feat.items.forEach(function (p, k) {
    var s = document.createElement('div');
    s.className = 'feat-slide';
    s.innerHTML = '<img src="' + IMG + p.src + '" alt="' + esc(p.alt) + '"' + (k ? ' loading="lazy"' : '') + '>';
    s.addEventListener('click', function () { openCase(p.story); });
    featStage.appendChild(s);
  });
  var slides = $$('.feat-slide', featStage), prog = $('#featProg');
  function showFeat(k) {
    feat.i = (k + feat.items.length) % feat.items.length;
    slides.forEach(function (s, j) { s.classList.toggle('is-on', j === feat.i); });
    var p = feat.items[feat.i], st = D.STORIES[p.story];
    $('#featIdx').textContent = pad(feat.i + 1) + ' / ' + pad(feat.items.length);
    $('#featTitle').textContent = st ? st.title : p.title;
    $('#featMeta').textContent = st ? st.kicker : '';
    feat.start = performance.now();
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tickFeat(now) {
    var f = Math.min(1, (now - feat.start) / feat.dur);
    prog.style.width = f * 100 + '%';
    if (f >= 1) showFeat(feat.i + 1);
    feat.raf = requestAnimationFrame(tickFeat);
  }
  if (feat.items.length) {
    showFeat(0);
    $('#featPrev').addEventListener('click', function () { showFeat(feat.i - 1); });
    $('#featNext').addEventListener('click', function () { showFeat(feat.i + 1); });
    $('#featOpen').addEventListener('click', function () { openCase(feat.items[feat.i].story); });
    // only animate while visible
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { feat.start = performance.now() - (parseFloat(prog.style.width) || 0) / 100 * feat.dur; feat.raf = requestAnimationFrame(tickFeat); }
      else cancelAnimationFrame(feat.raf);
    }).observe($('#feat'));
  }

  /* ---------- filters + grid ---------- */
  var grid = $('#grid'), filters = $('#filters');
  var counts = { all: D.PHOTOS.length };
  D.PHOTOS.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });
  var cats = [['all', 'Semua']].concat(Object.keys(D.CATEGORIES).map(function (k) { return [k, D.CATEGORIES[k]]; }));
  cats.forEach(function (c, k) {
    if (!counts[c[0]]) return;
    var b = document.createElement('button');
    b.type = 'button'; b.dataset.cat = c[0]; b.setAttribute('role', 'tab');
    b.innerHTML = esc(c[1]) + '<sup>' + counts[c[0]] + '</sup>';
    if (!k) { b.classList.add('is-on'); b.setAttribute('aria-selected', 'true'); }
    b.addEventListener('click', function () { applyFilter(c[0], b); });
    filters.appendChild(b);
  });

  D.PHOTOS.forEach(function (p, k) {
    var st = D.STORIES[p.story];
    var el = document.createElement('article');
    el.className = 'card rv'; el.dataset.cat = p.cat; el.tabIndex = 0;
    el.setAttribute('aria-label', p.title + ', buka cerita');
    el.innerHTML =
      '<div class="card-img"><span class="card-no mono">' + pad(k + 1) + '</span>' +
      '<img src="' + IMG + 'thumb/' + p.src + '" alt="' + esc(p.alt) + '" loading="lazy">' +
      '<span class="card-view mono">Lihat Cerita →</span></div>' +
      '<div class="card-body"><h3>' + esc(p.title) + '</h3><p class="mono">' + esc(D.CATEGORIES[p.cat]) + (st ? ' · ' + esc(st.title) : '') + '</p></div>';
    function go() { if (p.story) openCase(p.story, p.id); else openLb([p], 0); }
    el.addEventListener('click', go);
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    grid.appendChild(el);
    reveal(el, k);
  });

  function applyFilter(cat, btn) {
    $$('button', filters).forEach(function (b) { var on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
    var cards = $$('.card', grid);
    cards.forEach(function (c) { c.classList.add('is-fading'); });
    setTimeout(function () {
      cards.forEach(function (c) {
        var show = cat === 'all' || c.dataset.cat === cat;
        c.classList.toggle('is-hidden', !show);
        c.classList.add('in');
      });
      requestAnimationFrame(function () { requestAnimationFrame(function () { cards.forEach(function (c) { c.classList.remove('is-fading'); }); }); });
    }, 280);
  }

  /* ---------- story pop-up ---------- */
  var caseEl = $('#case'), lastFocus = null, caseId = null;
  function openCase(id, focusPhoto) {
    var st = D.STORIES[id]; if (!st) return;
    caseId = id; lastFocus = document.activeElement;
    var photos = D.PHOTOS.filter(function (p) { return p.story === id; });
    if (focusPhoto) photos.sort(function (a, b) { return (b.id === focusPhoto) - (a.id === focusPhoto); });
    $('#caseKick').textContent = st.kicker;
    $('#caseTitle').textContent = st.title;
    $('#caseMeta').innerHTML = st.meta.map(function (m) { return '<div><span>' + esc(m[0]) + '</span>' + esc(m[1]) + '</div>'; }).join('');
    $('#caseText').textContent = st.text;
    var gal = $('#caseGal'); gal.innerHTML = '';
    photos.forEach(function (p, k) {
      var f = document.createElement('figure');
      f.style.transitionDelay = (200 + k * 90) + 'ms';
      f.innerHTML = '<img src="' + IMG + p.src + '" alt="' + esc(p.alt) + '" loading="lazy">';
      f.addEventListener('click', function () { openLb(photos, k); });
      gal.appendChild(f);
    });
    $('#caseWa').href = waLink('Halo Ilmi, saya lihat cerita "' + st.title + '" di website Alaksa Wedding dan ingin cek tanggal untuk acara saya.');
    caseEl.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { requestAnimationFrame(function () { caseEl.classList.add('is-open'); }); });
    $('.case-x', caseEl).focus({ preventScroll: true });
    caseEl.querySelector('.case-panel').scrollTop = 0;
    if (location.hash !== '#cerita-' + id) history.replaceState(null, '', '#cerita-' + id);
  }
  function closeCase() {
    if (caseEl.hidden) return;
    caseEl.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(function () { caseEl.hidden = true; }, 600);
    if (location.hash.indexOf('#cerita-') === 0) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  $$('[data-close]', caseEl).forEach(function (b) { b.addEventListener('click', closeCase); });
  $('#caseShare').addEventListener('click', function () {
    var url = location.origin + location.pathname + '#cerita-' + caseId, btn = this;
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () {
      btn.textContent = 'Link tersalin ✓'; setTimeout(function () { btn.textContent = 'Salin Link Cerita'; }, 1800);
    }, function () { prompt('Salin link ini:', url); });
  });
  function fromHash() { var m = location.hash.match(/^#cerita-([\w-]+)/); if (m && D.STORIES[m[1]]) openCase(m[1]); }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  /* ---------- lightbox ---------- */
  var lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbSet = [], lbI = 0;
  function openLb(set, i) { lbSet = set; lbI = i; lb.hidden = false; showLb(); }
  function showLb() {
    lbI = (lbI + lbSet.length) % lbSet.length;
    var p = lbSet[lbI];
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
    lbImg.src = IMG + p.src; lbImg.alt = p.alt;
    lbCap.textContent = pad(lbI + 1) + ' / ' + pad(lbSet.length) + ' · ' + p.title;
  }
  function closeLb() { lb.hidden = true; }
  $('.lb-x', lb).addEventListener('click', closeLb);
  $('.lb-p', lb).addEventListener('click', function () { lbI--; showLb(); });
  $('.lb-n', lb).addEventListener('click', function () { lbI++; showLb(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', function (e) {
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') { lbI++; showLb(); }
      if (e.key === 'ArrowLeft') { lbI--; showLb(); }
      return;
    }
    if (e.key === 'Escape') closeCase();
  });

  /* ---------- testimonials (hidden until real ones are added) ---------- */
  if (D.TESTIMONIALS && D.TESTIMONIALS.length) {
    var tl = $('#testiList');
    D.TESTIMONIALS.forEach(function (t, k) {
      var f = document.createElement('figure');
      f.className = 'testi-card rv';
      f.innerHTML = '<blockquote>“' + esc(t.quote) + '”</blockquote><figcaption class="mono">' + esc(t.name) + (t.event ? ' · ' + esc(t.event) : '') + '</figcaption>';
      tl.appendChild(f); reveal(f, k);
    });
    $('#testi').hidden = false;
  }

  /* ---------- booking form → WhatsApp ---------- */
  var form = $('#bookForm'), err = $('#formErr');
  var dateIn = $('#fTanggal');
  dateIn.min = new Date().toISOString().slice(0, 10);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var nama = (fd.get('nama') || '').trim();
    var tanggal = fd.get('tanggal'), lokasi = fd.get('lokasi'), paket = fd.get('paket');
    var bad = [];
    [['nama', nama], ['tanggal', tanggal], ['lokasi', lokasi], ['paket', paket]].forEach(function (f) {
      var el = form.elements[f[0]]; var miss = !f[1]; el.classList.toggle('is-bad', miss); if (miss) bad.push(el);
    });
    if (bad.length) { err.textContent = 'Lengkapi nama, tanggal, lokasi dan paket dulu ya.'; bad[0].focus(); return; }
    err.textContent = '';
    var sesi = fd.getAll('sesi');
    var tgl = new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var lines = [
      'Halo Ilmi, saya ingin booking Alaksa Wedding 🤍',
      '',
      '*Nama:* ' + nama + ((fd.get('pasangan') || '').trim() ? ' & ' + fd.get('pasangan').trim() : ''),
      '*Tanggal acara:* ' + tgl,
      '*Lokasi:* ' + lokasi,
      '*Paket:* ' + paket
    ];
    if (sesi.length) lines.push('*Sesi:* ' + sesi.join(', '));
    var cat = (fd.get('catatan') || '').trim();
    if (cat) lines.push('*Catatan:* ' + cat);
    lines.push('', 'Apakah tanggal tersebut masih tersedia?');
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
  });
  form.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('is-bad'); });
})();
