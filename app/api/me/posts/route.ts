import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { listMyCommunityPosts } from "@/lib/db/community-posts";
import {
  formatPostedAtLabel,
  getCategoryLabel,
  mapDbCommunityPostToView,
} from "@/lib/posts/map-community-post";
import type { PostCategory } from "@/lib/posts/mock-feed";
import { ymdFromDb } from "@/lib/posts/visited-range";

export type MyPostItem = {
  id: string;
  title: string;
  imageUrl: string;
  mediaType: "image" | "video";
  category: PostCategory;
  categoryLabel: string;
  status: "draft" | "public" | "hidden";
  dateLabel: string;
  createdAt: string;
  /** 行った日（YYYY-MM-DD）。アルバムの振り分けに使う */
  visitedFrom?: string | null;
  visitedTo?: string | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  body?: string;
  areaLabel?: string;
  tags?: string[];
};

/** GET: ログインユーザー自身の投稿一覧（公開＋下書き）を返す */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const rows = await listMyCommunityPosts(user.id, { limit: 60 });

  const items: MyPostItem[] = rows.map((row) => {
    const view = mapDbCommunityPostToView(row);
    return {
      id: row.id,
      title: view.title,
      imageUrl: view.imageUrl,
      mediaType: row.media_type,
      category: row.category,
      categoryLabel: getCategoryLabel(row.category),
      status: row.status,
      dateLabel: formatPostedAtLabel(row.created_at),
      createdAt: row.created_at,
      visitedFrom: ymdFromDb(row.visited_from),
      visitedTo: ymdFromDb(row.visited_to),
      likeCount: view.likeCount,
      commentCount: view.commentCount,
      body: view.body,
      areaLabel: view.areaLabel,
      tags: view.tags,
      // TODO: view_count 列を追加したら row の値を返す
      viewCount: 0,
    };
  });

  return NextResponse.json({ items });
}
