import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * イベントポイントの使い方（主催者がイベントごとに決める）。表は supabase/migrations/00127_event_points.sql。
 * まだデータベースに表がないとき（適用前）は ready: false を返し、画面は「準備中」にする。
 */
export type EventPointMode = "off" | "exchange" | "discount";

export type EventPointSettings = {
  ready: boolean;
  mode: EventPointMode;
  yenPerPoint: number;
  discountMaxYen: number | null;
};

export const DEFAULT_EVENT_POINT_SETTINGS: EventPointSettings = {
  ready: true,
  mode: "off",
  yenPerPoint: 1,
  discountMaxYen: null,
};

/** 表・列がまだないときのエラーか（適用前） */
export function isMissingSchemaError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST205" ||
    error.code === "PGRST204" ||
    /does not exist|Could not find the/i.test(error.message ?? "")
  );
}

/** 割引の金額を会計に残す列（00129）が、データベースにもうあるか */
export async function isPointsDiscountReady(supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase.from("pos_sales").select("points_discount_yen").limit(0);
  return !isMissingSchemaError(error);
}

export async function getEventPointSettings(supabase: SupabaseClient, eventId: string): Promise<EventPointSettings> {
  const { data, error } = await supabase
    .from("event_point_settings")
    .select("mode, yen_per_point, discount_max_yen")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) return { ...DEFAULT_EVENT_POINT_SETTINGS, ready: false };
    throw error;
  }
  if (!data) return DEFAULT_EVENT_POINT_SETTINGS;
  const mode = data.mode === "exchange" || data.mode === "discount" ? data.mode : "off";
  return {
    ready: true,
    mode,
    yenPerPoint: Number(data.yen_per_point) || 1,
    discountMaxYen: data.discount_max_yen == null ? null : Number(data.discount_max_yen),
  };
}

export async function saveEventPointSettings(
  supabase: SupabaseClient,
  params: { eventId: string; organizerId: string; mode: EventPointMode; yenPerPoint: number; discountMaxYen: number | null }
): Promise<void> {
  const { error } = await supabase.from("event_point_settings").upsert(
    {
      event_id: params.eventId,
      organizer_id: params.organizerId,
      mode: params.mode,
      yen_per_point: params.yenPerPoint,
      discount_max_yen: params.discountMaxYen,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id" }
  );
  if (error) throw error;
}

/** レジの商品と、何ptで交換できるか（null：交換しない） */
export type PointProduct = { id: string; name: string; priceYen: number; pointPrice: number | null };

export async function listPointProducts(supabase: SupabaseClient, organizerId: string): Promise<PointProduct[]> {
  const { data, error } = await supabase
    .from("pos_products")
    .select("id, name, price_yen, point_price")
    .eq("organizer_id", organizerId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    priceYen: Number(r.price_yen) || 0,
    pointPrice: r.point_price == null ? null : Number(r.point_price),
  }));
}

export async function savePointPrices(
  supabase: SupabaseClient,
  organizerId: string,
  prices: { id: string; pointPrice: number | null }[]
): Promise<void> {
  for (const p of prices) {
    const { error } = await supabase
      .from("pos_products")
      .update({ point_price: p.pointPrice, updated_at: new Date().toISOString() })
      .eq("id", p.id)
      .eq("organizer_id", organizerId);
    if (error) throw error;
  }
}

export type RegisterPointUse = {
  mode: "exchange" | "discount";
  yenPerPoint: number;
  discountMaxYen: number | null;
};

/**
 * レジでポイントを使える設定（「商品と交換」か「割引」）になっているイベントと、その使い方。
 * 表がまだないときは空。割引は、金額を残す列（00129）がまだないときは入れない（レジが「準備中」のため）。
 */
export async function listRegisterPointEvents(
  supabase: SupabaseClient,
  eventIds: string[]
): Promise<Map<string, RegisterPointUse>> {
  const out = new Map<string, RegisterPointUse>();
  if (eventIds.length === 0) return out;
  const { data, error } = await supabase
    .from("event_point_settings")
    .select("event_id, mode, yen_per_point, discount_max_yen")
    .in("event_id", eventIds);
  if (error) {
    if (!isMissingSchemaError(error)) console.error("listRegisterPointEvents:", error);
    return out;
  }
  const rows = (data ?? []) as { event_id: string; mode: string; yen_per_point: number; discount_max_yen: number | null }[];
  const discountReady = rows.some((r) => r.mode === "discount") ? await isPointsDiscountReady(supabase) : false;
  for (const r of rows) {
    if (r.mode !== "exchange" && !(r.mode === "discount" && discountReady)) continue;
    out.set(r.event_id, {
      mode: r.mode,
      yenPerPoint: Number(r.yen_per_point) || 1,
      discountMaxYen: r.discount_max_yen == null ? null : Number(r.discount_max_yen),
    });
  }
  return out;
}

/** 割引のときの、参加者向けのひとこと（例：最大 ¥500 引き（1pt＝1円）） */
export function registerDiscountLabel(use: RegisterPointUse): string {
  const rate = `1pt＝${use.yenPerPoint}円`;
  return use.discountMaxYen != null ? `最大 ¥${use.discountMaxYen.toLocaleString("ja-JP")} 引き（${rate}）` : `${rate}で割引`;
}
