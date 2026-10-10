
const menuButton = document.querySelector(".menu-button");
const siteMenu = document.querySelector(".site-menu");

menuButton.addEventListener("click", () => {
    const isOpen = siteMenu.classList.toggle("is-open");

    menuButton.setAttribute("aria-expanded", isOpen);
    siteMenu.setAttribute("aria-hidden", !isOpen);
    menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu"
    );
});
