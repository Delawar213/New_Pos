/**
 * Build headers for the server-side fetch from Next.js to the backend API.
 *
 * We do not forward browser context headers (Origin, Referer, cookies, Sec-Fetch-*).
 * Some hosts/APIs reject mutations when those reflect the public site domain.
 */
const HOP_AND_BROWSER_HEADERS = new Set(
  [
    "host",
    "connection",
    "content-length",
    "origin",
    "referer",
    "referrer-policy",
    "sec-fetch-site",
    "sec-fetch-mode",
    "sec-fetch-dest",
    "sec-fetch-user",
    "sec-ch-ua",
    "sec-ch-ua-mobile",
    "sec-ch-ua-platform",
    "upgrade-insecure-requests",
    "priority",
    "cookie",
  ].map((h) => h.toLowerCase())
);

export function buildProxyOutboundHeaders(incoming: Headers): Headers {
  const out = new Headers();
  incoming.forEach((value, key) => {
    if (HOP_AND_BROWSER_HEADERS.has(key.toLowerCase())) return;
    out.set(key, value);
  });
  if (!out.has("content-type")) {
    out.set("content-type", "application/json");
  }
  return out;
}
