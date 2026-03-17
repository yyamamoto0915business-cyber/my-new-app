import type { Event } from "./db/types";

const SAMPLE_TITLE_KEYWORDS = [
  "サンプル",
  "sample",
  "テンプレ",
  "template",
  "テスト",
  "test",
  "demo",
  "デモ",
  "ダミー",
  "dummy",
  "確認用",
  "検証",
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
export function isSampleLikeEventRow(row: Record<string, any> | Event | null | undefined): boolean {
  if (!row) return false;

  // 明示的なフラグがあれば最優先
  if (row.isSample === true) return true;
  if ((row as any).is_sample === true) return true;
  if ((row as any).seedData === true) return true;
  if ((row as any).seed_source === "seed") return true;

  const title =
    (row as any).title ??
    null;
  const description =
    (row as any).description ??
    null;

  // organizer 名は Event / DB 行 / join 結果のいずれにも対応
  const organizerName =
    (row as any).organizerName ??
    (row as any).organizer_name ??
    (row as any).organizers?.organization_name ??
    (row as any).organizers?.profiles?.display_name ??
    null;

  if (containsKeyword(title, SAMPLE_TITLE_KEYWORDS)) return true;
  if (containsKeyword(description, SAMPLE_DESCRIPTION_KEYWORDS)) return true;
  if (containsKeyword(organizerName, SAMPLE_ORGANIZER_KEYWORDS)) return true;

  return false;
}

/** 公開用: Event 配列からサンプル/テンプレ系を除外する */
export function filterOutSampleEvents<T extends { title?: string; description?: string }>(
  events: T[]
): T[] {
  return events.filter((e) => !isSampleLikeEventRow(e as any));
}

/** 公開クエリ共通のガード（status / isPublic / isSample） */
export function isPublicEventLike(row: Record<string, any> | Event): boolean {
  const status = (row as any).status;
  if (status && status !== "published") return false;

  // isPublic フラグがあれば尊重（なければ true 扱い）
  if ("isPublic" in (row as any)) {
    if ((row as any).isPublic === false) return false;
  }
  if ("is_public" in (row as any)) {
    if ((row as any).is_public === false) return false;
  }

  if (isSampleLikeEventRow(row as any)) return false;

  return true;
}

