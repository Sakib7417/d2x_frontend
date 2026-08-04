import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your DOLLAR2X account.",
};

/**
 * The Suspense boundary is required, not decorative: `LoginForm` calls
 * `useSearchParams()` to read `?next=`, and Next refuses to prerender any
 * client component using it unless it sits inside a Suspense boundary. Without
 * this the build fails with a "missing suspense boundary" error.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton fields={2} />}>
      <LoginForm />
    </Suspense>
  );
}
