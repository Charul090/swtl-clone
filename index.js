import { router } from './main';

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
    console.log('service worker installed', event);
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        self.clients.claim()
      );
    console.log('service worker activated', event);
});

self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        console.log('fetch', event);
        event.respondWith(router.handleRequest(event.request));
    }
});