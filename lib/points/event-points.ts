import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJstNowHm, getJstTodayYmd } from "@/lib/jst-date";

/**
 * イベントポイント：ポイントは「イベントが発行して、そのイベントの開催中にだけ使える」もの。
 * アプリ全体で交換できるものはないので、合計の残高ではなくイベントごとに数えて見せる。
 *
 * 履歴（point_transactions.reference_id）の形：
 *   ためた分  "<ゲームの種類>:<ゲームのID>:<プレイヤーのID>"（stamp-rally / photo / checkin / mission）
 *   使った分  "event:<イベントのID>:<…>"（レジで使う仕組みを作るときにこの形で残す）
 * ゲームは organizer_games.event_id でイベントにつながる。
 */

export type EventPointsStatus = "upcoming" | "live" | "ended";

export type EventPointsItem = {
  eventId: string;
  title: string;
  imageUrl: string | null;
  date: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  status: EventPointsStatus;
  earned: number;
  used: number;
  balance: number;
};

export type MyEventPoints = {
  /** 開催前・開催中で、残りがあるイベント（使えるポイント） */
  usable: EventPointsItem[];
  /** 終わったイベント（記録だけ） */
  ended: EventPointsItem[];
  /** イベントにつながっていないゲームでためた分（記録だけ） */
  unlinked: number;
  /** これまでにためた合計（記録） */
  totalEarned: number;
};

