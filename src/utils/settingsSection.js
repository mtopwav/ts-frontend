/**
 * Section-scoped settings keys (admin vs manager).
 */
export function getSectionFromPath(pathname = "") {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/manager") || pathname.startsWith("/geita") || pathname.startsWith("/boma")) {
    return "manager";
  }
  return "";
}
