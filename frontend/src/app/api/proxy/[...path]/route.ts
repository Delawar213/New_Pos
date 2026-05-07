import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getBackendBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  return base.replace(/\/+$/, "");
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
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
  // Allow self-signed / mismatched certs for dev environments.
  // This is intentionally scoped to the server runtime (nodejs).
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const base = getBackendBaseUrl();
  if (!base) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_BASE_URL is not set" },
      { status: 500 }
    );
  }

  const { path } = await context.params;
  const url = new URL(request.url);

  // Backend is hosted behind IIS which redirects http -> https.
  // We call the https URL directly so the browser never sees the redirect.
  const target = new URL(`https://${base.replace(/^https?:\/\//, "")}/api/${path.join("/")}`);
  target.search = url.search;

  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  headers.set("content-type", request.headers.get("content-type") ?? "application/json");

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const resp = await fetch(target, {
    method,
    headers,
    body,
    redirect: "follow",
  });

  const respBody = await resp.arrayBuffer();
  const outHeaders = new Headers(resp.headers);
  outHeaders.delete("content-encoding");
  outHeaders.delete("content-length");

  return new NextResponse(respBody, {
    status: resp.status,
    headers: outHeaders,
  });
}

