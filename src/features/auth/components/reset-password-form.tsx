"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function ResetPasswordForm() {
  const router = useRouter();
  const [resetPassword] = useResetPasswordMutation();
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { submit, submitting, formError } = useFormSubmit({
    form,
    mutate: async (values) => {
      const parsed = resetPasswordSchema.parse(values);
      return resetPassword({
        email: parsed.email,
        otp: parsed.otp,
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
        description="Enter the 6-digit code we sent to your email, then set a new password."
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

          <FormField
            control={form.control}
            name="otp"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Reset code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code from your email"
                    className="font-mono"
                    aria-invalid={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        Didn&apos;t get a code?{" "}
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
