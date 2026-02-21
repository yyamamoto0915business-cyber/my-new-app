import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

function isAuthDisabled(): boolean {
  return (
    process.env.AUTH_DISABLED === "true" ||
    (process.env.NODE_ENV === "development" && process.env.AUTH_DISABLED !== "false")
  );
}

export default auth((req) => {
  // 方法3: 開発中は認証を完全にオフ
  if (isAuthDisabled()) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth?.user;
  const path = req.nextUrl.pathname;
  const hasRole = !!req.auth?.user?.role;

  if (path === "/onboarding" || path.startsWith("/login") || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (isLoggedIn && !hasRole) {
    return Response.redirect(new URL("/onboarding", req.url));
  }

  if (
    (path.startsWith("/organizer") && !path.includes("/organizer/register")) ||
    path.startsWith("/dm/")
  ) {
    if (!isLoggedIn) {
      return Response.redirect(new URL(`/login?returnTo=${encodeURIComponent(path)}`, req.url));
    }
  }

  return NextResponse.next();
});
