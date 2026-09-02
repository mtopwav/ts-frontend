import { getSectionFromPath, getSectionFromWindow } from "./settingsSection";

const THEME_KEY = "systemTheme";
export const DEFAULT_THEME = "light";

function themeKey(section = "") {
  return section ? `${THEME_KEY}_${section}` : THEME_KEY;
}

function normalizeTheme(theme) {
  return theme === "dark" ? "dark" : DEFAULT_THEME;
}

/**
 * Apply theme to the document for the current view.
 * When `section` is set, preference is saved only for that portal
 * (admin / boma / geita) and does not overwrite other portals.
 * Default theme is always light.
 */
export function applyTheme(theme = DEFAULT_THEME, section = "") {
  const root = document.documentElement;
  const resolved = normalizeTheme(theme);
  const isDark = resolved === "dark";

  root.classList.toggle("dark-theme", isDark);

  if (section) {
    localStorage.setItem(themeKey(section), resolved);
  } else {
    localStorage.setItem(THEME_KEY, resolved);
  }

  window.dispatchEvent(
    new CustomEvent("themeChanged", { detail: { theme: resolved, section } })
  );
}

/** Saved theme for a portal, or light when unset / invalid. */
export function getTheme(section = "") {
  try {
    const raw = section
      ? localStorage.getItem(themeKey(section))
      : localStorage.getItem(THEME_KEY);
    return normalizeTheme(raw);
  } catch {
    return DEFAULT_THEME;
  }
}

export function toggleTheme(section = "") {
  const next = getTheme(section) === "dark" ? DEFAULT_THEME : "dark";
  applyTheme(next, section);
  return next;
}

/** Boot theme: light by default; use portal preference only when present. */
export function initTheme() {
  const section = getSectionFromWindow();
  if (!section) {
    document.documentElement.classList.remove("dark-theme");
    applyTheme(DEFAULT_THEME, "");
    return;
  }
  applyTheme(getTheme(section), section);
}

/** Re-apply saved theme when navigating between portals (default light). */
export function syncThemeForPath(pathname = "") {
  const section = getSectionFromPath(pathname);
  if (!section) {
    document.documentElement.classList.remove("dark-theme");
    applyTheme(DEFAULT_THEME, "");
    return;
  }
  applyTheme(getTheme(section), section);
}
