/**
 * API ルート用の認証取得
 * Supabase Auth がなければ getAuth の開発用ユーザーを使う（AUTH_DISABLED 時）
 */
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/get-auth";

export type ApiUser = {
  id: string;
  email: string | null;
  name: string | null;
};

/** API で利用する認証ユーザーを取得。未認証の場合は null */
export async function getApiUser(): Promise<ApiUser | null> {
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) {
      const name =
        (user.user_metadata?.display_name as string) ??
        (user.user_metadata?.name as string) ??
        user.email?.split("@")[0] ??
        "ユーザー";
      return { id: user.id, email: user.email ?? null, name };
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
