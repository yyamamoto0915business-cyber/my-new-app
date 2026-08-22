import {
  POST_CATEGORY_TABS,
  type PostCategory,
} from "@/lib/posts/mock-feed";

export type PostCreateMediaKind = "image" | "video" | null;

export type PostCreateDraft = {
  title: string;
  body: string;
  category: PostCategory;
  /** 場所・スポット名 */
  spotName: string;
  /** 住所またはエリア */
  area: string;
  tags: string[];
  relatedUrl: string;
  locationEnabled: boolean;
  /** 公開＝みんなの投稿、非公開＝アルバム＋承認フォロワー */
  visibility: "public" | "hidden";
  /** 写真プレビュー（object URL） */
  imagePreviewUrls: string[];
  /** object URL（プレビュー用） */
  videoPreviewUrl: string | null;
  videoDurationSec: number | null;
};

export const POST_CREATE_TITLE_MAX = 100;
export const POST_CREATE_BODY_MAX = 1000;
export const POST_CREATE_TAG_MAX = 8;
export const POST_CREATE_TAG_LENGTH_MAX = 20;

export const POST_CREATE_ATMOSPHERE_CHIPS = [
  "カフェ巡り",
  "公園",
  "グルメ",
  "マルシェ",
  "風景",
  "夜景",
] as const;

export const DEFAULT_POST_CREATE_DRAFT: PostCreateDraft = {
  title: "",
  body: "",
  category: "scenery",
  spotName: "",
  area: "",
  tags: [],
  relatedUrl: "",
  locationEnabled: true,
  visibility: "public",
  imagePreviewUrls: [],
  videoPreviewUrl: null,
  videoDurationSec: null,
};

/** サイドバープレビュー用のサンプル画像（メディア未追加時） */
export const POST_CREATE_PREVIEW_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80";

export function getPostCategoryLabel(category: PostCategory): string {
  return (
    POST_CATEGORY_TABS.find((tab) => tab.key === category)?.label ?? category
  );
}

export function getPostCreateMediaKind(
  draft: PostCreateDraft,
): PostCreateMediaKind {
  if (draft.videoPreviewUrl) return "video";
  if (draft.imagePreviewUrls.length > 0) return "image";
  return null;
}

/** プレビュー・API 用のエリア表示 */
export function getPostCreateAreaLabel(draft: PostCreateDraft): string {
  if (!draft.locationEnabled) return "";
  const spot = draft.spotName.trim();
  const area = draft.area.trim();
  if (spot && area) return `${spot} · ${area}`;
  return spot || area;
}

/** プレビュー表示用タイトル */
export function getPostCreatePreviewTitle(draft: PostCreateDraft): string {
  const title = draft.title.trim();
  if (title) return title;
  if (getPostCreateMediaKind(draft) === "video") {
    const body = draft.body.trim();
    if (body) return body.slice(0, 40) + (body.length > 40 ? "…" : "");
    return "街の一コマ（動画）";
  }
  return "タイトルを入力してください";
}

export function canSubmitPostCreateDraft(draft: PostCreateDraft): boolean {
  const kind = getPostCreateMediaKind(draft);
  if (kind === "image") {
    return (
      draft.imagePreviewUrls.length > 0 && draft.title.trim().length > 0
    );
  }
  if (kind === "video") {
    return (
      draft.videoPreviewUrl != null &&
      draft.videoDurationSec != null &&
      draft.videoDurationSec > 0 &&
      draft.title.trim().length > 0
    );
  }
  return false;
}

/** 下書き再開時にサーバから受け取るメディア情報 */
export type PostCreateResumeSource = {
  title: string;
  body: string;
  category: PostCategory;
  areaLabel: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  galleryImages: string[];
  durationSec: number | null;
  status?: "draft" | "public" | "hidden";
  relatedUrl?: string;
};

const TAG_LINE_RE = /^#\S+(?:\s+#\S+)*$/;
const URL_LINE_RE = /^https?:\/\/\S+$/;

/**
 * appendDraftExtras で本文末尾に付与したタグ行・関連リンク行を本文から分離する。
 * 末尾ブロックのみを対象にすることで、通常の本文を誤って剥がさないようにする。
 */
export function parsePostBodyExtras(rawBody: string): {
  body: string;
  tags: string[];
  relatedUrl: string;
} {
  const segments = rawBody.split("\n\n");
  let relatedUrl = "";
  let tags: string[] = [];

  // 末尾がURL行なら関連リンクとして取り出す
  if (segments.length >= 1) {
    const last = segments[segments.length - 1].trim();
    if (URL_LINE_RE.test(last)) {
      relatedUrl = last;
      segments.pop();
    }
  }

  // その手前がタグ行ならタグとして取り出す
  if (segments.length >= 1) {
    const last = segments[segments.length - 1].trim();
    if (TAG_LINE_RE.test(last)) {
      tags = last
        .split(/\s+/)
        .map((t) => t.replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, POST_CREATE_TAG_MAX);
      segments.pop();
    }
  }

  return { body: segments.join("\n\n"), tags, relatedUrl };
}

/**
 * 保存済みの下書きを作成フォームの下書き状態に変換する。
 * メディアはサーバ URL をそのままプレビューに載せる（再アップロード不要）。
 */
export function buildPostCreateDraftFromSource(
  source: PostCreateResumeSource,
): PostCreateDraft {
  const isVideo = source.mediaType === "video";
  const imageUrls = isVideo
    ? []
    : [source.mediaUrl, ...source.galleryImages].filter(Boolean);
  // 本文末尾に連結されたタグ・関連リンクを分離して復元する
  // （再保存でタグ行が積み増しされるのを防ぐ）
  const { body, tags, relatedUrl } = parsePostBodyExtras(source.body);
  return {
    ...DEFAULT_POST_CREATE_DRAFT,
    title: source.title === "無題の下書き" ? "" : source.title,
    body,
    tags,
    relatedUrl: source.relatedUrl?.trim() || relatedUrl,
    category: source.category,
    // area_label は「スポット · エリア」を結合済みのため、そのまま area に載せる
    area: source.areaLabel,
    locationEnabled: source.areaLabel.trim().length > 0,
    visibility: source.status === "hidden" ? "hidden" : "public",
    imagePreviewUrls: imageUrls,
    videoPreviewUrl: isVideo ? source.mediaUrl : null,
    videoDurationSec: isVideo ? source.durationSec : null,
  };
}

export function togglePostCreateTag(
  tags: string[],
  tag: string,
): string[] {
  const normalized = tag.trim().replace(/^#/, "");
  if (!normalized) return tags;
  if (tags.includes(normalized)) {
    return tags.filter((t) => t !== normalized);
  }
  if (tags.length >= POST_CREATE_TAG_MAX) return tags;
  return [...tags, normalized.slice(0, POST_CREATE_TAG_LENGTH_MAX)];
}
