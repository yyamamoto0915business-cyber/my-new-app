import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/stripe";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import {
  canInviteAs,
  INVITE_DAYS,
  isMemberRole,
  newInviteToken,
  organizerHasTeamPlan,
  TEAM_MAX_PEOPLE,
  teamHeadcount,
} from "@/lib/organizer/team-server";

/** POST { role, days }：招待リンクを作る（管理者以上・TEAM プランだけ。管理者としての招待はオーナーだけ） */
export async function POST(req: NextRequest) {
  const ctx = await requireOrganizerApi("admin");
  if (!ctx.ok) return ctx.response;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as { role?: unknown; days?: unknown } | null;
  const role = body?.role;
  const days = Number(body?.days);
  if (!isMemberRole(role)) return NextResponse.json({ error: "招待するときの権限を選んでください" }, { status: 400 });
  if (!(INVITE_DAYS as readonly number[]).includes(days)) {
    return NextResponse.json({ error: "リンクの有効期限を選んでください" }, { status: 400 });
  }
  if (!canInviteAs(ctx.role, role)) {
    return NextResponse.json({ error: "管理者として招待できるのはオーナーだけです" }, { status: 403 });
  }
  if (!(await organizerHasTeamPlan(admin, ctx.organizerId))) {
    return NextResponse.json({ error: "メンバーの招待は TEAM プランで使えます" }, { status: 403 });
  }
  if ((await teamHeadcount(admin, ctx.organizerId)) >= TEAM_MAX_PEOPLE) {
    return NextResponse.json({ error: `チームは${TEAM_MAX_PEOPLE}人までです` }, { status: 400 });
  }

  const token = newInviteToken();
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
  const { data, error } = await admin
    .from("organizer_invites")
    .insert({ organizer_id: ctx.organizerId, token, role, created_by: ctx.userId, expires_at: expiresAt, max_uses: 1 })
    .select("id")
    .single();
  if (error) {
    console.error("create invite:", error);
    return NextResponse.json({ error: "招待リンクを作れませんでした" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id, url: `${getAppUrl()}/team/join/${token}`, role, expiresAt });
}
