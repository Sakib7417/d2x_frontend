import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

import type {
  ApiErrorKind,
  ApiFailure,
  ApiFieldError,
  NormalizedApiError,
} from "@/types/api";

/**
 * Error normalisation.
 *
 * Components must never see a raw `FetchBaseQueryError`. Every failure in the
 * app funnels through `normalizeError` and comes out as a
 * `NormalizedApiError` with a discriminated `kind` and a message that is
 * already safe to render.
 *
 * The payoff: `<ErrorState error={error} />` can decide whether to show a
 * "Retry" button (network/server) or a "Sign in" button (unauthorized) without
 * any component ever pattern-matching on HTTP status codes.
 */

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/**
 * Messages the backend produces that we deliberately override.
 *
 * `A记录 with this value already exists` is the Prisma P2002 handler in
 * `error.middleware.ts` — Chinese text leaked into a user-facing string.
 * Rewritten here so users never see it; reported to the backend separately.
 */
const MESSAGE_OVERRIDES: Array<[test: RegExp, replacement: string]> = [
  [/记录/, "A record with this value already exists."],
  [/^Internal server error$/i, FALLBACK_MESSAGE],
];

export function normalizeError(
  error: FetchBaseQueryError | SerializedError | undefined | null,
): NormalizedApiError | null {
  if (!error) return null;

  // ---- RTK's own serialized errors (thrown inside a thunk, aborts, etc.) ---
  if (!("status" in error)) {
    const serialized = error as SerializedError;
    if (serialized.name === "AbortError") {
      return { kind: "network", message: "Request cancelled.", raw: error };
    }
    return {
      kind: "unknown",
      message: serialized.message ?? FALLBACK_MESSAGE,
      raw: error,
    };
  }

  const fetchError = error as FetchBaseQueryError;

  // ---- Transport-level failures -------------------------------------------
  if (fetchError.status === "FETCH_ERROR") {
    return {
      kind: "network",
      message:
        "Unable to reach the server. Check your connection and try again.",
      raw: error,
    };
  }

  if (fetchError.status === "TIMEOUT_ERROR") {
    return {
      kind: "network",
      message: "The request timed out. Please try again.",
      raw: error,
    };
  }

  if (fetchError.status === "PARSING_ERROR") {
    return {
      kind: "malformed",
      message: "Received an unreadable response from the server.",
      status: fetchError.originalStatus,
      raw: error,
    };
  }

  if (fetchError.status === "CUSTOM_ERROR") {
    return {
      kind: "unknown",
      message: fetchError.error || FALLBACK_MESSAGE,
      raw: error,
    };
  }

  // ---- HTTP status with a body --------------------------------------------
  const status = fetchError.status;
  const body = fetchError.data;
  const failure = isApiFailure(body) ? body : null;

  return {
    kind: kindFromStatus(status),
    message: applyOverrides(failure?.message) ?? defaultMessageFor(status),
    status,
    fieldErrors: toFieldErrors(failure?.errors),
    raw: body,
  };
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "unknown";
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource could not be found.";
    case 409:
      return "This conflicts with existing data.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 502:
    case 503:
    case 504:
      return "The server is temporarily unavailable. Please try again shortly.";
    default:
      return FALLBACK_MESSAGE;
  }
}

function applyOverrides(message: string | undefined): string | undefined {
  if (!message) return undefined;
  for (const [test, replacement] of MESSAGE_OVERRIDES) {
    if (test.test(message)) return replacement;
  }
  return message;
}

/**
 * Collapse the backend's `[{ field, message }]` array into the flat record
 * react-hook-form's `setError` expects.
 *
 * Nested Zod paths arrive dot-joined ("profile.name"), which is exactly RHF's
 * path syntax, so no transformation is needed. On duplicate fields the first
 * message wins — it is the one closest to the top of the schema and therefore
 * the most specific.
 */
function toFieldErrors(
  errors: ApiFieldError[] | undefined,
): Record<string, string> | undefined {
  if (!errors?.length) return undefined;

  const record: Record<string, string> = {};
  for (const { field, message } of errors) {
    if (field && !(field in record)) record[field] = message;
  }
  return Object.keys(record).length > 0 ? record : undefined;
}

function isApiFailure(value: unknown): value is ApiFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success: unknown }).success === false
  );
}

/* -------------------------------------------------------------------------- */
/* Convenience predicates                                                      */
/* -------------------------------------------------------------------------- */

export const isUnauthorized = (e: NormalizedApiError | null): boolean =>
  e?.kind === "unauthorized";

export const isForbidden = (e: NormalizedApiError | null): boolean =>
  e?.kind === "forbidden";

export const isNotFound = (e: NormalizedApiError | null): boolean =>
  e?.kind === "not_found";

/** Whether offering a "Try again" affordance makes sense for this failure. */
export const isRetryable = (e: NormalizedApiError | null): boolean =>
  e?.kind === "network" || e?.kind === "server" || e?.kind === "rate_limited";
