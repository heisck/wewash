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
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const sessionCookie = getSessionCookie(req);

  if (sessionCookie) return NextResponse.next();

  const isAdmin = pathname.startsWith("/admin");
  const loginPath = isAdmin ? "/admin/login" : "/login";

  // Don't loop on the login pages themselves.
  if (pathname === loginPath || pathname === "/admin/login") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.search = `?callbackURL=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Guard the two portals; exclude the admin login route so it stays reachable.
  matcher: ["/admin/:path*", "/student/:path*"],
};
