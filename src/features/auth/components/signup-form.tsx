"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Gift, ArrowRight, ArrowLeft, Check } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ALL_GOV_ID_TYPES } from "@/types/enums";
import { humanizeEnum } from "@/lib/utils/format";
import { ROUTES } from "@/config/routes";

/**
 * Signup — two-step wizard.
 *
 * Step 1: personal details (name, email, password, optional phone/referral).
 *         "Next" validates step-1 fields before advancing.
 * Step 2: government ID upload (ID type + front + back photos) + terms.
 *         "Create account" submits the full form as multipart/form-data.
 *
 * Splitting the form keeps the cognitive load low — the user fills in familiar
 * text fields first, then handles the heavier file-upload task on its own
 * screen. Both steps share one `useForm` instance so values carry over
 * seamlessly and the final submit validates the entire schema at once.
 */
export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signup] = useSignupMutation();
  const [step, setStep] = useState<1 | 2>(1);

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
      govIdType: undefined,
      govId: undefined,
      acceptTerms: false as unknown as true,
    },
  });

  const { submit, submitting, formError } = useFormSubmit({
    form,
    mutate: async (values) => {
      const parsed = signupSchema.parse(values);
      // Builds multipart/form-data with text fields + the two ID photos.
      return signup(toSignupRequest(parsed)).unwrap();
    },
    onSuccess: (result) => {
      toast.success("Account created", {
        description: "We've sent a 6-digit code to your email.",
      });
      router.replace(`/verify-email?email=${encodeURIComponent(result.email)}`);
    },
  });

  // Fields that belong to step 1. Validating only these before advancing means
  // the user isn't blocked on ID-photo errors they haven't seen yet.
  const step1Fields = ["name", "email", "password", "confirmPassword", "phone", "referralCode"] as const;

  const goToStep2 = async () => {
    // Trigger validation only for step-1 fields.
    const valid = await form.trigger(step1Fields as unknown as (typeof step1Fields)[number]);
    if (valid) setStep(2);
  };

  const goToStep1 = () => setStep(1);

  return (
    <>
      <AuthFormHeader
        title="Create your account"
        description="Start with a USDT deposit and let automated sessions do the work."
      />

      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <StepIndicator number={1} label="Details" active={step === 1} done={step === 2} />
        <div className={cn("h-px w-8 transition-colors", step === 2 ? "bg-primary" : "bg-border")} />
        <StepIndicator number={2} label="ID Upload" active={step === 2} done={false} />
      </div>

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
          {/* ===== Step 1: Personal details ===== */}
          {step === 1 && (
            <div className="space-y-5">
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

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={goToStep2}
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {/* ===== Step 2: Government ID upload ===== */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Government ID verification</h3>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Upload a clear photo of your ID. This is required to create your account.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="govIdType"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>ID type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger aria-invalid={Boolean(fieldState.error)}>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ALL_GOV_ID_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {humanizeEnum(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="govId"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>ID photo</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          aria-invalid={Boolean(fieldState.error)}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            field.onChange(file ?? undefined);
                          }}
                        />
                      </FormControl>
                      <FormDescription>JPEG, PNG, GIF or WebP. Max 5MB.</FormDescription>
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

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={goToStep1}
                  disabled={submitting}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <AuthSubmitButton loading={submitting} loadingLabel="Creating account…" className="flex-1">
                  Create account
                </AuthSubmitButton>
              </div>
            </div>
          )}
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

/** Step indicator circle with label. */
function StepIndicator({
  number,
  label,
  active,
  done,
}: {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
          done && "border-primary bg-primary text-primary-foreground",
          active && !done && "border-primary text-primary",
          !active && !done && "border-border text-muted-foreground",
        )}
      >
        {done ? <Check className="size-3.5" /> : number}
      </div>
      <span
        className={cn(
          "text-xs font-medium transition-colors",
          active || done ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
