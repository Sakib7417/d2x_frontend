import "server-only";

import { z } from "zod";

/**
 * Server-side environment configuration.
 *
 * Guarded by `server-only`: importing this from a client component is a build
 * error, not a runtime surprise. That matters because this module holds the
 * upstream API origin and, later, any signing secrets — none of which may ever
 * reach the browser bundle.
 *
 * Validation runs once at module load. Failing fast on boot is strictly better
 * than discovering a typo'd API_BASE_URL when the first user tries to log in.
 */

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  /**
   * Origin + prefix of the Express backend, no trailing slash.
   * The backend defaults to :3000, so the Next dev server runs on :3001.
   */
  API_BASE_URL: z
    .string()
    .url()
    .transform((value) => value.replace(/\/+$/, ""))
    // .default("https://api.dollar2x.trade/api/v1"),
    .default("http://localhost:3000"),

  /**
   * Public origin of THIS app. Used for absolute redirect URLs and for the
   * referral link fallback. Must match the backend's FRONTEND_URL so that
   * `/referrals/link` produces URLs that actually resolve.
   */
  APP_URL: z
    .string()
    .url()
    .transform((value) => value.replace(/\/+$/, ""))
    // .default("https://api.dollar2x.trade"),
    .default("http://localhost:3000"),

  /**
   * Upstream request timeout in ms. The backend performs on-chain RPC calls on
   * some routes (blockchain verify), which can be slow, so this is generous —
   * but it must stay below the platform's own function timeout.
   */
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid server environment configuration:\n${issues}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
