/* Self-destructing service worker.
 *
 * A short-lived PWA rollout registered a workbox service worker at this same
 * URL (/sw.js) that ended up intercepting navigation to
 * /oauth2/authorization/azure-dev, breaking Outlook login for every role.
 * PWA support has been removed from the build, but simply deleting the old
 * sw.js from the server does NOT unregister it from browsers that already
 * installed it: a 404 on a service worker's own update check just means
 * "update failed, keep running the old one" — it does not unregister it.
 *
 * A browser's check for whether ITS OWN service worker script changed is
 * guaranteed by spec to bypass that worker's fetch handler, so replacing
 * this file's content (same URL, different bytes) is the one update an
 * already-broken worker cannot intercept or block. This new version does
 * nothing but wipe every cache, unregister itself, and force any open tab
 * back onto the network — then gets out of the way.
 *
 * Safe to delete this file (and the matching unregister bootstrap in
 * src/main.tsx) once enough time has passed that no affected browser is
 * likely still out there.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clientsList = await self.clients.matchAll({ type: 'window' });
      clientsList.forEach((client) => client.navigate(client.url));
    })()
  );
});
