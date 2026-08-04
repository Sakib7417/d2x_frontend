"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";
import {
  AuthFormError,
  AuthFormFooter,
  AuthFormHeader,
  AuthSubmitButton,
} from "./auth-form-shell";
import { useLoginMutation } from "../api/auth-api";
import { useFormSubmit } from "../hooks/use-form-submit";
import { loginSchema, type LoginFormValues } from "../schemas/auth-schemas";
import { ROUTES, safeRedirectTarget } from "@/config/routes";
import { UserRole } from "@/types/enums";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login] = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    // `onTouched` rather than `onChange`: validating an email on every
    // keystroke shows "invalid email" while the user is still typing the
    // domain, which reads as the form fighting them.
    mode: "onTouched",
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const { submit, submitting, formError } = useFormSubmit({
    form,
    mutate: async (values) => {
      const parsed = loginSchema.parse(values);
      return login({
        email: parsed.email,
        password: parsed.password,
      }).unwrap();
    },
    onSuccess: (user) => {
      toast.success(`Welcome back${user.name ? `, ${user.name}` : ""}`);

      // Honour ?next= from the middleware redirect, but only if it is a
      // same-origin path — `safeRedirectTarget` rejects absolute and
      // protocol-relative URLs to close the open-redirect vector.
      const fallback =
        user.role === UserRole.ADMIN ? ROUTES.admin.dashboard : ROUTES.dashboard;
      const destination = safeRedirectTarget(searchParams.get("next"), fallback);

      router.replace(destination);
      // Re-render server components so the layout picks up the new session
      // cookie; without this the shell can render its signed-out state.
      router.refresh();
    },
  });

  return (
    <>
      <AuthFormHeader
        title="Sign in"
        description="Access your portfolio, trading sessions and referral network."
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
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href={ROUTES.forgotPassword}
                    className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 transition-colors hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    invalid={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    id="rememberMe"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Label
                  htmlFor="rememberMe"
                  className="text-muted-foreground cursor-pointer text-sm font-normal"
                >
                  Keep me signed in
                </Label>
              </FormItem>
            )}
          />

          <AuthSubmitButton loading={submitting} loadingLabel="Signing in…">
            Sign in
          </AuthSubmitButton>
        </form>
      </Form>

      <AuthFormFooter
        prompt="New to DOLLAR2X?"
        linkLabel="Create an account"
        href={ROUTES.signup}
      />
    </>
  );
}
