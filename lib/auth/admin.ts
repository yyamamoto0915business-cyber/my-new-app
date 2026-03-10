/**
 * 開発者管理画面用の認可処理
 * Route Handler / Server Action から requireDeveloperAdmin() を通すこと
 */
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/get-auth";

export type AdminProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: string | null;
};

const ADMIN_EMAILS_ENV =
  process.env.DEV_ADMIN_EMAILS ??
  process.env.ADMIN_EMAILS ??
  process.env.ADMIN_EMAILS_LIST ??
  "";

const ADMIN_IDS_ENV =
  process.env.DEV_ADMIN_IDS ??
  process.env.ADMIN_USER_IDS ??
  process.env.DEVELOPER_ADMIN_IDS ??
  "";

function parseList(value: string | undefined | null): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
  );
}

const ADMIN_EMAILS = parseList(ADMIN_EMAILS_ENV);
const ADMIN_IDS = parseList(ADMIN_IDS_ENV);

/**
 * ログインユーザーの profile（role, email, display_name）を取得
 */
export async function getCurrentUserProfile(): Promise<AdminProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const isAuthDisabled =
      process.env.AUTH_DISABLED === "true" ||
      (process.env.NODE_ENV === "development" &&
        process.env.AUTH_DISABLED !== "false");
    if (isAuthDisabled && supabase) {
      const session = await getAuth();
      const authUser = session?.user;
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, display_name, role")
          .eq("id", authUser.id)
          .single();
        if (profile) {
          return {
            id: profile.id,
            email: profile.email ?? authUser.email ?? null,
            displayName: profile.display_name ?? authUser.name ?? null,
            role: profile.role ?? null,
          };
        }
      }
    }
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? null,
    displayName: profile.display_name ?? null,
    role: profile.role ?? null,
  };
}

/**
 * profile が developer_admin か判定
 * DB role 優先、env の ADMIN_EMAILS / ADMIN_IDS も併用
 */
export function isDeveloperAdmin(profile: AdminProfile | null): boolean {
  if (!profile) return false;
  if (profile.role === "developer_admin") return true;
  if (profile.id && ADMIN_IDS.has(profile.id)) return true;
  if (profile.email && ADMIN_EMAILS.has(profile.email)) return true;
  return false;
}

/**
 * developer_admin であることを要求。未ログインは 401、非 admin は 403
 */
export async function requireDeveloperAdmin(): Promise<
  { ok: true; profile: AdminProfile } | { ok: false; status: 401 | 403 }
> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return { ok: false, status: 401 };
  }
  if (!isDeveloperAdmin(profile)) {
    return { ok: false, status: 403 };
  }
  return { ok: true, profile };
}

/**
 * layout / page で使うアクセス可否判定
 * 未ログイン → /auth?next=/admin へ redirect
 * 権限なし → /forbidden へ redirect
 * 通れば profile を返す
 */
export async function requireAdminPageAccess(): Promise<{
  ok: true;
  profile: AdminProfile;
}> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    const { redirect } = await import("next/navigation");
    redirect("/auth?next=/admin");
  }
  if (!isDeveloperAdmin(profile)) {
    const { redirect } = await import("next/navigation");
    redirect("/forbidden");
  }
  return { ok: true, profile };
}

/**
 * Route Handler 用の認可チェック
 * 未ログイン → { ok: false, error: UNAUTHORIZED }
 * 権限なし → { ok: false, error: FORBIDDEN }
 */
export async function requireAdminApiAccess(): Promise<
  | { ok: true; profile: AdminProfile }
  | { ok: false; status: 401 | 403; error: { code: string; message: string } }
> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return {
      ok: false,
      status: 401,
      error: { code: "UNAUTHORIZED", message: "ログインが必要です" },
    };
  }
  if (!isDeveloperAdmin(profile)) {
    return {
      ok: false,
      status: 403,
      error: { code: "FORBIDDEN", message: "開発者権限が必要です" },
    };
  }
  return { ok: true, profile };
}

/**
 * layout / page で使う軽いアクセス可否判定
 */
export async function canAccessAdminRoute(): Promise<boolean> {
  const result = await requireDeveloperAdmin();
  return result.ok;
}
