import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  const protectedRoutes = [
    "/dashboard",
    "/projects",
    "/cases",
    "/leads",
    "/collect",
    "/reports",
    "/ai-receptionist",
  ];

  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/cases/:path*",
    "/leads/:path*",
    "/collect/:path*",
    "/reports/:path*",
    "/ai-receptionist/:path*",
  ],
};