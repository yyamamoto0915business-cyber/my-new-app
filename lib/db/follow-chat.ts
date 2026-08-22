import { createAdminClient } from "@/lib/supabase/admin";
import { isAcceptedFollower } from "@/lib/db/user-follows";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function createFollowDm(me: string, them: string): Promise<string> {
  const admin = createAdminClient();
  if (!admin) throw new Error("chat_unavailable");
  const [peerUserId, otherUserId] = me < them ? [me, them] : [them, me];

  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("kind", "follow_dm")
    .eq("peer_user_id", peerUserId)
    .eq("other_user_id", otherUserId)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: inserted, error } = await admin
    .from("conversations")
    .insert({
      event_id: null,
      kind: "follow_dm",
      organizer_id: null,
      peer_user_id: peerUserId,
      other_user_id: otherUserId,
    })
    .select("id")
    .single();
  if (error || !inserted?.id) {
    const { data: again } = await admin
      .from("conversations")
      .select("id")
      .eq("kind", "follow_dm")
      .eq("peer_user_id", peerUserId)
      .eq("other_user_id", otherUserId)
      .maybeSingle();
    if (again?.id) return again.id as string;
    throw new Error(error?.message ?? "chat_create_failed");
  }
  const convId = inserted.id as string;
  await admin.from("conversation_members").upsert(
    [
      { conversation_id: convId, user_id: me },
      { conversation_id: convId, user_id: them },
    ],
    { onConflict: "conversation_id,user_id", ignoreDuplicates: true },
  );
  return convId;
}

export async function createOrGetFollowChat(
  myId: string,
  theirId: string,
): Promise<{ conversationId: string } | { error: string; status: number }> {
  if (!isUuid(myId) || !isUuid(theirId)) {
    return { error: "チャットできません", status: 400 };
  }
  if (myId === theirId) {
    return { error: "自分には送れません", status: 400 };
  }
  const following = await isAcceptedFollower(myId, theirId);
  if (!following) {
    return { error: "フォロー中の相手にだけ送れます", status: 403 };
  }

  try {
    const conversationId = await createFollowDm(myId, theirId);
    return { conversationId };
  } catch (e) {
    console.error("createFollowDm:", e instanceof Error ? e.message : e);
    return { error: "チャットの準備に失敗しました", status: 500 };
  }
}
