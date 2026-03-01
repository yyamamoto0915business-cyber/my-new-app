/**
 * ストーリー（note風記事）の型定義
 * 立場×目的でテンプレを切り替え。blocks JSON で固定ブロック型。
 */

export type StoryBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | {
      type: "timeline";
      items: Array<{ time: string; text: string }>;
    }
  | { type: "qa"; items: Array<{ q: string; a: string }> }
  | {
      type: "rating";
      atmosphere?: number;
      physical?: number;
      recommend?: number;
    }
  | { type: "imageGallery"; imageUrls: string[] }
  | { type: "eventEmbed"; eventIds: string[] };

export type StoryRole = "organizer" | "volunteer" | "staff" | "participant";
export type StoryPurpose = "promotion" | "report" | "debrief";

export type StoryStatus = "draft" | "pending" | "published";

export type Story = {
  id: string;
  slug: string;
  title: string;
  lead: string;
  coverImageUrl: string;
  tags: string[];
  role: StoryRole;
  purpose: StoryPurpose;
  status: StoryStatus;
  authorId: string;
  authorName: string;
  eventId: string | null;
  blocks: StoryBlock[];
  createdAt: string;
  updatedAt: string;
};

export const STORY_ROLE_LABELS: Record<StoryRole, string> = {
  organizer: "主催者",
  volunteer: "ボランティア",
  staff: "スタッフ（運営）",
  participant: "参加者",
};

export const STORY_PURPOSE_LABELS: Record<StoryPurpose, string> = {
  promotion: "宣伝（事前）",
  report: "参加レポ（事後）",
  debrief: "運営振り返り（事後）",
};

/** テンプレート：立場×目的ごとの見出し */
export const STORY_TEMPLATE_HEADINGS: Record<
  StoryRole,
  Partial<Record<StoryPurpose, string[]>>
> = {
  organizer: {
    promotion: [
      "どんなイベント？",
      "見どころ",
      "当日の流れ",
      "初めての人へ（Q&A）",
      "主催者の想い",
      "関連イベント",
    ],
  },
  volunteer: {
    report: [
      "やったこと",
      "良かったところ",
      "大変だったこと（任意）",
      "学び",
      "これから参加する人へ",
      "簡易評価（任意）",
      "写真（任意）",
    ],
  },
  staff: {
    debrief: [
      "担当・役割",
      "当日の運営フロー",
      "うまくいったこと",
      "ヒヤリ・トラブル（任意）",
      "改善案",
      "感謝・伝えたいこと",
    ],
  },
  participant: {
    report: [
      "参加のきっかけ",
      "当日の様子",
      "印象に残ったこと",
      "これから参加する人へ",
      "簡易評価（任意）",
      "写真（任意）",
    ],
  },
};

export function getTocFromStoryBlocks(blocks: StoryBlock[]): { id: string; text: string }[] {
  const toc: { id: string; text: string }[] = [];
  let index = 0;
  for (const b of blocks) {
    if (b.type === "heading" && b.text.trim()) {
      index += 1;
      toc.push({ id: `heading-${index}`, text: b.text });
    }
  }
  return toc;
}

export function slugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "untitled";
}
