import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { isDeveloperAdminFromSupabaseUser } from "@/lib/admin-auth";
import { getCachedAuthUser } from "@/lib/supabase/get-cached-auth-user";

/** GET: 現在のログインユーザーと開発者管理者かどうか */
export async function GET() {
  const supabaseUser = await getCachedAuthUser();
  if (supabaseUser) {
    const name =
      (supabaseUser.user_metadata?.display_name as string) ??
      (supabaseUser.user_metadata?.name as string) ??
      supabaseUser.email?.split("@")[0] ??
      "ユーザー";
    return NextResponse.json({
      user: {
        id: supabaseUser.id,
        email: supabaseUser.email ?? null,
        name,
      },
      isDeveloperAdmin: isDeveloperAdminFromSupabaseUser(supabaseUser),
    });
  }

  const user = await getApiUser();
  return NextResponse.json(
    { user: user ? { id: user.id, email: user.email, name: user.name } : null, isDeveloperAdmin: false },
    { status: 200 },
  );
}
