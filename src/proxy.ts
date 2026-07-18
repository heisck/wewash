import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Lightweight edge guard: session cookie presence only (no DB).
 * Full role / student-profile checks live in dashboard layouts + services.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const sessionCookie = getSessionCookie(req);

  // Public auth pages always reachable
  const isPublicAuth =
    pathname === "/login" ||
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/forgot-password" ||
    pathname === "/signup";

  if (isPublicAuth) {
    return NextResponse.next();
  }

  if (sessionCookie) return NextResponse.next();

  const isAdmin = pathname.startsWith("/admin");
  const loginPath = isAdmin ? "/admin/login" : "/login";

  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.search = `?callbackURL=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*"],
};
