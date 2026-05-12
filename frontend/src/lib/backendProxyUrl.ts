/**
 * Base URL for server-side proxy → API (no `/api` suffix here; see buildBackendApiUrl).
 * Prefer `BACKEND_API_BASE_URL` in production so the Next server can use an internal URL
 * while the browser only calls same-origin `/proxy/*`.
 */
export function getBackendApiBaseRaw(): string | undefined {
  const internal = process.env.BACKEND_API_BASE_URL?.trim();
  if (internal) return internal;
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
}

/**
 * Builds the backend URL for Next.js proxy routes.
 * Base may be `https://host` or `https://host/api` (both common in this project).
 */
export function buildBackendApiUrl(pathSegments: string[], search: string): URL | null {
  const raw = getBackendApiBaseRaw();
  if (!raw) return null;

  let base = raw.replace(/\/+$/, "");
  const alreadyHasApiPath = /\/api$/i.test(base);
  if (!alreadyHasApiPath) {
    base = `${base}/api`;
  }

  const tail = pathSegments.filter(Boolean).join("/");
  const href = tail ? `${base}/${tail}` : `${base}/`;

  try {
    const u = new URL(href);
    if (search) {
      u.search = search.startsWith("?") ? search.slice(1) : search;
    }
    return u;
  } catch {
    return null;
  }
}
