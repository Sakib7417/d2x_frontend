import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { callUpstream, UpstreamTransportError } from "@/lib/api/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const contentType = request.headers.get("content-type") ?? "";

  let body: unknown;
  if (contentType.includes("multipart/form-data")) {
    const arrayBuffer = await request.arrayBuffer();
    body = {
      __rawBody: new Uint8Array(arrayBuffer),
      contentType,
    };
  } else {
    body = await request.json();
  }

  try {
    const upstream = await callUpstream({
      path: "/auth/signup",
      method: "POST",
      body,
      clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      signal: request.signal,
    });

    return NextResponse.json(upstream.body, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof UpstreamTransportError) {
      return NextResponse.json(
        {
          success: false,
          message: error.timedOut
            ? "The server took too long to respond. Please try again."
            : "Unable to reach the server. Please check your connection.",
        },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
