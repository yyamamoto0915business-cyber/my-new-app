import type { Event, EventFormData } from "@/lib/events";

/** イベント詳細 → フォーム初期値（新規・編集・複製で共通） */
export function eventToForm(event: Event): EventFormData {
  return {
    title: event.title,
    imageUrl: event.imageUrl ?? "",
    description: event.description,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime ?? "",
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
    registrationDeadline: event.registrationDeadline,
    registrationNote: event.registrationNote,
  };
}
