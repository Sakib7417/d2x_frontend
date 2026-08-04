"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound } from "lucide-react";
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
import { PasswordInput } from "./password-input";
import {
  AuthFormError,
  AuthFormHeader,
  AuthSubmitButton,
} from "./auth-form-shell";
import { useResetPasswordMutation } from "../api/auth-api";
import { useFormSubmit } from "../hooks/use-form-submit";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../schemas/auth-schemas";
import { ROUTES } from "@/config/routes";

/**
 * Complete a password reset.
 *
 * The token arrives as `?token=` from the emailed link. It is rendered as a
 * visible (editable) field only when absent from the URL, so a user who
 * received a code out-of-band — or whose email client mangled the link — can
 * still paste it rather than hitting a dead end.
 *
 * On success the backend revokes every refresh token for the account
 * (`revokeAllUserTokens`), so all other sessions are signed out. We tell the
 * user that explicitly: silent session termination looks like a bug on their
 * other devices.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resetPassword] = useResetPasswordMutation();
  const [done, setDone] = useState(false);

  const tokenFromUrl = (searchParams.get("token") ?? "").trim();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      token: tokenFromUrl,
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { submit, submitting, formError } = useFormSubmit({
    form,
    mutate: async (values) => {
      const parsed = resetPasswordSchema.parse(values);
      return resetPassword({
        token: parsed.token,
        newPassword: parsed.newPassword,
      }).unwrap();
    },
    onSuccess: () => {
      setDone(true);
      toast.success("Password updated");
    },
  });

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="border-profit/25 bg-profit-muted text-profit mb-6 grid size-12 place-items-center rounded-2xl border">
          <CheckCircle2 className="size-6" strokeWidth={1.75} />
        </div>

        <AuthFormHeader
          title="Password updated"
          description="For your security, you've been signed out on all other devices. Sign in with your new password to continue."
        />

        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            router.replace(ROUTES.login);
            router.refresh();
          }}
        >
          Continue to sign in
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="border-border/70 bg-surface-2 text-muted-foreground mb-6 grid size-12 place-items-center rounded-2xl border">
        <KeyRound className="size-6" strokeWidth={1.75} />
      </div>

      <AuthFormHeader
        title="Choose a new password"
        description="Pick something you haven't used before. This will sign you out everywhere else."
      />

      <AuthFormError error={formError} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
          {/*
            When the token came from the URL we keep it in the form state but
            out of the visual flow — showing an opaque 8-character code the
            user cannot act on is noise. It stays registered so validation and
            server-side field errors still target it.
          */}
          {tokenFromUrl ? (
            <input type="hidden" {...form.register("token")} />
          ) : (
            <FormField
              control={form.control}
              name="token"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Reset code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoFocus
                      spellCheck={false}
                      autoCapitalize="characters"
                      placeholder="Paste the code from your email"
                      className="font-mono"
                      aria-invalid={Boolean(fieldState.error)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
                    autoFocus={Boolean(tokenFromUrl)}
                    placeholder="At least 8 characters"
                    showStrength
                    invalid={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    invalid={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <AuthSubmitButton loading={submitting} loadingLabel="Updating…">
            Update password
          </AuthSubmitButton>
        </form>
      </Form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Link expired?{" "}
        <Link
          href={ROUTES.forgotPassword}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Request a new one
        </Link>
      </p>
    </>
  );
}
