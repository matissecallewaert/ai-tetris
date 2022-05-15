//with this code "Toggle Dark" is very blurry, no idea why"

/*

let togLight = document.getElementById("toggleLight");
if (togLight.innerText == "Toggle Light") togLight.innerText = "Toggle Dark";
else togLight.innerText = "Toggle Light";
*/

//maybe add some kind of global variable bool isDark to initiate toggleLight() on every page once it's toggled on.

function toggleLight() {
    toggle()
    if (getMode() === "dark") {
        localStorage.setItem("mode", "light")
        document.getElementById("toggleLight").innerText = "\u{1F31A}"
    } else {
        localStorage.setItem("mode", "dark")
        document.getElementById("toggleLight").innerText = "\u{1F31D}"
    }
}

function toggle() {
    document.body.classList.toggle("light-mode");
    let nav = document.querySelector("nav");
    nav.classList.toggle("light-mode");
    nav.classList.toggle("navbar-dark");
    nav.classList.toggle("navbar-light");
    document.querySelector("select").classList.toggle("light-mode");
}

function init() {
    document.getElementById("toggleLight").innerText = "\u{1F31D}";
    if (localStorage.getItem("mode") === null) localStorage.setItem("mode", "dark")
    if (getMode() === "light") {
        toggle()
        document.getElementById("toggleLight").innerText = "\u{1F31A}"
    }
}

function getMode() {
    return localStorage.getItem("mode")
}

init()