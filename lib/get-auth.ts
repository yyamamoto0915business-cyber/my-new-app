import { createClient } from "@/lib/supabase/server";

const DEV_USER = {
  id: "dev-user",
  email: "dev@local",
  name: "開発ユーザー",
  role: "volunteer" as const,
};

function isAuthDisabled(): boolean {
  return (
    process.env.AUTH_DISABLED === "true" ||
    (process.env.NODE_ENV === "development" && process.env.AUTH_DISABLED !== "false")
  );
}

export type AuthSession = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    role?: string | null;
  };
  expires?: string;
};

/**
 * 認証セッション取得（Supabase Auth）
 * AUTH_DISABLED 時は開発用モックユーザーを返す。
 */
export async function getAuth(): Promise<AuthSession | null> {
  if (isAuthDisabled()) {
    return {
      user: {
        id: DEV_USER.id,
        email: DEV_USER.email,
        name: DEV_USER.name,
        role: DEV_USER.role,
      },
      expires: "2099-12-31",
    };
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const name =
    (user.user_metadata?.display_name as string) ??
    (user.user_metadata?.name as string) ??
    user.email?.split("@")[0] ??
    "ユーザー";

  const role = (user.user_metadata?.role as string) ?? null;

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      name,
      role,
    },
    expires: undefined,
  };
}
