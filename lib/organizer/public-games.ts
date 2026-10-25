import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_ORGANIZER_GAME_TYPE_ID,
  getOrganizerGameType,
  isOrganizerGameTypeId,
  type OrganizerGameTypeId,
} from "@/lib/organizer/game-types";
import { organizerGameJoinPath } from "@/lib/organizer/game-tokens";
import { publicPlayParticipation, publicPlayStart, type GameParticipation } from "@/lib/organizer/game-experience";

export type PublicOrganizerGame = {
  id: string;
  type: OrganizerGameTypeId;
  typeLabel: string;
  name: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  joinPath: string;
  imageUrl: string;
  areaLabel: string;
  eventTitle: string | null;
};

export function coverFromSettings(settings: unknown, type: OrganizerGameTypeId): string | null {
  // 主催者が「まちの情報に出るカード」で選んだ画像を、いちばん先に使う。
  const cardImage = settings && typeof settings === "object" ? (settings as { cardImage?: unknown }).cardImage : null;
  if (typeof cardImage === "string" && cardImage.trim()) return cardImage.trim();
  const startImage = publicPlayStart(settings).imageUrl;
  if (startImage) return startImage;
  if (!settings || typeof settings !== "object") return null;
  const nested = (settings as Record<string, unknown>)[type];
  if (!nested || typeof nested !== "object") return null;
  const row = nested as Record<string, unknown>;
  if (typeof row.mainImage === "string" && row.mainImage.trim()) return row.mainImage.trim();
  if (typeof row.coverImage === "string" && row.coverImage.trim()) return row.coverImage.trim();
  return null;
}

function isHiddenFromPublic(settings: unknown, type: OrganizerGameTypeId): boolean {
  if (!settings || typeof settings !== "object") return false;
  const nested = (settings as Record<string, unknown>)[type];
  if (!nested || typeof nested !== "object") return false;
  const row = nested as Record<string, unknown>;
  if (row.publicToPlayers === false) return true;
  return false;
}

export function defaultCover(type: OrganizerGameTypeId): string {
  // 謎解きだけは種類の絵がないので、テンプレートの絵を使う。
  if (type === "mystery") return "/organizer/games/template-mystery.jpg";
  return `/organizer/games/game-type-${type}.png`;
}

