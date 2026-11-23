import { NextRequest, NextResponse } from "next/server";
import { requireDeveloperAdminWithSupabase } from "@/lib/auth/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/stripe";
import { issueClaimLink } from "@/lib/organizer/proxy-claims";

/** POST：受け取りリンクを作る（作り直すと前のリンクは使えなくなる） */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createRouteSupabaseClient(req, NextResponse.next());
  if (!supabase) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const auth = await requireDeveloperAdminWithSupabase(supabase);
  if (!auth.ok) return NextResponse.json({ error: "開発者権限が必要です" }, { status: auth.status });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const { id } = await params;
  const result = await issueClaimLink(admin, id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ url: `${getAppUrl()}/claim/${result.token}`, expiresAt: result.expiresAt });
}
