import type { SupabaseClient } from "@supabase/supabase-js";

export type ReactionType = "planned" | "interested";

/** イベントへのリアクション（参加予定・気になる）を追加・切り替え */
export async function setEventReaction(
  supabase: SupabaseClient,
  eventId: string,
  profileId: string,
  reactionType: ReactionType
): Promise<void> {
  const { error } = await supabase.from("event_reactions").upsert(
    { event_id: eventId, profile_id: profileId, reaction_type: reactionType },
    { onConflict: "event_id,profile_id" }
  );
  if (error) throw error;
}

/** リアクション解除 */
export async function removeEventReaction(
  supabase: SupabaseClient,
  eventId: string,
  profileId: string
): Promise<void> {
  const { error } = await supabase
    .from("event_reactions")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", profileId);
  if (error) throw error;
}

/** ユーザーの現在のリアクション取得 */
export async function getMyReaction(
  supabase: SupabaseClient,
  eventId: string,
  profileId: string
): Promise<ReactionType | null> {
  const { data } = await supabase
    .from("event_reactions")
    .select("reaction_type")
    .eq("event_id", eventId)
    .eq("profile_id", profileId)
    .single();
  return (data?.reaction_type as ReactionType) ?? null;
}

/** イベントのリアクション件数取得（主催者用） */
export async function getEventReactionCounts(
  supabase: SupabaseClient,
  eventId: string
): Promise<{ planned: number; interested: number }> {
  const { data } = await supabase
    .from("event_reactions")
    .select("reaction_type")
    .eq("event_id", eventId);

  if (!data) return { planned: 0, interested: 0 };
  let planned = 0;
  let interested = 0;
  for (const row of data as { reaction_type: string }[]) {
    if (row.reaction_type === "planned") planned++;
    else if (row.reaction_type === "interested") interested++;
  }
  return { planned, interested };
}

/** 自分の参加予定・気になるイベントID一覧（マイページ用） */
export async function getMyReactionEventIds(
  supabase: SupabaseClient,
  profileId: string
): Promise<{ planned: string[]; interested: string[] }> {
  const { data } = await supabase
    .from("event_reactions")
    .select("event_id, reaction_type")
    .eq("profile_id", profileId);

  if (!data) return { planned: [], interested: [] };
  const planned: string[] = [];
  const interested: string[] = [];
  for (const row of data as { event_id: string; reaction_type: string }[]) {
    if (row.reaction_type === "planned") planned.push(row.event_id);
    else if (row.reaction_type === "interested") interested.push(row.event_id);
  }
  return { planned, interested };
}
