import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  const isPrivatePage =
    pathname.startsWith("/profile") || pathname.startsWith("/notes");

  const accessToken = request.cookies.get("accessToken");

  if (isPrivatePage && !accessToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isAuthPage && accessToken) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/notes/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
