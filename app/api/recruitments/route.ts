import { NextRequest, NextResponse } from "next/server";
import { mockRecruitments } from "../../../lib/recruitments-mock";
import { mockEvents } from "../../../lib/events-mock";

const ORGANIZER_NAMES: Record<string, string> = {
  o1: "地域振興会",
  o2: "喫茶ポプラ",
  o3: "読書好きの会",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefecture = searchParams.get("prefecture") ?? undefined;
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  const type = searchParams.get("type") ?? undefined;
  const dateFrom = searchParams.get("date_from") ?? undefined;
  const dateTo = searchParams.get("date_to") ?? undefined;
  const techRole = searchParams.get("tech_role") ?? undefined;

  const eventsMap = Object.fromEntries(mockEvents.map((e) => [e.id, e]));
  let list = mockRecruitments.map((r) => ({
    ...r,
    event: r.event_id && eventsMap[r.event_id] ? eventsMap[r.event_id] : null,
    events: r.event_id && eventsMap[r.event_id]
      ? { title: eventsMap[r.event_id].title, date: eventsMap[r.event_id].date }
      : null,
    organizers: r.organizer_id
      ? { organization_name: ORGANIZER_NAMES[r.organizer_id] ?? "主催者" }
      : null,
  }));

  if (prefecture) {
    list = list.filter((r) => r.event?.prefecture === prefecture);
  }
  if (tags.length) {
    list = list.filter((r) => {
      const eventTags = r.event?.tags ?? [];
      return tags.every((t) => eventTags.includes(t));
    });
  }
  if (type) {
    list = list.filter((r) => r.type === type);
  }
  if (dateFrom || dateTo) {
    list = list.filter((r) => {
      const date = r.event?.date;
      if (!date) return true;
      if (dateFrom && date < dateFrom) return false;
      if (dateTo && date > dateTo) return false;
      return true;
    });
  }
  if (techRole) {
    list = list.filter((r) => (r as { tech_role?: string }).tech_role === techRole);
  }

  return NextResponse.json(list);
}
