import { render } from './render';
import { html } from './main';

self.addEventListener('install', (event) => {
    console.log('service worker installed', event);
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
    console.log('service worker activated random', event);
});

self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(render(html));
    }
});