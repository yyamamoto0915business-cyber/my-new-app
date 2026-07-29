import { NextResponse } from "next/server";
import { getVolunteerRoleById } from "@/lib/volunteer-roles-mock";
import { getCreatedVolunteerRoleById } from "@/lib/created-volunteer-roles-store";
import { getEventById } from "@/lib/events";
import { getOrganizerIdByEventId } from "@/lib/event-organizers";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicVolunteerRecruitmentById } from "@/lib/db/recruitments-mvp";
import {
  isRecruitmentRowId,
  isVolunteerDiscoveryType,
  recruitmentRowToVolunteerRole,
  type VolunteerRoleFromRecruitment,
} from "@/lib/map-recruitment-to-volunteer-role";
import {
  findRecruitmentIdForVolunteerRole,
  findRecruitmentIdForVolunteerRoleAsync,
} from "@/lib/volunteer-role-recruitment-bridge";
import type { VolunteerRole } from "@/lib/volunteer-roles-mock";
import type { CreatedVolunteerRole } from "@/lib/created-volunteer-roles-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const isProduction = process.env.NODE_ENV === "production";
  const mockRole = isProduction ? null : getVolunteerRoleById(id);
  const createdRole = getCreatedVolunteerRoleById(id);
  let role: VolunteerRole | CreatedVolunteerRole | VolunteerRoleFromRecruitment | null =
    mockRole ?? createdRole;

  const supabase = await createClient();

  if (!role && isRecruitmentRowId(id) && supabase) {
    try {
      const row = await fetchPublicVolunteerRecruitmentById(supabase, id);
      if (row && isVolunteerDiscoveryType(row.type)) {
        role = recruitmentRowToVolunteerRole(row);
      }
    } catch (e) {
      console.error("volunteer/roles/[id]: fetchPublicVolunteerRecruitmentById", e);
    }
  }

  if (!role) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let recruitmentId: string | null = isRecruitmentRowId(id)
    ? id
    : findRecruitmentIdForVolunteerRole(id);
  if (!recruitmentId && !isRecruitmentRowId(id) && supabase) {
    const oid = getOrganizerIdByEventId(role.eventId);
    if (oid) {
      recruitmentId = await findRecruitmentIdForVolunteerRoleAsync(
        supabase,
        id,
        oid
      );
    }
  }

  const roleOrganizerId = (role as { organizerId?: string | null }).organizerId;
  const organizerId =
    (typeof roleOrganizerId === "string" && roleOrganizerId.length > 0
      ? roleOrganizerId
      : null) ?? getOrganizerIdByEventId(role.eventId);

  const existingEvent = (role as { event?: unknown }).event;
  const event =
    existingEvent !== undefined
      ? existingEvent
      : (() => {
          const e = getEventById(role.eventId);
          return e
            ? {
                id: e.id,
                title: e.title,
                date: e.date,
                prefecture: e.prefecture,
              }
            : null;
        })();

  // 主催者プロフィールはクライアント側で追加取得（ここだとタイムアウトしやすい）
  return NextResponse.json({
    ...role,
    event,
    recruitmentId,
    organizerId: organizerId ?? null,
    organizerName: null,
    organizerAvatarUrl: null,
    organizerBio: null,
    organizerRegion: null,
  });
}
