import type { MyPostItem } from "@/app/api/me/posts/route";
import type { DbCommunityPost } from "@/lib/db/community-posts-types";
import {
  formatPostedAtLabel,
  getCategoryLabel,
  mapDbCommunityPostToView,
} from "@/lib/posts/map-community-post";
import { ymdFromDb } from "@/lib/posts/visited-range";

export function toMyPostItem(row: DbCommunityPost): MyPostItem {
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
    viewCount: 0,
    body: view.body,
    areaLabel: view.areaLabel,
    tags: view.tags,
  };
}
