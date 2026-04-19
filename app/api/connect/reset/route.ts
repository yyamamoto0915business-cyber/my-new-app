import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";

/**
 * POST: 主催者の Stripe Connect 紐付けを DB から消し、本番/テスト切替後にやり直せるようにする
 */
export async function POST(_request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("organizers")
    .update({
      stripe_account_id: null,
      stripe_account_charges_enabled: false,
      stripe_account_details_submitted: false,
      updated_at: now,
    })
    .eq("id", organizerId);

  if (error) {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
