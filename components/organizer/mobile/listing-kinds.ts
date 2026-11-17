import { CalendarDays, Gamepad2, Heart, Store, Truck, type LucideIcon } from "lucide-react";

/** 掲載の種類。掲載管理・新しく掲載で同じ名前・色・アイコンを使う（2026-11-18 にゲームも足した） */
export type ListingKind = "event" | "store" | "kitchen" | "volunteer" | "game";

export const LISTING_KINDS: ListingKind[] = ["event", "store", "kitchen", "volunteer", "game"];

export const LISTING_KIND_META: Record<
  ListingKind,
  { label: string; /** 種類の切り替えに出す短い名前（せまい画面では \u200b の所で折り返す） */ short: string; Icon: LucideIcon; color: string; bg: string }
> = {
  event: { label: "イベント", short: "イベント", Icon: CalendarDays, color: "#c7742c", bg: "#fdf1e4" },
  store: { label: "お店", short: "お店", Icon: Store, color: "#2f7d4e", bg: "#e6f3ea" },
  kitchen: { label: "キッチンカー", short: "キッチン\u200bカー", Icon: Truck, color: "#2f6fae", bg: "#e6f1fa" },
  volunteer: { label: "ボランティア募集", short: "ボラン\u200bティア", Icon: Heart, color: "#c0507a", bg: "#fbe9f0" },
  game: { label: "ゲーム", short: "ゲーム", Icon: Gamepad2, color: "#6b5bb5", bg: "#efecfa" },
};
