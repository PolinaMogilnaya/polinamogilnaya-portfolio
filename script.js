
/* ===== ВСЕГДА ОТКРЫВАТЬ ГЛАВНУЮ СВЕРХУ ===== */

if (
    window.location.pathname.endsWith("/polinamogilnaya-portfolio/") ||
    window.location.pathname.endsWith("/polinamogilnaya-portfolio/index.html")
) {
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);
}



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

/* ===== ENGLISH TYPOGRAPHY: PREVENT WIDOWED WORDS ===== */

function fixEnglishWidows() {
    const shortWords = new Set([
        "a", "an", "the",
        "of", "in", "on", "at",
        "to", "for", "by", "up",
        "as", "or", "and", "nor",
        "with", "from", "into", "via"
    ]);

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parent = node.parentElement;

                if (!parent || !node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                if (
                    parent.closest(
                        "script, style, noscript, textarea, input, button, .site-menu"
                    )
                ) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const textNodes = [];
    let node;

    while ((node = walker.nextNode())) {
        textNodes.push(node);
    }

    textNodes.forEach(textNode => {
        textNode.nodeValue = textNode.nodeValue.replace(
            /(^|\s)(a|an|the|of|in|on|at|to|for|by|up|as|or|and|nor|with|from|into|via) +(?=\S)/gi,
            (match, prefix, word) => {
                if (!shortWords.has(word.toLowerCase())) {
                    return match;
                }

                return prefix + word + "\u00A0";
            }
        );
    });
}

fixEnglishWidows();
