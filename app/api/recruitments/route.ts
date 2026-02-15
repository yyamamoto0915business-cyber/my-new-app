import { NextResponse } from "next/server";
import { mockRecruitments } from "../../../lib/recruitments-mock";
import { mockEvents } from "../../../lib/events-mock";

const ORGANIZER_NAMES: Record<string, string> = {
  o1: "地域振興会",
  o2: "喫茶ポプラ",
  o3: "読書好きの会",
};

export async function GET() {
  const eventsMap = Object.fromEntries(mockEvents.map((e) => [e.id, e]));
  const list = mockRecruitments.map((r) => ({
    ...r,
    events: r.event_id && eventsMap[r.event_id]
      ? { title: eventsMap[r.event_id].title, date: eventsMap[r.event_id].date }
      : null,
    organizers: r.organizer_id
      ? { organization_name: ORGANIZER_NAMES[r.organizer_id] ?? "主催者" }
      : null,
  }));
  return NextResponse.json(list);
}
