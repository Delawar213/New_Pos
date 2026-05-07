import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getBackendHost() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  return base.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}
export async function HEAD(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}
export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}
export async function PUT(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}
export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const host = getBackendHost();
  if (!host) {
    return NextResponse.json({ message: "NEXT_PUBLIC_API_BASE_URL is not set" }, { status: 500 });
  }

  const { path } = await context.params;
  const url = new URL(request.url);

  // Force HTTPS so we don't return IIS 301 to the browser.
  const target = new URL(`https://${host}/api/${path.join("/")}`);
  target.search = url.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // Let fetch calculate these for the outgoing request.
    if (lower === "host" || lower === "content-length" || lower === "connection") {
      return;
    }
    headers.set(key, value);
  });
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const resp = await fetch(target, { method, headers, body, redirect: "follow" });
  const respBody = await resp.arrayBuffer();

  const outHeaders = new Headers(resp.headers);
  outHeaders.delete("content-encoding");
  outHeaders.delete("content-length");

  return new NextResponse(respBody, { status: resp.status, headers: outHeaders });
}

