// Route rules shared by the proxy, server actions and pages. Pure, so they can be unit-tested.

export const HOME_PATH = "/jobs";
export const SIGN_IN_PATH = "/sign-in";
export const NO_ACCESS_PATH = "/no-access";

const PUBLIC_PATHS = new Set(["/", "/sign-in", "/sign-up", NO_ACCESS_PATH]);
const PUBLIC_PREFIXES = ["/auth/"];
const AUTH_PAGES = new Set(["/sign-in", "/sign-up"]);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Pages a signed-in user has no reason to see. */
export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.has(pathname);
}

/**
 * Turns an untrusted `next` value into a same-origin path, so a crafted link like
 * `/sign-in?next=https://evil.example` can't bounce a user off-site after login.
 */
export function safeRedirectPath(next: unknown, fallback: string = HOME_PATH): string {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback;

  const base = "http://hirelume.invalid";
  let url: URL;
  try {
    url = new URL(next, base);
  } catch {
    return fallback;
  }
  // Catches protocol-relative ("//evil"), backslash ("/\evil") and whitespace tricks.
  if (url.origin !== base) return fallback;
  if (isAuthPage(url.pathname)) return fallback;

  return `${url.pathname}${url.search}${url.hash}`;
}
