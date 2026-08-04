import type { NextRequest } from "next/server";

import { handleCredentialExchange } from "@/lib/auth/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(request: NextRequest) {
  return handleCredentialExchange(request, "/auth/login");
}
