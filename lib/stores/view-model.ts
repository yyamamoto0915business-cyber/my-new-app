import type { OrganizerStore, StoreFeature } from "@/lib/organizer/store-management-mock";
import {
  DEMO_ORGANIZER_STORE,
  DEMO_STORE_ID,
} from "@/lib/organizer/store-management-mock";
import { storeNewsRecordToItem } from "@/lib/stores/news-view";
import {
  featureDefsForKind,
  formatStoreDateJa,
  type StoreFeatureKey,
  type StoreNewsRecord,
  type StoreRecord,
} from "@/lib/stores/types";

function featureFromKey(
  key: StoreFeatureKey,
  kind: StoreRecord["kind"],
): StoreFeature {
  const def = featureDefsForKind(kind).find((d) => d.key === key);
  return {
    id: key,
    label: def?.label ?? key,
    icon: key,
  };
}

/** API の StoreRecord + ニュースを管理 UI 用ビューに変換 */
export function storeRecordToOrganizerView(
  record: StoreRecord,
  newsRecords: StoreNewsRecord[] = [],
  linkedEvents: Array<{ id: string; title: string; dateLabel: string }> = [],
): OrganizerStore {
  const isDemo =
    record.id === DEMO_STORE_ID ||
    record.id === "demo" ||
    record.name === DEMO_ORGANIZER_STORE.name;

  const gallery = record.galleryImages.map((src, i) => ({
    id: `g-${i}`,
    src,
    alt: `${record.name}の写真${i + 1}`,
  }));

  const mappedLinked = linkedEvents.map((e) => ({
    id: e.id,
    title: e.title,
    dateLabel: e.dateLabel,
  }));

  return {
    id: record.id,
    name: record.name,
    category: record.category ?? "",
    tagline: record.tagline ?? "",
    description: record.description ?? "",
    coverImage: record.coverImageUrl ?? "",
    hoursLabel: record.hoursLabel ?? "",
    publishStatus: record.status,
    publishedAt: formatStoreDateJa(record.publishedAt),
    updatedAt: formatStoreDateJa(record.updatedAt),
    features: record.features.map((k) => featureFromKey(k, record.kind)),
    gallery,
    galleryExtraCount: isDemo ? DEMO_ORGANIZER_STORE.galleryExtraCount : 0,
    news: newsRecords.map(storeNewsRecordToItem),
    linkedEvents:
      mappedLinked.length > 0
        ? mappedLinked
        : isDemo
          ? DEMO_ORGANIZER_STORE.linkedEvents
          : [],
  };
}
