/**
 * Default `fetch(..., { redirect: "follow" })` may rewrite POST to GET on 301/302.
 * That yields HTTP 200 "success" responses without running create/update/delete on the API.
 * This helper follows redirects while keeping the original method and body (except 303 → GET per RFC).
 */
const MAX_HOPS = 8;

export async function fetchPreservingWrites(
  url: string,
  options: {
    method: string;
    headers: Headers;
    body?: ArrayBuffer | undefined;
  }
): Promise<Response> {
  let current = url;
  let method = options.method.toUpperCase();
  let headers = new Headers(options.headers);
  let body: ArrayBuffer | undefined = options.body;

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    headers.delete("content-length");
    const resp = await fetch(current, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : body,
      redirect: "manual",
    });

    if (resp.status < 300 || resp.status >= 400) {
      return resp;
    }

    const loc = resp.headers.get("location");
    if (!loc) {
      return resp;
    }

    void resp.arrayBuffer().catch(() => {});

    const next = new URL(loc, current).href;

    if (resp.status === 303) {
      method = "GET";
      body = undefined;
      headers.delete("content-type");
      current = next;
      continue;
    }

    current = next;
  }

  return new Response(JSON.stringify({ message: "Too many redirects" }), {
    status: 508,
    headers: { "content-type": "application/json" },
  });
}
