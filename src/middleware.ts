import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — no auth needed
  const publicPaths = [
    "/login",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/me",
    "/_next",
    "/images",
    "/favicon.ico",
    "/fonts",
  ];

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = request.cookies.get("ks_session");
  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
