import { NextResponse, type NextRequest } from "next/server";
import { requiresAuth } from "@/lib/auth-utils";
import { isDeveloperAdminFromSupabaseUser } from "@/lib/admin-auth";
import { createProxySupabaseClient } from "@/lib/supabase/proxy";

function isAuthDisabled(): boolean {
  return (
    process.env.AUTH_DISABLED === "true" ||
    (process.env.NODE_ENV === "development" && process.env.AUTH_DISABLED !== "false")
  );
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createProxySupabaseClient(request, response);
  if (!supabase) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAuthDisabled()) {
    return response;
  }

  const path = request.nextUrl.pathname;
  const isAdminAppPage =
    path === "/admin" || path.startsWith("/admin/");
  const isAdminApiRoute = path.startsWith("/api/admin/");

  const isAuthPage =
    path === "/onboarding" ||
    path === "/auth" ||
    path.startsWith("/auth/") ||
    path.startsWith("/login") ||
    path.startsWith("/signup");

  if (isAuthPage) {
    return response;
  }

  // /admin 配下（ページ）の保護
  if (isAdminAppPage) {
    // 未ログイン → ログインへ
    if (!user) {
      const authUrl = new URL("/auth", request.url);
      authUrl.searchParams.set("next", path);
      return NextResponse.redirect(authUrl);
    }

    // ログイン済みだが developer_admin ではない → 権限なしページへ
    if (!isDeveloperAdminFromSupabaseUser(user)) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }

    return response;
  }

  // /api/admin/* の保護（API レスポンス）
  if (isAdminApiRoute) {
    if (!user) {
      return new NextResponse(
        JSON.stringify({ ok: false, error: { code: "UNAUTHORIZED", message: "ログインが必要です" } }),
        {
          status: 401,
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      );
    }

    if (!isDeveloperAdminFromSupabaseUser(user)) {
      return new NextResponse(
        JSON.stringify({ ok: false, error: { code: "FORBIDDEN", message: "開発者権限が必要です" } }),
        {
          status: 403,
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      );
    }

    return response;
  }

  // 未ログインで認証必須ページにアクセス → 認証入口へリダイレクト
  if (!user && requiresAuth(path)) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", path);
    return NextResponse.redirect(authUrl);
  }

  // ログイン済みでロール未設定 → オンボーディングへ
  if (user && !user.user_metadata?.role) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
