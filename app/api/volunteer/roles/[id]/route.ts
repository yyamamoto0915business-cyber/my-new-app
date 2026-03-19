import { NextResponse } from "next/server";
import { getVolunteerRoleById } from "@/lib/volunteer-roles-mock";
import { getCreatedVolunteerRoleById } from "@/lib/created-volunteer-roles-store";
import { getEventById } from "@/lib/events";
import { getOrganizerIdByEventId } from "@/lib/event-organizers";

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
  const role = mockRole ?? createdRole;

  if (!role) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
