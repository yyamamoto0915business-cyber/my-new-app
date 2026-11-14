import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";

type Params = { params: Promise<{ id: string }> };

/** DELETE：招待リンクを取り消す（管理者以上） */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireOrganizerApi("admin");
  if (!ctx.ok) return ctx.response;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const { data, error } = await admin
    .from("organizer_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organizer_id", ctx.organizerId)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "取り消せませんでした" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "招待リンクが見つかりません" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
