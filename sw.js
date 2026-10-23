
const CACHE_NAME = "polina-offline-v2";

const OFFLINE_PAGE = new URL(
    "offline.html",
    self.registration.scope
).href;

const FAILED_IMAGE = new URL(
    "images/failed.png",
    self.registration.scope
).href;

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await cache.add(OFFLINE_PAGE);
            await cache.add(FAILED_IMAGE).catch(() => {});
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key =>
                        key.startsWith("polina-offline-") &&
                        key !== CACHE_NAME
                    )
                    .map(key => caches.delete(key))
            )
        )
    );

    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.mode !== "navigate") return;

    event.respondWith(
        fetch(event.request).catch(async () => {
            const cachedPage = await caches.match(OFFLINE_PAGE);

            if (cachedPage) {
                return cachedPage;
            }

            return new Response(
                "You are offline. Please check your connection and retry.",
                {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8"
                    }
                }
            );
        })
    );
});
