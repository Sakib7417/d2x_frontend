import { Suspense } from "react";
import type { Metadata } from "next";

import { SignupForm } from "@/features/auth/components/signup-form";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";

export const metadata: Metadata = {
  title: "Create account",
  description: "Open a DOLLAR2X account and start compounding USDT.",
};

// Suspense is required because SignupForm reads ?ref= via useSearchParams().
export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton fields={4} />}>
      <SignupForm />
    </Suspense>
  );
}
