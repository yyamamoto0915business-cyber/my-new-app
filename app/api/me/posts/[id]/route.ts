import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import {
  deleteCommunityPost,
  getMyCommunityPostById,
  updateCommunityPost,
  type UpdateCommunityPostPatch,
} from "@/lib/db/community-posts";
import { getCategoryLabel } from "@/lib/posts/map-community-post";
import type { PostCategory } from "@/lib/posts/mock-feed";
import type { MyPostItem } from "@/app/api/me/posts/route";
import type { DbCommunityPost } from "@/lib/db/community-posts-types";

type Params = { params: Promise<{ id: string }> };

const CATEGORIES = new Set<PostCategory>([
  "event",
  "shop",
  "spot",
  "kitchen",
  "scenery",
]);

const STATUSES = new Set<DbCommunityPost["status"]>([
  "draft",
  "public",
  "hidden",
]);

/** 編集・下書き再開向けの1件情報 */
type MyPostDetail = MyPostItem & {
  body: string;
  areaLabel: string;
  /** 再開用のメディア原本 */
  mediaUrl: string;
  galleryImages: string[];
  posterUrl: string | null;
  durationSec: number | null;
};

function toDetail(row: DbCommunityPost): MyPostDetail {
  const isVideo = row.media_type === "video";
  return {
    id: row.id,
    title: row.title,
    imageUrl: isVideo ? row.poster_url ?? row.media_url : row.media_url,
    mediaType: row.media_type,
    category: row.category,
    categoryLabel: getCategoryLabel(row.category),
    status: row.status,
    dateLabel: row.created_at,
    createdAt: row.created_at,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    viewCount: 0,
    body: row.body,
    areaLabel: row.area_label,
    mediaUrl: row.media_url,
    galleryImages: row.gallery_images ?? [],
    posterUrl: row.poster_url,
    durationSec: row.duration_sec,
  };
}

/** GET: 本人の投稿1件（下書き・非公開含む）を返す */
export async function GET(_request: Request, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id } = await params;
  const row = await getMyCommunityPostById(id, user.id);
  if (!row) {
    return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(toDetail(row), {
    headers: { "Cache-Control": "private, no-store" },
  });
}

/** PATCH: 公開状態や本文などを更新する */
export async function PATCH(request: Request, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON が不正です" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const patch: UpdateCommunityPostPatch = {};

  let nextStatus: DbCommunityPost["status"] | undefined;
  if (data.status !== undefined) {
    const status = String(data.status);
    if (!STATUSES.has(status as DbCommunityPost["status"])) {
      return NextResponse.json({ error: "状態が不正です" }, { status: 400 });
    }
    nextStatus = status as DbCommunityPost["status"];
    patch.status = nextStatus;
  }

  if (data.category !== undefined) {
    const category = String(data.category);
    if (!CATEGORIES.has(category as PostCategory)) {
      return NextResponse.json({ error: "カテゴリが不正です" }, { status: 400 });
    }
    patch.category = category as PostCategory;
  }

  if (data.title !== undefined) {
    const title = String(data.title).trim().slice(0, 100);
    // 公開する場合のみタイトルを必須にする（下書きは空を許容）
    if (!title && nextStatus === "public") {
      return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
    }
    patch.title = title || "無題の下書き";
  }

  if (data.body !== undefined) {
    patch.body = String(data.body).slice(0, 1000);
  }

  if (data.area !== undefined || data.areaLabel !== undefined) {
    patch.area_label = String(data.area ?? data.areaLabel ?? "").slice(0, 120);
  }

  // メディア差し替え（下書き再開で写真・動画を更新した場合）
  if (data.mediaType !== undefined) {
    const mediaType = String(data.mediaType);
    if (mediaType === "image" || mediaType === "video") {
      patch.media_type = mediaType;
    }
  }
  if (data.mediaUrl !== undefined) {
    const mediaUrl = String(data.mediaUrl).trim();
    if (mediaUrl) patch.media_url = mediaUrl;
  }
  if (data.galleryImages !== undefined && Array.isArray(data.galleryImages)) {
    patch.gallery_images = data.galleryImages
      .filter((u): u is string => typeof u === "string")
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  if (data.durationSec !== undefined) {
    const durationSec = Number(data.durationSec);
    patch.duration_sec = Number.isFinite(durationSec) ? durationSec : null;
  }
  if (data.posterUrl !== undefined) {
    const posterUrl = String(data.posterUrl).trim();
    patch.poster_url = posterUrl || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "更新する項目がありません" },
      { status: 400 },
    );
  }

  const row = await updateCommunityPost(id, user.id, patch);
  if (!row) {
    return NextResponse.json(
      { error: "投稿が見つからないか、更新できませんでした" },
      { status: 404 },
    );
  }
  return NextResponse.json(toDetail(row));
}

/** DELETE: 本人の投稿を削除する */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteCommunityPost(id, user.id);
  if (!ok) {
    return NextResponse.json(
      { error: "投稿が見つからないか、削除できませんでした" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
