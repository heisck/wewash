import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Lightweight edge guard: checks only for the presence of a Better Auth
 * session cookie (no DB call). Full role enforcement happens in the dashboard
 * layouts (client session) and in the service layer via requirePermission().
 *
 * Unauthenticated users hitting a protected area are redirected to the right
 * login screen with a callback back to where they were headed.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const sessionCookie = getSessionCookie(req);

  if (sessionCookie) return NextResponse.next();

  const isAdmin = pathname.startsWith("/admin");
  const loginPath = isAdmin ? "/admin/login" : "/login";

  // Public auth pages (no session required).
  if (
    pathname === loginPath ||
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/forgot-password"
  ) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.search = `?callbackURL=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Guard the two portals; exclude the admin login route so it stays reachable.
  matcher: ["/admin/:path*", "/student/:path*"],
};
