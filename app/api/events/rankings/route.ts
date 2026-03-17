import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockEvents } from "../../../../lib/events-mock";
import { getCreatedEvents } from "../../../../lib/created-events-store";
import { getRankedEvents, type RankingType } from "../../../../lib/events";
import { fetchEvents } from "@/lib/db/events";

function getAllEvents() {
  return [...mockEvents, ...getCreatedEvents()];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") ?? "newest") as RankingType;
  const limit = Math.min(Number(searchParams.get("limit")) || 10, 30);

  if (!["newest", "popular", "satisfaction"].includes(type)) {
    return NextResponse.json(
      { error: "type は newest, popular, satisfaction のいずれかです" },
      { status: 400 }
    );
  }

  const isProduction = process.env.NODE_ENV === "production";
  let events = getAllEvents();
  const supabase = await createClient();
  if (supabase) {
    try {
      const dbEvents = await fetchEvents(supabase);
      events = isProduction ? dbEvents : (dbEvents.length > 0 ? dbEvents : events);
    } catch (e) {
      console.error("events rankings GET:", e);
      events = isProduction ? [] : events;
    }
  } else {
    events = isProduction ? [] : events;
  }
  const ranked = getRankedEvents(events, type, limit);

  return NextResponse.json(ranked, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
