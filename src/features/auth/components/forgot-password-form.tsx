"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { motion } from "framer-motion";

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
} from "./auth-form-shell";
import { useForgotPasswordMutation } from "../api/auth-api";
import { useFormSubmit } from "../hooks/use-form-submit";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../schemas/auth-schemas";
import { ROUTES } from "@/config/routes";

/**
 * Request a password reset.
 *
 * The backend deliberately returns the same success response whether or not
 * the email exists (`forgotPassword` returns early on an unknown address), to
 * prevent account enumeration. The UI must preserve that: we show the identical
 * confirmation either way and never hint at whether an account was found.
 */
export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [forgotPassword] = useForgotPasswordMutation();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  const { submit, submitting, formError } = useFormSubmit({
    form,
    mutate: async (values) => {
      const parsed = forgotPasswordSchema.parse(values);
      return forgotPassword({ email: parsed.email }).unwrap();
    },
    onSuccess: (_result, values) => {
      setSentTo(forgotPasswordSchema.parse(values).email);
    },
    // The confirmation screen is the feedback; a toast on top is redundant.
    toastOnError: true,
  });

  if (sentTo) {
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
          title="Check your inbox"
          description={
            <>
              If an account exists for{" "}
              <span className="text-foreground font-medium">{sentTo}</span>,
              we&apos;ve sent a link to reset your password. The link expires in
              one hour.
            </>
          }
        />

        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              try a different address
            </button>
            .
          </p>

          <Button variant="outline" asChild className="w-full">
            <Link href={ROUTES.login}>
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <AuthFormHeader
        title="Reset your password"
        description="Enter the email associated with your account and we'll send you a reset link."
      />

      <AuthFormError error={formError} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    aria-invalid={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <AuthSubmitButton loading={submitting} loadingLabel="Sending…">
            Send reset link
          </AuthSubmitButton>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <Link
          href={ROUTES.login}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </div>
    </>
  );
}
