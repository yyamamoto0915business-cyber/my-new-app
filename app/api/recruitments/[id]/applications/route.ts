import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchRecruitmentById,
  fetchApplicationsByRecruitment,
  getOrganizerIdByProfileId,
} from "@/lib/db/recruitments-mvp";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getStoreRecruitmentById,
  getStoreApplicationsByRecruitment,
  getDevOrganizerId,
} from "@/lib/created-recruitments-store";

type Params = { params: Promise<{ id: string }> };

async function enrichApplicantProfiles<
  T extends { user_id: string; user?: { display_name: string | null; email: string | null } }
>(apps: T[]): Promise<T[]> {
  const missingUserIds = Array.from(
    new Set(apps.filter((app) => !app.user?.display_name && !app.user?.email).map((app) => app.user_id))
  );
  if (missingUserIds.length === 0) return apps;

  const admin = createAdminClient();
  if (!admin) return apps;

  const { data } = await admin
    .from("profiles")
    .select("id, display_name, email")
    .in("id", missingUserIds);
  if (!data || data.length === 0) return apps;

  const profileById = new Map(
    data.map((row) => [row.id, { display_name: row.display_name ?? null, email: row.email ?? null }])
  );

  return apps.map((app) => {
    const profile = profileById.get(app.user_id);
    if (!profile) return app;
    return {
      ...app,
      user: {
        display_name: app.user?.display_name ?? profile.display_name,
        email: app.user?.email ?? profile.email,
      },
    };
  });
}

/** GET: 応募者一覧（主催者のみ） */
export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: recruitmentId } = await params;
  if (!recruitmentId) return NextResponse.json(null, { status: 404 });

  const supabase = await createClient();

  if (supabase) {
    try {
      const recruitment = await fetchRecruitmentById(supabase, recruitmentId);
      if (!recruitment) return NextResponse.json(null, { status: 404 });

      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      if (!organizerId || recruitment.organizer_id !== organizerId) {
        return NextResponse.json({ error: "権限がありません" }, { status: 403 });
      }

      const apps = await fetchApplicationsByRecruitment(supabase, recruitmentId);
      const enrichedApps = await enrichApplicantProfiles(apps);
      return NextResponse.json(enrichedApps);
    } catch (e) {
      console.error("applications GET:", e);
      return NextResponse.json([], { status: 500 });
    }
  }

  const recruitment = getStoreRecruitmentById(recruitmentId);
  if (!recruitment) return NextResponse.json(null, { status: 404 });
  if (recruitment.organizer_id !== getDevOrganizerId()) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const apps = getStoreApplicationsByRecruitment(recruitmentId);
  return NextResponse.json(apps);
}
