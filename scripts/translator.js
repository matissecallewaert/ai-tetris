let defaultLocale = localStorage.getItem("locale");
let currentLocale;

let translations = {};

//Initialise locale and translate page when loaded
document.addEventListener("DOMContentLoaded", () => {
    if (defaultLocale === null) {
        localStorage.setItem("locale", "en");
        defaultLocale = "en";
    }
    setLocale(defaultLocale);
});

//Switch locale
async function setLocale(newLocale) {
    if (newLocale === currentLocale) return;
    let newTranslations =
        await getTranslationsFor(newLocale);
    currentLocale = newLocale;
    localStorage.setItem("locale", newLocale);
    translations = newTranslations;
    translatePage();
}

//Get translations for a locale
async function getTranslationsFor(newLocale) {
    let response = await fetch(`assets/lang/${newLocale}.json`);
    return await response.json();
}

//Translate all HTML elements containing a translator key
function translatePage() {
    document
        .querySelectorAll("[data-i18n-key]")
        .forEach(translateElement);
}

//Translate content of an HTML element
function translateElement(element) {
    let key = element.getAttribute("data-i18n-key");
    let translation = translations[key];
    //If text is surrounded by double quotes, don't show these in page
    if (translation[0] === '"')
        translation = translation.substring(1, translation.length - 1);
    element.innerText = translation;
}