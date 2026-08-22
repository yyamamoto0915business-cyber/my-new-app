import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addMemoryFollow,
  countMemoryAcceptedFollowers,
  countMemoryAcceptedFollowing,
  getMemoryFollowById,
  getMemoryFollowByPair,
  listMemoryFollowers,
  listMemoryFollowing,
  updateMemoryFollowStatus,
  deleteMemoryFollow,
} from "@/lib/created-user-follows-store";
import {
  getMemoryIsPrivate,
} from "@/lib/created-profile-privacy-store";
import type { DbUserFollow, FollowStatus } from "@/lib/db/user-follows-types";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function writer() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export async function getFollowByPair(
  followerId: string,
  followeeId: string,
): Promise<DbUserFollow | null> {
  const memory = getMemoryFollowByPair(followerId, followeeId);
  const supabase = await createClient();
  if (!supabase || !isUuid(followerId) || !isUuid(followeeId)) return memory;

  const { data, error } = await supabase
    .from("user_follows")
    .select("*")
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId)
    .maybeSingle();
  if (error) {
    if (!/schema cache|does not exist|42P01/i.test(error.message)) {
      console.error("getFollowByPair:", error.message);
    }
    return memory;
  }
  return (data as DbUserFollow | null) ?? memory;
}

export async function isAcceptedFollower(
  followerId: string | null,
  followeeId: string | null,
): Promise<boolean> {
  if (!followerId || !followeeId) return false;
  if (followerId === followeeId) return true;
  const row = await getFollowByPair(followerId, followeeId);
  return row?.status === "accepted";
}

async function isFolloweePrivate(followeeId: string): Promise<boolean> {
  const supabase = await createClient();
  if (supabase && isUuid(followeeId)) {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_private")
      .eq("id", followeeId)
      .maybeSingle();
    if (!error && data && typeof (data as { is_private?: boolean }).is_private === "boolean") {
      return Boolean((data as { is_private: boolean }).is_private);
    }
  }
  return getMemoryIsPrivate(followeeId);
}

export async function requestFollow(
  followerId: string,
  followeeId: string,
): Promise<DbUserFollow | { error: string }> {
  if (followerId === followeeId) return { error: "自分自身はフォローできません" };

  const existing = await getFollowByPair(followerId, followeeId);
  if (existing?.status === "accepted" || existing?.status === "pending") {
    return existing;
  }

  const nextStatus: FollowStatus = (await isFolloweePrivate(followeeId))
    ? "pending"
    : "accepted";

  const client = await writer();
  if (!client || !isUuid(followerId) || !isUuid(followeeId)) {
    if (existing) {
      return updateMemoryFollowStatus(existing.id, nextStatus) ?? existing;
    }
    return addMemoryFollow(followerId, followeeId, nextStatus);
  }

  if (existing) {
    const { data, error } = await client
      .from("user_follows")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) {
      console.error("requestFollow update:", error?.message);
      return { error: "フォロー申請に失敗しました" };
    }
    return data as DbUserFollow;
  }

  const { data, error } = await client
    .from("user_follows")
    .insert({
      follower_id: followerId,
      followee_id: followeeId,
      status: nextStatus,
    })
    .select("*")
    .single();
  if (error || !data) {
    console.error("requestFollow insert:", error?.message);
    return addMemoryFollow(followerId, followeeId, nextStatus);
  }
  return data as DbUserFollow;
}

export async function respondFollow(
  followId: string,
  followeeId: string,
  status: "accepted" | "rejected",
): Promise<DbUserFollow | null> {
  const memory = getMemoryFollowById(followId);
  if (memory) {
    if (memory.followee_id !== followeeId) return null;
    return updateMemoryFollowStatus(followId, status);
  }

  const client = await writer();
  if (!client) return null;

  const { data, error } = await client
    .from("user_follows")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", followId)
    .eq("followee_id", followeeId)
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("respondFollow:", error.message);
    return null;
  }
  return (data as DbUserFollow | null) ?? null;
}

export async function unfollow(
  followerId: string,
  followeeId: string,
): Promise<boolean> {
  const existing = await getFollowByPair(followerId, followeeId);
  if (!existing) return true;
  if (deleteMemoryFollow(existing.id, followerId)) return true;

  const client = await writer();
  if (!client) return false;
  const { error } = await client
    .from("user_follows")
    .delete()
    .eq("id", existing.id)
    .eq("follower_id", followerId);
  return !error;
}

export async function listPendingFollowers(
  followeeId: string,
): Promise<DbUserFollow[]> {
  const memory = listMemoryFollowers(followeeId, "pending");
  const supabase = await createClient();
  if (!supabase || !isUuid(followeeId)) return memory;

  const { data, error } = await supabase
    .from("user_follows")
    .select("*")
    .eq("followee_id", followeeId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listPendingFollowers:", error.message);
    return memory;
  }
  return (data ?? []) as DbUserFollow[];
}

export async function listAcceptedFollowers(
  followeeId: string,
): Promise<DbUserFollow[]> {
  const memory = listMemoryFollowers(followeeId, "accepted");
  const supabase = await createClient();
  if (!supabase || !isUuid(followeeId)) return memory;
  const { data, error } = await supabase
    .from("user_follows")
    .select("*")
    .eq("followee_id", followeeId)
    .eq("status", "accepted")
    .order("updated_at", { ascending: false });
  if (error) return memory;
  return (data ?? []) as DbUserFollow[];
}

export async function listAcceptedFollowing(
  followerId: string,
): Promise<DbUserFollow[]> {
  const memory = listMemoryFollowing(followerId, "accepted");
  const supabase = await createClient();
  if (!supabase || !isUuid(followerId)) return memory;
  const { data, error } = await supabase
    .from("user_follows")
    .select("*")
    .eq("follower_id", followerId)
    .eq("status", "accepted")
    .order("updated_at", { ascending: false });
  if (error) return memory;
  return (data ?? []) as DbUserFollow[];
}

export async function countAcceptedFollowers(followeeId: string): Promise<number> {
  const memory = countMemoryAcceptedFollowers(followeeId);
  const supabase = await createClient();
  if (!supabase || !isUuid(followeeId)) return memory;
  const { count, error } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("followee_id", followeeId)
    .eq("status", "accepted");
  if (error) return memory;
  return count ?? memory;
}

export async function countAcceptedFollowing(followerId: string): Promise<number> {
  const memory = countMemoryAcceptedFollowing(followerId);
  const supabase = await createClient();
  if (!supabase || !isUuid(followerId)) return memory;
  const { count, error } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", followerId)
    .eq("status", "accepted");
  if (error) return memory;
  return count ?? memory;
}

export async function getFollowById(id: string): Promise<DbUserFollow | null> {
  const memory = getMemoryFollowById(id);
  const supabase = await createClient();
  if (!supabase) return memory;
  const { data, error } = await supabase
    .from("user_follows")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return memory;
  return (data as DbUserFollow | null) ?? memory;
}

export type { FollowStatus };
