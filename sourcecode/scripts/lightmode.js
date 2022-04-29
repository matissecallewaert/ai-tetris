function toggleLight() {
    document.body.classList.toggle("light-mode");
    let nav = document.querySelector("nav");
    nav.classList.toggle("light-mode");
    nav.classList.toggle("navbar-dark");
    nav.classList.toggle("navbar-light");

    //with this code "Toggle Dark" is very blurry, no idea why"

    /* 

    let togLight = document.getElementById("toggleLight");
    if (togLight.innerText == "Toggle Light") togLight.innerText = "Toggle Dark";
    else togLight.innerText = "Toggle Light"; 
    */

    //maybe add some kind of global variable bool isDark to initiate toggleLight() on every page once it's toggled on.
}