export async function listPublishedOrganizerGames(
  supabase: SupabaseClient,
  limit = 50
): Promise<PublicOrganizerGame[]> {
  const capped = Math.min(Math.max(limit, 1), 100);
  const now = Date.now();
  const { data, error } = await supabase
    .from("organizer_games")
    .select("id, type, name, description, starts_at, ends_at, join_token, settings, updated_at, events(title, prefecture, city, image_url)")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(capped);

  let rows = data as Record<string, unknown>[] | null;
  if (error) {
    if (/events|relationship|schema cache/i.test(error.message)) {
      const fallback = await supabase
        .from("organizer_games")
        .select("id, type, name, description, starts_at, ends_at, join_token, settings, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(capped);
      if (fallback.error) {
        if (/does not exist|schema cache|aborted/i.test(fallback.error.message)) return [];
        console.warn("listPublishedOrganizerGames:", fallback.error.message);
        return [];
      }
      rows = (fallback.data ?? []) as Record<string, unknown>[];
    } else {
      if (/does not exist|schema cache|aborted/i.test(error.message)) return [];
      console.warn("listPublishedOrganizerGames:", error.message);
      return [];
    }
  }

  return (rows ?? []).flatMap((row) => {
    const type = isOrganizerGameTypeId(String(row.type ?? ""))
      ? (row.type as OrganizerGameTypeId)
      : DEFAULT_ORGANIZER_GAME_TYPE_ID;
    if (isHiddenFromPublic(row.settings, type)) return [];
    const endsAt = typeof row.ends_at === "string" ? row.ends_at : null;
    if (endsAt && !Number.isNaN(Date.parse(endsAt)) && Date.parse(endsAt) < now) return [];
    const joinToken = typeof row.join_token === "string" ? row.join_token.trim() : "";
    if (!joinToken) return [];
    const eventRaw = row.events;
    const event = Array.isArray(eventRaw) ? eventRaw[0] : eventRaw;
    const eventObj = event && typeof event === "object" ? (event as Record<string, unknown>) : null;
    const eventTitle = typeof eventObj?.title === "string" ? eventObj.title : null;
    const startTitle = publicPlayStart(row.settings).title.trim();
    const areaLabel =
      (typeof eventObj?.prefecture === "string" && eventObj.prefecture) ||
      (typeof eventObj?.city === "string" && eventObj.city) ||
      eventTitle ||
      "地域のゲーム";
    return [
      {
        id: String(row.id),
        type,
        typeLabel: getOrganizerGameType(type).label,
        name: startTitle || (typeof row.name === "string" ? row.name : "ゲーム"),
        description: typeof row.description === "string" ? row.description : "",
        startsAt: typeof row.starts_at === "string" ? row.starts_at : null,
        endsAt,
        joinPath: organizerGameJoinPath(joinToken),
        // ゲーム専用の画像 → 対象イベントの画像（参加パスにも出る画像） → 種類ごとの絵、の順。
        imageUrl:
          coverFromSettings(row.settings, type) ||
          (typeof eventObj?.image_url === "string" && eventObj.image_url.trim() ? eventObj.image_url.trim() : "") ||
          defaultCover(type),
        areaLabel,
        eventTitle,
      },
    ];
  });
}

export function publicGameStartYmd(startsAt: string | null): string {
  if (!startsAt) return "";
  const value = new Date(startsAt);
  if (Number.isNaN(value.getTime())) return "";
  const jst = new Date(value.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export type EventLinkedGame = {
  id: string;
  name: string;
  typeLabel: string;
  participation: GameParticipation;
  joinPath: string;
  imageUrl: string;
};

/** イベントの詳細ページに出す、そのイベントに結びついた公開中のゲーム。 */
export async function listPublishedGamesForEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<EventLinkedGame[]> {
  const { data, error } = await supabase
    .from("organizer_games")
    .select("id, type, name, ends_at, join_token, settings")
    .eq("event_id", eventId)
    .eq("status", "published")
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("listPublishedGamesForEvent:", error.message);
    return [];
  }
  const now = Date.now();
  return ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const type = isOrganizerGameTypeId(String(row.type ?? ""))
      ? (row.type as OrganizerGameTypeId)
      : DEFAULT_ORGANIZER_GAME_TYPE_ID;
    if (isHiddenFromPublic(row.settings, type)) return [];
    const endsAt = typeof row.ends_at === "string" ? row.ends_at : null;
    if (endsAt && !Number.isNaN(Date.parse(endsAt)) && Date.parse(endsAt) < now) return [];
    const joinToken = typeof row.join_token === "string" ? row.join_token.trim() : "";
    if (!joinToken) return [];
    const startTitle = publicPlayStart(row.settings).title.trim();
    return [
      {
        id: String(row.id),
        name: startTitle || (typeof row.name === "string" ? row.name : "ゲーム"),
        typeLabel: getOrganizerGameType(type).label,
        participation: publicPlayParticipation(row.settings, type),
        joinPath: organizerGameJoinPath(joinToken),
        imageUrl: coverFromSettings(row.settings, type) ?? defaultCover(type),
      },
    ];
  });
}

/**
 * イベントに画像がないとき、参加パスに出すゲームの画像。イベントごとに、いちばん先に作ったゲームの画像を使う。
 * カードの画像 → スタート画面の画像 → 種類ごとの画像の順。
 */
export async function gameImagesForEvents(
  supabase: SupabaseClient,
  eventIds: string[]
): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  if (eventIds.length === 0) return images;
  const { data, error } = await supabase
    .from("organizer_games")
    .select("event_id, type, settings, created_at")
    .in("event_id", eventIds)
    .eq("status", "published")
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("gameImagesForEvents:", error.message);
    return images;
  }
  for (const row of (data ?? []) as { event_id: string | null; type: string; settings: unknown }[]) {
    if (!row.event_id || images.has(row.event_id)) continue;
    const type = isOrganizerGameTypeId(row.type) ? row.type : DEFAULT_ORGANIZER_GAME_TYPE_ID;
    images.set(row.event_id, coverFromSettings(row.settings, type) ?? defaultCover(type));
  }
  return images;
}
