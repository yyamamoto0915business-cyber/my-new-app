import { NextRequest, NextResponse } from "next/server";
import { requireDeveloperAdminWithSupabase } from "@/lib/auth/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantOrganizerPlan } from "@/lib/admin/mutations";
import { createProxyOrganizer, listProxyOrganizers } from "@/lib/organizer/proxy-claims";

async function guard(req: NextRequest) {
  const supabase = createRouteSupabaseClient(req, NextResponse.next());
  if (!supabase) return { error: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) } as const;
  const auth = await requireDeveloperAdminWithSupabase(supabase);
  if (!auth.ok) {
    return { error: NextResponse.json({ error: auth.status === 401 ? "ログインが必要です" : "開発者権限が必要です" }, { status: auth.status }) } as const;
  }
  const admin = createAdminClient();
  if (!admin) return { error: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) } as const;
  return { supabase, admin, profileId: auth.profile.id } as const;
}

/** GET：運営が代わりに作った主催者ページの一覧 */
export async function GET(req: NextRequest) {
  const g = await guard(req);
  if ("error" in g) return g.error;
  return NextResponse.json({ items: await listProxyOrganizers(g.admin) });
}

/** POST { name, contactNote }：主催者ページを代わりに作る（運営の人が管理者メンバーになる） */
export async function POST(req: NextRequest) {
  const g = await guard(req);
  if ("error" in g) return g.error;
  const body = (await req.json().catch(() => null)) as { name?: unknown; contactNote?: unknown } | null;
  const result = await createProxyOrganizer(g.admin, {
    name: typeof body?.name === "string" ? body.name : "",
    contactNote: typeof body?.contactNote === "string" ? body.contactNote : null,
    adminProfileId: g.profileId,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  // 作り込むあいだ、チームの機能（メンバーでの編集）が使えるように TEAM を付ける。受け取ったときに外し、相手には GAME を半年つける
  await grantOrganizerPlan(g.supabase, {
    organizerId: result.organizerId,
    grantType: "90_days",
    plan: "team",
    reason: "運営が代わりに作るため（受け取りで外す）",
    adminUserId: g.profileId,
  }).catch(() => null);
  return NextResponse.json({ organizerId: result.organizerId });
}
