import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchPublicRecruitments,
  fetchRecommendedRecruitments,
  createRecruitmentMvp,
  getOrganizerIdByProfileId,
} from "@/lib/db/recruitments-mvp";
import {
  addStoreRecruitment,
  getStoreRecruitmentsPublic,
  getStoreRecommendedRecruitments,
  getStoreRecruitmentsByOrganizer,
  getDevOrganizerId,
} from "@/lib/created-recruitments-store";

/** GET: 募集一覧（公開中） / おすすめ / 主催者自分の一覧 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recommended = searchParams.get("recommended") === "true";
  const mine = searchParams.get("mine") === "true";
  const eventId = searchParams.get("eventId") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const supabase = await createClient();
  const user = mine ? await getApiUser() : null;
  if (mine && !user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  if (supabase) {
    try {
      if (mine && user) {
        const { fetchRecruitmentsByOrganizer } = await import(
          "@/lib/db/recruitments-mvp"
        );
        const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
        if (!organizerId) return NextResponse.json([]);
        let list = await fetchRecruitmentsByOrganizer(supabase, organizerId);
        if (eventId) list = list.filter((r) => r.event_id === eventId);
        return NextResponse.json(list);
      }
      if (recommended) {
        const list = await fetchRecommendedRecruitments(supabase, Math.min(limit, 3));
        return NextResponse.json(list);
      }
      const list = await fetchPublicRecruitments(supabase, { limit });
      return NextResponse.json(list);
    } catch (e) {
      console.error("recruitments GET:", e);
      return NextResponse.json([], { status: 500 });
    }
  }

  if (mine && user) {
    const list = getStoreRecruitmentsByOrganizer(getDevOrganizerId());
    return NextResponse.json(list);
  }
  if (recommended) {
    const list = getStoreRecommendedRecruitments(Math.min(limit, 3));
    return NextResponse.json(list);
  }
  const list = getStoreRecruitmentsPublic(limit);
  return NextResponse.json(list);
}

/** POST: 募集作成（主催者） */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なJSONです" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!title || !description) {
    return NextResponse.json(
      { error: "タイトルと説明は必須です" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  if (supabase) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      if (!organizerId) {
        return NextResponse.json(
          { error: "主催者登録が必要です。プロフィールから主催者登録を行ってください。" },
          { status: 403 }
        );
      }

      const roles = Array.isArray(body.roles)
        ? (body.roles as { name?: string; count?: number }[])
            .filter((r) => r && typeof r === "object")
            .map((r) => ({ name: String(r.name ?? ""), count: Number(r.count ?? 0) }))
        : [];

      const id = await createRecruitmentMvp(supabase, organizerId, {
        title,
        description,
        status: (body.status as "draft" | "public") ?? "draft",
        start_at: typeof body.start_at === "string" ? body.start_at : null,
        end_at: typeof body.end_at === "string" ? body.end_at : null,
        meeting_place: typeof body.meeting_place === "string" ? body.meeting_place : null,
        meeting_lat: typeof body.meeting_lat === "number" ? body.meeting_lat : null,
        meeting_lng: typeof body.meeting_lng === "number" ? body.meeting_lng : null,
        roles: roles.length ? roles : undefined,
        capacity: typeof body.capacity === "number" ? body.capacity : null,
        items_to_bring: typeof body.items_to_bring === "string" ? body.items_to_bring : null,
        provisions: typeof body.provisions === "string" ? body.provisions : null,
        notes: typeof body.notes === "string" ? body.notes : null,
        event_id: typeof body.event_id === "string" ? body.event_id : null,
        type: typeof body.type === "string" ? body.type : "volunteer",
      });

      return NextResponse.json({ id }, { status: 201 });
    } catch (e) {
      console.error("recruitments POST:", e);
      return NextResponse.json(
        { error: "募集の作成に失敗しました" },
        { status: 500 }
      );
    }
  }

  // フォールバック: ストア
  const roles = Array.isArray(body.roles)
    ? (body.roles as { name?: string; count?: number }[])
        .filter((r) => r && typeof r === "object")
        .map((r) => ({ name: String(r.name ?? ""), count: Number(r.count ?? 0) }))
    : [];

  const r = addStoreRecruitment({
    organizer_id: getDevOrganizerId(),
    event_id: null,
    type: (body.type as string) || "volunteer",
    title,
    description,
    status: (body.status as "draft" | "public") || "draft",
    start_at: typeof body.start_at === "string" ? body.start_at : null,
    end_at: typeof body.end_at === "string" ? body.end_at : null,
    meeting_place: typeof body.meeting_place === "string" ? body.meeting_place : null,
    meeting_lat: typeof body.meeting_lat === "number" ? body.meeting_lat : null,
    meeting_lng: typeof body.meeting_lng === "number" ? body.meeting_lng : null,
    roles,
    capacity: typeof body.capacity === "number" ? body.capacity : null,
    items_to_bring: typeof body.items_to_bring === "string" ? body.items_to_bring : null,
    provisions: typeof body.provisions === "string" ? body.provisions : null,
    notes: typeof body.notes === "string" ? body.notes : null,
  });

  return NextResponse.json({ id: r.id }, { status: 201 });
}
