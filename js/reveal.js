(function () {
  'use strict';

  var SELECTORS = [
    '.section-title',
    '.home-body p',
    '.faq-item',
    '.video-item',
    '.video-page-header h1',
    '.video-page-header p',
    '.contact-wrap h1',
    '.contact-tagline',
    '.form-group',
    '.cat-page-header h1',
    '.cat-page-header h2',
    '.cat-copy p',
    '.cat-seo-below h2',
    '.cat-seo-below p',
    '.photo-page-header h1',
    '.social-footer'
  ].join(', ');

  function initReveal() {
    if (!('IntersectionObserver' in window)) return;

    var els = document.querySelectorAll(SELECTORS);

    /* Stagger siblings that share the same parent */
    var parentCounters = new Map();
    els.forEach(function (el) {
      el.classList.add('reveal');
      var parent = el.parentElement || document.body;
      var count = parentCounters.get(parent) || 0;
      var delay = Math.min(count * 90, 360);
      el.style.setProperty('--reveal-delay', delay + 'ms');
      parentCounters.set(parent, count + 1);
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { observer.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }

}());
