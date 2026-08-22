import type { DbCommunityPost } from "@/lib/db/community-posts-types";
import type {
  DbCommunityPostComment,
  PostCommentView,
} from "@/lib/db/community-post-comments-types";
import {
  POST_CATEGORY_TABS,
  type CommunityPost,
  type PostCategory,
} from "@/lib/posts/mock-feed";
import { parsePostBodyExtras } from "@/lib/posts/post-create-draft";
import {
  classifyRelatedHref,
  relatedLinkCtaLabel,
} from "@/lib/posts/related-link";

export function formatPostedAtLabel(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "いま";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

export function applyLikedByMe(
  posts: CommunityPost[],
  likedIds: Set<string>,
): CommunityPost[] {
  return posts.map((post) => ({
    ...post,
    likedByMe: likedIds.has(post.id),
  }));
}

export function getCategoryLabel(category: PostCategory): string {
  return (
    POST_CATEGORY_TABS.find((t) => t.key === category)?.label ?? category
  );
}

export function mapDbCommunityPostToView(row: DbCommunityPost): CommunityPost {
  const isVideo = row.media_type === "video";
  const extraGallery = (row.gallery_images ?? []).filter(Boolean);
  const allImages = isVideo
    ? []
    : [row.media_url, ...extraGallery.filter((u) => u !== row.media_url)];
  const extras = parsePostBodyExtras(row.body);
  const relatedHref =
    (row.related_url ?? "").trim() || extras.relatedUrl.trim() || undefined;
  const relatedKind = relatedHref ? classifyRelatedHref(relatedHref) : null;
  const relatedTitle = (row.related_title ?? "").trim() || undefined;
  const relatedImageUrl = (row.related_image_url ?? "").trim() || undefined;
  const relatedSiteName = (row.related_site_name ?? "").trim() || undefined;

  return {
    id: row.id,
    category: row.category,
    categoryLabel: getCategoryLabel(row.category),
    title: row.title,
    body: extras.body,
    mediaType: row.media_type,
    imageUrl: isVideo ? row.poster_url ?? row.media_url : row.media_url,
    videoUrl: isVideo ? row.media_url : null,
    galleryImages: allImages.length > 1 ? allImages : undefined,
    durationSec: row.duration_sec,
    authorId: row.author_id,
    authorName: row.author_display_name,
    authorAvatarUrl: row.author_avatar_url ?? null,
    areaLabel: row.area_label,
    postedAtLabel: formatPostedAtLabel(row.created_at),
    likeCount: row.like_count,
    likedByMe: false,
    commentCount: row.comment_count,
    relatedHref,
    relatedLabel: relatedKind ? relatedLinkCtaLabel(relatedKind) : undefined,
    relatedTitle,
    relatedImageUrl,
    relatedSiteName,
    tags: extras.tags,
  };
}

export function mapDbCommentToView(
  row: DbCommunityPostComment,
): PostCommentView {
  return {
    id: row.id,
    authorName: row.author_display_name,
    authorAvatarUrl: row.author_avatar_url ?? null,
    body: row.body,
    likeCount: row.like_count,
    postedAtLabel: formatPostedAtLabel(row.created_at),
    createdAt: row.created_at,
  };
}

export function buildPostTitleFromDraft(input: {
  title: string;
  body: string;
}): string {
  const title = input.title.trim();
  if (title) return title.slice(0, 100);
  const body = input.body.trim();
  if (body) return body.slice(0, 40) + (body.length > 40 ? "…" : "");
  return "街の一コマ（動画）";
}
