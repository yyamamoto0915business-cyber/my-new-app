import { NextRequest, NextResponse } from "next/server";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import { getOrganizerGameAnalytics } from "@/lib/organizer/game-analytics";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  try {
    const analytics = await getOrganizerGameAnalytics(auth.supabase, auth.organizerId, id);
    if (!analytics) {
      return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
    }
    return NextResponse.json(analytics);
  } catch (e) {
    console.error("organizer game analytics GET:", e);
    return NextResponse.json({ error: "分析データの取得に失敗しました" }, { status: 500 });
  }
}
