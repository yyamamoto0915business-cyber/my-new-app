import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getAuth } from "@/lib/get-auth";
import { getCachedAuthUser } from "@/lib/supabase/get-cached-auth-user";
import { createClient } from "@/lib/supabase/server";

type MaybeUser =
  | (Partial<User> & {
      id?: string;
      email?: string | null;
      user_metadata?: { role?: string } & Record<string, unknown>;
    })
  | null
  | undefined;

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

function isDeveloperAdminCore(options: {
  id?: string | null;
  email?: string | null;
  role?: string | null;
}): boolean {
  const { id, email, role } = options;

  if (role === "developer_admin") {
    return true;
  }

  if (id && ADMIN_IDS.has(id)) {
    return true;
  }

  if (email && ADMIN_EMAILS.has(email)) {
    return true;
  }

  return false;
}

/**
 * profiles.role（DB）を取得する。
 * user_metadata.role は本人が auth.updateUser で書き換えられるため、権限判定には使わない。
 */
const getProfileRole = cache(async (userId: string): Promise<string | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return typeof data?.role === "string" ? data.role : null;
});

export async function isDeveloperAdminFromSupabaseUser(user: MaybeUser): Promise<boolean> {
  if (!user) return false;
  const id = typeof user.id === "string" ? user.id : undefined;
  const email =
    typeof user.email === "string"
      ? user.email
      : (user as { email?: string | null }).email ?? null;
  if (isDeveloperAdminCore({ id, email })) return true;
  if (!id) return false;
  return isDeveloperAdminCore({ role: await getProfileRole(id) });
}

export type DeveloperAdminContext = {
  id: string;
  email: string | null;
  role: string | null;
};

export async function getDeveloperAdminContext(): Promise<DeveloperAdminContext | null> {
  const user = await getCachedAuthUser();

  if (user && (await isDeveloperAdminFromSupabaseUser(user))) {
    return {
      id: user.id,
      email: user.email ?? null,
      role: await getProfileRole(user.id),
    };
  }

  const isAuthDisabled =
    process.env.AUTH_DISABLED === "true" ||
    (process.env.NODE_ENV === "development" &&
      process.env.AUTH_DISABLED !== "false");

  if (isAuthDisabled) {
    const session = await getAuth();
    const sessionUser = session?.user;
    if (!sessionUser) return null;

    const id = sessionUser.id;
    const email = sessionUser.email ?? null;
    const role = await getProfileRole(id);

    if (isDeveloperAdminCore({ id, email, role })) {
      return { id, email, role };
    }
  }

  return null;
}

