import type { DbCommunityPost } from "@/lib/db/community-posts-types";

export type PostAccess =
  | { kind: "ok"; post: DbCommunityPost }
  | { kind: "private"; authorId: string | null }
  | { kind: "missing" };

export function canViewerSeePost(
  post: DbCommunityPost,
  viewerId: string | null,
  isAcceptedFollower: boolean,
): boolean {
  if (post.status === "draft") {
    return Boolean(viewerId && post.author_id === viewerId);
  }
  if (post.status === "public") return true;
  if (post.status === "hidden") {
    if (viewerId && post.author_id === viewerId) return true;
    return isAcceptedFollower;
  }
  return false;
}

export function filterAlbumPostsForViewer(
  posts: DbCommunityPost[],
  viewerId: string | null,
  isAcceptedFollower: boolean,
): DbCommunityPost[] {
  const isOwner = Boolean(viewerId && posts[0]?.author_id === viewerId);
  return posts.filter((post) => {
    if (post.status === "draft") return isOwner && post.author_id === viewerId;
    return canViewerSeePost(post, viewerId, isAcceptedFollower);
  });
}
