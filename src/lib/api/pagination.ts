import type { ApiMeta, Paginated } from "@/types/api";

/**
 * Pagination normalisation.
 *
 * The backend emits list responses in two incompatible shapes:
 *
 *   A) sibling `meta`  — via `sendPaginated()`
 *      { success, data: [...], meta: { page, limit, total, totalPages } }
 *      used by: ledgers, deposits, withdrawals, trades, referral bonuses,
 *               cycle bonuses
 *
 *   B) inline in `data` — hand-rolled in the service
 *      { success, data: { users: [...], total, page, limit, totalPages } }
 *      used by: GET /users, /admin/users, /admin/deposits,
 *               /admin/withdrawals, /notifications
 *      …and note the array key differs per endpoint (`users`, `deposits`,
 *      `withdrawals`, `notifications`).
 *
 * Leaking that split into components would mean every table knew which
 * backend module it came from. Instead each endpoint definition picks the
 * right adapter here and every list hook in the app returns `Paginated<T>`.
 *
 * These operate on the *whole* envelope because RTK Query's
 * `transformResponse` receives the parsed body, and shape B needs `data`
 * while shape A needs both `data` and `meta`.
 */

const EMPTY_META: ApiMeta = { page: 1, limit: 0, total: 0, totalPages: 0 };

/** Adapter for shape A — rows in `data`, pagination in a sibling `meta`. */
export function fromMetaEnvelope<T>(response: unknown): Paginated<T> {
  const envelope = asRecord(response);
  const items = Array.isArray(envelope?.data) ? (envelope.data as T[]) : [];
  const meta = { ...EMPTY_META, ...(asRecord(envelope?.meta) ?? {}) } as ApiMeta;

  return {
    items,
    page: numberOr(meta.page, 1),
    limit: numberOr(meta.limit, items.length),
    total: numberOr(meta.total, items.length),
    totalPages: numberOr(meta.totalPages, computeTotalPages(meta)),
  };
}

/**
 * Adapter for shape B — everything inside `data`, rows under `key`.
 *
 * @param key the property holding the array, e.g. "users" | "notifications"
 */
export function fromInlineEnvelope<T>(
  response: unknown,
  key: string,
): Paginated<T> {
  const envelope = asRecord(response);
  const data = asRecord(envelope?.data) ?? {};

  const items = Array.isArray(data[key]) ? (data[key] as T[]) : [];
  const limit = numberOr(data.limit, items.length);
  const total = numberOr(data.total, items.length);

  return {
    items,
    page: numberOr(data.page, 1),
    limit,
    total,
    totalPages: numberOr(
      data.totalPages,
      limit > 0 ? Math.ceil(total / limit) : 0,
    ),
  };
}

/**
 * Adapter for endpoints that return a bare array with no pagination at all
 * (GET /referrals/referrals, GET /settings). Presents them through the same
 * interface so a table component can consume either without branching.
 */
export function fromBareArray<T>(response: unknown): Paginated<T> {
  const envelope = asRecord(response);
  const items = Array.isArray(envelope?.data) ? (envelope.data as T[]) : [];
  return {
    items,
    page: 1,
    limit: items.length,
    total: items.length,
    totalPages: items.length > 0 ? 1 : 0,
  };
}

export function emptyPage<T>(): Paginated<T> {
  return { items: [] as T[], page: 1, limit: 0, total: 0, totalPages: 0 };
}

/* -------------------------------------------------------------------------- */
/* Query-string helpers                                                        */
/* -------------------------------------------------------------------------- */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/**
 * Build a query object, dropping empty values.
 *
 * Necessary because the backend's Zod query schemas mostly use
 * `z.nativeEnum(...).optional()`, which rejects an empty string — sending
 * `?status=` would 400. A "clear filter" action in the UI must therefore omit
 * the key entirely rather than send a blank.
 */
export function buildQuery(
  params: Record<string, string | number | boolean | null | undefined>,
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    query[key] = String(value);
  }
  return query;
}

function computeTotalPages(meta: ApiMeta): number {
  if (!meta.limit || meta.limit <= 0) return 0;
  return Math.ceil(meta.total / meta.limit);
}

function numberOr(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}
