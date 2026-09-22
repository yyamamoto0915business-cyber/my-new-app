import { NextResponse, type NextRequest } from "next/server";
import { requiresAuth } from "@/lib/auth-utils";
import { isDeveloperAdminFromSupabaseUser } from "@/lib/admin-auth";
import { isSupabaseAuthCookieName } from "@/lib/supabase/auth-cookie";
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
    .some((c) => isSupabaseAuthCookieName(c.name) && c.value.length > 0);
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

function unauthorizedAdminApi() {
  return new NextResponse(
    JSON.stringify({ ok: false, error: { code: "UNAUTHORIZED", message: "ログインが必要です" } }),
    {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    },
  );
}

function forbiddenAdminApi() {
  return new NextResponse(
    JSON.stringify({ ok: false, error: { code: "FORBIDDEN", message: "開発者権限が必要です" } }),
    {
      status: 403,
      headers: { "content-type": "application/json; charset=utf-8" },
    },
  );
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthPage = isAuthPagePath(path);
  const isAdminAppPage = path === "/admin" || path.startsWith("/admin/");
  const isAdminApiRoute = path.startsWith("/api/admin/");
  const isApiRoute = path.startsWith("/api/");

  // 認証オフならセッション更新もゲートも不要
  if (isAuthDisabled()) {
    return NextResponse.next({ request });
  }

  const isPassOnlinePreview =
    path === "/pass" &&
    parsePassOnlinePreviewMode(request.nextUrl.searchParams.get("preview")) !=
      null;
  const isPublishSuccessPreview = isDevPublishSuccessPreviewPath(
    path,
    request.nextUrl.searchParams.get("previewSuccess"),
  );
  const isAlbumDemoPreview =
    process.env.NODE_ENV !== "production" &&
    path === "/profile/posts" &&
    request.nextUrl.searchParams.get("demo") === "1";
  const needsAuthGate =
    (isAdminAppPage || requiresAuth(path)) &&
    !isPassOnlinePreview &&
    !isPublishSuccessPreview &&
    !isAlbumDemoPreview;

  // セッション Cookie なし → Auth サーバーへの getUser 往復をしない
  if (!hasSupabaseAuthCookie(request)) {
    if (isAuthPage) {
      return NextResponse.next({ request });
    }
    if (isAdminApiRoute) {
      return unauthorizedAdminApi();
    }
    if (needsAuthGate && !isApiRoute) {
      const authUrl = new URL("/auth", request.url);
      authUrl.searchParams.set("next", path + request.nextUrl.search);
      return NextResponse.redirect(authUrl);
    }
    return NextResponse.next({ request });
  }

  // Cookie ありでも admin 以外の API はハンドラ側で認証する。
  // ページ遷移のときにだけ getUser してセッションを更新する。
  if (isApiRoute && !isAdminApiRoute) {
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

  if (isAuthPage) {
    return response;
  }

  // /admin 配下（ページ）の保護
  if (isAdminAppPage) {
    if (!user) {
      const authUrl = new URL("/auth", request.url);
      authUrl.searchParams.set("next", path);
      const redirect = NextResponse.redirect(authUrl);
      mergeSupabaseCookies(response, redirect);
      return redirect;
    }

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
      const json = unauthorizedAdminApi();
      mergeSupabaseCookies(response, json);
      return json;
    }

    if (!isDeveloperAdminFromSupabaseUser(user)) {
      const json = forbiddenAdminApi();
      mergeSupabaseCookies(response, json);
      return json;
    }

    return response;
  }

  if (!user && needsAuthGate) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", path + request.nextUrl.search);
    const redirect = NextResponse.redirect(authUrl);
    mergeSupabaseCookies(response, redirect);
    return redirect;
  }

  // API は必ず Route Handler まで届ける。ここでオンボーディングへ飛ばすと、
  // イベント詳細など「ページは見られるが user_metadata.role 未設定」のユーザーが
  // fetch('/api/conversations') で HTML を受け取り会話作成だけ失敗する。
  if (isApiRoute) {
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
