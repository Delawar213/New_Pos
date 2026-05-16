import { NextResponse } from "next/server";
import { buildBackendApiUrl, getBackendApiBaseRaw } from "@/lib/backendProxyUrl";
import { buildProxyOutboundHeaders } from "@/lib/proxyOutboundHeaders";
import { fetchPreservingWrites } from "@/lib/fetchPreservingWrites";

export const runtime = "nodejs";

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
export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}
export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { path } = await context.params;
  const url = new URL(request.url);

  const target = buildBackendApiUrl(path ?? [], url.search);
  if (!target) {
    return NextResponse.json({ message: "NEXT_PUBLIC_API_BASE_URL is not set" }, { status: 500 });
  }

  const headers = buildProxyOutboundHeaders(request.headers);

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  try {
    const resp = await fetchPreservingWrites(target.toString(), { method, headers, body });
    const respBody = await resp.arrayBuffer();

    const outHeaders = new Headers(resp.headers);
    outHeaders.delete("content-encoding");
    outHeaders.delete("content-length");

    return new NextResponse(respBody, { status: resp.status, headers: outHeaders });
  } catch (err: unknown) {
    const cause =
      err != null && typeof err === "object" && "cause" in err ? (err as { cause?: unknown }).cause : err;
    const code =
      cause != null && typeof cause === "object" && "code" in cause
        ? String((cause as { code?: string }).code)
        : "";
    const isTimeout =
      code === "UND_ERR_CONNECT_TIMEOUT" ||
      code === "ETIMEDOUT" ||
      code === "ECONNREFUSED" ||
      code === "ENOTFOUND";

    const base = getBackendApiBaseRaw() ?? "(not set)";
    const message = isTimeout
      ? `Cannot reach the API at ${base}. Check that the backend is running and NEXT_PUBLIC_API_BASE_URL in .env.local is correct.`
      : err instanceof Error
        ? err.message
        : "Proxy request to API failed.";

    return NextResponse.json(
      { success: false, message, errors: [message], data: null },
      { status: 502 }
    );
  }
}

