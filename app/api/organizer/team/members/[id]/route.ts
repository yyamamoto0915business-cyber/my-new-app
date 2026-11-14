import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import { canChangeRole, canRemoveMember, isMemberRole, type MemberRole } from "@/lib/organizer/team-server";

type Params = { params: Promise<{ id: string }> };

async function loadMember(id: string) {
  const ctx = await requireOrganizerApi("staff");
  if (!ctx.ok) return { error: ctx.response };
  const admin = createAdminClient();
  if (!admin) return { error: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) };
  const { data } = await admin
    .from("organizer_members")
    .select("id, profile_id, role")
    .eq("id", id)
    .eq("organizer_id", ctx.organizerId)
    .maybeSingle();
  if (!data) return { error: NextResponse.json({ error: "メンバーが見つかりません" }, { status: 404 }) };
  return { ctx, admin, member: data as { id: string; profile_id: string; role: MemberRole } };
}

/** PATCH { role }：権限を変える（見本 08。オーナーは何でも、管理者は編集者・スタッフだけ） */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loaded = await loadMember(id);
  if ("error" in loaded) return loaded.error;
  const { ctx, admin, member } = loaded;
  const body = (await req.json().catch(() => null)) as { role?: unknown } | null;
  if (!isMemberRole(body?.role)) return NextResponse.json({ error: "権限を選んでください" }, { status: 400 });
  if (member.profile_id === ctx.userId) {
    return NextResponse.json({ error: "自分の権限は変えられません。オーナーか管理者に頼んでください" }, { status: 403 });
  }
  if (!canChangeRole(ctx.role, member.role, body.role)) {
    return NextResponse.json({ error: "権限の変更は、オーナーか管理者だけができます（管理者の変更はオーナーだけ）" }, { status: 403 });
  }
  const { error } = await admin
    .from("organizer_members")
    .update({ role: body.role, updated_at: new Date().toISOString() })
    .eq("id", member.id);
  if (error) return NextResponse.json({ error: "変えられませんでした" }, { status: 500 });
  return NextResponse.json({ ok: true, role: body.role });
}

/** DELETE：チームから外す（自分が抜けるのはだれでも可） */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loaded = await loadMember(id);
  if ("error" in loaded) return loaded.error;
  const { ctx, admin, member } = loaded;
  const isSelf = member.profile_id === ctx.userId;
  if (!canRemoveMember(ctx.role, member.role, isSelf)) {
    return NextResponse.json({ error: "メンバーを外せるのは、オーナーか管理者だけです（管理者を外すのはオーナーだけ）" }, { status: 403 });
  }
  const { error } = await admin.from("organizer_members").delete().eq("id", member.id);
  if (error) return NextResponse.json({ error: "外せませんでした" }, { status: 500 });
  return NextResponse.json({ ok: true, left: isSelf });
}
