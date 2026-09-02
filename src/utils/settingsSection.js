/**
 * Portal-scoped settings: admin, boma, and geita keep separate preferences.
 */
export function getSectionFromPath(pathname = "") {
  const path = String(pathname || "");
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/boma")) return "boma";
  if (path.startsWith("/geita")) return "geita";
  if (path.startsWith("/manager")) return "geita";
  return "";
}

export function getSectionFromWindow() {
  if (typeof window === "undefined") return "";
  return getSectionFromPath(window.location?.pathname || "");
}
