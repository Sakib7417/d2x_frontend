import "server-only";

import { cookies } from "next/headers";
import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

import { decodeJwtPayload, isExpired, type JwtClaims } from "./jwt";

import { isProduction } from "@/config/env";
import type { UserRole } from "@/types/enums";
import type { UUID } from "@/types/api";

/**
 * Server-side session storage.
 *
 * DESIGN
 * ------
 * The Express backend hands out JWTs in the response body — a pure SPA
 * contract. We deliberately do not let those tokens reach the browser.
 * Instead the Next server acts as a Backend-For-Frontend: it captures the
 * tokens at login and stores them in `httpOnly` cookies, then attaches the
 * bearer header itself on every proxied call.
 *
 * Consequences, all of them wanted:
 *   - XSS cannot exfiltrate the tokens. For a platform holding USDT balances
 *     this is the difference between a defaced page and drained accounts.
 *   - `middleware.ts` can gate routes before any JS ships.
 *   - Server Components can call the API during render.
 *   - CORS disappears entirely: browser talks same-origin to Next, Next talks
 *     server-to-server to Express.
 *
 * TOKEN LIFETIMES (from the backend's .env)
 *   access  15m   refresh  7d, and refresh tokens ROTATE — the old one is
 *   revoked the moment it is used. That rotation is why `refreshSession` is
 *   serialised through a mutex in `refresh.ts`.
 */

export const ACCESS_TOKEN_COOKIE = "mlm.at";
export const REFRESH_TOKEN_COOKIE = "mlm.rt";

/** Matches JWT_REFRESH_EXPIRY=7d. The cookie must not outlive the token. */
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * `lax` rather than `strict`: the referral funnel sends users to
 * `/ref/<code>` from external sites, and `strict` would drop the session
 * cookie on that top-level cross-site navigation, silently logging people out
 * mid-signup. `lax` still blocks CSRF on state-changing POSTs.
 */
const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
} as const;

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** Claims the backend signs into the access token (`auth.service.ts`). */
export interface AccessTokenClaims extends JwtClaims {
  userId: UUID;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/* -------------------------------------------------------------------------- */
/* Read                                                                        */
/* -------------------------------------------------------------------------- */

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

/**
 * Decode (NOT verify) the access token claims.
 *
 * We do not hold JWT_ACCESS_SECRET on this tier, so signature verification is
 * impossible here — and that is fine, because these claims are used only to
 * decide which UI to render and where to redirect. Every actual authorization
 * decision is made by the Express `authenticate` + `authorize` middleware
 * against a verified signature. A forged cookie buys an attacker a dashboard
 * shell that 401s on every request.
 *
 * Returns null on a malformed token so callers treat it as logged-out.
 */
export function decodeAccessToken(token: string): AccessTokenClaims | null {
  const claims = decodeJwtPayload<AccessTokenClaims>(token);
  if (!claims?.userId || !claims?.role) return null;
  return claims;
}

/** True when the access token is expired or within `skewSeconds` of expiring. */
export function isAccessTokenExpired(
  claims: AccessTokenClaims | null,
  skewSeconds = 30,
): boolean {
  return isExpired(claims, skewSeconds);
}

export interface Session {
  userId: UUID;
  email: string;
  role: UserRole;
  accessToken: string;
  expiresAt: number;
}

/**
 * Current session derived from cookies, or null.
 * Does not attempt a refresh — that is the proxy's job.
 */
export async function getSession(): Promise<Session | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const claims = decodeAccessToken(accessToken);
  if (!claims) return null;

  return {
    userId: claims.userId,
    email: claims.email,
    role: claims.role,
    accessToken,
    expiresAt: claims.exp * 1000,
  };
}

/* -------------------------------------------------------------------------- */
/* Write                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Persist tokens.
 *
 * The access cookie is a session cookie (no maxAge) rather than one pinned to
 * the 15-minute JWT expiry. If the cookie expired in lockstep with the token,
 * the proxy would lose the ability to read the (expired) access token and, in
 * some flows, the refresh path with it. Letting the cookie outlive the token
 * and treating expiry as a claims-level concern keeps refresh deterministic.
 *
 * Accepts an optional `ResponseCookies` target so Route Handlers can mutate the
 * outgoing response directly — `cookies()` from `next/headers` is read-only
 * inside a Route Handler's request scope.
 */
export function setSessionCookies(
  target: ResponseCookies,
  tokens: SessionTokens,
): void {
  target.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, BASE_COOKIE_OPTIONS);
  target.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookies(target: ResponseCookies): void {
  target.set(ACCESS_TOKEN_COOKIE, "", { ...BASE_COOKIE_OPTIONS, maxAge: 0 });
  target.set(REFRESH_TOKEN_COOKIE, "", { ...BASE_COOKIE_OPTIONS, maxAge: 0 });
}
