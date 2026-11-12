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
