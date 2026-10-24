import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_ORGANIZER_GAME_TYPE_ID,
  getOrganizerGameType,
  isOrganizerGameTypeId,
  type OrganizerGameTypeId,
} from "@/lib/organizer/game-types";
import { organizerGameJoinPath } from "@/lib/organizer/game-tokens";
import { publicPlayStart } from "@/lib/organizer/game-experience";

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

function coverFromSettings(settings: unknown, type: OrganizerGameTypeId): string | null {
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

function defaultCover(type: OrganizerGameTypeId): string {
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
