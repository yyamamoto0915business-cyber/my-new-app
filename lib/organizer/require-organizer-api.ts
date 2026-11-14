import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerAccess, ORGANIZER_ROLE_LABEL, roleAtLeast, type OrganizerRole } from "@/lib/organizer/team";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 主催者の API の入口。ログイン・主催者（本人か TEAM のメンバー）・役割を確かめる。
 * minRole を渡すと、その役割より下の人は 403 にする（例：プランの変更は "owner"）。
 */
export async function requireOrganizerApi(minRole: OrganizerRole = "staff"): Promise<
  | { ok: true; supabase: SupabaseClient; organizerId: string; role: OrganizerRole; userId: string }
  | { ok: false; response: NextResponse }
> {
  const user = await getApiUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "ログインが必要です" }, { status: 401 }),
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }),
    };
  }

  const access = await getOrganizerAccess(supabase, user.id);
  if (!access) {
    return {
      ok: false,
      response: NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 }),
    };
  }
  if (!roleAtLeast(access.role, minRole)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `この操作は${ORGANIZER_ROLE_LABEL[minRole]}${minRole === "owner" ? "" : "以上"}だけができます` },
        { status: 403 }
      ),
    };
  }

  return { ok: true, supabase, organizerId: access.organizerId, role: access.role, userId: user.id };
}
