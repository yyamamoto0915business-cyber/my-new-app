import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockEvents } from "../../../lib/events-mock";
import { getCreatedEvents } from "../../../lib/created-events-store";
import { filterEventsByRegion, filterEventsByTags } from "../../../lib/events";
import { fetchEvents } from "../../../lib/db/events";

function getFallbackEvents() {
  return [...mockEvents, ...getCreatedEvents()];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefecture = searchParams.get("prefecture") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

  const supabase = await createClient();
  let result;

  const isProduction = process.env.NODE_ENV === "production";

  if (supabase) {
    try {
      const dbEvents = await fetchEvents(supabase);
      // 本番環境では mock / created ストアには絶対にフォールバックしない
      if (isProduction) {
        result = dbEvents;
      } else {
        result = dbEvents.length > 0 ? dbEvents : getFallbackEvents();
      }
    } catch (e) {
      console.error("events GET:", e);
      result = isProduction ? [] : getFallbackEvents();
    }
  } else {
    result = isProduction ? [] : getFallbackEvents();
  }

  result = filterEventsByRegion(result, prefecture, city);
  result = filterEventsByTags(result, tags);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
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
      requiresRegistration,
      participationMode,
      registrationDeadline,
      registrationNote,
    } = body;

    if (!title?.trim() || !description?.trim() || !date || !startTime || !location?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "タイトル・説明・日付・開始時刻・場所・住所は必須です" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { getApiUser } = await import("../../../lib/api-auth");
    const { getOrganizerIdByProfileId } = await import("../../../lib/db/recruitments-mvp");
    const { createEvent } = await import("../../../lib/db/events");
    const { addCreatedEvent } = await import("../../../lib/created-events-store");
    const { addDefaultVolunteerRoleForEvent } = await import(
      "../../../lib/created-volunteer-roles-store"
    );
    const { setOrganizerForCreatedEvent } = await import(
      "../../../lib/event-organizers"
    );

    const formData = {
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
      requiresRegistration:
        (participationMode === "required" ||
          requiresRegistration === true ||
          requiresRegistration === "true" ||
          String(requiresRegistration).toLowerCase() === "true"),
      participationMode:
        participationMode === "required" ||
        participationMode === "optional" ||
        participationMode === "none"
          ? participationMode
          : requiresRegistration
            ? "required"
            : "none",
      registrationDeadline:
        registrationDeadline && String(registrationDeadline).trim()
          ? new Date(String(registrationDeadline)).toISOString()
          : undefined,
      registrationNote:
        registrationNote && String(registrationNote).trim()
          ? String(registrationNote).trim()
          : undefined,
    };

    const isProduction = process.env.NODE_ENV === "production";

    if (supabase) {
      // supabase 利用可能な環境では必ずDBに保存する
      const user = await getApiUser();
      if (!user) {
        return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
      }
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      if (!organizerId) {
        return NextResponse.json(
          { error: "主催者登録が必要です。主催者ページから主催者登録を行ってから再度お試しください。" },
          { status: 403 }
        );
      }
      const event = await createEvent(supabase, organizerId, formData);
      return NextResponse.json(event, { status: 201 });
    }

    // supabase 未設定: 本番環境ではエラー、開発環境のみフォールバック
    if (isProduction) {
      return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
    }
    const event = addCreatedEvent(formData);
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
