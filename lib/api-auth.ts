/**
 * API ルート用の認証取得
 * Supabase Auth がなければ getAuth の開発用ユーザーを使う（AUTH_DISABLED 時）
 */
import { createClient as createJwtClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/get-auth";

export type ApiUser = {
  id: string;
  email: string | null;
  name: string | null;
};

function toApiUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): ApiUser {
  const name =
    (user.user_metadata?.display_name as string) ??
    (user.user_metadata?.name as string) ??
    user.email?.split("@")[0] ??
    "ユーザー";
  return { id: user.id, email: user.email ?? null, name };
}

async function getUserFromAccessToken(token: string): Promise<ApiUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !token) return null;
  const supabase = createJwtClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return toApiUser(user);
}

/** API で利用する認証ユーザーを取得。未認証の場合は null */
export async function getApiUser(): Promise<ApiUser | null> {
  try {
    const headerList = await headers();
    const auth = headerList.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const fromToken = await getUserFromAccessToken(auth.slice(7).trim());
      if (fromToken) return fromToken;
    }
  } catch {
    /* headers() が使えないコンテキストでは Cookie 認証へ */
  }

  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) {
      return toApiUser(user);
    }
  }

  // Supabase 未設定 or 未ログイン時: AUTH_DISABLED なら開発ユーザー
  const isAuthDisabled =
    process.env.AUTH_DISABLED === "true" ||
    (process.env.NODE_ENV === "development" && process.env.AUTH_DISABLED !== "false");

  if (isAuthDisabled) {
    const session = await getAuth();
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      };
    }
  }

  return null;
}
