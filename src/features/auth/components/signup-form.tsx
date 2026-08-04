"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./password-input";
import {
  AuthFormError,
  AuthFormFooter,
  AuthFormHeader,
  AuthSubmitButton,
} from "./auth-form-shell";
import { useSignupMutation } from "../api/auth-api";
import { useFormSubmit } from "../hooks/use-form-submit";
import {
  signupSchema,
  toSignupRequest,
  type SignupFormValues,
} from "../schemas/auth-schemas";
import { ROUTES } from "@/config/routes";

/**
 * Signup.
 *
 * Only four fields are required (name, email, password, confirm). Phone,
 * country and wallet address are optional on the backend and are collapsed
 * behind a disclosure — asking for a wallet address before someone has an
 * account is a conversion killer, and it can be set later in Profile.
 *
 * The referral code is surfaced prominently *only* when one is present in the
 * URL, since that user arrived through a referral link and seeing their
 * sponsor's code confirmed is reassuring. Otherwise it lives in the optional
 * section.
 */
export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signup] = useSignupMutation();

  // `/ref/<code>` rewrites to `/signup?ref=<code>`; also accept ?referralCode=
  // so a manually shared link with either param works.
  const referralFromUrl = (
    searchParams.get("ref") ??
    searchParams.get("referralCode") ??
    ""
  )
    .trim()
    .toUpperCase();

  const hasReferral = referralFromUrl.length > 0;

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      referralCode: referralFromUrl,
      acceptTerms: false as unknown as true,
    },
  });

  const { submit, submitting, formError } = useFormSubmit({
    form,
    mutate: async (values) => {
      const parsed = signupSchema.parse(values);
      // Strips confirmPassword/acceptTerms and omits blank optionals — the
      // backend rejects "" for phone/walletAddress rather than ignoring it.
      return signup(toSignupRequest(parsed)).unwrap();
    },
    onSuccess: (user) => {
      toast.success("Account created", {
        description: `Welcome aboard${user.name ? `, ${user.name}` : ""}.`,
      });
      // New accounts are always USER role, so no admin branch is needed here.
      router.replace(ROUTES.dashboard);
      router.refresh();
    },
  });

  return (
    <>
      <AuthFormHeader
        title="Create your account"
        description="Start with a USDT deposit and let automated sessions do the work."
      />

      {hasReferral && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-primary/25 bg-primary/8 mb-5 flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5"
        >
          <Gift className="text-primary size-4 shrink-0" />
          <p className="text-sm">
            Invited with code{" "}
            <span className="font-mono font-semibold">{referralFromUrl}</span>
          </p>
        </motion.div>
      )}

      <AuthFormError error={formError} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="name"
                    autoFocus
                    placeholder="Alex Morgan"
                    aria-invalid={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormLabel>Password</FormLabel>
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
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    invalid={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              inputMode="tel"
                              autoComplete="tel"
                              placeholder="Mobile number"
                              aria-invalid={Boolean(fieldState.error)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="referralCode"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Referral code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="ABCD1234"
                              maxLength={8}
                              autoCapitalize="characters"
                              spellCheck={false}
                              className="font-mono uppercase"
                              aria-invalid={Boolean(fieldState.error)}
                            />
                          </FormControl>
                          <FormDescription>
                            8 characters, from whoever invited you.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
          </div>

          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field, fieldState }) => (
              <FormItem className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <FormControl>
                    <Checkbox
                      id="acceptTerms"
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      aria-invalid={Boolean(fieldState.error)}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <label
                    htmlFor="acceptTerms"
                    className="text-muted-foreground cursor-pointer text-sm leading-relaxed"
                  >
                    I agree to the{" "}
                    <Link
                      href="/legal/terms"
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/legal/privacy"
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <AuthSubmitButton loading={submitting} loadingLabel="Creating account…">
            Create account
          </AuthSubmitButton>
        </form>
      </Form>

      <AuthFormFooter
        prompt="Already have an account?"
        linkLabel="Sign in"
        href={ROUTES.login}
      />
    </>
  );
}
