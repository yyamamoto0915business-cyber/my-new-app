import type { Event } from "./db/types";
import { isPublicEventStatus } from "./public-events";

const SAMPLE_TITLE_KEYWORDS = [
  "サンプル",
  "sample",
  "テンプレ",
  "template",
  "demo",
  "デモ",
  "ダミー",
  "dummy",
];

const SAMPLE_DESCRIPTION_KEYWORDS = [
  "これはテストです",
  "テストデータ",
  "ダミーデータ",
  "検証用",
  "確認用",
  "サンプルイベント",
  "sample event",
  "demo event",
];

const SAMPLE_ORGANIZER_KEYWORDS = [
  "開発用",
  "デモ用",
  "テスト用",
  "sample",
  "demo",
];

function containsKeyword(text: string | null | undefined, keywords: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) =>
    lower.includes(kw.toLowerCase())
  );
}

/** DB行 or Event 型に対して「サンプル/テンプレっぽいか」を判定するユーティリティ */
export function isSampleLikeEventRow(row: Record<string, unknown> | Event | null | undefined): boolean {
  if (!row) return false;
  const obj = row as Record<string, unknown>;
  const nestedOrganizers = obj.organizers as
    | { organization_name?: string | null; profiles?: { display_name?: string | null } | null }
    | null
    | undefined;

  // 明示的なフラグがあれば最優先
  if ((row as Event).isSample === true) return true;
  if (obj.is_sample === true) return true;
  if (obj.seedData === true) return true;
  if (obj.seed_source === "seed") return true;

  const title = typeof obj.title === "string" ? obj.title : null;
  const description = typeof obj.description === "string" ? obj.description : null;

  // organizer 名は Event / DB 行 / join 結果のいずれにも対応
  const organizerName =
    (typeof obj.organizerName === "string" ? obj.organizerName : null) ??
    (typeof obj.organizer_name === "string" ? obj.organizer_name : null) ??
    (typeof nestedOrganizers?.organization_name === "string"
      ? nestedOrganizers.organization_name
      : null) ??
    (typeof nestedOrganizers?.profiles?.display_name === "string"
      ? nestedOrganizers.profiles.display_name
      : null);

  if (containsKeyword(title, SAMPLE_TITLE_KEYWORDS)) return true;
  if (containsKeyword(description, SAMPLE_DESCRIPTION_KEYWORDS)) return true;
  if (containsKeyword(organizerName, SAMPLE_ORGANIZER_KEYWORDS)) return true;

  return false;
}

/** 公開用: Event 配列からサンプル/テンプレ系を除外する */
export function filterOutSampleEvents<T extends { title?: string; description?: string }>(
  events: T[]
): T[] {
  return events.filter((e) => !isSampleLikeEventRow(e as unknown as Record<string, unknown>));
}

/** 公開クエリ共通のガード（status / isPublic / isSample） */
export function isPublicEventLike(row: Record<string, unknown> | Event): boolean {
  const obj = row as Record<string, unknown>;
  const status = obj.status;
  if (status && !isPublicEventStatus(status)) return false;

  // isPublic フラグがあれば尊重（なければ true 扱い）
  if ("isPublic" in obj) {
    if (obj.isPublic === false) return false;
  }
  if ("is_public" in obj) {
    if (obj.is_public === false) return false;
  }

  if (isSampleLikeEventRow(obj)) return false;

  return true;
}

