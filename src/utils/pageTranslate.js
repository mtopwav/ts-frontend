/**
 * Full-page language: keep the React UI in English, then let Google Translate
 * convert the entire DOM to Swahili. That covers hardcoded labels without
 * needing a t.key for every string.
 */

const SCRIPT_ID = "thiago-google-translate-script";
const HOST_ID = "google_translate_element";

function setGoogTransCookie(value) {
  const hostname = window.location.hostname;
  const expires = "expires=Thu, 01 Jan 2099 00:00:00 GMT";
  document.cookie = `googtrans=${value};path=/;${expires}`;
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    document.cookie = `googtrans=${value};path=/;domain=${hostname};${expires}`;
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      const parent = `.${parts.slice(-2).join(".")}`;
      document.cookie = `googtrans=${value};path=/;domain=${parent};${expires}`;
    }
  }
}

function clearGoogTransCookie() {
  const hostname = window.location.hostname;
  const past = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=;path=/;${past}`;
  document.cookie = `googtrans=/en/en;path=/;${past}`;
  if (hostname && hostname !== "localhost") {
    document.cookie = `googtrans=;path=/;domain=${hostname};${past}`;
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      document.cookie = `googtrans=;path=/;domain=.${parts.slice(-2).join(".")};${past}`;
    }
  }
}

function ensureHostElement() {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(host);
  }
  return host;
}

function triggerCombo(lang) {
  const select = document.querySelector(".goog-te-combo");
  if (!select) return false;
  const value = lang === "sw" ? "sw" : "en";
  select.value = value;
  select.dispatchEvent(new Event("change"));
  return true;
}

/**
 * Load the Google Translate widget once (hidden).
 */
export function initPageTranslate() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  ensureHostElement();

  try {
    const saved = localStorage.getItem("appLanguage");
    if (saved === "sw") {
      setGoogTransCookie("/en/sw");
    }
  } catch {
    /* ignore */
  }

  window.googleTranslateElementInit = function googleTranslateElementInit() {
    if (!window.google?.translate?.TranslateElement) return;
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: "en,sw",
        autoDisplay: false,
        multilanguagePage: false,
      },
      HOST_ID
    );

    const saved = localStorage.getItem("appLanguage");
    if (saved === "sw") {
      setTimeout(() => triggerCombo("sw"), 400);
    }
  };

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  } else if (window.google?.translate?.TranslateElement) {
    window.googleTranslateElementInit();
  }
}

/**
 * Switch full-page language. Reloads so every label is translated consistently.
 */
export function applyPageLanguage(lang, { reload = true } = {}) {
  const next = lang === "sw" ? "sw" : "en";

  if (next === "sw") {
    setGoogTransCookie("/en/sw");
  } else {
    clearGoogTransCookie();
    setGoogTransCookie("/en/en");
  }

  if (!reload) {
    triggerCombo(next);
    return next;
  }

  window.location.reload();
  return next;
}

export function getPageTranslateTarget() {
  try {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (match && decodeURIComponent(match[1]).includes("/sw")) return "sw";
  } catch {
    /* ignore */
  }
  return "en";
}
