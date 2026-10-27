self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Returns a basic 200 OK response if the network fails, satisfying Chrome's install requirements.
      return new Response('HIYWA Connect is offline.', { 
        status: 200, 
        headers: { 'Content-Type': 'text/plain' } 
      });
    })
  );
});