import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { listAuthorAlbumPosts } from "@/lib/db/community-posts";
import {
  countAcceptedFollowers,
  countAcceptedFollowing,
  getFollowByPair,
} from "@/lib/db/user-follows";
import {
  formatPostedAtLabel,
  getCategoryLabel,
  mapDbCommunityPostToView,
} from "@/lib/posts/map-community-post";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { MY_POSTS_DEMO } from "@/lib/posts/my-posts-demo";
import { getFollowPreviewPerson, isFollowPreviewUserId, PREVIEW_FOLLOWERS, PREVIEW_FOLLOWING } from "@/lib/follows/preview-people";
import {
  normalizeProfileAvatarRole,
  resolveAvatarUrlByRole,
} from "@/lib/profile-avatar";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id: authorId } = await params;
  const preview = isFollowPreviewUserId(authorId)
    ? getFollowPreviewPerson(authorId)
    : null;
  if (preview) {
    const items = MY_POSTS_DEMO.filter((p) => p.status !== "draft").slice(0, 8);
    return NextResponse.json({
      profile: {
        id: authorId,
        displayName: preview.displayName,
        avatarUrl: preview.avatarUrl,
        bio: null,
      },
      isSelf: false,
      follow: { status: "accepted", id: null },
      counts: {
        posts: items.length,
        followers: PREVIEW_FOLLOWERS.length,
        following: PREVIEW_FOLLOWING.length,
      },
      items,
    });
  }
  const viewer = await getApiUser();
  const supabase = await createClient();

  let displayName = "ユーザー";
  let avatarUrl: string | null = null;
  let bio: string | null = null;

  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url, bio, participant_avatar_url, organizer_avatar_url, active_profile_role",
      )
      .eq("id", authorId)
      .maybeSingle();
    if (data) {
      displayName = (data.display_name as string | null)?.trim() || displayName;
      bio = (data.bio as string | null) ?? null;
      avatarUrl = resolveAvatarUrlByRole(
        {
          avatar_url: data.avatar_url as string | null,
          participant_avatar_url: data.participant_avatar_url as string | null,
          organizer_avatar_url: data.organizer_avatar_url as string | null,
        },
        normalizeProfileAvatarRole(data.active_profile_role),
      );
    }
  }

  const isSelf = viewer?.id === authorId;
  const followRow =
    viewer && !isSelf ? await getFollowByPair(viewer.id, authorId) : null;

  const [rows, followers, following] = await Promise.all([
    listAuthorAlbumPosts(authorId, viewer?.id ?? null, { limit: 80 }),
    countAcceptedFollowers(authorId),
    countAcceptedFollowing(authorId),
  ]);

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
      likeCount: view.likeCount,
      commentCount: view.commentCount,
      viewCount: 0,
      body: view.body,
    };
  });

  return NextResponse.json({
    profile: { id: authorId, displayName, avatarUrl, bio },
    isSelf,
    follow: {
      status: isSelf ? "self" : (followRow?.status ?? "none"),
      id: followRow?.id ?? null,
    },
    counts: {
      posts: items.filter((p) => p.status !== "draft").length,
      followers,
      following,
    },
    items,
  });
}
