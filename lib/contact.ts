export const CONTACT_CATEGORIES = [
  { value: "account", label: "アカウント・ログイン" },
  { value: "event", label: "イベント" },
  { value: "organizer", label: "主催者機能" },
  { value: "payment", label: "決済・参加パス" },
  { value: "bug", label: "不具合・バグ報告" },
  { value: "other", label: "その他" },
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]["value"];

export const CONTACT_CATEGORY_VALUES = CONTACT_CATEGORIES.map(
  (c) => c.value
) as [ContactCategory, ...ContactCategory[]];

export function contactCategoryLabel(value: string): string {
  return CONTACT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const CONTACT_STATUSES = [
  { value: "open", label: "未対応" },
  { value: "in_progress", label: "対応中" },
  { value: "closed", label: "完了" },
] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number]["value"];

export const CONTACT_STATUS_VALUES = CONTACT_STATUSES.map(
  (s) => s.value
) as [ContactStatus, ...ContactStatus[]];

export function contactStatusLabel(value: string): string {
  return CONTACT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export const CONTACT_BODY_MAX = 1000;
export const CONTACT_SUBJECT_MAX = 200;
