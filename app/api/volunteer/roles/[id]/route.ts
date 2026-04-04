import { NextResponse } from "next/server";
import { getVolunteerRoleById } from "@/lib/volunteer-roles-mock";
import { getCreatedVolunteerRoleById } from "@/lib/created-volunteer-roles-store";
import { getEventById } from "@/lib/events";
import { getOrganizerIdByEventId } from "@/lib/event-organizers";
import { createClient } from "@/lib/supabase/server";
import { fetchRecruitmentById } from "@/lib/db/recruitments-mvp";
import {
  isRecruitmentRowId,
  isVolunteerDiscoveryType,
  recruitmentRowToVolunteerRole,
  type VolunteerRoleFromRecruitment,
} from "@/lib/map-recruitment-to-volunteer-role";
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

  if (!role && isRecruitmentRowId(id)) {
    const supabase = await createClient();
    if (supabase) {
      try {
        const row = await fetchRecruitmentById(supabase, id);
        if (
          row &&
          row.status === "public" &&
          isVolunteerDiscoveryType(row.type)
        ) {
          role = recruitmentRowToVolunteerRole(row);
        }
      } catch (e) {
        console.error("volunteer/roles/[id]: fetchRecruitmentById", e);
      }
    }
  }

  if (!role) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const oid = (role as { organizerId?: string | null }).organizerId;
  if (typeof oid === "string" && oid.length > 0) {
    return NextResponse.json({
      ...role,
      organizerId: oid,
    });
  }

  const event = getEventById(role.eventId);
  const organizerId = getOrganizerIdByEventId(role.eventId);

  const withEvent = {
    ...role,
    event: event
      ? {
          id: event.id,
          title: event.title,
          date: event.date,
          prefecture: event.prefecture,
        }
      : null,
    organizerId: organizerId ?? null,
  };

  return NextResponse.json(withEvent);
}
