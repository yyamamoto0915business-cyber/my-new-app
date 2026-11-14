import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { isMissingSchemaError } from "@/lib/db/event-point-settings";
import {
  ANALYTICS_PERIODS,
  buildAnalytics,
  jstToday,
  periodRange,
  type AnalyticsPeriod,
  type AnalyticsRows,
} from "@/lib/organizer/analytics";

const MAX_ROWS = 20000;

/** 日本時間の日付の始まり（その日の 0:00 JST を UTC で） */
function jstStartIso(ymd: string): string {
  return new Date(`${ymd}T00:00:00+09:00`).toISOString();
}

/**
 * GET ?period=7d|30d|month|last_month&eventId=：主催者のダッシュボード（見本 09）の数字。
 * 自分のイベント・募集・お店の分だけを数える（主催者か確かめてから、読み取りはサーバーの鍵で行う）。
 */
export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });

  const sp = request.nextUrl.searchParams;
  const periodParam = sp.get("period") ?? "7d";
  const period: AnalyticsPeriod = ANALYTICS_PERIODS.some((p) => p.id === periodParam)
    ? (periodParam as AnalyticsPeriod)
    : "7d";
  const today = jstToday();
  const range = periodRange(period, today);
  const sinceIso = jstStartIso(range.prevFrom);
  const untilIso = jstStartIso(new Date(Date.parse(`${range.to}T00:00:00Z`) + 86400000).toISOString().slice(0, 10));

  try {
    const { data: eventRows, error: evErr } = await admin
      .from("events")
      .select("id, title, date")
      .eq("organizer_id", organizerId)
      .order("date", { ascending: false })
      .limit(500);
    if (evErr) throw evErr;
    const events = (eventRows ?? []) as { id: string; title: string | null; date: string }[];

    const eventIdParam = sp.get("eventId");
    const oneEvent = eventIdParam && events.some((e) => e.id === eventIdParam) ? eventIdParam : null;
    const eventIds = oneEvent ? [oneEvent] : events.map((e) => e.id);

    // 募集：1つのイベントにしぼるときは、そのイベントの募集だけ
    let recQuery = admin.from("recruitments").select("id").eq("organizer_id", organizerId).limit(500);
    if (oneEvent) recQuery = recQuery.eq("event_id", oneEvent);
    const { data: recRows } = await recQuery;
    const recruitmentIds = ((recRows ?? []) as { id: string }[]).map((r) => r.id);

    const none = Promise.resolve({ data: [] as never[], error: null });
    const [checkins, participants, recApps, posSales, orders, views] = await Promise.all([
      eventIds.length
        ? admin.from("event_checkins").select("checked_in_at").in("event_id", eventIds)
            .gte("checked_in_at", sinceIso).lt("checked_in_at", untilIso).limit(MAX_ROWS)
        : none,
      eventIds.length
        ? admin.from("event_participants").select("created_at, status").in("event_id", eventIds)
            .gte("created_at", sinceIso).lt("created_at", untilIso).limit(MAX_ROWS)
        : none,
      recruitmentIds.length
        ? admin.from("recruitment_applications").select("created_at").in("recruitment_id", recruitmentIds)
            .gte("created_at", sinceIso).lt("created_at", untilIso).limit(MAX_ROWS)
        : none,
      (() => {
        let q = admin.from("pos_sales").select("paid_at, total_yen").eq("organizer_id", organizerId)
          .eq("status", "paid").gte("paid_at", sinceIso).lt("paid_at", untilIso).limit(MAX_ROWS);
        if (oneEvent) q = q.eq("event_id", oneEvent);
        return q;
      })(),
      eventIds.length
        ? admin.from("event_orders").select("created_at, amount").in("event_id", eventIds)
            .eq("status", "paid").gte("created_at", sinceIso).lt("created_at", untilIso).limit(MAX_ROWS)
        : none,
      (() => {
        let q = admin.from("listing_view_daily").select("day, views").eq("organizer_id", organizerId)
          .gte("day", range.prevFrom).lte("day", range.to).limit(MAX_ROWS);
        if (oneEvent) q = q.eq("kind", "event").eq("target_id", oneEvent);
        return q;
      })(),
    ]);

    for (const r of [checkins, participants, recApps, posSales, orders]) {
      if (r.error && !isMissingSchemaError(r.error)) throw r.error;
    }
    // 閲覧数の表（00130）がまだないときは、数えていない扱い
    const viewsReady = !views.error;
    if (views.error && !isMissingSchemaError(views.error)) throw views.error;

    let viewsSince: string | null = null;
    if (viewsReady) {
      const { data: first } = await admin.from("listing_view_daily").select("day")
        .eq("organizer_id", organizerId).order("day", { ascending: true }).limit(1);
      viewsSince = ((first ?? []) as { day: string }[])[0]?.day ?? today;
    }

    const rows: AnalyticsRows = {
      checkins: ((checkins.data ?? []) as { checked_in_at: string }[]).map((c) => ({ at: c.checked_in_at })),
      applications: [
        ...((participants.data ?? []) as { created_at: string | null; status: string | null }[])
          .filter((p) => p.created_at && p.status !== "declined" && p.status !== "cancelled")
          .map((p) => ({ at: p.created_at as string })),
        ...((recApps.data ?? []) as { created_at: string | null }[])
          .filter((a) => a.created_at)
          .map((a) => ({ at: a.created_at as string })),
      ],
      sales: [
        ...((posSales.data ?? []) as { paid_at: string | null; total_yen: number }[])
          .filter((s) => s.paid_at)
          .map((s) => ({ at: s.paid_at as string, yen: Number(s.total_yen) || 0 })),
        ...((orders.data ?? []) as { created_at: string | null; amount: number }[])
          .filter((o) => o.created_at)
          .map((o) => ({ at: o.created_at as string, yen: Number(o.amount) || 0 })),
      ],
      views: viewsReady ? ((views.data ?? []) as { day: string; views: number }[]) : [],
    };

    return NextResponse.json({
      ...buildAnalytics(period, today, rows, viewsReady ? viewsSince : null),
      events: events.map((e) => ({ id: e.id, title: e.title?.trim() || "イベント", date: e.date })),
      eventId: oneEvent,
    });
  } catch (e) {
    console.error("organizer analytics:", e);
    return NextResponse.json({ error: "数字を読み込めませんでした" }, { status: 500 });
  }
}
