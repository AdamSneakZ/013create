(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.getElementById('cookieBanner');
    if (!banner) return;
    if (localStorage.getItem('cookieConsent')) {
      banner.style.display = 'none';
      return;
    }
    var btnAccept = document.getElementById('cookieAccept');
    var btnDecline = document.getElementById('cookieDecline');
    if (btnAccept) btnAccept.addEventListener('click', function () {
      localStorage.setItem('cookieConsent', '1');
      banner.style.display = 'none';
    });
    if (btnDecline) btnDecline.addEventListener('click', function () {
      banner.style.display = 'none';
    });
  });
}());
