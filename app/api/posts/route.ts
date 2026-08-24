import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import {
  createCommunityPost,
  listPublicCommunityPosts,
} from "@/lib/db/community-posts";
import { listLikedPostIds } from "@/lib/db/community-post-likes";
import {
  applyLikedByMe,
  buildPostTitleFromDraft,
  mapDbCommunityPostToView,
} from "@/lib/posts/map-community-post";
import { POST_PHOTO_MAX_COUNT } from "@/lib/posts/post-photos";
import {
  POST_VIDEO_MAX_DURATION_SEC,
  isVideoDurationValid,
} from "@/lib/posts/post-video";
import type { PostCategory } from "@/lib/posts/mock-feed";

const CATEGORIES = new Set<PostCategory>([
  "event",
  "shop",
  "spot",
  "kitchen",
  "scenery",
]);

function normalizeGalleryUrls(value: unknown, coverUrl: string): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>([coverUrl]);
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= POST_PHOTO_MAX_COUNT - 1) break;
  }
  return out;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Math.min(100, Math.max(1, Number(limitRaw))) : 50;

  try {
    const [rows, user] = await Promise.all([
      listPublicCommunityPosts({
        category:
          category &&
          category !== "all" &&
          CATEGORIES.has(category as PostCategory)
            ? (category as PostCategory)
            : "all",
        limit: Number.isFinite(limit) ? limit : 50,
      }),
      getApiUser(),
    ]);

    const views = rows.map(mapDbCommunityPostToView);
    if (!user) {
      return NextResponse.json(views, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    const likedIds = await listLikedPostIds(
      user.id,
      views.map((p) => p.id),
    );
    return NextResponse.json(applyLikedByMe(views, likedIds), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    console.error("posts GET:", e);
    return NextResponse.json([], {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON が不正です" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const mediaType = String(data.mediaType ?? "video");
  const category = String(data.category ?? "scenery");
  const titleRaw = String(data.title ?? "");
  const bodyText = String(data.body ?? "").slice(0, 1000);
  const areaLabel = String(data.area ?? "").slice(0, 120);
  const mediaUrl = String(data.mediaUrl ?? "").trim();
  const statusRaw = String(data.status ?? "public");
  const status =
    statusRaw === "draft"
      ? "draft"
      : statusRaw === "hidden"
        ? "hidden"
        : "public";
  const isDraft = status === "draft";

  if (!CATEGORIES.has(category as PostCategory)) {
    return NextResponse.json({ error: "カテゴリが不正です" }, { status: 400 });
  }
  if (!mediaUrl) {
    return NextResponse.json({ error: "メディアURLが必要です" }, { status: 400 });
  }

  if (mediaType === "image") {
    const title = titleRaw.trim();
    if (!title && !isDraft) {
      return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
    }
    const galleryImages = normalizeGalleryUrls(data.galleryImages, mediaUrl);

    try {
      const row = await createCommunityPost({
        authorId: user.id,
        authorDisplayName: user.name ?? "ユーザー",
        category: category as PostCategory,
        title: (title || "無題の下書き").slice(0, 100),
        body: bodyText,
        areaLabel,
        mediaUrl,
        galleryImages,
        mediaType: "image",
        status,
        relatedUrl: String(data.relatedUrl ?? "").trim(),
      });

      return NextResponse.json(mapDbCommunityPostToView(row), { status: 201 });
    } catch (e) {
      console.error("posts POST image:", e);
      return NextResponse.json(
        { error: "投稿の保存に失敗しました" },
        { status: 500 },
      );
    }
  }

  const durationSec = Number(data.durationSec);
  if (!isVideoDurationValid(durationSec)) {
    return NextResponse.json(
      { error: `動画は${POST_VIDEO_MAX_DURATION_SEC}秒以内にしてください` },
      { status: 400 },
    );
  }

  const title = buildPostTitleFromDraft({ title: titleRaw, body: bodyText });

  try {
    const row = await createCommunityPost({
      authorId: user.id,
      authorDisplayName: user.name ?? "ユーザー",
      category: category as PostCategory,
      title,
      body: bodyText,
      areaLabel,
      mediaUrl,
      durationSec,
      mediaType: "video",
      status,
      relatedUrl: String(data.relatedUrl ?? "").trim(),
    });

    return NextResponse.json(mapDbCommunityPostToView(row), { status: 201 });
  } catch (e) {
    console.error("posts POST video:", e);
    return NextResponse.json(
      { error: "投稿の保存に失敗しました" },
      { status: 500 },
    );
  }
}
