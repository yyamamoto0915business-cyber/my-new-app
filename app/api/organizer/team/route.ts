import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/stripe";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import { roleAtLeast } from "@/lib/organizer/team";
import { inviteState, organizerHasTeamPlan, TEAM_MAX_PEOPLE, type InviteRow } from "@/lib/organizer/team-server";

/** GET：チーム（オーナー・メンバー）と、管理者以上には招待中のリンク */
export async function GET() {
  const ctx = await requireOrganizerApi("staff");
  if (!ctx.ok) return ctx.response;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const { organizerId, role, userId } = ctx;

  const [{ data: org }, { data: memberRows, error: memberErr }, isTeam] = await Promise.all([
    admin.from("organizers").select("id, profile_id, organization_name").eq("id", organizerId).maybeSingle(),
    admin.from("organizer_members").select("id, profile_id, role, created_at").eq("organizer_id", organizerId).order("created_at"),
    organizerHasTeamPlan(admin, organizerId),
  ]);
  if (!org) return NextResponse.json({ error: "主催者が見つかりません" }, { status: 404 });
  // メンバーの表（00131）がまだないときは「準備中」
  if (memberErr) return NextResponse.json({ ready: false, isTeam: false, role, members: [], invites: [] });

  const members = (memberRows ?? []) as { id: string; profile_id: string; role: string; created_at: string }[];
  const profileIds = [org.profile_id as string, ...members.map((m) => m.profile_id)];
  const { data: profiles } = await admin.from("profiles").select("id, display_name, avatar_url").in("id", profileIds);
  const byId = new Map(((profiles ?? []) as { id: string; display_name: string | null; avatar_url: string | null }[]).map((p) => [p.id, p]));
  const person = (pid: string) => ({
    name: byId.get(pid)?.display_name?.trim() || "メンバー",
    avatarUrl: byId.get(pid)?.avatar_url ?? null,
    isMe: pid === userId,
  });

  let invites: { id: string; role: string; url: string; expiresAt: string; usedCount: number; maxUses: number }[] = [];
  if (roleAtLeast(role, "admin")) {
    const { data: inv } = await admin
      .from("organizer_invites")
      .select("*")
      .eq("organizer_id", organizerId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(20);
    const base = getAppUrl();
    invites = ((inv ?? []) as InviteRow[])
      .filter((i) => inviteState(i) === "ok")
      .map((i) => ({ id: i.id, role: i.role, url: `${base}/team/join/${i.token}`, expiresAt: i.expires_at, usedCount: i.used_count, maxUses: i.max_uses }));
  }

  return NextResponse.json({
    ready: true,
    isTeam,
    role,
    maxPeople: TEAM_MAX_PEOPLE,
    organizationName: (org.organization_name as string | null)?.trim() || "主催者",
    members: [
      { id: "owner", role: "owner", ...person(org.profile_id as string), joinedAt: null },
      ...members.map((m) => ({ id: m.id, role: m.role, ...person(m.profile_id), joinedAt: m.created_at })),
    ],
    invites,
  });
}
