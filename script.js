
const menuButton = document.querySelector(".menu-button");
const siteMenu = document.querySelector(".site-menu");

/* ===== МОБИЛЬНОЕ МЕНЮ ===== */

if (menuButton && siteMenu) {
    menuButton.addEventListener("click", () => {
        const isOpen = siteMenu.classList.toggle("is-open");

        menuButton.setAttribute("aria-expanded", String(isOpen));
        siteMenu.setAttribute("aria-hidden", String(!isOpen));
        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Close menu" : "Open menu"
        );
    });
}

/* ===== ФЕЙД-ИН ИЗОБРАЖЕНИЙ И ВИДЕО ===== */

function showMedia(media) {
    if (media.dataset.fadeHandled === "true") return;

    media.dataset.fadeHandled = "true";
    media.classList.remove("media-pending");
    media.classList.add("media-loaded");
}

function prepareMedia(media) {
    if (media.dataset.fadeHandled === "true") return;

    if (media.tagName === "IMG") {
        if (media.complete) {
            if (media.naturalWidth > 0) {
                showMedia(media);
            } else {
                media.classList.remove("media-pending");
            }
            return;
        }

        media.classList.add("media-pending");

        media.addEventListener("load", () => {
            showMedia(media);
        }, { once: true });

        media.addEventListener("error", () => {
            media.classList.remove("media-pending");
        }, { once: true });

        return;
    }

    if (media.readyState >= 2) {
        showMedia(media);
        return;
    }

    media.classList.add("media-pending");

    media.addEventListener("loadeddata", () => {
        showMedia(media);
    }, { once: true });

    media.addEventListener("error", () => {
        media.classList.remove("media-pending");
    }, { once: true });
}

document.querySelectorAll("img, video").forEach(prepareMedia);

/* ===== SERVICE WORKER ===== */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register(
            "/polinamogilnaya-portfolio/sw.js"
        ).catch(error => {
            console.error("Service Worker registration failed:", error);
        });
    });
}
