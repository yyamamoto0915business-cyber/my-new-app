import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { isDeveloperAdminFromSupabaseUser } from "@/lib/admin-auth";

/** GET: 現在のログインユーザーと開発者管理者かどうか */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json(
      { user: null, isDeveloperAdmin: false },
      { status: 200 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ user, isDeveloperAdmin: false }, { status: 200 });
  }

  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  const isDeveloperAdmin = isDeveloperAdminFromSupabaseUser(supabaseUser);

  return NextResponse.json({ user, isDeveloperAdmin }, { status: 200 });
}
