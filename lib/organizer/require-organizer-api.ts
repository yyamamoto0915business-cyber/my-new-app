import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireOrganizerApi(): Promise<
  | { ok: true; supabase: SupabaseClient; organizerId: string }
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

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 }),
    };
  }

  return { ok: true, supabase, organizerId };
}
