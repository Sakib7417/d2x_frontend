/**
 * Minimal, dependency-free JWT payload decoder.
 *
 * WHY NOT `jose`
 * --------------
 * We only ever need to *read* claims, never verify them — this tier holds no
 * JWT secret, and all authorization is enforced by the Express backend against
 * a verified signature.
 *
 * Importing `jose` for that pulled its whole entry point (JWE decryption,
 * CompressionStream-based deflate, the full key-management surface) into the
 * Edge middleware bundle: ~36 kB shipped to every request, plus build warnings
 * about Node APIs unavailable in the Edge runtime. For a base64url decode and
 * a `JSON.parse`, that is a bad trade.
 *
 * This module is runtime-agnostic (Edge, Node, browser) and has no imports.
 *
 * SECURITY: decoding is NOT verification. Anything returned here is
 * attacker-controlled and may only drive presentation — which nav to render,
 * where to redirect. Never gate a security decision on it.
 */

export interface JwtClaims {
  [key: string]: unknown;
  iat?: number;
  exp?: number;
}

/**
 * Decode the payload segment of a JWS compact-serialised token.
 * Returns null for anything malformed rather than throwing, so callers can
 * treat a bad cookie as simply "not signed in".
 */
export function decodeJwtPayload<T extends JwtClaims = JwtClaims>(
  token: string,
): T | null {
  if (typeof token !== "string") return null;

  const segments = token.split(".");
  // header.payload.signature — a JWE has 5 segments and is not supported.
  if (segments.length !== 3) return null;

  const payload = segments[1];
  if (!payload) return null;

  try {
    const json = base64UrlDecode(payload);
    const parsed = JSON.parse(json) as unknown;

    // A JWT payload must be a JSON object; a bare string or array is invalid.
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * base64url -> UTF-8 string.
 *
 * `atob` yields a binary string, one code unit per byte, which mangles any
 * multi-byte UTF-8 sequence — a user with a non-ASCII name would get mojibake.
 * Re-encoding through TextDecoder fixes that. `atob` is available in every
 * target runtime (Edge, Node 16+, browsers).
 */
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  // Restore the padding `atob` requires.
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder("utf-8").decode(bytes);
}

/** True when `exp` is absent, in the past, or within `skewSeconds` of now. */
export function isExpired(
  claims: Pick<JwtClaims, "exp"> | null,
  skewSeconds = 30,
): boolean {
  if (typeof claims?.exp !== "number") return true;
  return claims.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
