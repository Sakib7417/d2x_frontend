"use client";

import { forwardRef, useId, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { assessPassword, type PasswordStrength } from "../schemas/auth-schemas";

/**
 * Password field with a visibility toggle and an optional strength meter.
 *
 * The visibility toggle is not a nicety: on mobile, a masked 12-character
 * password with mixed case and symbols has a high mistype rate, and the
 * alternative users reach for is a weaker password they can type reliably.
 *
 * `forwardRef` is required so react-hook-form's `register`/`setFocus` can
 * address the underlying input — without it, focusing the first errored field
 * silently does nothing.
 */

export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  /** Render the strength meter. Signup/reset only — never on login. */
  showStrength?: boolean;
  invalid?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { className, showStrength = false, invalid, value, ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false);
    const meterId = useId();

    const text = typeof value === "string" ? value : "";
    const assessment = showStrength ? assessPassword(text) : null;

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? "text" : "password"}
            value={value}
            aria-invalid={invalid}
            aria-describedby={assessment ? meterId : undefined}
            className={cn("pr-10", className)}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            // `tabIndex={-1}` keeps Tab moving between form fields rather than
            // detouring through the toggle on every password input.
            tabIndex={-1}
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
          >
            {visible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </div>

        {assessment && text.length > 0 && (
          <div id={meterId} className="space-y-1.5">
            <StrengthBars score={assessment.score} />
            <div className="flex items-start justify-between gap-3">
              <p
                className={cn(
                  "text-xs font-medium",
                  STRENGTH_TEXT[assessment.score],
                )}
              >
                {assessment.label}
              </p>
              {assessment.suggestions.length > 0 && (
                <ul className="text-muted-foreground space-y-0.5 text-right text-[0.6875rem]">
                  {assessment.suggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
            {assessment.suggestions.length === 0 && (
              <p className="text-profit inline-flex items-center gap-1 text-[0.6875rem]">
                <Check className="size-3" strokeWidth={3} />
                Meets all recommendations
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

const STRENGTH_TEXT: Record<PasswordStrength, string> = {
  0: "text-loss",
  1: "text-loss",
  2: "text-pending",
  3: "text-info",
  4: "text-profit",
};

const STRENGTH_BG: Record<PasswordStrength, string> = {
  0: "bg-loss",
  1: "bg-loss",
  2: "bg-pending",
  3: "bg-info",
  4: "bg-profit",
};

/**
 * Four segments rather than a single continuous bar: discrete steps make the
 * effect of adding a character class legible, where a smoothly growing bar
 * reads as arbitrary.
 */
function StrengthBars({ score }: { score: PasswordStrength }) {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {[1, 2, 3, 4].map((segment) => {
        const filled = score >= segment;
        return (
          <div
            key={segment}
            className="bg-muted h-1 flex-1 overflow-hidden rounded-full"
          >
            <motion.div
              initial={false}
              animate={{ scaleX: filled ? 1 : 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "left" }}
              className={cn("h-full w-full rounded-full", STRENGTH_BG[score])}
            />
          </div>
        );
      })}
    </div>
  );
}
