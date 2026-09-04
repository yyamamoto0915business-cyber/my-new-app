import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getPosSaleById } from "@/lib/db/pos";

type Params = { params: Promise<{ id: string }> };

/** GET: 会計1件の状態確認（オンライン決済ポーリング用） */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
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

  try {
    const sale = await getPosSaleById(supabase, organizerId, id);
    if (!sale) {
      return NextResponse.json({ error: "会計が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ sale });
  } catch (e) {
    console.error("pos sale GET:", e);
    return NextResponse.json({ error: "会計の取得に失敗しました" }, { status: 500 });
  }
}
