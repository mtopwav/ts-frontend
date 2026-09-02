/**
 * Full-page language: React UI stays English; Google Translate converts the DOM
 * to Swahili silently (no banner / spinner). Language is portal-scoped
 * (admin / boma / geita) so one portal does not change another.
 */

import { getCurrentLanguage } from "./translations";
import { getSectionFromPath, getSectionFromWindow } from "./settingsSection";

const SCRIPT_ID = "thiago-google-translate-script";
const HOST_ID = "google_translate_element";
const HIDE_STYLE_ID = "thiago-hide-gt-runtime";
const SETTLING_CLASS = "thiago-lang-settling";

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

function ensureHideStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(HIDE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HIDE_STYLE_ID;
  style.textContent = `
    .goog-te-banner-frame,.goog-te-banner-frame.skiptranslate,iframe.goog-te-banner-frame,
    .goog-te-balloon-frame,#goog-gt-tt,.goog-te-spinner-pos,.goog-te-spinner-animation,
    .goog-te-spinner,.VIpgJd-ZVi9od-ORHb,.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-l4eHX-hSRGPd,
    body>.skiptranslate:not(#google_translate_element){
      display:none!important;visibility:hidden!important;height:0!important;width:0!important;
      max-height:0!important;opacity:0!important;pointer-events:none!important;
      position:absolute!important;left:-9999px!important;z-index:-1!important;
    }
    html{margin-top:0!important}
    body{top:0!important;position:static!important}
    #google_translate_element{
      position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;
      overflow:hidden!important;opacity:0!important;pointer-events:none!important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function ensureHostElement() {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(host);
  }
  return host;
}

function endLangSettling() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(SETTLING_CLASS);
}

function beginLangSettling() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.add(SETTLING_CLASS);
}

/** Hide Google Translate banner / spinner without destroying the widget. */
function hideGoogleTranslateChrome() {
  if (typeof document === "undefined") return;
  ensureHideStyles();

  const hideEl = (el) => {
    if (!el || el.id === HOST_ID) return;
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("opacity", "0", "important");
    el.style.setProperty("height", "0", "important");
    el.style.setProperty("max-height", "0", "important");
    el.style.setProperty("width", "0", "important");
    el.style.setProperty("pointer-events", "none", "important");
    el.style.setProperty("position", "absolute", "important");
    el.style.setProperty("left", "-9999px", "important");
    el.style.setProperty("z-index", "-1", "important");
  };

  document
    .querySelectorAll(
      [
        ".goog-te-banner-frame",
        "iframe.goog-te-banner-frame",
        ".goog-te-balloon-frame",
        "#goog-gt-tt",
        ".goog-te-spinner-pos",
        ".goog-te-spinner-animation",
        ".goog-te-spinner",
        ".VIpgJd-ZVi9od-ORHb",
        ".VIpgJd-ZVi9od-ORHb-OEVmcd",
        ".VIpgJd-ZVi9od-l4eHX-hSRGPd",
      ].join(",")
    )
    .forEach(hideEl);

  document.querySelectorAll("body > .skiptranslate").forEach((el) => {
    if (el.id === HOST_ID) return;
    hideEl(el);
  });

  if (document.body) {
    document.body.style.setProperty("top", "0", "important");
    document.body.style.setProperty("position", "static", "important");
  }
  if (document.documentElement) {
    document.documentElement.style.setProperty("margin-top", "0", "important");
  }
}

function startChromeGuard() {
  if (typeof window === "undefined" || window.__thiagoGtBannerGuard) return;
  window.__thiagoGtBannerGuard = true;

  ensureHideStyles();
  hideGoogleTranslateChrome();

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      hideGoogleTranslateChrome();
    });
  });

  const start = () => {
    if (!document.body) return;
    observer.observe(document.documentElement, { childList: true, subtree: true });
    hideGoogleTranslateChrome();
  };

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);

  let ticks = 0;
  const timer = setInterval(() => {
    hideGoogleTranslateChrome();
    ticks += 1;
    if (ticks >= 60) clearInterval(timer);
  }, 200);
}

function triggerCombo(lang) {
  const select = document.querySelector(".goog-te-combo");
  if (!select) return false;
  const value = lang === "sw" ? "sw" : "en";
  if (select.value === value) {
    hideGoogleTranslateChrome();
    return true;
  }
  select.value = value;
  select.dispatchEvent(new Event("change"));
  hideGoogleTranslateChrome();
  setTimeout(hideGoogleTranslateChrome, 100);
  setTimeout(hideGoogleTranslateChrome, 400);
  setTimeout(hideGoogleTranslateChrome, 1000);
  return true;
}

function revealWhenReady() {
  hideGoogleTranslateChrome();
  // Give Google a short window to finish DOM rewrite under the cover
  const delays = [600, 1200, 2000, 3200];
  delays.forEach((ms, i) => {
    setTimeout(() => {
      hideGoogleTranslateChrome();
      if (i === delays.length - 1) endLangSettling();
    }, ms);
  });
  // Hard fallback so UI never stays covered
  setTimeout(endLangSettling, 4500);
}

/**
 * Load the Google Translate widget once (hidden).
 */
export function initPageTranslate(section = "") {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  ensureHideStyles();
  ensureHostElement();
  startChromeGuard();

  const resolved = section || getSectionFromWindow();
  let saved = "en";
  try {
    saved = getCurrentLanguage(resolved);
    if (saved === "sw") {
      beginLangSettling();
      setGoogTransCookie("/en/sw");
    } else {
      endLangSettling();
      clearGoogTransCookie();
      setGoogTransCookie("/en/en");
    }
  } catch {
    endLangSettling();
  }

  window.googleTranslateElementInit = function googleTranslateElementInit() {
    if (!window.google?.translate?.TranslateElement) {
      endLangSettling();
      return;
    }

    const layout =
      window.google.translate.TranslateElement.InlineLayout?.SIMPLE;

    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: "en,sw",
        autoDisplay: false,
        multilanguagePage: false,
        ...(layout != null ? { layout } : {}),
      },
      HOST_ID
    );

    hideGoogleTranslateChrome();

    const lang = getCurrentLanguage(getSectionFromWindow());
    if (lang === "sw") {
      setTimeout(() => {
        triggerCombo("sw");
        revealWhenReady();
      }, 350);
    } else {
      endLangSettling();
    }
  };

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => endLangSettling();
    document.body.appendChild(script);
  } else if (window.google?.translate?.TranslateElement) {
    window.googleTranslateElementInit();
  } else if (saved !== "sw") {
    endLangSettling();
  }
}

/**
 * Switch full-page language for a portal. Reloads so labels stay consistent.
 */
export function applyPageLanguage(lang, { reload = true, section = "" } = {}) {
  const next = lang === "sw" ? "sw" : "en";
  const resolved = section || getSectionFromWindow();

  if (next === "sw") {
    beginLangSettling();
    setGoogTransCookie("/en/sw");
  } else {
    endLangSettling();
    clearGoogTransCookie();
    setGoogTransCookie("/en/en");
  }

  if (!reload) {
    triggerCombo(next);
    if (next === "sw") revealWhenReady();
    else endLangSettling();
    return next;
  }

  window.location.reload();
  return next;
}

/**
 * When navigating between portals, apply that portal's saved language
 * without changing another portal's stored preference.
 */
export function syncPageLanguageForPath(pathname = "") {
  const section = getSectionFromPath(pathname);
  if (!section) {
    endLangSettling();
    clearGoogTransCookie();
    setGoogTransCookie("/en/en");
    triggerCombo("en");
    return "en";
  }

  const wanted = getCurrentLanguage(section);
  const active = getPageTranslateTarget();
  if (wanted === active) {
    if (typeof document !== "undefined") {
      document.documentElement.lang = wanted;
    }
    if (wanted !== "sw") endLangSettling();
    return wanted;
  }

  return applyPageLanguage(wanted, { reload: true, section });
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
