import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import {
  fetchEventById,
  updateEvent,
  deleteEvent,
  getOrganizerIdByEventId,
} from "@/lib/db/events";
import {
  getCreatedEventById,
  updateCreatedEvent,
  deleteCreatedEvent,
} from "@/lib/created-events-store";
import { getEventById } from "@/lib/events";
import type { EventFormData } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

/** GET: 主催者用イベント1件取得（下書き含む） */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (supabase) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const eventOrganizerId = await getOrganizerIdByEventId(supabase, id);
      if (!organizerId || eventOrganizerId !== organizerId) {
        return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
      }
      const event = await fetchEventById(supabase, id);
      if (!event) return NextResponse.json(null, { status: 404 });
      return NextResponse.json(event);
    } catch (e) {
      console.error("organizer events GET:", e);
      return NextResponse.json(
        { error: "イベントの取得に失敗しました" },
        { status: 500 }
      );
    }
  }

  const created = getCreatedEventById(id);
  if (created) return NextResponse.json(created);
  const fromStore = getEventById(id);
  if (fromStore) return NextResponse.json(fromStore);
  return NextResponse.json(null, { status: 404 });
}

/** PATCH: 主催者用イベント更新 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 }
    );
  }

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

  const t = String(title ?? "").trim();
  const d = String(description ?? "").trim();
  const loc = String(location ?? "").trim();
  const addr = String(address ?? "").trim();
  if (!t || !d || !date || !startTime || !loc || !addr) {
    return NextResponse.json(
      { error: "タイトル・説明・日付・開始時刻・場所・住所は必須です" },
      { status: 400 }
    );
  }

  const formData: EventFormData = {
    title: String(title ?? "").trim(),
    imageUrl: (typeof imageUrl === "string" ? imageUrl.trim() : "") || "",
    description: String(description ?? "").trim(),
    date: String(date),
    startTime: String(startTime),
    endTime: endTime ? String(endTime) : "",
    location: String(location ?? "").trim(),
    address: String(address ?? "").trim(),
    price: Number(price) || 0,
    priceNote: (typeof priceNote === "string" ? priceNote.trim() : "") || "",
    organizerName: String(organizerName ?? "").trim(),
    organizerContact: (typeof organizerContact === "string" ? organizerContact.trim() : "") || "",
    rainPolicy: (typeof rainPolicy === "string" ? rainPolicy.trim() : "") || "",
    itemsToBring: Array.isArray(itemsToBring) ? itemsToBring : [],
    access: (typeof access === "string" ? access.trim() : "") || "",
    childFriendly: Boolean(childFriendly),
    prefecture: (typeof prefecture === "string" ? prefecture.trim() : "") || "",
    city: (typeof city === "string" ? city.trim() : "") || "",
    area: (typeof area === "string" ? area.trim() : "") || "",
    tags: Array.isArray(tags) ? tags : [],
    sponsorTicketPrices: Array.isArray(sponsorTicketPrices) ? sponsorTicketPrices : [],
    sponsorPerks: sponsorPerks && typeof sponsorPerks === "object" ? (sponsorPerks as Record<number, string>) : {},
    prioritySlots: Number(prioritySlots) || 0,
    englishGuideAvailable: Boolean(englishGuideAvailable),
    capacity: capacity != null ? Number(capacity) : undefined,
    requiresRegistration:
      participationMode === "required" ||
      requiresRegistration === true ||
      String(requiresRegistration).toLowerCase() === "true",
    participationMode:
      participationMode === "required" ||
      participationMode === "optional" ||
      participationMode === "none"
        ? (participationMode as "required" | "optional" | "none")
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

  const supabase = await createClient();
  if (supabase) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const eventOrganizerId = await getOrganizerIdByEventId(supabase, id);
      if (!organizerId || eventOrganizerId !== organizerId) {
        return NextResponse.json(
          { error: "イベントが見つかりません" },
          { status: 404 }
        );
      }
      await updateEvent(supabase, id, formData);
      const updated = await fetchEventById(supabase, id);
      return NextResponse.json(updated ?? { id, ...formData });
    } catch (e) {
      console.error("organizer events PATCH:", e);
      return NextResponse.json(
        { error: "更新に失敗しました" },
        { status: 500 }
      );
    }
  }

  const updated = updateCreatedEvent(id, formData);
  if (!updated) {
    return NextResponse.json(
      { error: "イベントが見つかりません" },
      { status: 404 }
    );
  }
  return NextResponse.json(updated);
}

/** DELETE: 主催者用イベント削除 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (supabase) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const eventOrganizerId = await getOrganizerIdByEventId(supabase, id);
      if (!organizerId || eventOrganizerId !== organizerId) {
        return NextResponse.json(
          { error: "イベントが見つかりません" },
          { status: 404 }
        );
      }
      await deleteEvent(supabase, id);
      return NextResponse.json({ success: true });
    } catch (e) {
      console.error("organizer events DELETE:", e);
      return NextResponse.json(
        { error: "削除に失敗しました" },
        { status: 500 }
      );
    }
  }

  const deleted = deleteCreatedEvent(id);
  if (!deleted) {
    return NextResponse.json(
      { error: "イベントが見つかりません" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true });
}
