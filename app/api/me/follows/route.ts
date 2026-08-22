import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import {
  countAcceptedFollowers,
  countAcceptedFollowing,
  listAcceptedFollowers,
  listAcceptedFollowing,
  unfollow,
} from "@/lib/db/user-follows";
import {
  resolveAvatarUrlByRole,
  type ProfileAvatarFields,
} from "@/lib/profile-avatar";

export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const tab = new URL(request.url).searchParams.get("tab") === "following"
    ? "following"
    : "followers";

  const rows =
    tab === "following"
      ? await listAcceptedFollowing(user.id)
      : await listAcceptedFollowers(user.id);

  const ids = rows.map((r) =>
    tab === "following" ? r.followee_id : r.follower_id,
  );
  const supabase = await createClient();
  const profileById = new Map<
    string,
    { displayName: string; avatarUrl: string | null }
  >();
  if (supabase && ids.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url, participant_avatar_url, organizer_avatar_url, active_profile_role",
      )
      .in("id", ids);
    for (const p of data ?? []) {
      const fields = p as ProfileAvatarFields & { id: string };
      profileById.set(fields.id, {
        displayName: (fields.display_name as string | null)?.trim() || "ユーザー",
        avatarUrl: resolveAvatarUrlByRole(fields),
      });
    }
  }

  const items = rows.map((r) => {
    const id = tab === "following" ? r.followee_id : r.follower_id;
    const profile = profileById.get(id);
    return {
      id,
      displayName: profile?.displayName ?? "ユーザー",
      avatarUrl: profile?.avatarUrl ?? null,
      albumHref: `/users/${id}/album`,
    };
  });

  const [followerCount, followingCount] = await Promise.all([
    countAcceptedFollowers(user.id),
    countAcceptedFollowing(user.id),
  ]);

  let selfName = user.name?.trim() || "ユーザー";
  if (supabase) {
    const { data: self } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    const fromProfile = (self?.display_name as string | null | undefined)?.trim();
    if (fromProfile) selfName = fromProfile;
  }

  return NextResponse.json({
    tab,
    items,
    followerCount,
    followingCount,
    displayName: selfName,
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const followerId = new URL(request.url).searchParams.get("followerId") ?? "";
  if (!followerId) {
    return NextResponse.json({ error: "followerId が必要です" }, { status: 400 });
  }
  await unfollow(followerId, user.id);
  return NextResponse.json({ ok: true });
}
