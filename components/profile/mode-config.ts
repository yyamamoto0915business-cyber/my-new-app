import type { ProfileMode } from "./mode-switcher";

export const MODE_CONFIG: Record<
  ProfileMode,
  {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
    stat1: { label: string; key: string };
    stat2: { label: string; key: string };
    stat3: { label: string; key: string };
    list1: { title: string; key: string };
    list2: { title: string; key: string };
    empty1: { title: string; ctaLabel: string; ctaHref: string };
    empty2: { title: string; ctaLabel: string; ctaHref: string };
  }
> = {
  participant: {
    title: "参加する",
    description: "参加予定・気になるイベント・主催者との連絡",
    ctaLabel: "イベントを探す",
    ctaHref: "/events",
    stat1: { label: "参加予定", key: "upcoming" },
    stat2: { label: "あとで見る", key: "interested" },
    stat3: { label: "未読", key: "unread" },
    list1: { title: "参加予定のイベント", key: "upcoming" },
    list2: { title: "あとで見るイベント", key: "interested" },
    empty1: {
      title: "まだ参加予定はありません。イベント詳細で「参加予定にする」を押すとここに表示されます",
      ctaLabel: "イベントを探す",
      ctaHref: "/events",
    },
    empty2: {
      title: "まだあとで見るはありません。気になるイベントで「あとで見る」を押すとここに表示されます",
      ctaLabel: "イベントを探す",
      ctaHref: "/events",
    },
  },
  volunteer: {
    title: "手伝う",
    description: "応募・シフト・当日連絡・活動履歴",
    ctaLabel: "募集を探す",
    ctaHref: "/volunteer",
    stat1: { label: "確定予定", key: "confirmed" },
    stat2: { label: "応募中", key: "pending" },
    stat3: { label: "未読", key: "unread" },
    list1: { title: "次のボランティア予定", key: "confirmed" },
    list2: { title: "応募中", key: "pending" },
    empty1: {
      title: "まだ応募はありません。まずは1件、できそうな募集を見てみましょう",
      ctaLabel: "募集を探す",
      ctaHref: "/volunteer",
    },
    empty2: {
      title: "まだ応募はありません。まずは1件、できそうな募集を見てみましょう",
      ctaLabel: "募集を探す",
      ctaHref: "/volunteer",
    },
  },
  organizer: {
    title: "主催する",
    description: "イベント管理・応募者対応・メッセージ",
    ctaLabel: "イベントを作成",
    ctaHref: "/organizer/events/new",
    stat1: { label: "主催中", key: "hosting" },
    stat2: { label: "要対応", key: "needsAction" },
    stat3: { label: "未読", key: "unread" },
    list1: { title: "主催中のイベント", key: "hosting" },
    list2: { title: "要対応（応募・質問）", key: "needsAction" },
    empty1: {
      title: "まだ主催イベントがありません。小さく1件から始めましょう",
      ctaLabel: "イベントを作成",
      ctaHref: "/organizer/events/new",
    },
    empty2: {
      title: "まだ主催イベントがありません。小さく1件から始めましょう",
      ctaLabel: "イベントを作成",
      ctaHref: "/organizer/events/new",
    },
  },
};
