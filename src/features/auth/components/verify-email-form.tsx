"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AuthFormError,
  AuthFormHeader,
  AuthSubmitButton,
} from "@/features/auth/components/auth-form-shell";
import { useVerifyEmailMutation, useResendOtpMutation } from "@/features/auth/api/auth-api";
import { useFormSubmit } from "@/features/auth/hooks/use-form-submit";
import {
  verifyEmailSchema,
  type VerifyEmailFormValues,
} from "@/features/auth/schemas/auth-schemas";
import { ROUTES } from "@/config/routes";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifyEmail] = useVerifyEmailMutation();
  const [resendOtp] = useResendOtpMutation();
  const [resending, setResending] = useState(false);

  const email = searchParams.get("email") ?? "";

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    mode: "onTouched",
    defaultValues: {
      email,
      otp: "",
    },
  });

  // Keep email in sync with URL param
  useEffect(() => {
    form.setValue("email", email);
  }, [email, form]);

  const { submit, submitting, formError } = useFormSubmit({
    form,
    mutate: async (values) => {
      const parsed = verifyEmailSchema.parse(values);
      return verifyEmail(parsed).unwrap();
    },
    onSuccess: () => {
      toast.success("Email verified");
      router.replace(ROUTES.dashboard);
      router.refresh();
    },
  });

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await resendOtp({ email, purpose: "SIGNUP" }).unwrap();
      toast.success("Code sent", { description: "Check your email." });
    } catch {
      // error surfaced by RTK/sonner
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="border-profit/25 bg-profit-muted text-profit mb-6 grid size-12 place-items-center rounded-2xl border">
        <MailCheck className="size-6" strokeWidth={1.75} />
      </div>

      <AuthFormHeader
        title="Verify your email"
        description={
          <>
            We sent a 6-digit code to{" "}
            <span className="text-foreground font-medium">{email || "your email"}</span>.
            Enter it below to finish creating your account.
          </>
        }
      />

      <AuthFormError error={formError} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
          <input type="hidden" {...form.register("email")} value={email} />

          <FormField
            control={form.control}
            name="otp"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Verification code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    className="font-mono"
                    aria-invalid={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <AuthSubmitButton loading={submitting} loadingLabel="Verifying…">
            Verify and continue
          </AuthSubmitButton>
        </form>
      </Form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Didn&apos;t get it?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-foreground font-medium underline-offset-4 hover:underline disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </p>

      <p className="text-muted-foreground mt-2 text-center text-sm">
        Wrong email?{" "}
        <Link
          href={ROUTES.signup}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Sign up again
        </Link>
      </p>
    </motion.div>
  );
}
