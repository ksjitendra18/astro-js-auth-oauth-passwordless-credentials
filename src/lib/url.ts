export function sanitizeRedirectUrl(
  url: string | null,
  defaultPath = "/"
): string {
  if (!url) return defaultPath;

  try {
    new URL(url);
    return defaultPath;
  } catch {
    if (
      url.startsWith("/") &&
      !url.includes("//") &&
      !url.toLowerCase().includes("http") &&
      !url.includes("\\") &&
      !url.includes("%")
    ) {
      return url;
    }
    return defaultPath;
  }
}
