/**
 * 公開イベント詳細ページ用：DB を優先し、なければモック/ストアから取得
 */
import type { Event } from "./db/types";
import { createClient } from "@/lib/supabase/server";
import { fetchPublishedEventById } from "./db/events";
import { getEventById } from "./events";

/** 公開イベント1件取得（DB優先、status=published のみ） */
export async function getEventForPublicPage(id: string): Promise<Event | null> {
  const supabase = await createClient();
  if (supabase) {
    try {
      const dbEvent = await fetchPublishedEventById(supabase, id);
      if (dbEvent) return dbEvent;
    } catch {
      // DB未接続 or スキーマ未適用時はフォールバック
    }
  }
  return getEventById(id);
}
