"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { normalizeError } from "@/lib/api/errors";
import { useEndImpersonationMutation } from "@/features/auth/api/auth-api";
import { ROUTES } from "@/config/routes";
import { IMPERSONATION_FLAG_COOKIE } from "@/lib/auth/session-cookie-names";

/**
 * Shown at the top of the user app while an admin is impersonating a user.
 *
 * Driven by the `mlm.imp` cookie — deliberately readable to client JS (it is
 * a boolean flag, not a secret) so no extra query is needed just to paint the
 * banner. Server-side truth still lives in the httpOnly session cookies.
 */
export function ImpersonationBanner() {
  const [active, setActive] = useState(false);
  const [endImpersonation, { isLoading }] = useEndImpersonationMutation();
  const router = useRouter();

  useEffect(() => {
    setActive(
      document.cookie
        .split("; ")
        .some((entry) => entry === `${IMPERSONATION_FLAG_COOKIE}=1`),
    );
  }, []);

  if (!active) return null;

  const handleReturn = async () => {
    try {
      await endImpersonation().unwrap();
      // Full reload: every RTK cache belongs to the impersonated user.
      window.location.assign(ROUTES.admin.users);
    } catch (error) {
      toast.error(
        normalizeError(error as Parameters<typeof normalizeError>[0])
          ?.message ?? "Failed to return to admin session.",
      );
    }
  };

  void router;

  return (
    <div className="bg-pending-muted border-pending/25 mb-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5">
      <p className="text-pending flex items-center gap-2 text-sm font-medium">
        <UserX className="size-4" />
        You are viewing this account as an admin impersonation.
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReturn}
        disabled={isLoading}
      >
        {isLoading ? "Returning…" : "Return to admin"}
      </Button>
    </div>
  );
}
