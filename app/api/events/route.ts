import { NextRequest, NextResponse } from "next/server";
import { mockEvents } from "../../../lib/events-mock";
import { getCreatedEvents } from "../../../lib/created-events-store";
import { filterEventsByRegion, filterEventsByTags } from "../../../lib/events";

function getAllEvents() {
  return [...mockEvents, ...getCreatedEvents()];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefecture = searchParams.get("prefecture") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

  let result = getAllEvents();
  result = filterEventsByRegion(result, prefecture, city);
  result = filterEventsByTags(result, tags);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      imageUrl,
      description,
      date,
      startTime,
      endTime,
      location,
      address,
      price,
      priceNote,
      organizerName,
      organizerContact,
      rainPolicy,
      itemsToBring,
      access,
      childFriendly,
      prefecture,
      city,
      area,
      tags,
      sponsorTicketPrices,
      sponsorPerks,
      prioritySlots,
      englishGuideAvailable,
      capacity,
    } = body;

    if (!title?.trim() || !description?.trim() || !date || !startTime || !location?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "タイトル・説明・日付・開始時刻・場所・住所は必須です" },
        { status: 400 }
      );
    }

    const { addCreatedEvent } = await import("../../../lib/created-events-store");
    const { addDefaultVolunteerRoleForEvent } = await import(
      "../../../lib/created-volunteer-roles-store"
    );
    const { setOrganizerForCreatedEvent } = await import(
      "../../../lib/event-organizers"
    );
    const event = addCreatedEvent({
      title: String(title).trim(),
      imageUrl: imageUrl?.trim() || null,
      description: String(description).trim(),
      date: String(date),
      startTime: String(startTime),
      endTime: endTime ? String(endTime) : undefined,
      location: String(location).trim(),
      address: String(address).trim(),
      price: Number(price) || 0,
      priceNote: priceNote?.trim() || undefined,
      organizerName: String(organizerName || "").trim(),
      organizerContact: organizerContact?.trim() || undefined,
      rainPolicy: rainPolicy?.trim() || undefined,
      itemsToBring: Array.isArray(itemsToBring) ? itemsToBring : [],
      access: access?.trim() || undefined,
      childFriendly: Boolean(childFriendly),
      prefecture: prefecture?.trim() || undefined,
      city: city?.trim() || undefined,
      area: area?.trim() || undefined,
      tags: Array.isArray(tags) ? tags : [],
      sponsorTicketPrices: Array.isArray(sponsorTicketPrices) ? sponsorTicketPrices : [],
      sponsorPerks: sponsorPerks && typeof sponsorPerks === "object" ? sponsorPerks : {},
      prioritySlots: Number(prioritySlots) || 0,
      englishGuideAvailable: Boolean(englishGuideAvailable),
      capacity: capacity != null ? Number(capacity) : undefined,
    });

    setOrganizerForCreatedEvent(event.id);
    addDefaultVolunteerRoleForEvent(event);

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
