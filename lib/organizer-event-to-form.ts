import type { Event, EventFormData } from "@/lib/events";

/** DB の "14:00:00" などを time input 向けの "14:00" に揃える */
function normalizeHm(time: string | null | undefined): string {
  const s = String(time ?? "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

/** イベント詳細 → フォーム初期値（新規・編集・複製で共通） */
export function eventToForm(event: Event): EventFormData {
  return {
    title: event.title,
    imageUrl: event.imageUrl ?? "",
    description: event.description,
    date: event.date,
    startTime: normalizeHm(event.startTime),
    endTime: event.endTime ? normalizeHm(event.endTime) : "",
    location: event.location,
    address: event.address,
    price: event.price ?? 0,
    priceNote: event.priceNote ?? "",
    organizerName: event.organizerName ?? "",
    organizerContact: event.organizerContact ?? "",
    rainPolicy: event.rainPolicy ?? "",
    itemsToBring: event.itemsToBring ?? [],
    access: event.access ?? "",
    childFriendly: event.childFriendly ?? false,
    prefecture: event.prefecture ?? "",
    city: event.city ?? "",
    area: event.area ?? "",
    tags: event.tags ?? [],
    sponsorTicketPrices: event.sponsorTicketPrices ?? [],
    sponsorPerks: event.sponsorPerks ?? {},
    prioritySlots: event.prioritySlots ?? 0,
    englishGuideAvailable: event.englishGuideAvailable ?? false,
    capacity: event.capacity,
    requiresRegistration: event.requiresRegistration ?? false,
    participationMode: event.participationMode ?? "none",
    paymentMethod: event.paymentMethod ?? null,
    checkInMethod: event.checkInMethod ?? null,
    passConfigured: event.passConfigured ?? false,
    registrationDeadline: event.registrationDeadline,
    registrationNote: event.registrationNote,
    recurrence: event.recurrence ?? "none",
    recurrenceCount: event.recurrenceCount ?? null,
    eventFormat: event.eventFormat ?? "onsite",
    onlineService: event.onlineService ?? null,
    onlineJoinUrl: event.onlineJoinUrl ?? "",
    onlineMeetingId: event.onlineMeetingId ?? "",
    onlinePasscode: event.onlinePasscode ?? "",
    onlineGuideMessage: event.onlineGuideMessage ?? "",
    onlineLinkVisibility: event.onlineLinkVisibility ?? "pass_holders_only",
    onlineLinkDisplayTiming: event.onlineLinkDisplayTiming ?? "15_minutes_before",
    publicPageLinkVisible: false,
  };
}
