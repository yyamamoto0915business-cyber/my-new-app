import { NextRequest, NextResponse } from "next/server";
import { getCollectionBySlug } from "../../../../lib/featured-collections-store";
import { getEventById } from "../../../../lib/events";
import type { Event } from "../../../../lib/db/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) {
    return NextResponse.json({ error: "特集が見つかりません" }, { status: 404 });
  }

  const events: Event[] = [];
  for (const eid of collection.eventIds) {
    const e = getEventById(eid);
    if (e) events.push(e);
  }

  return NextResponse.json({ ...collection, events }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
