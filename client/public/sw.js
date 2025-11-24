// Simple service worker that doesn't cache anything
// Just registers to avoid console warnings

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Don't cache anything, just pass through
  event.respondWith(fetch(event.request));
});
