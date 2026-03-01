/**
 * 読みもの記事（note風）の型定義
 * blocks JSON で固定ブロック型テンプレを表現
 */

// ブロック型（blocks 配列の要素）
export type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | {
      type: "timeline";
      items: Array<{ time: string; text: string }>;
    }
  | {
      type: "qa";
      items: Array<{ q: string; a: string }>;
    }
  | { type: "eventEmbed"; eventIds: string[] };

export type ArticleTemplateType =
  | "feature"      // 特集
  | "interview"    // 主催者インタビュー
  | "report"       // 参加レポ
  | "guide";       // 街ガイド

export type ArticleStatus = "draft" | "published";

export type ReadArticle = {
  id: string;
  slug: string;
  title: string;
  lead: string;           // 140字リード
  coverImageUrl: string;
  tags: string[];
  status: ArticleStatus;
  templateType: ArticleTemplateType;
  authorId: string;
  authorName: string;
  blocks: ArticleBlock[];
  createdAt: string;
  updatedAt: string;
};

export type ReadArticleFormData = Omit<
  ReadArticle,
  "id" | "slug" | "createdAt" | "updatedAt"
> & {
  slug?: string;
};

/** heading ブロックから目次用の項目を抽出 */
export function getTocFromBlocks(blocks: ArticleBlock[]): { id: string; text: string }[] {
  const toc: { id: string; text: string }[] = [];
  let index = 0;
  for (const b of blocks) {
    if (b.type === "heading" && b.text.trim()) {
      index += 1;
      const id = `heading-${index}`;
      toc.push({ id, text: b.text });
    }
  }
  return toc;
}

/** slug をタイトルから生成（簡易） */
export function slugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "untitled";
}

/** テンプレート種別のラベル */
export const ARTICLE_TEMPLATE_LABELS: Record<ArticleTemplateType, string> = {
  feature: "特集（テーマでイベントを束ねる）",
  interview: "主催者インタビュー（想い・背景）",
  report: "参加レポ（当日の空気感）",
  guide: "街ガイド（イベント前後の寄り道）",
};

/** テンプレートごとのデフォルト見出し（セクション） */
export const TEMPLATE_HEADINGS: Record<ArticleTemplateType, string[]> = {
  feature: ["この特集について", "注目のポイント", "参加の流れ", "まとめ"],
  interview: ["主催者について", "イベントに込めた想い", "参加者へのメッセージ", "今後の展望"],
  report: ["参加のきっかけ", "当日の様子", "印象に残ったこと", "これから参加する方へ"],
  guide: ["エリアの魅力", "おすすめスポット", "アクセス・タイミング", "まとめ"],
};
