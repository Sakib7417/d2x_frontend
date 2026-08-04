import { NextResponse, type NextRequest } from "next/server";

import { callUpstream } from "@/lib/api/upstream";
import { ACCESS_TOKEN_COOKIE, clearSessionCookies } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Log out.
 *
 * Tells the backend to revoke every refresh token for the user
 * (`authRepository.revokeAllUserTokens`), then clears our cookies.
 *
 * The upstream call is best-effort: if it fails we still clear the cookies.
 * Leaving a user "logged in" in the browser because a revocation call timed
 * out would be strictly worse than a stale server-side token that expires on
 * its own in at most 7 days.
 */
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;

  if (accessToken) {
    try {
      await callUpstream({
        path: "/auth/logout",
        method: "POST",
        accessToken,
        signal: request.signal,
      });
    } catch {
      // Intentionally swallowed — see note above.
    }
  }

  const response = NextResponse.json(
    { success: true, message: "Signed out." },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
  clearSessionCookies(response.cookies);
  return response;
}
