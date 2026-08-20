import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { fetchMyVolunteerApplications } from "@/lib/db/recruitments-mvp";
import { volunteerStatusLabel } from "@/lib/mypage-summary-types";

/** GET: 自分のボランティア応募履歴 */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ applications: [] });
  }

  const apps = await fetchMyVolunteerApplications(supabase, user.id, 50);
  return NextResponse.json({
    applications: apps.map((a) => ({
      ...a,
      statusLabel: volunteerStatusLabel(a.status),
    })),
  });
}
