/**
 * CLASS CADDY — Service Worker  (cc-sw.js)
 * Place this file in your project ROOT (same folder as study_plan.html)
 *
 * Strategy: Cache-first for static assets, network-first for Firebase.
 */

const CACHE_NAME   = 'cc-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/study_plan.html',
  '/study-plan-styles.css',
  '/cc-upgrades.css',
  '/cc-upgrades.js',
  '/images/cc-icon-full.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
];

/* ── INSTALL: cache static shell ─────── */
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url).catch(() => {})));
    })
  );
});

/* ── ACTIVATE: clean old caches ──────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: strategy routing ─────────── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin Firebase / Google APIs (they have their own caching)
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('googletagmanager')) return;

  // For everything else: cache-first, fall back to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses for static assets
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/study_plan.html');
        }
      });
    })
  );
});
