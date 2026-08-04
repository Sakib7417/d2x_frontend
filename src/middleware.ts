import { NextResponse, type NextRequest } from "next/server";

import { decodeJwtPayload, type JwtClaims } from "@/lib/auth/jwt";
import {
  ROUTES,
  isAdminPath,
  isAuthOnlyPath,
  isProtectedPath,
  safeRedirectTarget,
} from "@/config/routes";
import { UserRole } from "@/types/enums";

/**
 * Route gate.
 *
 * Runs before any page renders, so a signed-out visitor never downloads the
 * dashboard bundle and an unauthorised user never sees an admin shell flash
 * before a client-side guard kicks in.
 *
 * WHAT THIS IS NOT
 * ----------------
 * This is not authorization. The access token is *decoded*, not verified —
 * this tier holds no JWT secret, by design. A forged cookie will pass this
 * check and then fail on literally every API call, because the Express
 * `authenticate` + `authorize('ADMIN')` middleware verifies the signature
 * against the real secret.
 *
 * So the model is: middleware decides *what to render*, the backend decides
 * *what is permitted*. Treating a decoded claim as an authorization decision
 * would be the classic mistake here; it is worth being explicit that we are
 * not making it.
 *
 * Verifying properly at the edge would mean sharing JWT_ACCESS_SECRET with
 * this tier. That is a real option (jose can do it in ~3 lines) and worth
 * doing if we ever want the edge to hard-fail bad tokens, but it widens the
 * blast radius of a frontend compromise, so it stays out for now.
 */

const ACCESS_TOKEN_COOKIE = "mlm.at";

interface Claims extends JwtClaims {
  userId?: string;
  role?: string;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const claims = token ? readClaims(token) : null;

  /**
   * An expired access token is still a valid session: the refresh token is
   * good for 7 days and the proxy will silently rotate it on the next API
   * call. Treating expiry as signed-out here would kick users to /login every
   * 15 minutes even though their session is perfectly alive.
   *
   * So presence of a decodable token is the signal, not its freshness.
   */
  const isSignedIn = claims !== null;
  const isAdmin = claims?.role === UserRole.ADMIN;

  // ---- Protected routes ---------------------------------------------------
  if (isProtectedPath(pathname) && !isSignedIn) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.login;
    url.search = "";
    // Preserve the full intended destination, query string included.
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // ---- Admin routes -------------------------------------------------------
  if (isAdminPath(pathname) && isSignedIn && !isAdmin) {
    // 404-style redirect to the user dashboard rather than a 403 page: it does
    // not confirm to a probing non-admin that the admin area exists here.
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ---- Auth pages while already signed in ---------------------------------
  if (isAuthOnlyPath(pathname) && isSignedIn) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");
    url.pathname = safeRedirectTarget(
      next,
      isAdmin ? ROUTES.admin.dashboard : ROUTES.dashboard,
    );
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function readClaims(token: string): Claims | null {
  const claims = decodeJwtPayload<Claims>(token);
  return claims?.userId ? claims : null;
}

export const config = {
  /**
   * Skip the middleware for anything that cannot benefit from it.
   *
   * `api` is excluded deliberately: the BFF proxy does its own auth handling
   * including transparent refresh, and running a redirect-issuing middleware
   * in front of it would turn a refreshable 401 into a 307 pointing at an HTML
   * login page — which RTK Query would then try to parse as JSON.
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf)$).*)",
  ],
};
