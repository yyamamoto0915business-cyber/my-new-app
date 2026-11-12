import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEventPointSettings } from "@/lib/db/event-point-settings";
import { eventPointsStatusOf, usableUntilLabel } from "@/lib/points/event-points";
import { resolvePassQr } from "@/lib/checkin/resolve-pass-qr";
import { buildReceptionNumber } from "@/lib/checkin/parse-pass-qr";

/**
 * レジでイベントポイントを使う（商品と交換する）ための、サーバー側の処理。
 * 使うときの履歴は reference_id = "event:<イベントID>:pos:<会計ID>"（関数が "event:<イベントID>:" を前につける）。
 * 残り・使う・戻すは 00127 のデータベース関数（service_role だけが呼べる）で行う。
 */

export type PosPointsAvailability =
  | { enabled: true; eventTitle: string; untilLabel: string }
  | { enabled: false; reason: "no_event" | "not_ready" | "off" | "discount" | "upcoming" | "ended" };

type EventRow = {
  id: string;
  title: string | null;
  date: string;
  end_date: string | null;
  end_time: string | null;
};

/** このイベントのレジで、いまポイントを使えるか（自分のイベント・「商品と交換」・開催中） */
export async function getPosPointsAvailability(
  supabase: SupabaseClient,
  organizerId: string,
  eventId: string | null | undefined
): Promise<PosPointsAvailability> {
  if (!eventId) return { enabled: false, reason: "no_event" };
  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, end_date, end_time")
    .eq("id", eventId)
    .eq("organizer_id", organizerId)
    .maybeSingle();
  if (!event) return { enabled: false, reason: "no_event" };
  const ev = event as EventRow;

  const settings = await getEventPointSettings(supabase, eventId);
  if (!settings.ready) return { enabled: false, reason: "not_ready" };
  if (settings.mode === "discount") return { enabled: false, reason: "discount" };
  if (settings.mode !== "exchange") return { enabled: false, reason: "off" };

  const status = eventPointsStatusOf(ev);
  if (status !== "live") return { enabled: false, reason: status };

  return {
    enabled: true,
    eventTitle: ev.title?.trim() || "イベント",
    untilLabel: usableUntilLabel({
      date: ev.date,
      endDate: ev.end_date,
      endTime: (ev.end_time ?? "").slice(0, 5) || null,
    }),
  };
}

export const POS_POINTS_UNAVAILABLE_MESSAGE: Record<
  Extract<PosPointsAvailability, { enabled: false }>["reason"],
  string
> = {
  no_event: "ポイントを使うには、売上を記録するイベントを選んでください",
  not_ready: "イベントポイントはただいま準備中です",
  off: "このイベントは、ポイントを使わない設定です",
  discount: "このイベントのポイントは、レジではまだ使えません",
  upcoming: "ポイントはイベントの開催中だけ使えます（まだ始まっていません）",
  ended: "このイベントは終わったため、ポイントは使えません",
};

export type PosPointsHolder = {
  userId: string;
  name: string;
  receptionNumber: string;
  balance: number;
};

export type PosPointsLookup =
  | { ok: true; holder: PosPointsHolder }
  | { ok: false; status: number; error: string };

/** 参加パスのQR（または受付番号）から、その人のこのイベントのポイントの残りを調べる */
export async function lookupPosPointsHolder(
  supabase: SupabaseClient,
  organizerId: string,
  eventId: string,
  qr: string
): Promise<PosPointsLookup> {
  const availability = await getPosPointsAvailability(supabase, organizerId, eventId);
  if (!availability.enabled) {
    return { ok: false, status: 400, error: POS_POINTS_UNAVAILABLE_MESSAGE[availability.reason] };
  }

  const resolved = await resolvePassQr(supabase, qr, eventId);
  if (!resolved) {
    return { ok: false, status: 404, error: "このイベントの参加パスが見つかりません" };
  }
  if (resolved.kind === "visitor" && resolved.status === "declined") {
    return { ok: false, status: 403, error: "この参加は辞退済みです" };
  }
  if (!resolved.userId) {
    return { ok: false, status: 400, error: "この参加パスはアカウントがないため、ポイントを持てません" };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, status: 503, error: "ポイントを確認できません。時間をおいてお試しください" };

  const [{ data: balance, error }, { data: profile }] = await Promise.all([
    admin.rpc("event_points_balance", { p_user_id: resolved.userId, p_event_id: eventId }),
    admin.from("profiles").select("display_name").eq("id", resolved.userId).maybeSingle(),
  ]);
  if (error) {
    console.error("pos points balance:", error);
    return { ok: false, status: 500, error: "ポイントの確認に失敗しました" };
  }

  return {
    ok: true,
    holder: {
      userId: resolved.userId,
      name: (profile?.display_name as string | null)?.trim() || "参加者",
      receptionNumber: buildReceptionNumber(
        resolved.kind === "visitor" ? resolved.participantId : resolved.applicationId
      ),
      balance: Math.max(0, Number(balance) || 0),
    },
  };
}

export function posPointsRef(saleId: string): string {
  return `pos:${saleId}`;
}

/** ポイントを使う。足りなければ "insufficient_points" で止まる。同じ会計で2回呼んでも二重には引かない */
export async function redeemPosPoints(params: {
  userId: string;
  eventId: string;
  amount: number;
  saleId: string;
}): Promise<{ ok: true; balance: number } | { ok: false; error: "insufficient_points" | "failed" }> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "failed" };
  const { data, error } = await admin.rpc("redeem_event_points", {
    p_user_id: params.userId,
    p_event_id: params.eventId,
    p_amount: params.amount,
    p_ref: posPointsRef(params.saleId),
  });
  if (error) {
    if (/insufficient_points/.test(error.message ?? "")) return { ok: false, error: "insufficient_points" };
    console.error("pos points redeem:", error);
    return { ok: false, error: "failed" };
  }
  return { ok: true, balance: Number(data) || 0 };
}

/** 会計を取り消したときに、使ったポイントを戻す（二重には戻さない） */
export async function restorePosPoints(params: {
  userId: string;
  eventId: string;
  saleId: string;
}): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin.rpc("restore_event_points", {
    p_user_id: params.userId,
    p_event_id: params.eventId,
    p_ref: posPointsRef(params.saleId),
  });
  if (error) {
    console.error("pos points restore:", error);
    return false;
  }
  return true;
}
