import { z } from "zod";

/**
 * Client-side validation schemas.
 *
 * These MIRROR `src/modules/auth/validator/auth.validator.ts` in the backend.
 * That duplication is deliberate and needs to stay honest in both directions:
 *
 *   - Looser than the server -> the user submits, waits for a round trip, and
 *     gets an error that could have been caught instantly.
 *   - Stricter than the server -> we reject input the platform would have
 *     accepted, and the user has no way to understand why.
 *
 * So every rule below is annotated with the backend rule it mirrors. If you
 * change one, change both.
 *
 * Client-only additions (confirm-password, terms acceptance) are marked as
 * such and are stripped before the request is sent — see `toSignupRequest`.
 */

/* -------------------------------------------------------------------------- */
/* Shared field rules                                                          */
/* -------------------------------------------------------------------------- */

/** Backend: `z.string().email('Invalid email format')` */
const email = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  // The backend compares raw, and Postgres `@unique` is case-SENSITIVE, so
  // "User@x.com" and "user@x.com" would be two distinct accounts. Normalising
  // here means a user who capitalises their email on a second visit still
  // reaches the account they created.
  .transform((value) => value.trim().toLowerCase());

/** Backend: `z.string().min(8, 'Password must be at least 8 characters')` */
const password = z
  .string()
  .min(8, "Password must be at least 8 characters");

/**
 * Login password.
 *
 * Backend uses `min(1)` here, NOT `min(8)` — deliberately, so that an existing
 * account with a legacy short password can still sign in. Mirroring that
 * matters: applying the 8-char rule on login would lock such users out with a
 * validation error rather than letting the server decide.
 */
const loginPassword = z.string().min(1, "Password is required");

/**
 * Backend: `z.string().regex(/^\+?[1-9]\d{1,14}$/)` — E.164.
 * Note it rejects a leading zero and any spaces, dashes or parentheses, so we
 * strip common formatting before validating rather than failing a user who
 * typed "+1 (555) 123-4567".
 */
const phone = z
  .string()
  .transform((value) => value.replace(/[\s()\-.]/g, ""))
  .pipe(
    z
      .string()
      .regex(
        /^\+?[1-9]\d{1,14}$/,
        "Enter a valid international phone number, e.g. +14155551234",
      ),
  );

/** Backend: `z.string().regex(/^0x[a-fA-F0-9]{40}$/)` */
const walletAddress = z
  .string()
  .trim()
  .regex(
    /^0x[a-fA-F0-9]{40}$/,
    "Enter a valid wallet address (0x followed by 40 hex characters)",
  );

/**
 * Backend: `z.string().length(8, 'Referral code must be 8 characters')`.
 *
 * Worth flagging: `POST /referrals/validate` accepts `min(6)` while signup
 * requires exactly 8. Codes are generated at length 8
 * (REFERRAL_CODE_LENGTH), so 8 is the real constraint and we enforce that.
 *
 * Uppercased because generated codes use A-Z0-9 only, and users routinely type
 * them in lowercase off a screenshot.
 */
const referralCode = z
  .string()
  .trim()
  .toUpperCase()
  .length(8, "Referral codes are 8 characters");

/* -------------------------------------------------------------------------- */
/* Login                                                                       */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email,
  password: loginPassword,
  /** Client-only: not sent. Reserved for future session-length control. */
  rememberMe: z.boolean().default(true),
});

export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginFormOutput = z.output<typeof loginSchema>;

/* -------------------------------------------------------------------------- */
/* Signup                                                                      */
/* -------------------------------------------------------------------------- */

export const signupSchema = z
  .object({
    /** Backend: `z.string().min(2).optional()` */
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be 100 characters or fewer"),
    email,
    password,
    /** Client-only — never transmitted. */
    confirmPassword: z.string().min(1, "Please confirm your password"),
    /** Optional on the backend; blank strings are stripped before sending. */
    phone: z.union([phone, z.literal("")]).optional(),
    country: z
      .union([
        z
          .string()
          .trim()
          .min(2, "Country must be at least 2 characters")
          .max(100),
        z.literal(""),
      ])
      .optional(),
    referralCode: z.union([referralCode, z.literal("")]).optional(),
    walletAddress: z.union([walletAddress, z.literal("")]).optional(),
    /** Client-only. */
    acceptTerms: z.literal(true, {
      message: "You must accept the terms to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    // Attach to the confirm field so the message renders under the input the
    // user needs to fix, not at the form root.
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.input<typeof signupSchema>;
export type SignupFormOutput = z.output<typeof signupSchema>;

/**
 * Strip client-only fields and drop empty optionals.
 *
 * Sending `phone: ""` would fail the backend's regex — its optional fields
 * reject empty strings rather than treating them as absent. Every optional
 * must therefore be omitted entirely when blank, not sent as "".
 */
export function toSignupRequest(values: SignupFormOutput) {
  const payload: Record<string, string> = {
    name: values.name,
    email: values.email,
    password: values.password,
  };

  if (values.phone) payload.phone = values.phone;
  if (values.country) payload.country = values.country;
  if (values.referralCode) payload.referralCode = values.referralCode;
  if (values.walletAddress) payload.walletAddress = values.walletAddress;

  return payload as {
    name: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    referralCode?: string;
    walletAddress?: string;
  };
}

/* -------------------------------------------------------------------------- */
/* Password reset                                                              */
/* -------------------------------------------------------------------------- */

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    /**
     * Backend: `z.string().min(1)`.
     * Generated by `generateReferralCode()` in auth.service, so it is 8 chars
     * of A-Z0-9 — but we only enforce non-empty, matching the server, in case
     * that generator changes.
     */
    token: z.string().min(1, "Reset token is missing"),
    newPassword: password,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>;
export type ResetPasswordFormOutput = z.output<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: password,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export type ChangePasswordFormValues = z.input<typeof changePasswordSchema>;

/* -------------------------------------------------------------------------- */
/* Password strength                                                           */
/* -------------------------------------------------------------------------- */

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export interface PasswordAssessment {
  score: PasswordStrength;
  label: string;
  /** Unmet criteria, shown as a checklist. */
  suggestions: string[];
}

/**
 * Heuristic password strength meter.
 *
 * Deliberately NOT zxcvbn: that library is ~400kB and would be loaded on the
 * signup page, which is a conversion-critical first impression. This is a
 * cheap approximation whose only job is to nudge users toward better
 * passwords.
 *
 * It is advisory. The only enforced rule is the backend's 8-character minimum;
 * a weak-but-valid password still submits, because blocking on a client-side
 * heuristic would be both user-hostile and trivially bypassed.
 */
export function assessPassword(value: string): PasswordAssessment {
  const suggestions: string[] = [];

  const hasLength = value.length >= 8;
  const hasLongLength = value.length >= 12;
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if (!hasLength) suggestions.push("At least 8 characters");
  if (!hasUpper || !hasLower) suggestions.push("Mix upper and lower case");
  if (!hasDigit) suggestions.push("Include a number");
  if (!hasSymbol) suggestions.push("Include a symbol");
  if (hasLength && !hasLongLength) suggestions.push("12+ characters is stronger");

  let score = 0;
  if (hasLength) score += 1;
  if (hasUpper && hasLower) score += 1;
  if (hasDigit) score += 1;
  if (hasSymbol) score += 1;
  if (hasLongLength && score >= 3) score = 4;

  // A password under the minimum can never read as anything but weakest,
  // regardless of how much variety it packs into 5 characters.
  if (!hasLength) score = Math.min(score, 1);

  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;

  return {
    score: score as PasswordStrength,
    label: labels[score],
    suggestions: suggestions.slice(0, 3),
  };
}
