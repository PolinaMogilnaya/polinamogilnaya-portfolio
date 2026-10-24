/* Адрес этого скрипта нужен для регистрации service worker.
   currentScript доступен только пока скрипт выполняется, поэтому читаем сразу. */
const SCRIPT_URL = document.currentScript ? document.currentScript.src : "";


/* ===== ГЛАВНАЯ ВСЕГДА ОТКРЫВАЕТСЯ СВЕРХУ ===== */

if (document.querySelector(".work-grid")) {
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);
}


/* ===== МОБИЛЬНОЕ МЕНЮ ===== */

const menuButton = document.querySelector(".menu-button");
const siteMenu = document.querySelector(".site-menu");
const desktopQuery = window.matchMedia("(min-width: 700px)");

let savedScrollY = 0;

function setMenu(open) {
    if (!menuButton || !siteMenu) return;
    if (open === siteMenu.classList.contains("is-open")) return;

    siteMenu.classList.toggle("is-open", open);

    if (open) {
        // Запоминаем положение страницы и фиксируем её на месте
        savedScrollY = window.scrollY;
        document.body.style.top = `-${savedScrollY}px`;
        document.documentElement.classList.add("menu-open");
        document.body.classList.add("menu-open");
    } else {
        document.documentElement.classList.remove("menu-open");
        document.body.classList.remove("menu-open");
        document.body.style.top = "";

        // Возвращаемся на прежнее место мгновенно, без плавной прокрутки
        const root = document.documentElement;
        root.style.scrollBehavior = "auto";
        window.scrollTo(0, savedScrollY);
        root.style.scrollBehavior = "";
    }

    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

if (menuButton && siteMenu) {
    // Видимость закрытого меню на телефоне полностью решает CSS (visibility),
    // поэтому aria-hidden не нужен
    siteMenu.removeAttribute("aria-hidden");

    menuButton.addEventListener("click", () => {
        setMenu(!siteMenu.classList.contains("is-open"));
    });

    // Ссылка на текущую страницу: закрываем меню (например, work на главной)
    const normalize = path => path.replace(/index\.html$/, "");

    siteMenu.addEventListener("click", event => {
        const link = event.target.closest("a");

        if (link && normalize(link.pathname) === normalize(location.pathname)) {
            setMenu(false);
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && siteMenu.classList.contains("is-open")) {
            setMenu(false);
            menuButton.focus();
        }
    });

    // Окно стало широким: убираем блокировку страницы
    desktopQuery.addEventListener("change", event => {
        if (event.matches) setMenu(false);
    });

    // Возврат кнопкой «назад»: страница могла вернуться с открытым меню
    window.addEventListener("pageshow", event => {
        if (event.persisted) setMenu(false);
    });
}


/* ===== ПЛАВНОЕ ПОЯВЛЕНИЕ КАРТИНОК И ВИДЕО В <main> ===== */

function showMedia(media) {
    if (media.dataset.fadeHandled === "true") return;

    media.dataset.fadeHandled = "true";
    media.classList.remove("media-pending");
    media.classList.add("media-loaded");
}

function giveUp(media) {
    media.classList.remove("media-pending");
}

function prepareMedia(media) {
    if (media.dataset.fadeHandled === "true") return;

    const isImage = media.tagName === "IMG";
    const isReady = isImage
        ? media.complete && media.naturalWidth > 0
        : media.readyState >= 2;

    if (isReady) {
        showMedia(media);
        return;
    }

    // Картинка уже не загрузится: показываем как есть
    if (isImage && media.complete) {
        giveUp(media);
        return;
    }

    media.classList.add("media-pending");

    media.addEventListener(isImage ? "load" : "loadeddata", () => showMedia(media), { once: true });
    media.addEventListener("error", () => giveUp(media), { once: true });

    // Запасной вариант: видео не должно оставаться невидимым,
    // если телефон не подгружает его заранее
    window.setTimeout(() => {
        if (media.dataset.fadeHandled !== "true") {
            showMedia(media);
        }
    }, 3000);
}

document.querySelectorAll("main img, main video").forEach(prepareMedia);


/* ===== SERVICE WORKER ===== */

if ("serviceWorker" in navigator && SCRIPT_URL) {
    window.addEventListener("load", () => {
        // sw.js лежит рядом с script.js, поэтому путь не зависит от адреса сайта
        const swUrl = new URL("sw.js", SCRIPT_URL).href;

        navigator.serviceWorker.register(swUrl).catch(error => {
            console.error("Service Worker registration failed:", error);
        });
    });
}


/* ===== АНГЛИЙСКАЯ ТИПОГРАФИКА: ЗАЩИТА ОТ ВИСЯЧИХ ПРЕДЛОГОВ ===== */

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