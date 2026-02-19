import { NextResponse } from "next/server";
import { getAllVolunteerRoles } from "@/lib/volunteer-roles-mock";
import { getEventById } from "@/lib/events";
import { getOrganizerIdByEventId } from "@/lib/event-organizers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prefecture = searchParams.get("prefecture") ?? undefined;
  const roleType = searchParams.get("roleType") ?? undefined;
  const eventId = searchParams.get("eventId") ?? undefined;

  let roles = getAllVolunteerRoles();

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
