import { publicPlayMoment, type PublicPlayMoment } from "@/lib/organizer/game-experience";
import { getPlayDb } from "@/lib/organizer/play";

async function readSettings(gameId: string): Promise<unknown> {
  const db = getPlayDb();
  if (!db) return null;
  const { data, error } = await db.from("organizer_games").select("settings").eq("id", gameId).maybeSingle();
  if (error) {
    console.error("play moment settings:", error);
    return null;
  }
  return (data as { settings?: unknown } | null)?.settings ?? null;
}

async function indexOfSpot(gameId: string, spotId: string): Promise<number | null> {
  const db = getPlayDb();
  if (!db) return null;
  const { data, error } = await db
    .from("organizer_game_spots")
    .select("id")
    .eq("game_id", gameId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return null;
  const index = data.findIndex((row) => row.id === spotId);
  return index >= 0 ? index : null;
}

export async function loadPlayMoment(gameId: string, spotId?: string | null): Promise<PublicPlayMoment> {
  const settings = await readSettings(gameId);
  const spotIndex = spotId ? await indexOfSpot(gameId, spotId) : null;
  return publicPlayMoment(settings, spotIndex);
}

export async function loadPlayMomentBySpot(spotId: string): Promise<PublicPlayMoment> {
  const db = getPlayDb();
  if (!db) return publicPlayMoment(null, null);
  const { data, error } = await db.from("organizer_game_spots").select("game_id").eq("id", spotId).maybeSingle();
  if (error || !data?.game_id) return publicPlayMoment(null, null);
  return loadPlayMoment(data.game_id as string, spotId);
}
