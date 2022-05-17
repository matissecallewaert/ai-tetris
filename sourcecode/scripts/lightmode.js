//Main toggle function, saves the current mode
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

//Executes the toggling of HTML-tags
function toggle() {
    document.body.classList.toggle("light-mode");
    let nav = document.querySelector("nav");
    nav.classList.toggle("light-mode");
    nav.classList.toggle("navbar-dark");
    nav.classList.toggle("navbar-light");
    document.querySelector("select").classList.toggle("light-mode");
}

//Initialise the toggling functionality
function init() {
    document.getElementById("toggleLight").innerText = "\u{1F31D}";
    if (localStorage.getItem("mode") === null) localStorage.setItem("mode", "dark")
    if (getMode() === "light") {
        toggle()
        document.getElementById("toggleLight").innerText = "\u{1F31A}"
    }
}

//Get current toggle mode
function getMode() {
    return localStorage.getItem("mode")
}

init()