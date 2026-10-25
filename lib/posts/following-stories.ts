import type { CommunityPost } from "@/lib/posts/mock-feed";

/** フォロー中の 1 人分の最近の投稿（「みんなの投稿」上部の丸アイコン） */
export type FollowingStory = {
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  latestPostId: string;
  latestAt: string;
  /** 新しい順 */
  posts: CommunityPost[];
};

const SEEN_KEY = "mg-following-stories-seen";

/** 見た人ごとに「見たときの最新投稿 ID」を覚える（新しい投稿が来たらまた色付きに） */
export function readSeenStories(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function markStorySeen(story: FollowingStory): Record<string, string> {
  const next = { ...readSeenStories(), [story.authorId]: story.latestPostId };
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    // 保存できなくても表示は続ける
  }
  return next;
}
