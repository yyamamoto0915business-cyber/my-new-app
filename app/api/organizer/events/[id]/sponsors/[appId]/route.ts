import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { isOrganizerOfEvent } from "@/lib/db/events";
import { updateSponsorApplicationStatus } from "@/lib/db/sponsors";

type RouteParams = { params: Promise<{ id: string; appId: string }> };

/** 主催者用：スポンサー申込のステータスを更新（承認/却下） */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();
  const isDev = process.env.NODE_ENV === "development";

  if (!user && !isDev) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: eventId, appId } = await params;
  if (!eventId || !appId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  let body: { status?: "approved" | "rejected" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body;
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "status は approved または rejected を指定してください" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  if (user) {
    const isOrganizer = await isOrganizerOfEvent(supabase, eventId, user.id);
    if (!isOrganizer) {
      return NextResponse.json({ error: "このイベントの主催者ではありません" }, { status: 403 });
    }
  }

  // 申込がこのイベントに属することを確認
  const { data: app } = await supabase
    .from("sponsor_applications")
    .select("event_id")
    .eq("id", appId)
    .single();
  if (!app || app.event_id !== eventId) {
    return NextResponse.json({ error: "申込が見つかりません" }, { status: 404 });
  }

  const ok = await updateSponsorApplicationStatus(supabase, appId, status);
  if (!ok) {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true, status });
}
