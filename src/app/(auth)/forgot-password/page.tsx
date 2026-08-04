import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a password reset link for your DOLLAR2X account.",
};

// No Suspense boundary needed: this form does not read search params.
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
