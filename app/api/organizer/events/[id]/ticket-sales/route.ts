import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByEventId } from "@/lib/db/events";
import { getTicketSalesAttendanceSummary } from "@/lib/organizer/day-ops";

type Params = { params: Promise<{ id: string }> };

type OrderDetailRow = {
  id: string;
  amount: number | null;
  status: string;
  created_at: string;
  user_id: string;
  profiles: { display_name?: string | null } | null;
};

/** GET: チケット販売レポート用の詳細データ */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "DB未設定" }, { status: 503 });

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  const eventOrganizerId = await getOrganizerIdByEventId(supabase, id);
  if (!organizerId || eventOrganizerId !== organizerId) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  try {
    const [{ data: event }, summary, ordersRes] = await Promise.all([
      supabase.from("events").select("id, title, date, price, capacity").eq("id", id).maybeSingle(),
      getTicketSalesAttendanceSummary(supabase, id),
      supabase
        .from("event_orders")
        .select("id, amount, status, created_at, user_id, profiles(display_name)")
        .eq("event_id", id)
        .in("status", ["paid", "refunded"])
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (!event || !summary) {
      return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
    }

    const orders = ((ordersRes.data ?? []) as unknown as OrderDetailRow[]).map((o) => ({
      id: o.id,
      amount: Number(o.amount) || 0,
      status: o.status as "paid" | "refunded",
      createdAt: o.created_at,
      buyerName: o.profiles?.display_name ?? "ゲスト",
    }));

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        price: Number(event.price) || 0,
        capacity: event.capacity != null ? Number(event.capacity) : null,
      },
      summary,
      orders,
    });
  } catch (e) {
    console.error("ticket-sales GET:", e);
    return NextResponse.json({ error: "レポートの取得に失敗しました" }, { status: 500 });
  }
}
