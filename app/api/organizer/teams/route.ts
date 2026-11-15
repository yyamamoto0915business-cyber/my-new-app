import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrganizerAccess, listOrganizerAccesses, ORGANIZER_ROLE_LABEL } from "@/lib/organizer/team";

/** GET：いま使えるチーム（主催者）の一覧と、いま使っているチーム */
export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });

  const [list, current] = await Promise.all([listOrganizerAccesses(supabase, user.id), getOrganizerAccess(supabase, user.id)]);
  if (list.length === 0) return NextResponse.json({ current: null, teams: [] });
  const { data: orgs } = await admin
    .from("organizers")
    .select("id, organization_name")
    .in("id", list.map((a) => a.organizerId));
  const names = new Map(((orgs ?? []) as { id: string; organization_name: string | null }[]).map((o) => [o.id, o.organization_name?.trim() || "主催者"]));
  return NextResponse.json({
    current: current?.organizerId ?? null,
    teams: list.map((a) => ({
      organizerId: a.organizerId,
      name: names.get(a.organizerId) ?? "主催者",
      role: a.role,
      roleLabel: ORGANIZER_ROLE_LABEL[a.role],
    })),
  });
}

/** POST：使うチームを切りかえる（入っているチームだけ選べる） */
export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { organizerId?: unknown };
  const organizerId = typeof body.organizerId === "string" ? body.organizerId : "";
  const list = await listOrganizerAccesses(supabase, user.id);
  const target = list.find((a) => a.organizerId === organizerId);
  if (!target) return NextResponse.json({ error: "このチームは使えません" }, { status: 403 });

  const { error } = await admin
    .from("organizer_choices")
    .upsert({ profile_id: user.id, organizer_id: target.organizerId, updated_at: new Date().toISOString() }, { onConflict: "profile_id" });
  if (error) {
    console.error("organizer choice:", error.message);
    return NextResponse.json(
      { error: /organizer_choices/.test(error.message) ? "チームの切りかえの準備ができていません" : "切りかえられませんでした" },
      { status: /organizer_choices/.test(error.message) ? 503 : 500 },
    );
  }
  return NextResponse.json({ ok: true, organizerId: target.organizerId, role: target.role });
}
