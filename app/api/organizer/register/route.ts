import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { createOrganizerWithGrants } from "@/lib/db/organizers-with-grants";

/**
 * POST: 主催者登録（Earlybird/Founder30付与付き）
 */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const existing = await getOrganizerIdByProfileId(supabase, user.id);
  if (existing) {
    return NextResponse.json({ error: "既に主催者登録済みです" }, { status: 400 });
  }

  let body: { organizationName?: string; contactEmail?: string; contactPhone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const organizationName = String(body.organizationName ?? "").trim();
  if (!organizationName) {
    return NextResponse.json({ error: "団体名は必須です" }, { status: 400 });
  }

  try {
    const organizer = await createOrganizerWithGrants(supabase, {
      profileId: user.id,
      organizationName,
      contactEmail: body.contactEmail?.trim() || undefined,
      contactPhone: body.contactPhone?.trim() || undefined,
    });
    return NextResponse.json(organizer, { status: 201 });
  } catch (e) {
    console.error("organizer register:", e);
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}
