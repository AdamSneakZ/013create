(function () {
  'use strict';

  var currentCat = '';
  var currentImages = [];
  var currentIdx = 0;
  var _loading = {};

  function loadCatData(cat, cb) {
    if ((window.GALLERY_DATA || {})[cat]) { cb(); return; }
    if (_loading[cat]) { return; }
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

  function makeGalleryItem(cat, filename, imgIdx, isFirst) {
    var item = document.createElement('div');
    item.className = 'gallery-item';
    var img = document.createElement('img');
    img.src = thumbSrc(cat, filename);
    img.alt = altText(cat, filename, imgIdx);
    img.loading = isFirst ? 'eager' : 'lazy';
    img.decoding = 'async';
    if (isFirst) img.fetchPriority = 'high';
    var pos = (window.GALLERY_POSITIONS || {})[cat] || {};
    if (pos[filename]) img.style.objectPosition = pos[filename];
    item.appendChild(img);
    return item;
  }

  function renderGallery(cat) {
    var grid = document.getElementById('galleryGrid');
    if (!grid) return;

    var data = window.GALLERY_DATA || {};
    var images = data[cat] || [];
    var patterns = window.GALLERY_ROW_PATTERNS || {};
    var pattern = patterns[cat] || [3];

    currentCat = cat;
    currentImages = images;
    renderCategoryDesc(cat);

    // Check for the static first row (present in HTML for fast LCP)
    var staticRow = grid.querySelector('[data-static-row]');

    if (staticRow && cat === 'automotive') {
      // Static row is already in the DOM and already painted — preserve it.
      // Wire lightbox click handlers to its items.
      var staticItems = staticRow.querySelectorAll('.gallery-item');
      staticItems.forEach(function (item, i) {
        // Replace any previously-attached handler by cloning
        var fresh = item.cloneNode(true);
        fresh.addEventListener('click', function () { openLightbox(i); });
        item.parentNode.replaceChild(fresh, item);
      });

      // Remove any previously-appended dynamic rows
      var prev = grid.querySelector('[data-dynamic]');
      if (prev) prev.parentNode.removeChild(prev);

      // Append rows 2 onwards (skip the 3 images already in the static row)
      var firstRowCount = pattern[0] || 3;
      var remaining = images.slice(firstRowCount);
      var remainPat = pattern.length > 1 ? pattern.slice(1) : [pattern[pattern.length - 1]];
      var rows = buildRows(remaining, remainPat);

      if (rows.length > 0) {
        var container = document.createElement('div');
        container.setAttribute('data-dynamic', '');
        var imgIdx = firstRowCount;
        rows.forEach(function (rowImages) {
          var row = document.createElement('div');
          row.className = 'gallery-row';
          rowImages.forEach(function (filename) {
            var item = makeGalleryItem(cat, filename, imgIdx, false);
            var capturedIdx = imgIdx++;
            item.addEventListener('click', function () { openLightbox(capturedIdx); });
            row.appendChild(item);
          });
          container.appendChild(row);
        });
        grid.appendChild(container);
      }

    } else {
      // Full render: clear grid and build all rows.
      // Used for tab switches (CLS from user interaction is not measured).
      grid.innerHTML = '';
      var container = document.createElement('div');
      container.setAttribute('data-dynamic', '');
      container.className = 'gallery-rows';
      var imgIdx = 0;
      buildRows(images, pattern).forEach(function (rowImages) {
        var row = document.createElement('div');
        row.className = 'gallery-row';
        rowImages.forEach(function (filename) {
          var isFirst = imgIdx === 0;
          var item = makeGalleryItem(cat, filename, imgIdx, isFirst);
          var capturedIdx = imgIdx++;
          item.addEventListener('click', function () { openLightbox(capturedIdx); });
          row.appendChild(item);
        });
        container.appendChild(row);
      });
      grid.appendChild(container);
    }

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

    document.querySelectorAll('.category-nav button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadCatData(btn.dataset.category, function () {
          renderGallery(btn.dataset.category);
        });
      });
    });

    var firstBtn = document.querySelector('.category-nav button');
    if (firstBtn) {
      loadCatData(firstBtn.dataset.category, function () {
        renderGallery(firstBtn.dataset.category);
      });
    }

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
