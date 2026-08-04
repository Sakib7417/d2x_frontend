/**
 * Wire-level primitives for the backend contract.
 *
 * Everything here describes JSON *as it arrives over HTTP*, which is not the
 * same as the Prisma types on the server:
 *   - Prisma `Decimal`  -> JSON string   (e.g. "1250.45000000")
 *   - Prisma `DateTime` -> JSON string   (ISO 8601)
 *   - Prisma `BigInt`   -> throws unless the server stringifies it
 *
 * Encoding those differences in the type system is the whole point: it makes
 * `deposit.amount * 2` a compile error instead of a silent `NaN` in production.
 */

/* -------------------------------------------------------------------------- */
/* Branded scalars                                                            */
/* -------------------------------------------------------------------------- */

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

/**
 * A fixed-point decimal serialised as a string, `Decimal(20,8)` on the server.
 *
 * Branded so it cannot be passed where a plain `string` label is expected and,
 * more importantly, so arithmetic on it fails to compile. All maths must go
 * through `@/lib/utils/money`, which operates on BigInt sub-units.
 *
 * Why this matters here specifically: USDT balances have 8 decimal places and
 * can exceed 2^53 sub-units. `parseFloat("0.1") + parseFloat("0.2")` is
 * 0.30000000000000004 — an accounting platform cannot ship that.
 */
export type DecimalString = Brand<string, "DecimalString">;

/** ISO-8601 timestamp string, e.g. "2026-08-01T09:00:00.000Z". */
export type ISODateString = Brand<string, "ISODateString">;

/** UUID v4 as returned by Prisma `@default(uuid())`. */
export type UUID = Brand<string, "UUID">;

/** 0x-prefixed 40-hex EVM address. */
export type EvmAddress = Brand<string, "EvmAddress">;

/** 0x-prefixed 64-hex transaction hash. */
export type TxHash = Brand<string, "TxHash">;

/* -------------------------------------------------------------------------- */
/* Response envelopes                                                          */
/* -------------------------------------------------------------------------- */

/** Shape emitted by `sendSuccess` in `src/utils/responseFormatter.ts`. */
export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

/** Pagination block emitted by `sendPaginated`. */
export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** `sendPaginated` puts the rows in `data` and pagination in a sibling `meta`. */
export interface ApiPaginated<T> extends ApiSuccess<T[]> {
  meta: ApiMeta;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

/** Shape emitted by `errorHandler` / `sendError`. */
export interface ApiFailure {
  success: false;
  message: string;
  error?: string;
  errors?: ApiFieldError[];
  /** Only present when the backend runs with NODE_ENV=development. */
  stack?: string;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/**
 * Some modules return pagination *inside* `data` instead of in a sibling
 * `meta`. This is a genuine inconsistency in the backend, not a modelling
 * choice on our side:
 *
 *   sibling `meta`   -> ledgers, deposits, withdrawals, trades,
 *                       referral bonuses, cycle bonuses
 *   inline in `data` -> GET /users, GET /admin/users,
 *                       GET /admin/deposits, GET /admin/withdrawals,
 *                       GET /notifications
 *
 * Rather than leak that split into every component, each endpoint definition
 * normalises to `Paginated<T>` in its `transformResponse`, using the adapters
 * in `@/lib/api/pagination.ts` (`fromMetaEnvelope` / `fromInlineEnvelope`).
 */

/** The single normalised list shape every list hook in the app returns. */
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* -------------------------------------------------------------------------- */
/* Normalised client-side error                                                */
/* -------------------------------------------------------------------------- */

export type ApiErrorKind =
  /** 400 — Zod rejected the body/query. `fieldErrors` is populated. */
  | "validation"
  /** 401 — missing/expired token; refresh already attempted and failed. */
  | "unauthorized"
  /** 403 — authenticated but wrong role. */
  | "forbidden"
  /** 404 */
  | "not_found"
  /** 409 — unique constraint (duplicate email, duplicate tx hash). */
  | "conflict"
  /** 429 — rate limited. */
  | "rate_limited"
  /** 5xx */
  | "server"
  /** Request never completed: DNS, offline, CORS, abort. */
  | "network"
  /** Response was not the envelope we expect — contract drift. */
  | "malformed"
  | "unknown";

/**
 * Every failure in the app is normalised to this before it reaches a component.
 * Components must never branch on raw HTTP status codes.
 */
export interface NormalizedApiError {
  kind: ApiErrorKind;
  /** Safe to display to an end user. */
  message: string;
  status?: number;
  /** Keyed by form field path, ready to feed into react-hook-form setError. */
  fieldErrors?: Record<string, string>;
  /** Original payload, for logging only. Never render this. */
  raw?: unknown;
}
