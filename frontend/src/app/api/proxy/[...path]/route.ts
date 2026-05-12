import { NextResponse } from "next/server";
import { buildBackendApiUrl } from "@/lib/backendProxyUrl";
import { buildProxyOutboundHeaders } from "@/lib/proxyOutboundHeaders";
import { fetchPreservingWrites } from "@/lib/fetchPreservingWrites";

export const runtime = "nodejs";

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

  const { path } = await context.params;
  const url = new URL(request.url);

  const target = buildBackendApiUrl(path ?? [], url.search);
  if (!target) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_BASE_URL is not set" },
      { status: 500 }
    );
  }

  const headers = buildProxyOutboundHeaders(request.headers);

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const resp = await fetchPreservingWrites(target.toString(), { method, headers, body });

  const respBody = await resp.arrayBuffer();
  const outHeaders = new Headers(resp.headers);
  outHeaders.delete("content-encoding");
  outHeaders.delete("content-length");

  return new NextResponse(respBody, {
    status: resp.status,
    headers: outHeaders,
  });
}

