import { NextResponse, type NextRequest } from "next/server";
import { requiresAuth } from "@/lib/auth-utils";
import { isDeveloperAdminFromSupabaseUser } from "@/lib/admin-auth";
import { createProxySupabase, mergeSupabaseCookies } from "@/lib/supabase/proxy";
import { parsePassOnlinePreviewMode } from "@/lib/pass-online-preview";
import { isDevPublishSuccessPreviewPath } from "@/lib/dev-publish-success-preview";

function isAuthDisabled(): boolean {
  return (
    process.env.AUTH_DISABLED === "true" ||
    (process.env.NODE_ENV === "development" && process.env.AUTH_DISABLED !== "false")
  );
}

/** Supabase Auth のセッション Cookie があるか（未ログイン訪問の getUser を避ける） */
function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.includes("auth-token") && c.value.length > 0);
}

function isAuthPagePath(path: string): boolean {
  return (
    path === "/onboarding" ||
    path.startsWith("/onboarding/") ||
    path === "/auth" ||
    path.startsWith("/auth/") ||
    path === "/login" ||
    path.startsWith("/login/") ||
    path === "/signup" ||
    path.startsWith("/signup/")
  );
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthPage = isAuthPagePath(path);

  // 認証画面かつセッション Cookie なし → getUser 往復をスキップ（新規登録の初回表示を高速化）
  if (isAuthPage && !hasSupabaseAuthCookie(request)) {
    return NextResponse.next({ request });
  }

  const proxyClient = createProxySupabase(request);
  if (!proxyClient) {
    return NextResponse.next({ request });
  }

  const { supabase, getSupabaseResponse } = proxyClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const response = getSupabaseResponse();

  if (isAuthDisabled()) {
    return response;
  }

  const isAdminAppPage =
    path === "/admin" || path.startsWith("/admin/");
  const isAdminApiRoute = path.startsWith("/api/admin/");

  if (isAuthPage) {
    return response;
  }

  // /admin 配下（ページ）の保護
  if (isAdminAppPage) {
    // 未ログイン → ログインへ
    if (!user) {
      const authUrl = new URL("/auth", request.url);
      authUrl.searchParams.set("next", path);
      const redirect = NextResponse.redirect(authUrl);
      mergeSupabaseCookies(response, redirect);
      return redirect;
    }

    // ログイン済みだが developer_admin ではない → 権限なしページへ
    if (!isDeveloperAdminFromSupabaseUser(user)) {
      const redirect = NextResponse.redirect(new URL("/forbidden", request.url));
      mergeSupabaseCookies(response, redirect);
      return redirect;
    }

    return response;
  }

  // /api/admin/* の保護（API レスポンス）
  if (isAdminApiRoute) {
    if (!user) {
      const json = new NextResponse(
        JSON.stringify({ ok: false, error: { code: "UNAUTHORIZED", message: "ログインが必要です" } }),
        {
          status: 401,
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      );
      mergeSupabaseCookies(response, json);
      return json;
    }

    if (!isDeveloperAdminFromSupabaseUser(user)) {
      const json = new NextResponse(
        JSON.stringify({ ok: false, error: { code: "FORBIDDEN", message: "開発者権限が必要です" } }),
        {
          status: 403,
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      );
      mergeSupabaseCookies(response, json);
      return json;
    }

    return response;
  }

  // 未ログインで認証必須ページにアクセス → 認証入口へリダイレクト
  // 参加パスの見た目プレビュー（?preview=）はログイン不要
  const isPassOnlinePreview =
    path === "/pass" &&
    parsePassOnlinePreviewMode(request.nextUrl.searchParams.get("preview")) !=
      null;
  const isPublishSuccessPreview = isDevPublishSuccessPreviewPath(
    path,
    request.nextUrl.searchParams.get("previewSuccess"),
  );
  if (
    !user &&
    requiresAuth(path) &&
    !isPassOnlinePreview &&
    !isPublishSuccessPreview
  ) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", path + request.nextUrl.search);
    const redirect = NextResponse.redirect(authUrl);
    mergeSupabaseCookies(response, redirect);
    return redirect;
  }

  // API は必ず Route Handler まで届ける。ここでオンボーディングへ飛ばすと、
  // イベント詳細など「ページは見られるが user_metadata.role 未設定」のユーザーが
  // fetch('/api/conversations') で HTML を受け取り会話作成だけ失敗する。
  if (path.startsWith("/api/")) {
    return response;
  }

  // ログイン済みでロール未設定 → オンボーディングへ（アプリページのみ）
  if (user && !user.user_metadata?.role) {
    const redirect = NextResponse.redirect(new URL("/onboarding", request.url));
    mergeSupabaseCookies(response, redirect);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
