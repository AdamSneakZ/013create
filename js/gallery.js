(function () {
  'use strict';

  var currentCat = '';
  var currentImages = [];
  var currentIdx = 0;

  function enc(path) {
    return path.split('/').map(function (p) { return encodeURIComponent(p); }).join('/');
  }

  function imgSrc(cat, filename) {
    return enc('assets/photos/' + cat + '/' + filename);
  }

  function altText(cat, n) {
    var labels = {
      'automotive': 'Automotive photography by Adam Gofton — 013Create',
      'hotel-interiors': 'Hotel & interiors photography by Adam Gofton — 013Create',
      'food-beverage': 'Food & beverage photography by Adam Gofton — 013Create',
      'events': 'Events photography by Adam Gofton — 013Create',
      'portrait-fashion': 'Portrait & fashion photography by Adam Gofton — 013Create',
      'sports': 'Sports photography by Adam Gofton — 013Create'
    };
    return (labels[cat] || '013Create photography by Adam Gofton') + ', image ' + (n + 1);
  }

  /* Build rows from flat image array using pattern */
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

  /* Render category description text */
  function renderCategoryDesc(cat) {
    var info = (window.CATEGORY_INFO || {})[cat];
    var el = document.getElementById('catDesc');
    if (!el || !info) return;
    el.innerHTML =
      '<h2>' + info.subtitle + '</h2>' +
      info.copy.map(function (p) { return '<p>' + p + '</p>'; }).join('');
  }

  /* Main gallery renderer */
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
        img.src = imgSrc(cat, filename);
        img.alt = altText(cat, imgIdx);
        img.loading = 'lazy';
        img.decoding = 'async';

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

    /* Update active tab */
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
      img.alt = altText(currentCat, currentIdx);
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
  window.renderGalleryDirect = renderGallery;

  /* ── INIT ── */
  document.addEventListener('DOMContentLoaded', function () {

    /* Tab switching */
    document.querySelectorAll('.category-nav button').forEach(function (btn) {
      btn.addEventListener('click', function () { renderGallery(btn.dataset.category); });
    });

    var firstBtn = document.querySelector('.category-nav button');
    if (firstBtn) renderGallery(firstBtn.dataset.category);

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
