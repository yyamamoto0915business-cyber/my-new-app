import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { listRecentPostsByAuthors } from "@/lib/db/community-posts";
import { listLikedPostIds } from "@/lib/db/community-post-likes";
import { filterModerated } from "@/lib/db/moderation";
import { listAcceptedFollowing } from "@/lib/db/user-follows";
import {
  applyLikedByMe,
  mapDbCommunityPostToView,
} from "@/lib/posts/map-community-post";
import type { FollowingStory } from "@/lib/posts/following-stories";

/** 何日前までの投稿を丸アイコンに出すか */
const STORY_WINDOW_DAYS = 7;
/** 一度に見るフォロー数の上限（多すぎるときは最近フォローした順） */
const MAX_FOLLOWING = 100;

const NO_STORE = { "Cache-Control": "private, no-store" };

/** フォロー中の人の最近の投稿を、人ごとにまとめて返す */
export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ stories: [] }, { headers: NO_STORE });

  try {
    const follows = await listAcceptedFollowing(user.id);
    const authorIds = follows.slice(0, MAX_FOLLOWING).map((f) => f.followee_id);
    if (authorIds.length === 0) {
      return NextResponse.json({ stories: [] }, { headers: NO_STORE });
    }

    const since = new Date(Date.now() - STORY_WINDOW_DAYS * 86_400_000).toISOString();
    const rows = await filterModerated(
      await listRecentPostsByAuthors(authorIds, user.id, { sinceIso: since }),
      user.id,
      "post",
    );
    const views = rows.map(mapDbCommunityPostToView);
    const likedIds = await listLikedPostIds(
      user.id,
      views.map((p) => p.id),
    );
    const posts = applyLikedByMe(views, likedIds);

    const byAuthor = new Map<string, FollowingStory>();
    rows.forEach((row, i) => {
      const authorId = row.author_id;
      if (!authorId) return;
      const post = posts[i];
      const story = byAuthor.get(authorId);
      if (story) {
        story.posts.push(post);
        return;
      }
      byAuthor.set(authorId, {
        authorId,
        authorName: post.authorName,
        authorAvatarUrl: post.authorAvatarUrl,
        latestPostId: row.id,
        latestAt: row.created_at,
        posts: [post],
      });
    });

    const stories = [...byAuthor.values()].sort(
      (a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime(),
    );
    return NextResponse.json({ stories }, { headers: NO_STORE });
  } catch (e) {
    console.error("posts/following GET:", e);
    return NextResponse.json({ stories: [] }, { status: 503, headers: NO_STORE });
  }
}
