import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import {
  getEventPointSettings,
  isPointsDiscountReady,
  listPointProducts,
  saveEventPointSettings,
  savePointPrices,
  type EventPointMode,
} from "@/lib/db/event-point-settings";
import { fetchEventPointStats } from "@/lib/points/event-points";

type Params = { params: Promise<{ id: string }> };

/** 自分のイベントか確かめて、主催者のIDとイベントの名前・日付を返す */
async function ownEvent(id: string) {
  const user = await getApiUser();
  if (!user) return { error: NextResponse.json({ error: "ログインが必要です" }, { status: 401 }) };
  const supabase = await createClient();
  if (!supabase) return { error: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) };
  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) return { error: NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 }) };
  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, end_date, start_time, end_time")
    .eq("id", id)
    .eq("organizer_id", organizerId)
    .maybeSingle();
  if (!event) return { error: NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 }) };
  return { supabase, organizerId, event };
}

/** GET: このイベントのポイントの使い方・交換できる商品・発行済みなどの数 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const own = await ownEvent(id);
  if ("error" in own) return own.error;
  const { supabase, organizerId, event } = own;
  const [settings, products, stats, discountReady] = await Promise.all([
    getEventPointSettings(supabase, id),
    listPointProducts(supabase, organizerId),
    fetchEventPointStats(id),
    isPointsDiscountReady(supabase),
  ]);
  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      date: event.date,
      endDate: event.end_date ?? null,
      startTime: (event.start_time as string | null)?.slice(0, 5) ?? null,
      endTime: (event.end_time as string | null)?.slice(0, 5) ?? null,
    },
    settings,
    /** 割引を選べるか（00129 の適用前は「準備中」） */
    discountReady,
    products,
    stats,
  });
}

/** PUT: 使い方と、商品ごとの交換ptを保存 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const own = await ownEvent(id);
  if ("error" in own) return own.error;
  const { supabase, organizerId } = own;

  const body = (await req.json().catch(() => null)) as {
    mode?: string;
    yenPerPoint?: number;
    discountMaxYen?: number | null;
    products?: { id: string; pointPrice: number | null }[];
  } | null;
  if (!body) return NextResponse.json({ error: "内容が読めませんでした" }, { status: 400 });

  const mode: EventPointMode =
    body.mode === "exchange" ? "exchange" : body.mode === "discount" ? "discount" : "off";
  const rawRate = Number(body.yenPerPoint);
  const rawCap = body.discountMaxYen == null ? null : Number(body.discountMaxYen);
  if (mode === "discount") {
    if (!Number.isInteger(rawRate) || rawRate < 1 || rawRate > 100) {
      return NextResponse.json({ error: "1ptで引く金額は、1〜100円で決めてください" }, { status: 400 });
    }
    if (rawCap != null && (!Number.isInteger(rawCap) || rawCap < 1 || rawCap > 1000000)) {
      return NextResponse.json({ error: "1回の上限は1円以上で決めてください（決めないこともできます）" }, { status: 400 });
    }
    if (rawCap != null && rawCap < rawRate) {
      return NextResponse.json({ error: "1回の上限が、1pt分の金額より小さくなっています" }, { status: 400 });
    }
    if (!(await isPointsDiscountReady(supabase))) {
      return NextResponse.json({ error: "割引はただいま準備中です" }, { status: 400 });
    }
  }
  // 割引でないときは、前に決めた割引の値を残す（あとで割引に戻したときのため）
  const before = mode === "discount" ? null : await getEventPointSettings(supabase, id).catch(() => null);
  const yenPerPoint = mode === "discount" ? rawRate : (before?.yenPerPoint ?? 1);
  const discountMaxYen = mode === "discount" ? rawCap : (before?.discountMaxYen ?? null);
  const products = Array.isArray(body.products)
    ? body.products
        .filter((p) => typeof p?.id === "string")
        .map((p) => ({
          id: p.id,
          pointPrice:
            p.pointPrice == null || !Number.isFinite(Number(p.pointPrice)) || Number(p.pointPrice) <= 0
              ? null
              : Math.min(99999, Math.round(Number(p.pointPrice))),
        }))
    : [];
  if (mode === "exchange" && products.every((p) => p.pointPrice == null)) {
    return NextResponse.json({ error: "交換できる商品を1つ以上決めてください" }, { status: 400 });
  }

  try {
    await saveEventPointSettings(supabase, { eventId: id, organizerId, mode, yenPerPoint, discountMaxYen });
    if (products.length) await savePointPrices(supabase, organizerId, products);
  } catch (e) {
    console.error("event points PUT:", e);
    return NextResponse.json({ error: "保存できませんでした" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
