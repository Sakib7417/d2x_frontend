import "server-only";

import { env } from "@/config/env";

/**
 * Low-level HTTP client for the Express backend.
 *
 * Only the BFF layer (route handlers, server actions, RSC data loaders) may
 * import this. Client components go through RTK Query, which talks to our own
 * same-origin `/api/bff/*` proxy.
 */

export interface UpstreamRequest {
  /** Path relative to API_BASE_URL, must start with "/". e.g. "/auth/login". */
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Bearer token to attach. Omit for public endpoints. */
  accessToken?: string | null;
  /** Extra headers. `content-type` and `authorization` are managed for you. */
  headers?: Record<string, string>;
  /**
   * Real client IP, forwarded so the backend's express-rate-limit buckets by
   * end user rather than by our single proxy IP. See the note in `proxy.ts`.
   */
  clientIp?: string | null;
  signal?: AbortSignal;
  /** Next.js fetch cache directives, for RSC data loading. */
  next?: { revalidate?: number | false; tags?: string[] };
}

export interface UpstreamResponse {
  status: number;
  ok: boolean;
  /** Parsed JSON body, or null when the response had no body / was not JSON. */
  body: unknown;
  /** Raw text, retained when JSON parsing failed so we can log contract drift. */
  rawText: string | null;
  headers: Headers;
}

/** Thrown only for transport failures — never for a 4xx/5xx with a body. */
export class UpstreamTransportError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    readonly timedOut = false,
  ) {
    super(message);
    this.name = "UpstreamTransportError";
  }
}

export async function callUpstream(
  request: UpstreamRequest,
): Promise<UpstreamResponse> {
  const {
    path,
    method = "GET",
    body,
    accessToken,
    headers = {},
    clientIp,
    signal,
    next,
  } = request;

  const url = `${env.API_BASE_URL}${path}`;

  const finalHeaders: Record<string, string> = {
    accept: "application/json",
    ...headers,
  };

  if (accessToken) {
    finalHeaders.authorization = `Bearer ${accessToken}`;
  }

  // Preserve the end user's IP through the proxy hop. Without this every
  // request looks like it came from the Next server and the backend's
  // 100-req/15min-per-IP limiter throttles the entire platform as one client.
  if (clientIp) {
    finalHeaders["x-forwarded-for"] = clientIp;
    finalHeaders["x-real-ip"] = clientIp;
  }

  let payload: BodyInit | undefined;
  if (body !== undefined && method !== "GET") {
    // Raw body passthrough (multipart form data from proxy)
    if (typeof body === "object" && body !== null && "__rawBody" in body) {
      const raw = body as { __rawBody: Uint8Array; contentType: string };
      payload = raw.__rawBody as unknown as BodyInit;
      finalHeaders["content-type"] = raw.contentType;
    } else {
      payload = JSON.stringify(body);
      finalHeaders["content-type"] = "application/json";
    }
  }

  // Compose caller-supplied abort with our own timeout.
  const timeoutController = new AbortController();
  const timeout = setTimeout(
    () => timeoutController.abort(new Error("upstream-timeout")),
    env.API_TIMEOUT_MS,
  );
  const composedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
      signal: composedSignal,
      // Default to no caching: this is an authenticated financial API and a
      // cached balance is a wrong balance. Opt in explicitly per call.
      cache: next ? undefined : "no-store",
      ...(next ? { next } : {}),
    });
  } catch (error) {
    const timedOut = timeoutController.signal.aborted;
    throw new UpstreamTransportError(
      timedOut
        ? `Upstream request timed out after ${env.API_TIMEOUT_MS}ms: ${method} ${path}`
        : `Upstream request failed: ${method} ${path}`,
      error,
      timedOut,
    );
  } finally {
    clearTimeout(timeout);
  }

  // 204 and friends legitimately have no body.
  if (response.status === 204 || response.status === 304) {
    return {
      status: response.status,
      ok: response.ok,
      body: null,
      rawText: null,
      headers: response.headers,
    };
  }

  const rawText = await response.text();

  let parsed: unknown = null;
  if (rawText.length > 0) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Non-JSON response. Happens on 429 from some proxies, or if the backend
      // crashes and Express emits an HTML error page. Keep the text for logs;
      // the caller normalises this into a `malformed` error.
      parsed = null;
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    body: parsed,
    rawText,
    headers: response.headers,
  };
}
