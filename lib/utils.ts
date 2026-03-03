/** すでに表示したIDを除外して指定件数取得し、使ったIDを返す */
export function takeWithoutSeen<T extends { id: string }>(
  items: T[],
  seenIds: Set<string>,
  limit: number
): { items: T[]; updatedSeen: Set<string> } {
  const result: T[] = [];
  const updatedSeen = new Set(seenIds);
  for (const item of items) {
    if (result.length >= limit) break;
    if (!updatedSeen.has(item.id)) {
      result.push(item);
      updatedSeen.add(item.id);
    }
  }
  return { items: result, updatedSeen };
}
