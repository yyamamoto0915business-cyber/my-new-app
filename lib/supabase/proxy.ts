/**
 * proxy.ts 用 Supabase クライアント
 * リクエスト/レスポンスの cookie コンテキストで動作。
 * setAll で request を更新し NextResponse を作り直す（@supabase/ssr / Next.js 推奨パターン）。
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export type ProxySupabase = {
  supabase: ReturnType<typeof createServerClient>;
  getSupabaseResponse: () => NextResponse;
};

export function createProxySupabase(request: NextRequest): ProxySupabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, getSupabaseResponse: () => supabaseResponse };
}

/** リダイレクト応答に Supabase がセットした Cookie を引き継ぐ（セッション欠落防止） */
export function mergeSupabaseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((c) => {
    target.cookies.set(c.name, c.value, {
      path: c.path,
      maxAge: c.maxAge,
      domain: c.domain,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite,
      expires: c.expires,
    });
  });
}
