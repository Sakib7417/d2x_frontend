import "server-only";

import { NextResponse } from "next/server";

import {
  IMPERSONATOR_ACCESS_COOKIE,
  IMPERSONATOR_REFRESH_COOKIE,
  clearImpersonatorCookies,
  setSessionCookies,
} from "@/lib/auth/session";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/end-impersonation
 *
 * Restores the parked admin session that /api/auth/impersonate stashed away.
 * The impersonated user's refresh token simply expires on its own — no need
 * to call upstream, and this must work even if the backend is down.
 */
export async function POST() {
  const store = await cookies();
  const accessToken = store.get(IMPERSONATOR_ACCESS_COOKIE)?.value ?? null;
  const refreshToken = store.get(IMPERSONATOR_REFRESH_COOKIE)?.value ?? null;

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { success: false, message: "No impersonation session to end." },
      { status: 400 },
    );
  }

  const response = NextResponse.json(
    { success: true, message: "Returned to admin session." },
    { status: 200, headers: { "cache-control": "no-store" } },
  );

  setSessionCookies(response.cookies, { accessToken, refreshToken });
  clearImpersonatorCookies(response.cookies);
  return response;
}
