import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { ORGANIZER_ROLE_LABEL } from "@/lib/organizer/team";
import { acceptInvite, INVITE_STATE_MESSAGE, inviteState, type InviteRow } from "@/lib/organizer/team-server";

type Params = { params: Promise<{ token: string }> };
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

/** GET：招待リンクの中身（団体名・権限・使えるか）。ログインなしでも見られる */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) return NextResponse.json({ error: "招待リンクが見つかりません" }, { status: 404 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const { data } = await admin.from("organizer_invites").select("*").eq("token", token).maybeSingle();
  const inv = data as InviteRow | null;
  if (!inv) return NextResponse.json({ error: "招待リンクが見つかりません" }, { status: 404 });
  const { data: org } = await admin.from("organizers").select("organization_name").eq("id", inv.organizer_id).maybeSingle();
  const state = inviteState(inv);
  return NextResponse.json({
    organizationName: (org?.organization_name as string | null)?.trim() || "主催者",
    role: inv.role,
    roleLabel: ORGANIZER_ROLE_LABEL[inv.role],
    expiresAt: inv.expires_at,
    usable: state === "ok",
    message: state === "ok" ? null : INVITE_STATE_MESSAGE[state],
  });
}

/** POST：ログインしている人が、このチームに参加する */
export async function POST(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  if (!TOKEN_RE.test(token)) return NextResponse.json({ error: "招待リンクが見つかりません" }, { status: 404 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const result = await acceptInvite(admin, token, user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, role: result.role });
}
