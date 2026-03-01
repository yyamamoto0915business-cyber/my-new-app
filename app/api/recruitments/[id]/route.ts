import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import type { RecruitmentCreateInput } from "@/lib/db/recruitments-mvp";
import {
  fetchRecruitmentById,
  getOrganizerIdByProfileId,
  updateRecruitmentMvp,
} from "@/lib/db/recruitments-mvp";
import {
  getStoreRecruitmentById,
  getStoreRecruitmentsByOrganizer,
  updateStoreRecruitment,
  getDevOrganizerId,
} from "@/lib/created-recruitments-store";

type Params = { params: Promise<{ id: string }> };

/** GET: 募集1件 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) return NextResponse.json(null, { status: 404 });

  const supabase = await createClient();

  if (supabase) {
    try {
      const r = await fetchRecruitmentById(supabase, id);
      if (!r) return NextResponse.json(null, { status: 404 });
      return NextResponse.json(r);
    } catch (e) {
      console.error("recruitments/[id] GET:", e);
      return NextResponse.json(null, { status: 500 });
    }
  }

  const r = getStoreRecruitmentById(id);
  if (!r) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(r);
}

/** PATCH: 募集更新（主催者のみ） */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json(null, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なJSONです" }, { status: 400 });
  }

  const supabase = await createClient();

  if (supabase) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      if (!organizerId) {
        return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
      }

      const existing = await fetchRecruitmentById(supabase, id);
      if (!existing) return NextResponse.json(null, { status: 404 });
      if (existing.organizer_id !== organizerId) {
        return NextResponse.json({ error: "この募集の編集権限がありません" }, { status: 403 });
      }

      const roles = Array.isArray(body.roles)
        ? (body.roles as { name?: string; count?: number }[])
            .filter((r) => r && typeof r === "object")
            .map((r) => ({ name: String(r.name ?? ""), count: Number(r.count ?? 0) }))
        : undefined;

      const updates: Partial<RecruitmentCreateInput> = {};
      if (typeof body.title === "string") updates.title = body.title;
      if (typeof body.description === "string") updates.description = body.description;
      if (body.status && ["draft", "public", "closed"].includes(String(body.status))) {
        updates.status = body.status as "draft" | "public" | "closed";
      }
      if (body.start_at !== undefined) updates.start_at = body.start_at as string | null;
      if (body.end_at !== undefined) updates.end_at = body.end_at as string | null;
      if (body.meeting_place !== undefined) updates.meeting_place = body.meeting_place as string | null;
      if (body.meeting_lat !== undefined) updates.meeting_lat = body.meeting_lat as number | null;
      if (body.meeting_lng !== undefined) updates.meeting_lng = body.meeting_lng as number | null;
      if (roles) updates.roles = roles;
      if (body.capacity !== undefined) updates.capacity = body.capacity as number | null;
      if (body.items_to_bring !== undefined) updates.items_to_bring = body.items_to_bring as string | null;
      if (body.provisions !== undefined) updates.provisions = body.provisions as string | null;
      if (body.notes !== undefined) updates.notes = body.notes as string | null;
      await updateRecruitmentMvp(supabase, id, organizerId, updates);

      const updated = await fetchRecruitmentById(supabase, id);
      return NextResponse.json(updated);
    } catch (e) {
      console.error("recruitments/[id] PATCH:", e);
      return NextResponse.json(
        { error: "更新に失敗しました" },
        { status: 500 }
      );
    }
  }

  const existing = getStoreRecruitmentById(id);
  if (!existing) return NextResponse.json(null, { status: 404 });
  if (existing.organizer_id !== getDevOrganizerId()) {
    return NextResponse.json({ error: "この募集の編集権限がありません" }, { status: 403 });
  }

  const roles = Array.isArray(body.roles)
    ? (body.roles as { name?: string; count?: number }[])
        .filter((r) => r && typeof r === "object")
        .map((r) => ({ name: String(r.name ?? ""), count: Number(r.count ?? 0) }))
    : undefined;

  const updated = updateStoreRecruitment(id, getDevOrganizerId(), {
    title: typeof body.title === "string" ? body.title : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
    status: body.status as "draft" | "public" | "closed" | undefined,
    start_at: body.start_at !== undefined ? (body.start_at as string | null) : undefined,
    end_at: body.end_at !== undefined ? (body.end_at as string | null) : undefined,
    meeting_place: body.meeting_place !== undefined ? (body.meeting_place as string | null) : undefined,
    meeting_lat: body.meeting_lat !== undefined ? (body.meeting_lat as number | null) : undefined,
    meeting_lng: body.meeting_lng !== undefined ? (body.meeting_lng as number | null) : undefined,
    roles,
    capacity: body.capacity !== undefined ? (body.capacity as number | null) : undefined,
    items_to_bring: body.items_to_bring !== undefined ? (body.items_to_bring as string | null) : undefined,
    provisions: body.provisions !== undefined ? (body.provisions as string | null) : undefined,
    notes: body.notes !== undefined ? (body.notes as string | null) : undefined,
  });

  return NextResponse.json(updated);
}
