// Web Push service worker for Tech Handlers admin notifications.
// v2: avoids invalid NotificationOptions that can silently drop pushes.

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || 'Tech Handlers';
  const targetUrl = data.url || '/admin';
  const options = {
    body: data.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: targetUrl },
    ...(data.tag ? { tag: data.tag, renotify: true } : {}),
  };
  event.waitUntil((async () => {
    try {
      await self.registration.showNotification(title, options);
    } catch (error) {
      console.error('showNotification failed, retrying with safe options', error);
      await self.registration.showNotification(title, {
        body: data.body || '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { url: targetUrl },
      });
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/admin', self.location.origin).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      try {
        const u = new URL(c.url);
        if (u.origin === self.location.origin) {
          await c.focus();
          await c.navigate(url);
          return;
        }
      } catch (_) {}
    }
    await self.clients.openWindow(url);
  })());
});