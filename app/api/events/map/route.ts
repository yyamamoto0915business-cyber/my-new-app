import { createClient } from "../../../../lib/supabase/server";
import { fetchEvents } from "../../../../lib/db/events";
import { NextResponse } from "next/server";
import { mockEvents } from "../../../../lib/events-mock";
import { calcDistanceKm } from "../../../../lib/events";
import type { Event } from "../../../../lib/db/types";

const DEFAULT_LAT = 35.6812;
const DEFAULT_LNG = 139.7671;
const DEFAULT_RADIUS_KM = 50;
const MAX_LIMIT = 200;

type EventWithDistance = Event & { distanceKm?: number };

function filterByRadius(
  events: EventWithDistance[],
  lat: number,
  lng: number,
  radiusKm: number
): EventWithDistance[] {
  return events
    .filter((e) => e.latitude != null && e.longitude != null)
    .map((e) => ({
      ...e,
      distanceKm: calcDistanceKm(lat, lng, e.latitude!, e.longitude!),
    }))
    .filter((e) => e.distanceKm! <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

function filterByDateRange(
  events: EventWithDistance[],
  start?: string,
  end?: string
): EventWithDistance[] {
  if (!start && !end) return events;
  const today = new Date().toISOString().split("T")[0];
  const startStr = start ?? today;
  const endStr = end ?? "9999-12-31";
  return events.filter(
    (e) => e.date >= startStr && e.date <= endStr
  );
}

function filterByPrice(
  events: EventWithDistance[],
  price: "all" | "free" | "paid"
): EventWithDistance[] {
  if (price === "all") return events;
  if (price === "free") return events.filter((e) => e.price === 0);
  return events.filter((e) => e.price > 0);
}

function filterByChildFriendly(
  events: EventWithDistance[],
  childFriendly: boolean
): EventWithDistance[] {
  if (!childFriendly) return events;
  return events.filter((e) => e.childFriendly);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const radiusKm = Math.min(
    parseInt(searchParams.get("radius") ?? String(DEFAULT_RADIUS_KM), 10) || DEFAULT_RADIUS_KM,
    DEFAULT_RADIUS_KM
  );
  const start = searchParams.get("start") ?? undefined;
  const end = searchParams.get("end") ?? undefined;
  const price = (searchParams.get("price") as "all" | "free" | "paid") ?? "all";
  const childFriendly = searchParams.get("child_friendly") === "true";
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? "100", 10) || 100,
    MAX_LIMIT
  );
  const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;

  const lat = latParam ? parseFloat(latParam) : DEFAULT_LAT;
  const lng = lngParam ? parseFloat(lngParam) : DEFAULT_LNG;

  let events: EventWithDistance[] = [];
  try {
    const supabase = await createClient();
    if (supabase) {
      events = await fetchEvents(supabase);
    } else {
      events = mockEvents as EventWithDistance[];
    }
  } catch {
    events = mockEvents as EventWithDistance[];
  }

  events = filterByDateRange(events, start, end);
  events = filterByPrice(events, price);
  events = filterByChildFriendly(events, childFriendly);

  if (latParam && lngParam) {
    events = filterByRadius(events, lat, lng, radiusKm);
  } else {
    events = events
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({
        ...e,
        distanceKm: calcDistanceKm(lat, lng, e.latitude!, e.longitude!),
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  const total = events.length;
  const paginated = events.slice(offset, offset + limit);

  return NextResponse.json({
    events: paginated,
    total,
    hasMore: offset + limit < total,
  });
}
