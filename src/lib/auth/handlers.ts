import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { callUpstream, UpstreamTransportError } from "@/lib/api/upstream";
import { extractTokens } from "./refresh";
import { setSessionCookies } from "./session";
import type { AuthUser } from "@/types/models";

/**
 * Shared implementation for the two credential-exchange endpoints
 * (`/api/auth/login`, `/api/auth/signup`).
 *
 * Both upstream routes return `{ data: { user, tokens } }`. This handler
 * strips `tokens` out of the payload entirely, moves it into httpOnly cookies,
 * and returns only `{ success, data: { user } }` to the browser.
 *
 * That subtraction is the security boundary of the whole BFF design — it is
 * the one place where a mistake would leak a bearer token into client-side JS.
 */
export async function handleCredentialExchange(
  request: NextRequest,
  upstreamPath: "/auth/login" | "/auth/signup",
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  let upstream;
  try {
    upstream = await callUpstream({
      path: upstreamPath,
      method: "POST",
      body,
      clientIp: resolveClientIp(request),
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

  // Pass upstream failures straight through: the backend's messages
  // ("Invalid credentials", "Account suspended", Zod field errors) are already
  // the right thing to show, and rewriting them here would desync the two.
  if (!upstream.ok) {
    return NextResponse.json(upstream.body ?? { success: false, message: "Authentication failed." }, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
  }

  const tokens = extractTokens(upstream.body);
  if (!tokens) {
    // Contract drift — a 2xx without a usable token pair. Fail closed.
    return NextResponse.json(
      { success: false, message: "Received an invalid response from the server." },
      { status: 502 },
    );
  }

  const user = extractUser(upstream.body);

  const response = NextResponse.json(
    {
      success: true,
      message: readMessage(upstream.body),
      data: { user },
    },
    { status: upstream.status, headers: { "cache-control": "no-store" } },
  );

  setSessionCookies(response.cookies, tokens);
  return response;
}

function extractUser(payload: unknown): AuthUser | null {
  if (!isRecord(payload)) return null;
  const data = isRecord(payload.data) ? payload.data : null;
  if (!data) return null;
  return isRecord(data.user) ? (data.user as unknown as AuthUser) : null;
}

function readMessage(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  return typeof payload.message === "string" ? payload.message : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function resolveClientIp(request: NextRequest): string | null {
  const candidates = [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for"),
  ];
  for (const value of candidates) {
    const first = value?.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}
