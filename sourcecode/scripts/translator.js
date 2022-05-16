let defaultLocale = localStorage.getItem("locale");

let locale;

let translations = {};

document.addEventListener("DOMContentLoaded", () => {

    if (defaultLocale === null) {
        localStorage.setItem("locale", "en");
        defaultLocale = localStorage.getItem("locale");
    }

    setLocale(defaultLocale);

    bindLocaleSwitcher(defaultLocale);
});

async function setLocale(newLocale) {
    if (newLocale === locale) return;

    const newTranslations =
        await fetchTranslationsFor(newLocale);

    locale = newLocale;
    localStorage.setItem("locale", newLocale);
    translations = newTranslations;

    translate_page();
}

async function fetchTranslationsFor(newLocale) {
    const response = await fetch(`assets/lang/${newLocale}.json`);
    return await response.json();
}

function translate_page() {
    document
        .querySelectorAll("[data-i18n-key]")
        .forEach(translateElement);
}

function translateElement(element) {
    const key = element.getAttribute("data-i18n-key");
    let translation = translations[key];
    if (translation[0] === '"') {
        translation = translation.substring(1, translation.length - 1);
    }
    //console.log(`${translation}`)
    element.innerText = translation;
}

function bindLocaleSwitcher(initialValue) {
    const switcher =
        document.querySelector("[data-i18n-switcher]");
    switcher.value = initialValue;
    switcher.onchange = (e) => {
        setLocale(e.target.value);
    };
}