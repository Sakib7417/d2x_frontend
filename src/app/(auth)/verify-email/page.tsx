import type { Metadata } from "next";

import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Enter the verification code sent to your email to complete signup.",
};

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
