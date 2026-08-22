import type { DbUserFollow, FollowStatus } from "@/lib/db/user-follows-types";

const memoryFollows: DbUserFollow[] = [];

function nowIso() {
  return new Date().toISOString();
}

export function addMemoryFollow(
  followerId: string,
  followeeId: string,
  status: FollowStatus = "pending",
): DbUserFollow {
  const existing = memoryFollows.find(
    (f) => f.follower_id === followerId && f.followee_id === followeeId,
  );
  if (existing) return existing;
  const row: DbUserFollow = {
    id: `mem-follow-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    follower_id: followerId,
    followee_id: followeeId,
    status,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  memoryFollows.unshift(row);
  return row;
}

export function getMemoryFollowByPair(
  followerId: string,
  followeeId: string,
): DbUserFollow | null {
  return (
    memoryFollows.find(
      (f) => f.follower_id === followerId && f.followee_id === followeeId,
    ) ?? null
  );
}

export function getMemoryFollowById(id: string): DbUserFollow | null {
  return memoryFollows.find((f) => f.id === id) ?? null;
}

export function updateMemoryFollowStatus(
  id: string,
  status: FollowStatus,
): DbUserFollow | null {
  const row = getMemoryFollowById(id);
  if (!row) return null;
  row.status = status;
  row.updated_at = nowIso();
  return row;
}

export function deleteMemoryFollow(id: string, followerId: string): boolean {
  const idx = memoryFollows.findIndex(
    (f) => f.id === id && f.follower_id === followerId,
  );
  if (idx === -1) return false;
  memoryFollows.splice(idx, 1);
  return true;
}

export function listMemoryFollowers(
  followeeId: string,
  status?: FollowStatus,
): DbUserFollow[] {
  return memoryFollows.filter(
    (f) =>
      f.followee_id === followeeId && (status ? f.status === status : true),
  );
}

export function listMemoryFollowing(
  followerId: string,
  status?: FollowStatus,
): DbUserFollow[] {
  return memoryFollows.filter(
    (f) =>
      f.follower_id === followerId && (status ? f.status === status : true),
  );
}

export function countMemoryAcceptedFollowers(followeeId: string): number {
  return listMemoryFollowers(followeeId, "accepted").length;
}

export function countMemoryAcceptedFollowing(followerId: string): number {
  return listMemoryFollowing(followerId, "accepted").length;
}
