import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/get-auth";

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

export function isDeveloperAdminFromSupabaseUser(user: MaybeUser): boolean {
  if (!user) return false;
  const id = typeof user.id === "string" ? user.id : undefined;
  const email =
    typeof user.email === "string"
      ? user.email
      : (user as { email?: string | null }).email ?? null;
  const role =
    typeof user.user_metadata?.role === "string"
      ? (user.user_metadata.role as string)
      : null;

  return isDeveloperAdminCore({ id, email, role });
}

export type DeveloperAdminContext = {
  id: string;
  email: string | null;
  role: string | null;
};

export async function getDeveloperAdminContext(): Promise<DeveloperAdminContext | null> {
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user && isDeveloperAdminFromSupabaseUser(user)) {
      return {
        id: user.id,
        email: user.email ?? null,
        role:
          typeof user.user_metadata?.role === "string"
            ? (user.user_metadata.role as string)
            : null,
      };
    }
  }

  const isAuthDisabled =
    process.env.AUTH_DISABLED === "true" ||
    (process.env.NODE_ENV === "development" &&
      process.env.AUTH_DISABLED !== "false");

  if (isAuthDisabled) {
    const session = await getAuth();
    const user = session?.user;
    if (!user) return null;

    const id = user.id;
    const email = user.email ?? null;
    const role =
      typeof (user as { role?: string }).role === "string"
        ? ((user as { role?: string }).role as string)
        : null;

    if (isDeveloperAdminCore({ id, email, role })) {
      return { id, email, role };
    }
  }

  return null;
}

