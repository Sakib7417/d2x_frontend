import "server-only";

import { callUpstream, UpstreamTransportError } from "@/lib/api/upstream";
import type { SessionTokens } from "./session";

/**
 * Single-flight refresh-token rotation.
 *
 * THE PROBLEM
 * -----------
 * The backend ROTATES refresh tokens: `authService.refreshTokens` revokes the
 * presented token before issuing a new pair (`auth.service.ts`, the
 * `revokeRefreshToken(tokenRecord.id, 'Token refresh')` call). A refresh token
 * is therefore strictly single-use.
 *
 * A dashboard mounts ~6 RTK Query hooks at once. When the 15-minute access
 * token expires, all six fire, all six get 401, and all six attempt a refresh
 * with the same cookie value. The first wins; the other five present a
 * now-revoked token and get `REFRESH_TOKEN_REVOKED`. Naively that logs the
 * user out roughly every 15 minutes, mid-session — the classic symptom.
 *
 * THE FIX
 * -------
 * Keyed promise de-duplication. The first caller performs the network round
 * trip; concurrent callers presenting the same refresh token await that same
 * promise and receive the same new token pair. The entry is evicted as soon as
 * it settles, so a later expiry starts a fresh cycle.
 *
 * SCOPE / LIMITS
 * --------------
 * The map is per-process. On a single Node server (including `next start`)
 * that is complete coverage. On a multi-instance or serverless deployment two
 * instances can still collide; the loser's refresh fails and that one request
 * 401s, after which the client re-authenticates. Making this bulletproof
 * across instances requires shared state (Redis — the backend already runs
 * one) or, better, dropping rotation for a sliding-window refresh token.
 * Flagged as a follow-up rather than silently pretended-solved.
 */

interface RefreshOutcome {
  ok: boolean;
  tokens?: SessionTokens;
  /** Reason for failure, for logging. Never shown to the user. */
  reason?: string;
}

const inFlight = new Map<string, Promise<RefreshOutcome>>();

/**
 * Exchange a refresh token for a new token pair, de-duplicating concurrent
 * attempts that present the same token.
 */
export function refreshTokens(
  refreshToken: string,
  clientIp?: string | null,
): Promise<RefreshOutcome> {
  const existing = inFlight.get(refreshToken);
  if (existing) return existing;

  const attempt = performRefresh(refreshToken, clientIp).finally(() => {
    // Evict immediately on settle. Keeping a resolved entry around would hand
    // an already-rotated (and therefore revoked) pair to a later caller.
    inFlight.delete(refreshToken);
  });

  inFlight.set(refreshToken, attempt);
  return attempt;
}

async function performRefresh(
  refreshToken: string,
  clientIp?: string | null,
): Promise<RefreshOutcome> {
  try {
    const response = await callUpstream({
      path: "/auth/refresh",
      method: "POST",
      body: { refreshToken },
      clientIp,
    });

    if (!response.ok) {
      const message =
        isRecord(response.body) && typeof response.body.message === "string"
          ? response.body.message
          : `status ${response.status}`;
      return { ok: false, reason: message };
    }

    const tokens = extractTokens(response.body);
    if (!tokens) {
      return { ok: false, reason: "refresh response missing token pair" };
    }

    return { ok: true, tokens };
  } catch (error) {
    if (error instanceof UpstreamTransportError) {
      return {
        ok: false,
        reason: error.timedOut ? "refresh timed out" : "refresh transport error",
      };
    }
    return { ok: false, reason: "unexpected refresh failure" };
  }
}

/**
 * Pull the token pair out of the refresh response.
 *
 * `POST /auth/refresh` returns `{ data: { accessToken, refreshToken } }` while
 * login/signup return `{ data: { user, tokens: { ... } } }`. Both shapes are
 * accepted so this helper can be reused by the login route.
 */
export function extractTokens(payload: unknown): SessionTokens | null {
  if (!isRecord(payload)) return null;

  const data = isRecord(payload.data) ? payload.data : payload;

  const candidate = isRecord(data.tokens) ? data.tokens : data;

  const accessToken = candidate.accessToken;
  const refreshToken = candidate.refreshToken;

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    return null;
  }
  return { accessToken, refreshToken };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
