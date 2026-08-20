import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  getMyReactionCounts,
  getMyReactionEventIds,
} from "@/lib/db/event-reactions";
import { fetchPublishedEventsByIds } from "@/lib/db/events";
import { fetchMyParticipationPasses } from "@/lib/db/participation-passes";
import { listMyCommunityPosts } from "@/lib/db/community-posts";
import { fetchMyVolunteerApplications } from "@/lib/db/recruitments-mvp";
import { mapDbCommunityPostToView } from "@/lib/posts/map-community-post";
import {
  normalizeProfileAvatarRole,
  resolveAvatarUrlByRole,
} from "@/lib/profile-avatar";
import {
  isConfirmedVolunteerStatus,
  volunteerStatusLabel,
  type MypageActivityItem,
  type MypageNextEvent,
  type MypageNextVolunteer,
  type MypagePostPreview,
  type MypageSummaryResponse,
} from "@/lib/mypage-summary-types";

function isMissingAvatarColumnsError(msg: string) {
  return /participant_avatar_url|organizer_avatar_url|active_profile_role|42703/i.test(msg);
}

function formatMdLabel(isoOrYmd: string): string {
  const d = new Date(isoOrYmd.includes("T") ? isoOrYmd : `${isoOrYmd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoOrYmd;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function emptySummary(
  displayName: string,
  isOrganizerRegistered = false
): MypageSummaryResponse {
  return {
    profile: {
      displayName,
      avatarUrl: null,
      bio: null,
      region: null,
      isOrganizerRegistered,
    },
    stats: { participated: 0, posts: 0, volunteer: 0, favorites: 0 },
    counts: {
      planned: 0,
      interested: 0,
      passes: 0,
      volunteerApplications: 0,
    },
    nextEvent: null,
    nextVolunteer: null,
    posts: [],
    activity: [],
  };
}

/** GET: マイページ用のプロフィール＋統計＋次の予定を1リクエストで返す */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(emptySummary(user.name ?? "ゲスト"));
  }

  const [{ data: organizerRow }, profileResult, counts, reactionIds, myPosts] =
    await Promise.all([
      supabase.from("organizers").select("id").eq("profile_id", user.id).maybeSingle(),
      supabase
        .from("profiles")
        .select(
          "display_name, avatar_url, participant_avatar_url, organizer_avatar_url, active_profile_role, bio, region"
        )
        .eq("id", user.id)
        .single(),
      getMyReactionCounts(supabase, user.id),
      getMyReactionEventIds(supabase, user.id),
      listMyCommunityPosts(user.id, { limit: 12 }),
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
    avatarUrl = resolveAvatarUrlByRole({
      avatar_url: profileData.avatar_url,
      participant_avatar_url: profileData.participant_avatar_url,
      organizer_avatar_url: profileData.organizer_avatar_url,
      active_profile_role: normalizeProfileAvatarRole(profileData.active_profile_role),
    });
  }

  const [plannedEvents, passes, volunteerApps] = await Promise.all([
    fetchPublishedEventsByIds(supabase, reactionIds.planned),
    fetchMyParticipationPasses(supabase, user.id, displayName).catch(() => []),
    fetchMyVolunteerApplications(supabase, user.id, 20).catch(() => []),
  ]);

  const activePasses = passes.filter(
    (p) => p.status === "upcoming" || p.status === "today"
  );
  const completedPasses = passes.filter((p) => p.status === "completed");

  let nextEvent: MypageNextEvent | null = null;
  const nextPass = activePasses[0];
  if (nextPass) {
    const start = new Date(nextPass.startAt);
    const end = nextPass.endAt ? new Date(nextPass.endAt) : null;
    nextEvent = {
      id: nextPass.eventId,
      title: nextPass.eventTitle,
      date: Number.isNaN(start.getTime())
        ? ""
        : `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
      startTime: Number.isNaN(start.getTime())
        ? ""
        : `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
      endTime:
        end && !Number.isNaN(end.getTime())
          ? `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
          : undefined,
      location: nextPass.venueName,
      imageUrl: nextPass.eventImage || null,
      passHref: "/pass",
    };
  } else if (plannedEvents[0]) {
    const e = plannedEvents[0];
    nextEvent = {
      id: e.id,
      title: e.title,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      location: e.location,
      imageUrl: e.imageUrl,
      passHref: `/pass`,
    };
  }

  const confirmedOrPending = volunteerApps.filter(
    (a) =>
      a.status !== "rejected" &&
      a.status !== "canceled" &&
      a.status !== "completed"
  );
  const nextVolApp =
    confirmedOrPending.find((a) => isConfirmedVolunteerStatus(a.status)) ??
    confirmedOrPending[0] ??
    null;

  const nextVolunteer: MypageNextVolunteer | null = nextVolApp
    ? {
        id: nextVolApp.id,
        recruitmentId: nextVolApp.recruitmentId,
        title: nextVolApp.title,
        roleLabel: nextVolApp.roleLabel,
        startAt: nextVolApp.startAt,
        meetingPlace: nextVolApp.meetingPlace,
        imageUrl: nextVolApp.imageUrl,
        statusLabel: volunteerStatusLabel(nextVolApp.status),
        href: `/recruitments/${nextVolApp.recruitmentId}`,
      }
    : null;

  const posts: MypagePostPreview[] = myPosts.slice(0, 8).map((row) => {
    const view = mapDbCommunityPostToView(row);
    return {
      id: row.id,
      title: view.title,
      imageUrl: view.imageUrl,
      dateLabel: formatMdLabel(row.created_at),
      likeCount: view.likeCount,
      commentCount: view.commentCount,
      href: `/posts/${row.id}`,
    };
  });

  const volunteerParticipated = volunteerApps.filter((a) =>
    isConfirmedVolunteerStatus(a.status)
  ).length;

  const activity: MypageActivityItem[] = [];
  for (const p of myPosts.slice(0, 3)) {
    activity.push({
      id: `post-${p.id}`,
      dateLabel: formatMdLabel(p.created_at),
      text: `投稿しました「${p.title}」`,
      href: `/posts/${p.id}`,
      thumbUrl:
        p.media_type === "video" ? p.poster_url ?? p.media_url : p.media_url,
    });
  }
  for (const e of plannedEvents.slice(0, 2)) {
    activity.push({
      id: `planned-${e.id}`,
      dateLabel: formatMdLabel(e.date),
      text: `参加予定に追加「${e.title}」`,
      href: `/events/${e.id}`,
      thumbUrl: e.imageUrl,
    });
  }
  activity.sort((a, b) => {
    const [am, ad] = a.dateLabel.split("/").map(Number);
    const [bm, bd] = b.dateLabel.split("/").map(Number);
    return bm * 100 + bd - (am * 100 + ad);
  });

  const body: MypageSummaryResponse = {
    profile: {
      displayName: displayName || "ゲスト",
      avatarUrl,
      bio,
      region,
      isOrganizerRegistered: !!organizerRow,
    },
    stats: {
      participated: Math.max(completedPasses.length, 0),
      posts: myPosts.length,
      volunteer: volunteerParticipated,
      favorites: counts.interested,
    },
    counts: {
      planned: counts.planned,
      interested: counts.interested,
      passes: activePasses.length,
      volunteerApplications: volunteerApps.length,
    },
    nextEvent,
    nextVolunteer,
    posts,
    activity: activity.slice(0, 5),
  };

  return NextResponse.json(body);
}
