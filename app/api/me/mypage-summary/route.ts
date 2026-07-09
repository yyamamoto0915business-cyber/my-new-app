import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getMyReactionCounts } from "@/lib/db/event-reactions";
import {
  normalizeProfileAvatarRole,
  resolveAvatarUrlByRole,
} from "@/lib/profile-avatar";

function isMissingAvatarColumnsError(msg: string) {
  return /participant_avatar_url|organizer_avatar_url|active_profile_role|42703/i.test(msg);
}

/** GET: マイページ用のプロフィール＋統計を1リクエストで返す */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({
      profile: {
        displayName: user.name ?? "ゲスト",
        avatarUrl: null,
        bio: null,
        region: null,
        isOrganizerRegistered: false,
      },
      counts: { planned: 0, interested: 0 },
    });
  }

  const [{ data: organizerRow }, profileResult, counts] = await Promise.all([
    supabase.from("organizers").select("id").eq("profile_id", user.id).maybeSingle(),
    supabase
      .from("profiles")
      .select(
        "display_name, avatar_url, participant_avatar_url, organizer_avatar_url, active_profile_role, bio, region"
      )
      .eq("id", user.id)
      .single(),
    getMyReactionCounts(supabase, user.id),
  ]);

  let displayName = user.name ?? "ゲスト";
  let avatarUrl: string | null = null;
  let bio: string | null = null;
  let region: string | null = null;

  const { data: profileData, error: profileError } = profileResult;

  if (profileError && isMissingAvatarColumnsError(profileError.message ?? "")) {
    const { data: leg } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, bio, region")
      .eq("id", user.id)
      .single();
    if (leg) {
      displayName = leg.display_name ?? displayName;
      avatarUrl = leg.avatar_url ?? null;
      bio = leg.bio ?? null;
      region = leg.region ?? null;
    }
  } else if (profileData) {
    displayName = profileData.display_name ?? displayName;
    bio = profileData.bio ?? null;
    region = profileData.region ?? null;
    avatarUrl = resolveAvatarUrlByRole(
      {
        avatar_url: profileData.avatar_url,
        participant_avatar_url: profileData.participant_avatar_url,
        organizer_avatar_url: profileData.organizer_avatar_url,
        active_profile_role: normalizeProfileAvatarRole(profileData.active_profile_role),
      },
      "participant"
    );
  }

  return NextResponse.json({
    profile: {
      displayName: displayName || "ゲスト",
      avatarUrl,
      bio,
      region,
      isOrganizerRegistered: !!organizerRow,
    },
    counts,
  });
}
