"use client";

import { useCallback, useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { normalizeError } from "@/lib/api/errors";
import type { NormalizedApiError } from "@/types/api";

/**
 * Bridges an RTK Query mutation to a react-hook-form form.
 *
 * Without this, every form re-implements the same five-step dance and gets at
 * least one step subtly wrong. It handles:
 *
 *  1. Normalising the RTK error into our discriminated `NormalizedApiError`.
 *  2. Mapping the backend's `errors: [{ field, message }]` onto the matching
 *     RHF fields, so a server-side "Invalid referral code" appears under the
 *     referral input rather than in a toast the user has to mentally re-attach
 *     to a field.
 *  3. Keeping any field error the server reports for a field the form does not
 *     have (contract drift) as a form-level message, instead of silently
 *     swallowing it.
 *  4. Surfacing non-field errors (401/409/429/5xx) as a form-level error the
 *     page can render inline, plus an optional toast.
 *  5. Focusing the first errored field, which is both an accessibility
 *     requirement and the thing that makes long forms bearable.
 *
 * Returns `formError` for non-field failures; field failures are already on
 * the form via `setError`.
 */

export interface UseFormSubmitOptions<TValues extends FieldValues, TResult> {
  form: UseFormReturn<TValues>;
  /** The mutation trigger. Must be the `.unwrap()`-able RTK trigger. */
  mutate: (values: TValues) => Promise<TResult>;
  onSuccess?: (result: TResult, values: TValues) => void | Promise<void>;
  /** Toast on non-field errors. Default true. */
  toastOnError?: boolean;
  /** Suppress the inline form-level error (when the page renders its own). */
  silent?: boolean;
}

export function useFormSubmit<TValues extends FieldValues, TResult>({
  form,
  mutate,
  onSuccess,
  toastOnError = true,
  silent = false,
}: UseFormSubmitOptions<TValues, TResult>) {
  const [formError, setFormError] = useState<NormalizedApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (values: TValues) => {
      setFormError(null);
      setSubmitting(true);

      try {
        const result = await mutate(values);
        await onSuccess?.(result, values);
        return result;
      } catch (rawError) {
        const error = normalizeError(
          rawError as Parameters<typeof normalizeError>[0],
        );
        if (!error) return undefined;

        const fieldErrors = error.fieldErrors;
        let mappedAny = false;

        if (fieldErrors) {
          // Which field names actually exist on this form. `getValues()` gives
          // us the registered shape, which is more reliable than assuming the
          // schema and the server agree.
          const known = new Set(Object.keys(form.getValues()));
          const unmapped: string[] = [];

          for (const [field, message] of Object.entries(fieldErrors)) {
            // Server paths are dot-joined, which is already RHF path syntax.
            // Compare on the root segment so "profile.name" matches "profile".
            const root = field.split(".")[0];

            if (known.has(field) || known.has(root)) {
              form.setError(field as Path<TValues>, {
                type: "server",
                message,
              });
              mappedAny = true;
            } else {
              unmapped.push(message);
            }
          }

          // Never lose a server message just because the field name drifted.
          if (unmapped.length > 0) {
            setFormError({
              ...error,
              message: unmapped.join(" "),
            });
          }
        }

        if (mappedAny) {
          // Focus the first errored field. RHF's own `shouldFocusError` only
          // applies to client-side resolver errors, not to `setError`.
          const first = Object.keys(fieldErrors ?? {})[0];
          if (first) {
            form.setFocus(first as Path<TValues>, { shouldSelect: true });
          }
        } else {
          if (!silent) setFormError(error);
          if (toastOnError) {
            toast.error(titleFor(error), { description: error.message });
          }
        }

        return undefined;
      } finally {
        setSubmitting(false);
      }
    },
    [form, mutate, onSuccess, silent, toastOnError],
  );

  return {
    submit,
    submitting,
    formError,
    clearFormError: () => setFormError(null),
  };
}

/**
 * Short heading for the toast. The detail lives in the description, so the
 * title should categorise rather than repeat.
 */
function titleFor(error: NormalizedApiError): string {
  switch (error.kind) {
    case "unauthorized":
      return "Sign-in failed";
    case "forbidden":
      return "Not permitted";
    case "conflict":
      return "Already exists";
    case "rate_limited":
      return "Too many attempts";
    case "network":
      return "Connection problem";
    case "server":
    case "malformed":
      return "Server error";
    case "validation":
      return "Check your details";
    default:
      return "Something went wrong";
  }
}
