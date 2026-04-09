self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Simple pass-through for now, just to satisfy PWA requirements
  e.respondWith(fetch(e.request));
});
