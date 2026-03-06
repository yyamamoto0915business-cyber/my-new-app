import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requiresAuth } from "@/lib/auth-utils";

function isAuthDisabled(): boolean {
  return (
    process.env.AUTH_DISABLED === "true" ||
    (process.env.NODE_ENV === "development" && process.env.AUTH_DISABLED !== "false")
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAuthDisabled()) {
    return response;
  }

  const path = request.nextUrl.pathname;
  const isAuthPage =
    path === "/onboarding" ||
    path === "/auth" ||
    path.startsWith("/auth/") ||
    path.startsWith("/login") ||
    path.startsWith("/signup");

  if (isAuthPage) {
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
