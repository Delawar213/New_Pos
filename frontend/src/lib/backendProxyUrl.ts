/**
 * Builds the backend URL for Next.js proxy routes.
 * `NEXT_PUBLIC_API_BASE_URL` may be `https://host` or `https://host/api` (both common in this project).
 */
export function buildBackendApiUrl(pathSegments: string[], search: string): URL | null {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
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
