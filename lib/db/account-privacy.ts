import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getMemoryIsPrivate } from "@/lib/created-profile-privacy-store";
import { isAcceptedFollower } from "@/lib/db/user-follows";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/** 指定ユーザーのうち、非公開アカウントの id */
export async function listPrivateProfileIds(ids: string[]): Promise<Set<string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const out = new Set<string>();
  for (const id of unique) {
    if (getMemoryIsPrivate(id)) out.add(id);
  }

  const uuids = unique.filter(isUuid);
  if (uuids.length === 0) return out;

  const client = createAdminClient() ?? (await createClient());
  if (!client) return out;

  const { data, error } = await client
    .from("profiles")
    .select("id, is_private")
    .in("id", uuids);
  if (error) {
    console.error("listPrivateProfileIds:", error.message);
    return out;
  }
  for (const row of data ?? []) {
    if ((row as { is_private?: boolean }).is_private) {
      out.add((row as { id: string }).id);
    }
  }
  return out;
}

export async function isProfilePrivate(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const set = await listPrivateProfileIds([userId]);
  return set.has(userId);
}

/**
 * 非公開アカウントの投稿を、本人と承認済みフォロワー以外の一覧から外す。
 * 公開アカウントの投稿はそのまま残す。
 */
export async function filterPostsVisibleDespitePrivateAccounts<
  T extends { author_id: string | null },
>(posts: T[], viewerId: string | null): Promise<T[]> {
  const privateIds = await listPrivateProfileIds(
    posts.map((post) => post.author_id).filter((id): id is string => Boolean(id)),
  );
  if (privateIds.size === 0) return posts;

  const allowed = new Set<string>();
  if (viewerId) allowed.add(viewerId);
  const pending = [...privateIds].filter((id) => id !== viewerId);
  await Promise.all(
    pending.map(async (authorId) => {
      if (viewerId && (await isAcceptedFollower(viewerId, authorId))) {
        allowed.add(authorId);
      }
    }),
  );

  return posts.filter(
    (post) =>
      !post.author_id ||
      !privateIds.has(post.author_id) ||
      allowed.has(post.author_id),
  );
}
