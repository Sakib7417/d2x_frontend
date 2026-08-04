import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight session probe for the client.
 *
 * Returns the claims already present in the access-token cookie without
 * touching the backend, so it is cheap enough to call on every app mount.
 * It is a *hint* for rendering, not an authorization decision — the claims are
 * decoded, not signature-verified (we hold no JWT secret on this tier).
 *
 * For the authoritative, verified user record the client uses
 * `GET /api/bff/users/profile`.
 */
export async function GET() {
  const session = await getSession();

  return NextResponse.json(
    {
      success: true,
      data: session
        ? {
            authenticated: true as const,
            userId: session.userId,
            email: session.email,
            role: session.role,
            expiresAt: session.expiresAt,
          }
        : { authenticated: false as const },
    },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}
