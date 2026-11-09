/* StorySpark: install button, offline notice and update prompt. */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }

  var bar = el('div', 'pwa-bar'); bar.hidden = true; bar.setAttribute('role', 'status'); bar.setAttribute('aria-live', 'polite');
  document.body.appendChild(bar);
  var timer = 0;
  function say(msg, buttons, ms) {
    clearTimeout(timer); bar.textContent = '';
    bar.appendChild(el('span', 'pwa-msg', msg));
    (buttons || []).forEach(function (b) { var x = el('button', 'pwa-btn' + (b.ghost ? ' pwa-ghost' : ''), b.text); x.type = 'button'; x.addEventListener('click', b.fn); bar.appendChild(x); });
    bar.hidden = false;
    if (ms) timer = setTimeout(hide, ms);
  }
  function hide() { bar.hidden = true; }

  // Install button (Chrome, Edge, Android)
  var deferred = null, installBtn = null;
  var header = document.querySelector('header.top');
  if (header && !standalone) {
    installBtn = el('button', 'btn btn-ghost pwa-install', '📲 Install'); installBtn.type = 'button'; installBtn.hidden = true;
    installBtn.setAttribute('aria-label', 'Install StorySpark as an app');
    var lib = document.getElementById('btn-lib'); header.insertBefore(installBtn, lib || null);
    installBtn.addEventListener('click', function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; installBtn.hidden = true; });
    });
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; if (installBtn) installBtn.hidden = false; });
  window.addEventListener('appinstalled', function () { deferred = null; if (installBtn) installBtn.hidden = true; say('StorySpark is installed. Open it from your home screen.', [], 5000); });

  // iPhone / iPad hint (Safari has no install button)
  var ua = navigator.userAgent || '';
  var ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var safari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  if (ios && safari && !standalone && !store.get('ss-ios-hint')) {
    setTimeout(function () {
      say('To install: tap Share, then “Add to Home Screen”.', [{ text: 'Got it', fn: function () { store.set('ss-ios-hint', '1'); hide(); } }]);
    }, 2500);
  }

  // Offline notice
  window.addEventListener('offline', function () { say('You are offline. Your saved stories and the built-in story maker still work.', [], 6000); });
  window.addEventListener('online', function () { say('Back online.', [], 2500); });

  // Register the service worker
  var reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (reloading) return; reloading = true; location.reload(); });
  navigator.serviceWorker.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'CACHED' && !store.get('ss-offline-ready')) { store.set('ss-offline-ready', '1'); say('Ready to use offline.', [], 4000); }
  });

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(function (reg) {
      function offerUpdate(w) {
        say('A new version is ready.', [{ text: 'Refresh', fn: function () { w.postMessage({ type: 'SKIP_WAITING' }); } }, { text: 'Later', ghost: true, fn: hide }]);
      }
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var w = reg.installing; if (!w) return;
        w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(w); });
      });
      // Save every file this page used, so fonts and other assets work offline too.
      navigator.serviceWorker.ready.then(function (r) {
        var urls = [location.origin + '/'];
        try { performance.getEntriesByType('resource').forEach(function (x) { if (x.name.indexOf(location.origin) === 0) urls.push(x.name); }); } catch (e) {}
        if (r.active) r.active.postMessage({ type: 'CACHE_URLS', urls: urls });
      });
    }).catch(function () {});
  });
})();
