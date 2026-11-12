/**
 * Session cookie names, shared between the server-only session module and
 * client components. Kept in a separate, side-effect-free file because
 * `session.ts` is `server-only` and cannot be imported from client code.
 *
 * Only the names live here — the cookies' contents are meaningless to anyone
 * reading this file, so nothing needs protection.
 */

export const ACCESS_TOKEN_COOKIE = "mlm.at";
export const REFRESH_TOKEN_COOKIE = "mlm.rt";

/**
 * Impersonation: while an admin is signed in as a user, their own session
 * is parked in these cookies so "Return to admin" can restore it without a
 * re-login. The flag cookie is intentionally NOT httpOnly — the client reads
 * it to render the "you are impersonating" banner; it carries no secrets.
 */
export const IMPERSONATOR_ACCESS_COOKIE = "mlm.imp_at";
export const IMPERSONATOR_REFRESH_COOKIE = "mlm.imp_rt";
export const IMPERSONATION_FLAG_COOKIE = "mlm.imp";
