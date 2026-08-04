import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { callUpstream, UpstreamTransportError } from "@/lib/api/upstream";
import { refreshTokens } from "@/lib/auth/refresh";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from "@/lib/auth/session";

/**
 * The BFF proxy.
 *
 * Browser  ──same-origin──>  /api/bff/*  ──server-to-server──>  Express /api/v1/*
 *
 * Responsibilities:
 *   1. Attach the bearer token from the httpOnly cookie.
 *   2. Transparently refresh + retry once on a 401.
 *   3. Forward the real client IP so upstream rate limiting is per-user.
 *   4. Refuse to proxy token-bearing auth routes (see DENYLIST).
 *   5. Normalise transport failures into the backend's own error envelope, so
 *      the client only ever parses one response shape.
 */

/**
 * Routes the generic proxy must never serve.
 *
 * login/signup/refresh all return raw JWTs in the response body. If the
 * catch-all forwarded them, those tokens would land in the browser's JS heap
 * and the entire point of httpOnly storage would be defeated. They have
 * dedicated handlers under /api/auth/* that capture tokens into cookies and
 * return only the user object.
 */
const DENYLIST = new Set(["/auth/login", "/auth/signup", "/auth/refresh"]);

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "host",
  "content-length",
  // Never let the browser choose the bearer token.
  "authorization",
  "cookie",
]);

export async function proxyRequest(
  request: NextRequest,
  segments: string[],
): Promise<NextResponse> {
  const path = `/${segments.join("/")}`;

  if (DENYLIST.has(path)) {
    return jsonError(
      404,
      "Route not available through this endpoint",
    );
  }

  const search = request.nextUrl.search;
  const upstreamPath = `${path}${search}`;

  const method = request.method as
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE";

  const body = await readBody(request);
  const clientIp = resolveClientIp(request);
  const forwardedHeaders = collectHeaders(request);

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;

  try {
    let upstream = await callUpstream({
      path: upstreamPath,
      method,
      body,
      accessToken,
      headers: forwardedHeaders,
      clientIp,
      signal: request.signal,
    });

    // ---- Transparent refresh + single retry -------------------------------
    //
    // Only retried once, and only when we actually hold a refresh token.
    // A 401 with no refresh token means "genuinely logged out", and retrying
    // would just burn a request against the rate limiter.
    if (upstream.status === 401 && refreshToken) {
      const outcome = await refreshTokens(refreshToken, clientIp);

      if (!outcome.ok || !outcome.tokens) {
        // Refresh token is dead (expired, revoked, or rotated out from under
        // us). Clear the session so the client's 401 handler redirects to
        // login instead of thrashing.
        const response = jsonError(401, "Your session has expired. Please sign in again.");
        clearSessionCookies(response.cookies);
        return response;
      }

      upstream = await callUpstream({
        path: upstreamPath,
        method,
        body,
        accessToken: outcome.tokens.accessToken,
        headers: forwardedHeaders,
        clientIp,
        signal: request.signal,
      });

      const response = buildResponse(upstream);
      setSessionCookies(response.cookies, outcome.tokens);
      return response;
    }

    // A 401 with no refresh token available: make sure no stale access cookie
    // lingers, otherwise middleware keeps believing the user is signed in.
    if (upstream.status === 401 && !refreshToken) {
      const response = buildResponse(upstream);
      clearSessionCookies(response.cookies);
      return response;
    }

    return buildResponse(upstream);
  } catch (error) {
    if (error instanceof UpstreamTransportError) {
      // 504 rather than 500: the failure is upstream, and the distinction
      // drives a different (retryable) ErrorState in the UI.
      return jsonError(
        504,
        error.timedOut
          ? "The server took too long to respond. Please try again."
          : "Unable to reach the server. Please check your connection.",
      );
    }
    return jsonError(500, "An unexpected error occurred.");
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function buildResponse(upstream: {
  status: number;
  body: unknown;
  rawText: string | null;
}): NextResponse {
  // The backend always speaks JSON. If we got something else it means Express
  // crashed or an infrastructure layer intercepted the call — surface that as
  // a well-formed envelope rather than letting the client choke on HTML.
  if (upstream.body === null && upstream.rawText) {
    return jsonError(502, "Received an invalid response from the server.");
  }

  return NextResponse.json(upstream.body ?? { success: upstream.status < 400 }, {
    status: upstream.status,
    headers: { "cache-control": "no-store" },
  });
}

function jsonError(status: number, message: string): NextResponse {
  // Mirrors the backend's ApiFailure shape exactly, so the client's error
  // normaliser needs no special case for proxy-generated errors.
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

async function readBody(request: NextRequest): Promise<unknown> {
  if (request.method === "GET" || request.method === "DELETE") return undefined;

  const contentType = request.headers.get("content-type") ?? "";

  // Multipart form data (file uploads) — pass through as raw bytes
  if (contentType.includes("multipart/form-data")) {
    const arrayBuffer = await request.arrayBuffer();
    return {
      __rawBody: new Uint8Array(arrayBuffer),
      contentType,
    };
  }

  if (!contentType.includes("application/json")) return undefined;

  try {
    const text = await request.text();
    return text.length > 0 ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Best-effort client IP.
 *
 * Reads the platform-provided headers in order of trustworthiness. On Vercel
 * `x-vercel-forwarded-for` is set by the edge and cannot be spoofed by the
 * client; `x-forwarded-for` can be, so it is used last and only the first hop
 * is taken.
 *
 * NOTE: for this to have any effect the backend must call
 * `app.set('trust proxy', 1)` — express-rate-limit ignores X-Forwarded-For
 * otherwise. Flagged to the backend as a required change.
 */
function resolveClientIp(request: NextRequest): string | null {
  const candidates = [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for"),
  ];

  for (const value of candidates) {
    if (!value) continue;
    const first = value.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}

function collectHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers[key] = value;
    }
  });
  return headers;
}
