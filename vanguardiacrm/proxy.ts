import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/leads/:path*",
    "/contacts/:path*",
    "/messages/:path*",
    "/collect/:path*",
    "/reports/:path*",
    "/automations/:path*",
    "/calendar/:path*",
    "/company-settings/:path*",
    "/my-account/:path*",
    "/cases/:path*",
  ],
};