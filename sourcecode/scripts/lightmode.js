function toggleLight() {
    document.body.classList.toggle("light-mode");
    let nav = document.querySelector("nav");
    nav.classList.toggle("light-mode");
    nav.classList.toggle("navbar-dark");
    nav.classList.toggle("navbar-light");
}