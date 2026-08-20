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
import { normalizeEventRecurrence, normalizeRecurrenceCount } from "@/lib/event-recurrence";
import {
  normalizeCheckInMethod,
  normalizePaymentMethod,
} from "@/lib/event-pass-settings";
import {
  ONLINE_LOCATION_PLACEHOLDER,
  normalizeEventFormat,
  resolveReminderAtIso,
} from "@/lib/event-online";
import {
  pickOnlineFormFields,
  validateOnlineEventFormFields,
} from "@/lib/event-online-validation";

type Params = { params: Promise<{ id: string }> };

/** DB の "14:00:00" とフォームの "14:00" を同一視する */
function normalizeHm(time: unknown): string {
  const s = String(time ?? "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function toJstTimestamp(dateYmd: string, timeHm: string): number | null {
  const d = String(dateYmd ?? "").trim();
  const t = normalizeHm(timeHm);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  if (!/^\d{2}:\d{2}$/.test(t)) return null;
  const ts = Date.parse(`${d}T${t}:00+09:00`);
  return Number.isNaN(ts) ? null : ts;
}

function isEventEndedJst(event: { date?: string; startTime?: string; endTime?: string | null | undefined }): boolean {
  const endTime = (event.endTime && String(event.endTime).trim()) || (event.startTime ? String(event.startTime) : "00:00");
  const ts = toJstTimestamp(String(event.date ?? ""), endTime);
  if (ts == null) return false;
  return Date.now() > ts;
}

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
    galleryImages,
    description,
    date,
    startTime,
    endTime,
    location,
    address,
    storeId,
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
    paymentMethod,
    checkInMethod,
    passConfigured,
    registrationDeadline,
    registrationNote,
    recurrence,
    recurrenceCount,
    eventFormat,
    onlineService,
    onlineJoinUrl,
    onlineMeetingId,
    onlinePasscode,
    onlineGuideMessage,
    onlineLinkDisplayTiming,
  } = body;

  const format = normalizeEventFormat(eventFormat);
  const locationValue =
    format === "online"
      ? String(location ?? "").trim() || ONLINE_LOCATION_PLACEHOLDER
      : String(location ?? "").trim();
  const addressValue = String(address ?? "").trim();

  const t = String(title ?? "").trim();
  const d = String(description ?? "").trim();
  if (!t || !d || !date || !startTime) {
    return NextResponse.json(
      { error: "タイトル・説明・日付・開始時刻は必須です" },
      { status: 400 }
    );
  }

  const onlineErrors = validateOnlineEventFormFields({
    eventFormat: format,
    onlineService,
    onlineJoinUrl,
    onlineGuideMessage,
    onlineLinkDisplayTiming,
    location: locationValue,
    address: addressValue,
    startTime,
  });
  if (Object.keys(onlineErrors).length > 0) {
    return NextResponse.json(
      { error: Object.values(onlineErrors)[0], errors: onlineErrors },
      { status: 400 }
    );
  }

  const normalizedRecurrence = normalizeEventRecurrence(recurrence);
  const normalizedRecurrenceCount =
    normalizedRecurrence === "none"
      ? null
      : normalizeRecurrenceCount(recurrenceCount, normalizedRecurrence);

  const formData: EventFormData = {
    title: String(title ?? "").trim(),
    imageUrl: (typeof imageUrl === "string" ? imageUrl.trim() : "") || "",
    galleryImages: Array.isArray(galleryImages) ? galleryImages.filter((x): x is string => typeof x === "string") : [],
    description: String(description ?? "").trim(),
    date: String(date),
    startTime: normalizeHm(startTime),
    endTime: endTime ? normalizeHm(endTime) : "",
    location: locationValue,
    address: addressValue,
    storeId:
      typeof storeId === "string" && storeId.trim()
        ? storeId.trim()
        : null,
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
    capacity: capacity != null && capacity !== "" ? Number(capacity) : undefined,
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
    paymentMethod: normalizePaymentMethod(paymentMethod),
    checkInMethod: normalizeCheckInMethod(checkInMethod),
    passConfigured: Boolean(passConfigured),
    registrationDeadline:
      registrationDeadline && String(registrationDeadline).trim()
        ? new Date(String(registrationDeadline)).toISOString()
        : undefined,
    registrationNote:
      registrationNote && String(registrationNote).trim()
        ? String(registrationNote).trim()
        : undefined,
    recurrence: normalizedRecurrence,
    recurrenceCount: normalizedRecurrenceCount,
    ...pickOnlineFormFields({
      eventFormat: format,
      onlineService,
      onlineJoinUrl,
      onlineMeetingId,
      onlinePasscode,
      onlineGuideMessage,
      onlineLinkDisplayTiming,
    }),
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

      const existing = await fetchEventById(supabase, id);
      if (!existing) {
        return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
      }

      const scheduleChanged =
        String(existing.date ?? "") !== String(formData.date ?? "") ||
        normalizeHm(existing.startTime) !== normalizeHm(formData.startTime) ||
        normalizeHm(existing.endTime) !== normalizeHm(formData.endTime);

      if (scheduleChanged) {
        const existingWasPublished = Boolean(existing.publishedAt);
        const ended = isEventEndedJst(existing);
        if (existingWasPublished || ended) {
          return NextResponse.json(
            {
              error:
                "公開済み、または終了したイベントの日程は変更できません。新しいイベントとして複製・作成してください。",
              code: "SCHEDULE_CHANGE_NOT_ALLOWED",
            },
            { status: 400 }
          );
        }

        const newStartTs = toJstTimestamp(formData.date, formData.startTime);
        if (newStartTs == null) {
          return NextResponse.json(
            { error: "日付または開始時刻の形式が正しくありません" },
            { status: 400 }
          );
        }
        if (newStartTs < Date.now()) {
          return NextResponse.json(
            { error: "過去の日時には設定できません" },
            { status: 400 }
          );
        }
      }

      await updateEvent(supabase, id, formData);

      // 開催日時変更時はリマインダーの remind_at を再計算
      if (scheduleChanged) {
        const remindAt = resolveReminderAtIso(formData.date, formData.startTime);
        if (remindAt) {
          await supabase
            .from("event_reminder_prefs")
            .update({
              remind_at: remindAt,
              notified_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("event_id", id)
            .eq("enabled", true);
        }
      }

      const updated = await fetchEventById(supabase, id);
      return NextResponse.json(updated ?? { id, ...formData });
    } catch (e) {
      console.error("organizer events PATCH:", e);
      const message =
        e instanceof Error && e.message.trim()
          ? e.message
          : "更新に失敗しました";
      return NextResponse.json({ error: message }, { status: 500 });
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
