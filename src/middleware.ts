import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const appPassword = process.env.APP_PASSWORD;

  // If no password configured, pass through
  if (!appPassword) {
    return NextResponse.next();
  }

  // Public paths that do not require auth
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/fonts") ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("brevity_session")?.value;
  if (session !== appPassword) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
