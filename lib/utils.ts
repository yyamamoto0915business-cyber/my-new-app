import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** seen に含まれない要素を limit 件まで取得し、updatedSeen を返す */
export function takeWithoutSeen<T extends { id: string }>(
  arr: T[],
  seen: Set<string>,
  limit: number
): { items: T[]; updatedSeen: Set<string> } {
  const result: T[] = [];
  const updatedSeen = new Set(seen);
  for (const item of arr) {
    if (result.length >= limit) break;
    if (!updatedSeen.has(item.id)) {
      result.push(item);
      updatedSeen.add(item.id);
    }
  }
  return { items: result, updatedSeen };
}
