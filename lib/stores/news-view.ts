import type { StoreNewsItem } from "@/lib/organizer/store-management-mock";
import {
  formatStoreDateJa,
  type StoreNewsRecord,
} from "@/lib/stores/types";

/** API ニュースを管理テーブル表示用に変換 */
export function storeNewsRecordToItem(record: StoreNewsRecord): StoreNewsItem {
  return {
    id: record.id,
    title: record.title,
    excerpt: record.excerpt ?? "",
    thumbnail:
      record.thumbnailUrl ||
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=80",
    category: record.category,
    periodStart: record.periodStart
      ? formatStoreDateJa(record.periodStart)
      : "—",
    periodEnd: record.periodEnd ? formatStoreDateJa(record.periodEnd) : null,
    status: record.status,
    updatedAt: formatStoreDateJa(record.updatedAt),
  };
}
