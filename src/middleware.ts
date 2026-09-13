import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Edge guard for authenticated areas.
 *
 * A layout's `redirect()` cannot protect a sibling page: in the App Router
 * layouts and pages render in parallel, so the page would still run its
 * data fetching and stream markup before the redirect took effect. Blocking
 * here stops the request before any page code runs. Pages additionally
 * re-check their own session (defence in depth) — never rely on this alone.
 */

// /booking/* is intentionally absent: those paths are now pure redirects to
// /checkout and /payment/status. Gating them would bounce an old confirmation
// link to /login before the redirect fired; the destination guards it anyway.
const PROTECTED = ["/account", "/checkout", "/payment"];
const ADMIN_ONLY = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isAdminPath = ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isAdminPath && !isProtected) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    // NextAuth v5 prefixes the cookie with "__Secure-" over HTTPS.
    secureCookie: process.env.NODE_ENV === "production" && req.nextUrl.protocol === "https:",
  });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (isAdminPath && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/checkout",
    "/payment/:path*",
  ],
};
