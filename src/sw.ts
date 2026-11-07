/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 })],
    networkTimeoutSeconds: 10,
  })
);

registerRoute(
  ({ url }) => url.hostname === "res.cloudinary.com",
  new CacheFirst({
    cacheName: "cloudinary-images",
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Notifications sur téléphone ─────────────────────────────────
self.addEventListener("push", (event) => {
  let message: { title?: string; body?: string; url?: string; tag?: string } = {};
  try { message = event.data?.json() ?? {}; } catch { message = { body: event.data?.text() }; }
  event.waitUntil(
    self.registration.showNotification(message.title || "ShopM", {
      body: message.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: message.tag || undefined,
      data: { url: message.url || "/" },
    })
  );
});

// Un appui ouvre la page concernée, dans la fenêtre ShopM déjà ouverte si possible.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find(w => new URL(w.url).origin === self.location.origin);
    if (existing) {
      await existing.focus();
      await existing.navigate(url);
      return;
    }
    await self.clients.openWindow(url);
  })());
});
