import { Suspense } from "react";
import type { Metadata } from "next";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your DOLLAR2X account.",
};

// Suspense is required because ResetPasswordForm reads ?token= via
// useSearchParams(), which Next cannot prerender without a boundary.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton fields={2} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
