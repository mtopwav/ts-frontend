const THEME_KEY = "systemTheme";

function themeKey(section = "") {
  return section ? `${THEME_KEY}_${section}` : THEME_KEY;
}

export function applyTheme(theme = "light", section = "") {
  const root = document.documentElement;
  const isDark = theme === "dark";

  root.classList.toggle("dark-theme", isDark);
  localStorage.setItem(themeKey(section), isDark ? "dark" : "light");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  window.dispatchEvent(new Event("themeChanged"));
}

export function getTheme(section = "") {
  return localStorage.getItem(themeKey(section)) || localStorage.getItem(THEME_KEY) || "light";
}

export function toggleTheme(section = "") {
  const next = getTheme(section) === "dark" ? "light" : "dark";
  applyTheme(next, section);
  return next;
}

export function initTheme() {
  applyTheme(getTheme());
}
