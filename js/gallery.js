(function () {
  'use strict';

  var currentCat = '';
  var currentImages = [];
  var currentIdx = 0;
  var _loading = {}; // prevent double-loading a category

  /* Load per-category data on demand */
  function loadCatData(cat, cb) {
    if ((window.GALLERY_DATA || {})[cat]) { cb(); return; }
    if (_loading[cat]) { return; } // already in flight
    _loading[cat] = true;
    var s = document.createElement('script');
    s.src = '/js/gallery-data-' + cat + '.js';
    s.onload = cb;
    s.onerror = cb;
    document.head.appendChild(s);
  }

  function enc(path) {
    return path.split('/').map(function (p) { return encodeURIComponent(p); }).join('/');
  }

  function imgSrc(cat, filename) {
    return enc('/assets/photos/' + cat + '/' + filename);
  }

  function thumbSrc(cat, filename) {
    var base = filename.replace(/\.[^.]+$/, '');
    return enc('/assets/photos/' + cat + '/thumbs/' + base + '.webp');
  }

  function altText(cat, filename, n) {
    var overrides = (window.GALLERY_ALT_TEXT || {})[cat] || {};
    if (overrides[filename]) return overrides[filename];
    var labels = {
      'automotive':       'Prestige automotive photography by Adam Gofton, 013Create — specialist car photographer UK',
      'hotel-interiors':  'Luxury hotel and interiors photography by Adam Gofton, 013Create — hospitality photography UK',
      'food-beverage':    'Commercial food and beverage photography by Adam Gofton, 013Create — culinary photography West Yorkshire',
      'events':           'Professional event photography by Adam Gofton, 013Create — corporate and brand event photographer UK',
      'portrait-fashion': 'Editorial portrait and fashion photography by Adam Gofton, 013Create — fashion photographer West Yorkshire',
      'sports':           'Action sports photography by Adam Gofton, 013Create — athlete and sports photographer UK'
    };
    return (labels[cat] || '013Create photography by Adam Gofton — West Yorkshire UK') + ', image ' + (n + 1);
  }

  function buildRows(images, pattern) {
    var rows = [];
    var idx = 0;
    var patIdx = 0;
    while (idx < images.length) {
      var count = pattern[Math.min(patIdx, pattern.length - 1)];
      var slice = images.slice(idx, Math.min(idx + count, images.length));
      if (slice.length > 0) rows.push(slice);
      idx += count;
      patIdx++;
    }
    return rows;
  }

  function renderCategoryDesc(cat) {
    var info = (window.CATEGORY_INFO || {})[cat];
    var el = document.getElementById('catDesc');
    if (!el || !info) return;
    el.innerHTML =
      '<h2>' + info.subtitle + '</h2>' +
      info.copy.map(function (p) { return '<p>' + p + '</p>'; }).join('');
  }

  function renderGallery(cat) {
    var data = window.GALLERY_DATA || {};
    var images = data[cat] || [];
    var patterns = window.GALLERY_ROW_PATTERNS || {};
    var pattern = patterns[cat] || [3];

    var grid = document.getElementById('galleryGrid');
    if (!grid) return;

    currentCat = cat;
    currentImages = images;

    renderCategoryDesc(cat);

    var container = document.createElement('div');
    container.className = 'gallery-rows';

    var imgIdx = 0;
    var rows = buildRows(images, pattern);

    rows.forEach(function (rowImages) {
      var row = document.createElement('div');
      row.className = 'gallery-row';

      rowImages.forEach(function (filename) {
        var item = document.createElement('div');
        item.className = 'gallery-item';

        var img = document.createElement('img');
        img.src = thumbSrc(cat, filename);
        img.alt = altText(cat, filename, imgIdx);
        img.loading = imgIdx === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';
        if (imgIdx === 0) img.fetchPriority = 'high';

        var positions = (window.GALLERY_POSITIONS || {})[cat] || {};
        if (positions[filename]) img.style.objectPosition = positions[filename];

        var capturedIdx = imgIdx++;
        item.addEventListener('click', function () { openLightbox(capturedIdx); });
        item.appendChild(img);
        row.appendChild(item);
      });

      container.appendChild(row);
    });

    grid.innerHTML = '';
    grid.appendChild(container);

    document.querySelectorAll('.category-nav button').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.category === cat);
    });
  }

  /* ── LIGHTBOX ── */
  function openLightbox(idx) {
    currentIdx = idx;
    updateLB();
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateLB() {
    var img = document.getElementById('lbImg');
    var counter = document.getElementById('lbCounter');
    if (img) {
      img.src = imgSrc(currentCat, currentImages[currentIdx]);
      img.alt = altText(currentCat, currentImages[currentIdx], currentIdx);
    }
    if (counter) counter.textContent = (currentIdx + 1) + ' / ' + currentImages.length;
  }

  function lbPrev() {
    currentIdx = (currentIdx - 1 + currentImages.length) % currentImages.length;
    updateLB();
  }

  function lbNext() {
    currentIdx = (currentIdx + 1) % currentImages.length;
    updateLB();
  }

  /* ── SINGLE-CATEGORY PAGE SUPPORT ── */
  window.renderGalleryDirect = function (cat) {
    loadCatData(cat, function () { renderGallery(cat); });
  };

  /* ── INIT ── */
  document.addEventListener('DOMContentLoaded', function () {

    /* Tab switching — load data file on demand */
    document.querySelectorAll('.category-nav button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadCatData(btn.dataset.category, function () {
          renderGallery(btn.dataset.category);
        });
      });
    });

    /* Initial render — data already on page via preloaded <script> */
    var firstBtn = document.querySelector('.category-nav button');
    if (firstBtn) {
      loadCatData(firstBtn.dataset.category, function () {
        renderGallery(firstBtn.dataset.category);
      });
    }

    /* Lightbox controls */
    var lb = document.getElementById('lightbox');
    var lbClose = document.getElementById('lbClose');
    var lbPrevBtn = document.getElementById('lbPrev');
    var lbNextBtn = document.getElementById('lbNext');

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrevBtn) lbPrevBtn.addEventListener('click', lbPrev);
    if (lbNextBtn) lbNextBtn.addEventListener('click', lbNext);
    if (lb) {
      lb.addEventListener('click', function (e) {
        if (e.target === lb) closeLightbox();
      });
    }

    document.addEventListener('keydown', function (e) {
      var lbEl = document.getElementById('lightbox');
      if (!lbEl || !lbEl.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lbPrev();
      if (e.key === 'ArrowRight') lbNext();
    });

    /* Cookie banner */
    var banner = document.getElementById('cookieBanner');
    if (banner) {
      if (localStorage.getItem('cookieConsent')) {
        banner.style.display = 'none';
      } else {
        var btnAccept = document.getElementById('cookieAccept');
        var btnDecline = document.getElementById('cookieDecline');
        if (btnAccept) btnAccept.addEventListener('click', function () {
          localStorage.setItem('cookieConsent', '1');
          banner.style.display = 'none';
        });
        if (btnDecline) btnDecline.addEventListener('click', function () {
          banner.style.display = 'none';
        });
      }
    }
  });

}());