const GAME_SOURCES = new Set(["stamp-rally", "photo", "checkin", "mission"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** イベントが開催前・開催中・終わったか（日本時間） */
export function eventPointsStatusOf(e: { date: string; end_date: string | null; end_time: string | null }): EventPointsStatus {
  const today = getJstTodayYmd();
  const last = e.end_date || e.date;
  if (today < e.date) return "upcoming";
  if (today > last) return "ended";
  if (today === last && e.end_time && getJstNowHm() > e.end_time.slice(0, 5)) return "ended";
  return "live";
}

/**
 * 本人のイベントポイントを、イベントごとに数える。
 * ゲーム・イベントの表は本人には読めない（主催者のものしか読めない）ので、
 * 本人の履歴に出てくるIDだけを管理用の接続で読む。
 */
export async function fetchMyEventPoints(supabase: SupabaseClient, userId: string): Promise<MyEventPoints> {
  const empty: MyEventPoints = { usable: [], ended: [], unlinked: 0, totalEarned: 0 };
  const { data: rows } = await supabase
    .from("point_transactions")
    .select("amount, reference_id")
    .eq("user_id", userId)
    .limit(2000);
  const txs = (rows ?? []) as { amount: number; reference_id: string | null }[];
  if (txs.length === 0) return empty;

  // 1件ずつ「どのゲーム（またはイベント）の分か」を取り出す
  const byGame = new Map<string, number>();
  const usedByEvent = new Map<string, number>();
  let totalEarned = 0;
  let unlinked = 0;
  for (const t of txs) {
    const amount = Number(t.amount) || 0;
    const [source, id] = (t.reference_id ?? "").split(":");
    // 使った分を戻したとき（event:…:restore）は「ためた」には数えない
    if (amount > 0 && source !== "event") totalEarned += amount;
    if (source === "event" && id && UUID.test(id)) {
      usedByEvent.set(id, (usedByEvent.get(id) ?? 0) + amount);
    } else if (GAME_SOURCES.has(source) && id && UUID.test(id)) {
      byGame.set(id, (byGame.get(id) ?? 0) + amount);
    } else if (amount > 0) {
      unlinked += amount;
    }
  }

  const admin = createAdminClient();
  if (!admin) return { ...empty, totalEarned, unlinked: totalEarned };

  const gameIds = [...byGame.keys()];
  const { data: games } = gameIds.length
    ? await admin.from("organizer_games").select("id, event_id").in("id", gameIds)
    : { data: [] as { id: string; event_id: string | null }[] };

  const earnedByEvent = new Map<string, number>();
  for (const [gameId, amount] of byGame) {
    const eventId = (games ?? []).find((g) => g.id === gameId)?.event_id as string | null | undefined;
    if (eventId) earnedByEvent.set(eventId, (earnedByEvent.get(eventId) ?? 0) + amount);
    else unlinked += amount;
  }

  const eventIds = [...new Set([...earnedByEvent.keys(), ...usedByEvent.keys()])];
  if (eventIds.length === 0) return { ...empty, unlinked, totalEarned };
  const { data: events } = await admin
    .from("events")
    .select("id, title, image_url, date, end_date, start_time, end_time")
    .in("id", eventIds);

  const items: EventPointsItem[] = (events ?? []).map((e) => {
    const earned = earnedByEvent.get(e.id as string) ?? 0;
    const used = -(usedByEvent.get(e.id as string) ?? 0);
    return {
      eventId: e.id as string,
      title: (e.title as string) ?? "イベント",
      imageUrl: ((e.image_url as string | null) ?? "").trim() || null,
      date: e.date as string,
      endDate: (e.end_date as string | null) ?? null,
      startTime: ((e.start_time as string | null) ?? "").slice(0, 5) || null,
      endTime: ((e.end_time as string | null) ?? "").slice(0, 5) || null,
      status: eventPointsStatusOf({
        date: e.date as string,
        end_date: (e.end_date as string | null) ?? null,
        end_time: (e.end_time as string | null) ?? null,
      }),
      earned,
      used,
      balance: Math.max(earned - used, 0),
    };
  });

  const byDate = (a: EventPointsItem, b: EventPointsItem) => a.date.localeCompare(b.date);
  return {
    usable: items.filter((i) => i.status !== "ended" && i.balance > 0).sort(byDate),
    ended: items.filter((i) => i.status === "ended").sort((a, b) => byDate(b, a)),
    unlinked,
    totalEarned,
  };
}

/** 「今日 15:00まで」「11/23 15:00まで」のような使える期限 */
export function usableUntilLabel(item: Pick<EventPointsItem, "date" | "endDate" | "endTime">): string {
  const last = item.endDate || item.date;
  const today = getJstTodayYmd();
  const [, m, d] = last.split("-").map(Number);
  const day = last === today ? "今日" : `${m}/${d}`;
  return item.endTime ? `${day} ${item.endTime}まで` : `${day}まで`;
}

export type EventPointStats = { issued: number; used: number; earners: number };

/** 主催者の設定画面に出す、このイベントのポイントの数（発行済み・使われた・ためた人） */
export async function fetchEventPointStats(eventId: string): Promise<EventPointStats> {
  const admin = createAdminClient();
  const zero = { issued: 0, used: 0, earners: 0 };
  if (!admin || !UUID.test(eventId)) return zero;
  const { data: games } = await admin.from("organizer_games").select("id").eq("event_id", eventId);
  const gameIds = (games ?? []).map((g) => g.id as string).filter((id) => UUID.test(id));

  const earnedRows: { user_id: string; amount: number }[] = [];
  if (gameIds.length) {
    const { data } = await admin
      .from("point_transactions")
      .select("user_id, amount, reference_id")
      .or(gameIds.map((id) => `reference_id.like.%:${id}:%`).join(","))
      .limit(20000);
    for (const r of data ?? []) {
      const [source] = String(r.reference_id ?? "").split(":");
      if (GAME_SOURCES.has(source)) earnedRows.push({ user_id: r.user_id as string, amount: Number(r.amount) || 0 });
    }
  }
  const { data: spent } = await admin
    .from("point_transactions")
    .select("amount")
    .like("reference_id", `event:${eventId}:%`)
    .limit(20000);

  return {
    issued: earnedRows.reduce((s, r) => s + Math.max(r.amount, 0), 0),
    used: Math.max(-(spent ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0), 0),
    earners: new Set(earnedRows.filter((r) => r.amount > 0).map((r) => r.user_id)).size,
  };
}
