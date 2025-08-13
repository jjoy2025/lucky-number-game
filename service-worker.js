const CACHE_NAME = 'lucky-number-cache-v2'; // ক্যাশের নাম পরিবর্তন করা হয়েছে
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './favicon.png',
  './favicon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // নতুন সার্ভিস ওয়ার্কার দ্রুত সক্রিয় করার জন্য
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // পুরানো ক্যাশ মুছে ফেলা
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
