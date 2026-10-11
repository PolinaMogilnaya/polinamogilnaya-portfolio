
const menuButton = document.querySelector(".menu-button");
const siteMenu = document.querySelector(".site-menu");

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
