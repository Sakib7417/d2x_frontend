import type { NextRequest } from "next/server";

import { proxyRequest } from "@/lib/api/proxy";

/**
 * Catch-all BFF proxy: /api/bff/<anything> -> <API_BASE_URL>/<anything>
 *
 * `force-dynamic` + `nodejs` runtime are both deliberate:
 *   - dynamic, because every response depends on the session cookie and an
 *     authenticated financial API must never be statically cached;
 *   - nodejs, because the edge runtime would put the proxy in a different
 *     region from the backend, adding a cross-continent hop to every call.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
