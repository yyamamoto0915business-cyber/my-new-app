import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isProfilePrivate } from "@/lib/db/account-privacy";
import { listAuthorAlbumPosts } from "@/lib/db/community-posts";
import { isBlockedBetween, isBlockedByMe } from "@/lib/db/moderation";
import {
  countAcceptedFollowers,
  countAcceptedFollowing,
  getFollowByPair,
} from "@/lib/db/user-follows";
import {
  formatPostedAtLabel,
  mapDbCommunityPostToView,
} from "@/lib/posts/map-community-post";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { MY_POSTS_DEMO } from "@/lib/posts/my-posts-demo";
import { ymdFromDb } from "@/lib/posts/visited-range";
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
        region: null,
      },
      isSelf: false,
      locked: false,
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
  const profileReader = createAdminClient() ?? supabase;

  let displayName = "ユーザー";
  let avatarUrl: string | null = null;
  let bio: string | null = null;
  let region: string | null = null;

  if (profileReader) {
    const { data } = await profileReader
      .from("profiles")
      .select(
        "id, display_name, avatar_url, bio, region, participant_avatar_url, organizer_avatar_url, active_profile_role",
      )
      .eq("id", authorId)
      .maybeSingle();
    if (data) {
      displayName = (data.display_name as string | null)?.trim() || displayName;
      bio = (data.bio as string | null) ?? null;
      region = (data.region as string | null) ?? null;
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
  const blocked = !isSelf && (await isBlockedBetween(viewer?.id ?? null, authorId));
  const blockedByMe = blocked && viewer ? await isBlockedByMe(viewer.id, authorId) : false;
  const followRow =
    viewer && !isSelf ? await getFollowByPair(viewer.id, authorId) : null;
  const locked =
    blocked ||
    (!isSelf &&
      followRow?.status !== "accepted" &&
      (await isProfilePrivate(authorId)));

  const [rows, followers, following, lockedPostCount] = await Promise.all([
    locked
      ? Promise.resolve([])
      : listAuthorAlbumPosts(authorId, viewer?.id ?? null, { limit: 80 }),
    countAcceptedFollowers(authorId),
    countAcceptedFollowing(authorId),
    locked && !blocked ? countAuthorAlbumPosts(authorId) : Promise.resolve(0),
  ]);

  const items: MyPostItem[] = rows.map((row) => {
    const view = mapDbCommunityPostToView(row);
    return {
      id: row.id,
      title: view.title,
      imageUrl: view.imageUrl,
      mediaType: row.media_type,
      category: view.category,
      categoryLabel: view.categoryLabel,
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
  });

  return NextResponse.json({
    profile: {
      id: authorId,
      displayName,
      avatarUrl,
      bio: locked ? null : bio,
      region,
    },
    isSelf,
    locked,
    blocked,
    blockedByMe,
    follow: {
      status: isSelf ? "self" : (followRow?.status ?? "none"),
      id: followRow?.id ?? null,
    },
    counts: {
      posts: locked
        ? lockedPostCount
        : items.filter((p) => p.status !== "draft").length,
      followers,
      following,
    },
    items,
  });
}

async function countAuthorAlbumPosts(authorId: string): Promise<number> {
  const client = createAdminClient() ?? (await createClient());
  if (!client) return 0;
  const { count, error } = await client
    .from("community_posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", authorId)
    .neq("status", "draft");
  if (error) return 0;
  return count ?? 0;
}
