import { NextResponse, type NextRequest } from "next/server";

/**
 * Referral landing: /ref/<CODE> -> /signup?ref=<CODE>
 *
 * Implemented as a Route Handler rather than a page, because there is nothing
 * to render — it is purely a redirect. A page would ship a React tree, run a
 * client-side `router.replace`, and briefly flash empty content.
 *
 * The backend builds these links in `referralService.getReferralLink()` as
 * `${FRONTEND_URL}/ref/{referralCode}`, so this path is fixed by the API
 * contract and must not be renamed without changing the backend too.
 *
 * Validation matters here because the code lands in a query string that the
 * signup form renders back to the user. Codes are generated from
 * `REFERRAL_CODE_CHARS` (A-Z0-9) at `REFERRAL_CODE_LENGTH` (8), so anything
 * else is either a typo or someone probing for reflected-XSS. Invalid codes
 * redirect to a clean /signup rather than 404-ing — the visitor is a
 * prospective user and should still land on the form.
 */

const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{8}$/;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;

  const normalised = decodeURIComponent(code ?? "")
    .trim()
    .toUpperCase();

  const appUrl = process.env.APP_URL || request.nextUrl.origin;
  const target = new URL("/signup", appUrl);

  if (REFERRAL_CODE_PATTERN.test(normalised)) {
    target.searchParams.set("ref", normalised);
  }

  // 307 rather than 308: this mapping is a product decision, not a permanent
  // canonical move, and a browser that cached a 308 would be impossible to
  // walk back if the funnel changes.
  return NextResponse.redirect(target, 307);
}
