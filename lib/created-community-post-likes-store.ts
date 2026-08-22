/**
 * 開発用インメモリいいね（Supabase 未接続時）
 */
const likeKeys = new Set<string>();

function key(userId: string, postId: string) {
  return `${userId}:${postId}`;
}

export function memoryHasLike(userId: string, postId: string): boolean {
  return likeKeys.has(key(userId, postId));
}

export function memoryAddLike(userId: string, postId: string): boolean {
  const k = key(userId, postId);
  if (likeKeys.has(k)) return false;
  likeKeys.add(k);
  return true;
}

export function memoryRemoveLike(userId: string, postId: string): boolean {
  return likeKeys.delete(key(userId, postId));
}

export function memoryLikedPostIds(
  userId: string,
  postIds: string[],
): string[] {
  return postIds.filter((id) => likeKeys.has(key(userId, id)));
}

export function memoryLikedPostIdsForUser(userId: string): string[] {
  const prefix = `${userId}:`;
  const ids: string[] = [];
  for (const k of likeKeys) {
    if (k.startsWith(prefix)) ids.push(k.slice(prefix.length));
  }
  return ids;
}

export function memoryCountLikes(postId: string): number {
  let n = 0;
  const suffix = `:${postId}`;
  for (const k of likeKeys) {
    if (k.endsWith(suffix) && k.slice(0, -suffix.length).length > 0) n += 1;
  }
  return n;
}
