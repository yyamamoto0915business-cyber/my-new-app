import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { isOrganizerOfEvent } from "@/lib/db/events";
import {
  fetchSponsorApplicationsAllByEvent,
  fetchSponsorTiersByEvent,
} from "@/lib/db/sponsors";

type RouteParams = { params: Promise<{ id: string }> };

/** 主催者用：イベントのスポンサー申込一覧（全ステータス） */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();
  const isDev = process.env.NODE_ENV === "development";

  if (!user && !isDev) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: eventId } = await params;
  if (!eventId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "データベースに接続できません" },
      { status: 503 }
    );
  }

  if (user) {
    const isOrganizer = await isOrganizerOfEvent(supabase, eventId, user.id);
    if (!isOrganizer) {
      return NextResponse.json({ error: "このイベントの主催者ではありません" }, { status: 403 });
    }
  }
  // development かつ 未認証: テスト用にアクセス許可

  const [applications, allTiers] = await Promise.all([
    fetchSponsorApplicationsAllByEvent(supabase, eventId),
    fetchSponsorTiersByEvent(supabase, eventId),
  ]);

  const tiers = allTiers.filter((t) => t.type === "company");
  const tierMap = Object.fromEntries(tiers.map((t) => [t.id, t]));

  return NextResponse.json({
    applications,
    tiers,
    tierMap,
  });
}
