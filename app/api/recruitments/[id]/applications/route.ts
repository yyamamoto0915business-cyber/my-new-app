import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchRecruitmentById,
  fetchApplicationsByRecruitment,
  getOrganizerIdByProfileId,
} from "@/lib/db/recruitments-mvp";
import {
  getStoreRecruitmentById,
  getStoreApplicationsByRecruitment,
  getDevOrganizerId,
} from "@/lib/created-recruitments-store";

type Params = { params: Promise<{ id: string }> };

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
      return NextResponse.json(apps);
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
