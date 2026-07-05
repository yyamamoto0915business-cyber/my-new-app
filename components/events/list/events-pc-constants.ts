import {
  LayoutGrid,
  Music2,
  Utensils,
  Dumbbell,
  Sparkles,
  GraduationCap,
  Baby,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";

export const EVENTS_PC_HERO_IMAGE = "/events/pc-hero-landscape.jpg";

/** モバイル一覧ヒーロー（水彩イラスト） */
export const EVENTS_MOBILE_HERO_IMAGE = "/events/day-mgmt-mobile-hero.png";

/** PC 一覧の最大幅（横に広げて4列を確保） */
export const EVENTS_PC_MAX_WIDTH = "max-w-[1320px]";

/** コンパクトグリッド（列を増やしてカード幅を抑える） */
export const EVENTS_PC_GRID_CLASS =
  "grid grid-cols-2 gap-2 min-[920px]:grid-cols-3 min-[1080px]:grid-cols-4 min-[1280px]:grid-cols-5";

/** PC サイドバー・カテゴリ */
export const EVENTS_PC_SIDEBAR_CATEGORIES: {
  key: string;
  label: string;
  Icon: LucideIcon;
}[] = [
  { key: "", label: "すべてのカテゴリ", Icon: LayoutGrid },
  { key: "community", label: "祭り・イベント", Icon: PartyPopper },
  { key: "sports", label: "スポーツ・健康", Icon: Dumbbell },
  { key: "workshop", label: "体験・ワークショップ", Icon: Sparkles },
  { key: "study", label: "学び・講座", Icon: GraduationCap },
  { key: "music", label: "音楽・ライブ", Icon: Music2 },
  { key: "food", label: "食・グルメ", Icon: Utensils },
  { key: "family", label: "親子向け", Icon: Baby },
];

export const EVENTS_PC_DATE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "すべての期間" },
  { value: "today", label: "今日" },
  { value: "weekend", label: "今週末" },
  { value: "week", label: "来週以降" },
];

export const EVENTS_PC_PAGE_SIZES = [12, 24, 48] as const;

/** モバイル一覧の「もっと見る」1回あたりの件数 */
export const EVENTS_MOBILE_PAGE_STEP = 10;

/** モバイル一覧グリッド（2列・コンパクト） */
export const EVENTS_MOBILE_GRID_CLASS = "grid grid-cols-2 gap-2";
