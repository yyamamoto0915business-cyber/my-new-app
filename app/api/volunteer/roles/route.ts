import { NextResponse } from "next/server";
import { getAllVolunteerRoles } from "@/lib/volunteer-roles-mock";
import { getCreatedVolunteerRoles } from "@/lib/created-volunteer-roles-store";
import { getEventById } from "@/lib/events";
import { getOrganizerIdByEventId } from "@/lib/event-organizers";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicRecruitments } from "@/lib/db/recruitments-mvp";
import {
  isVolunteerDiscoveryType,
  recruitmentRowToVolunteerRole,
  type VolunteerRoleFromRecruitment,
} from "@/lib/map-recruitment-to-volunteer-role";
import type { VolunteerRole } from "@/lib/volunteer-roles-mock";
import type { CreatedVolunteerRole } from "@/lib/created-volunteer-roles-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prefecture = searchParams.get("prefecture") ?? undefined;
  const roleType = searchParams.get("roleType") ?? undefined;
  const eventId = searchParams.get("eventId") ?? undefined;

  const isProduction = process.env.NODE_ENV === "production";
  // 本番では初期シード（モック）を公開しない
  let roles: (VolunteerRole | CreatedVolunteerRole | VolunteerRoleFromRecruitment)[] = [
    ...(isProduction ? [] : getAllVolunteerRoles()),
    ...getCreatedVolunteerRoles(),
  ];

  const supabase = await createClient();
  if (supabase) {
    try {
      const fromDb = await fetchPublicRecruitments(supabase, { limit: 100 });
      for (const row of fromDb) {
        if (!isVolunteerDiscoveryType(row.type)) continue;
        roles.push(recruitmentRowToVolunteerRole(row));
      }
    } catch (e) {
      console.error("volunteer/roles: fetchPublicRecruitments", e);
    }
  }

  if (eventId) {
    roles = roles.filter((r) => r.eventId === eventId);
  }
  if (roleType) {
    roles = roles.filter((r) => r.roleType === roleType);
  }
  if (prefecture) {
    roles = roles.filter((r) => {
      const event = getEventById(r.eventId);
      return event?.prefecture === prefecture;
    });
  }

  const withEvent = roles.map((r) => {
    const oid = (r as { organizerId?: string | null }).organizerId;
    if (typeof oid === "string" && oid.length > 0) {
      return { ...r, organizerId: oid };
    }
    const event = getEventById(r.eventId);
    const organizerId = getOrganizerIdByEventId(r.eventId);
    return {
      ...r,
      event: event
        ? { id: event.id, title: event.title, date: event.date, prefecture: event.prefecture }
        : null,
      organizerId: organizerId ?? null,
    };
  });

  return NextResponse.json(withEvent);
}
