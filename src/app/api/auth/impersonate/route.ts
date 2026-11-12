import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { callUpstream, UpstreamTransportError } from "@/lib/api/upstream";
import { extractTokens } from "@/lib/auth/refresh";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  setImpersonatorCookies,
  setSessionCookies,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/impersonate  { userId }
 *
 * Starts an impersonation session: asks the backend (as the *current* admin)
 * for a token pair belonging to `userId`, parks the admin's own tokens in the
 * impersonator cookies, then installs the target user's tokens as the session.
 *
 * Mirrors the login handler's contract: tokens never reach the browser, only
 * the safe user object is returned. The non-httpOnly `mlm.imp` flag cookie is
 * what lets the client render the "impersonating" banner without a query.
 */
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { success: false, message: "You must be signed in to impersonate." },
      { status: 401 },
    );
  }

  let userId: unknown;
  try {
    userId = (await request.json()).userId;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    );
  }
  if (typeof userId !== "string" || !userId) {
    return NextResponse.json(
      { success: false, message: "userId is required." },
      { status: 400 },
    );
  }

  let upstream;
  try {
    upstream = await callUpstream({
      path: `/admin/users/${encodeURIComponent(userId)}/impersonate`,
      method: "POST",
      accessToken,
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof UpstreamTransportError) {
      return NextResponse.json(
        {
          success: false,
          message: error.timedOut
            ? "The server took too long to respond. Please try again."
            : "Unable to reach the server. Please check your connection.",
        },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      upstream.body ?? { success: false, message: "Impersonation failed." },
      { status: upstream.status, headers: { "cache-control": "no-store" } },
    );
  }

  const tokens = extractTokens(upstream.body);
  if (!tokens) {
    return NextResponse.json(
      { success: false, message: "Received an invalid response from the server." },
      { status: 502 },
    );
  }

  const data =
    typeof upstream.body === "object" && upstream.body !== null
      ? (upstream.body as Record<string, unknown>).data
      : null;
  const user =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>).user ?? null
      : null;

  const response = NextResponse.json(
    { success: true, data: { user } },
    { status: 200, headers: { "cache-control": "no-store" } },
  );

  // Order matters: park the admin session first, then swap in the target's.
  setImpersonatorCookies(response.cookies, { accessToken, refreshToken });
  setSessionCookies(response.cookies, tokens);
  return response;
}
