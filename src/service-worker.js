/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (
  /** @type {unknown} */ (self)
);

import { build, files, version } from "$service-worker";

const CACHE = `cache-${version}`;

const ASSETS = [...build, ...files];

sw.addEventListener("install", (event) => {
  async function addFilesToCacheAndNotify() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);

    if (sw.registration.active) {
      const clients = await sw.clients.matchAll({ includeUncontrolled: true });
      clients.forEach((client) => {
        client.postMessage({ type: "update-available" });
      });
    }
  }

  event.waitUntil(addFilesToCacheAndNotify());
});

sw.addEventListener("activate", (event) => {
  async function activateAndClaim() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
    await sw.clients.claim();
  }

  event.waitUntil(activateAndClaim());
});

sw.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE);
    const request = event.request;

    // Cache First for Assets
    if (ASSETS.includes(url.pathname)) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      try {
        const response = await fetch(request);
        if (response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        console.error(`Failed to fetch asset: ${url.pathname}`, err);
        throw err;
      }
    }

    // Network First for Navigation
    if (request.mode === "navigate") {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          try {
            cache.put(request, networkResponse.clone());
          } catch (error) {
            console.error(
              `Failed to cache response for request: ${url.pathname}`,
              error
            );
          }
          return networkResponse;
        }
      } catch (err) {
        console.warn(
          `Failed to fetch navigation request from network: ${url.pathname}`,
          err
        );
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        throw err;
      }
    }

    // Network First for Others
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok && request.method === "GET") {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (err) {
      console.warn(`Failed to fetch from network: ${url.pathname}`, err);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw err;
    }
  }

  event.respondWith(respond());
});