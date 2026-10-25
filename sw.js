/* Что делает этот service worker:
   - страницы, стили и скрипты: сначала сеть (правки на сайте видны сразу),
     без сети берутся из кэша, а если страницы там нет, показывается offline.html;
   - картинки: сразу из кэша, а в фоне обновляются; не загрузилась картинка, то показывается failed.png;
   - видео не кэшируются (браузеры запрашивают их кусками). */

const CACHE_NAME = "polina-v4";
const MAX_ENTRIES = 120;

const toUrl = path => new URL(path, self.registration.scope).href;

const OFFLINE_PAGE = toUrl("offline.html");
const FAILED_IMAGE = toUrl("images/failed.webp");

// Кэшируется сразу при установке (проекты и остальные картинки попадают в кэш по мере посещения)
const CORE_FILES = [
    "./",
    "index.html",
    "about.html",
    "contact.html",
    "offline.html",
    "style.css",
    "script.js",
    "images/logo.webp",
    "images/stamp.webp",
    "images/failed.webp"
].map(toUrl);


self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.all(
                CORE_FILES.map(url => cache.add(url).catch(() => {}))
            )
        )
    );

    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key.startsWith("polina-") && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );

    self.clients.claim();
});


/* Не даём кэшу бесконечно расти: удаляем самые старые, кроме основных файлов */
async function trimCache(cache) {
    const keys = await cache.keys();
    const removable = keys.filter(request => !CORE_FILES.includes(request.url));
    const extra = keys.length - MAX_ENTRIES;

    for (let i = 0; i < extra && i < removable.length; i++) {
        await cache.delete(removable[i]);
    }
}

async function saveToCache(cache, request, response) {
    await cache.put(request, response);
    await trimCache(cache);
}


/* Страницы, CSS и JS: сначала сеть */
async function networkFirst(event, isPage) {
    const { request } = event;
    const cache = await caches.open(CACHE_NAME);

    try {
        const response = await fetch(request);

        // Перенаправления и ошибки в кэш не кладём
        if (response.ok && !response.redirected) {
            event.waitUntil(saveToCache(cache, request, response.clone()));
        }

        return response;
    } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: true });

        if (cached) return cached;

        if (isPage) {
            const offline = await cache.match(OFFLINE_PAGE);

            if (offline) return offline;

            return new Response(
                "You are offline. Please check your connection and retry.",
                {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: { "Content-Type": "text/plain; charset=utf-8" }
                }
            );
        }

        return Response.error();
    }
}

/* Картинки: из кэша сразу, в фоне обновляем */
async function imageHandler(event) {
    const { request } = event;
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const fromNetwork = fetch(request)
        .then(response => {
            if (response.ok) {
                event.waitUntil(saveToCache(cache, request, response.clone()));
            }

            return response;
        })
        .catch(() => null);

    if (cached) {
        event.waitUntil(fromNetwork);
        return cached;
    }

    const response = await fromNetwork;

    if (response) return response;

    return (await cache.match(FAILED_IMAGE)) || Response.error();
}


self.addEventListener("fetch", event => {
    const { request } = event;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) return;

    // Видео и частичные запросы браузер должен обработать сам
    if (
        request.destination === "video" ||
        request.destination === "audio" ||
        request.headers.has("range")
    ) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(networkFirst(event, true));
        return;
    }

    if (request.destination === "image") {
        event.respondWith(imageHandler(event));
        return;
    }

    if (request.destination === "style" || request.destination === "script") {
        event.respondWith(networkFirst(event, false));
    }
});
