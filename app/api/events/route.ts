import { NextRequest, NextResponse } from "next/server";
import { mockEvents } from "../../../lib/events-mock";
import { filterEventsByRegion, filterEventsByTags } from "../../../lib/events";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefecture = searchParams.get("prefecture") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

  let result = mockEvents;
  result = filterEventsByRegion(result, prefecture, city);
  result = filterEventsByTags(result, tags);
  return NextResponse.json(result);
}
