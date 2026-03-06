import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbEvent, Event, EventFormData } from "./types";

function participationModeFromDb(
  db: DbEvent & { participation_mode?: string | null }
): "required" | "optional" | "none" {
  const mode = db.participation_mode;
  if (mode === "required" || mode === "optional" || mode === "none")
    return mode;
  return db.requires_registration ? "required" : "none";
}

function dbEventToEvent(
  db: DbEvent & { image_url?: string | null; participation_mode?: string | null },
  organizerName: string,
  organizerContact?: string
): Event {
  const participationMode = participationModeFromDb(db);
  return {
    id: db.id,
    status: db.status as "draft" | "published" | undefined,
    publishedAt: db.published_at ?? undefined,
    title: db.title,
    imageUrl: db.image_url?.trim() || null,
    description: db.description,
    date: db.date,
    startTime: db.start_time,
    endTime: db.end_time ?? undefined,
    location: db.location,
    address: db.address,
    price: db.price,
    priceNote: db.price_note ?? undefined,
    organizerName,
    organizerContact,
    rainPolicy: db.rain_policy ?? undefined,
    itemsToBring: db.items_to_bring ?? undefined,
    access: db.access ?? undefined,
    childFriendly: db.child_friendly ?? false,
    latitude: db.latitude ?? undefined,
    longitude: db.longitude ?? undefined,
    prefecture: db.prefecture ?? undefined,
    city: db.city ?? undefined,
    area: db.area ?? undefined,
    tags: db.tags ?? undefined,
    sponsorTicketPrices: db.sponsor_ticket_prices ?? undefined,
    sponsorPerks: db.sponsor_perks ?? undefined,
    prioritySlots: db.priority_slots ?? undefined,
    englishGuideAvailable: db.english_guide_available ?? undefined,
    capacity: db.capacity ?? undefined,
    requiresRegistration: participationMode === "required",
    participationMode,
    registrationDeadline: db.registration_deadline ?? undefined,
    registrationNote: db.registration_note ?? undefined,
    createdAt: db.created_at,
  };
}

export async function fetchEvents(supabase: SupabaseClient): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organizers (
        organization_name,
        contact_email,
        contact_phone,
        profiles (
          display_name,
          email
        )
      )
    `
    )
    .eq("status", "published")
    .order("date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const org = row.organizers as {
      organization_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      profiles: { display_name: string | null; email: string | null };
    } | null;
    const name =
      org?.organization_name ??
      org?.profiles?.display_name ??
      org?.profiles?.email ??
      "主催者";
    const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
    return dbEventToEvent(row as unknown as DbEvent, name, contact);
  });
}

export async function getOrganizerIdByEventId(
  supabase: SupabaseClient,
  eventId: string
): Promise<string | null> {
  const { data: ev } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", eventId)
    .single();
  return ev?.organizer_id ?? null;
}

export async function getOrganizerProfileId(
  supabase: SupabaseClient,
  eventId: string
): Promise<string | null> {
  const organizerId = await getOrganizerIdByEventId(supabase, eventId);
  if (!organizerId) return null;
  const { data: org } = await supabase
    .from("organizers")
    .select("profile_id")
    .eq("id", organizerId)
    .single();
  return org?.profile_id ?? null;
}

export async function isOrganizerOfEvent(
  supabase: SupabaseClient,
  eventId: string,
  profileId: string
): Promise<boolean> {
  const { data: org } = await supabase
    .from("organizers")
    .select("id")
    .eq("profile_id", profileId)
    .single();
  if (!org) return false;
  const { data: ev } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("organizer_id", org.id)
    .maybeSingle();
  return !!ev;
}

export async function fetchEventById(
  supabase: SupabaseClient,
  id: string
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organizers (
        organization_name,
        contact_email,
        contact_phone,
        profiles (
          display_name,
          email
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const org = (data as Record<string, unknown>).organizers as {
    organization_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    profiles: { display_name: string | null; email: string | null };
  } | null;
  const name =
    org?.organization_name ??
    org?.profiles?.display_name ??
    org?.profiles?.email ??
    "主催者";
  const contact = org?.contact_phone ?? org?.contact_email ?? undefined;

  return dbEventToEvent(data as unknown as DbEvent, name, contact);
}

/** 公開イベント1件取得（status=published のみ。公開詳細ページ用） */
export async function fetchPublishedEventById(
  supabase: SupabaseClient,
  id: string
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organizers (
        organization_name,
        contact_email,
        contact_phone,
        profiles (
          display_name,
          email
        )
      )
    `
    )
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !data) return null;

  const org = (data as Record<string, unknown>).organizers as {
    organization_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    profiles: { display_name: string | null; email: string | null };
  } | null;
  const name =
    org?.organization_name ??
    org?.profiles?.display_name ??
    org?.profiles?.email ??
    "主催者";
  const contact = org?.contact_phone ?? org?.contact_email ?? undefined;

  return dbEventToEvent(data as unknown as DbEvent, name, contact);
}

/** 公開イベントをIDリストで取得（マイページの参加予定・気になる一覧用） */
export async function fetchPublishedEventsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Event[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organizers (
        organization_name,
        contact_email,
        contact_phone,
        profiles (
          display_name,
          email
        )
      )
    `
    )
    .in("id", ids)
    .eq("status", "published");

  if (error) return [];
  const today = new Date().toISOString().split("T")[0];
  return (data ?? [])
    .map((row: Record<string, unknown>) => {
      const org = row.organizers as {
        organization_name: string | null;
        contact_email: string | null;
        contact_phone: string | null;
        profiles: { display_name: string | null; email: string | null };
      } | null;
      const name =
        org?.organization_name ??
        org?.profiles?.display_name ??
        org?.profiles?.email ??
        "主催者";
      const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
      return dbEventToEvent(row as unknown as DbEvent, name, contact);
    })
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || ""));
}

export async function fetchEventsByOrganizer(
  supabase: SupabaseClient,
  organizerId: string
): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organizers!inner (
        organization_name,
        contact_email,
        contact_phone,
        profiles (
          display_name,
          email
        )
      )
    `
    )
    .eq("organizer_id", organizerId)
    .order("date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const org = row.organizers as {
      organization_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      profiles: { display_name: string | null; email: string | null };
    };
    const name =
      org?.organization_name ??
      org?.profiles?.display_name ??
      org?.profiles?.email ??
      "主催者";
    const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
    return dbEventToEvent(row as unknown as DbEvent, name, contact);
  });
}

export async function createEvent(
  supabase: SupabaseClient,
  organizerId: string,
  form: EventFormData
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      organizer_id: organizerId,
      status: "draft",
      title: form.title,
      description: form.description,
      date: form.date,
      start_time: form.startTime,
      end_time: form.endTime || null,
      location: form.location,
      address: form.address,
      price: form.price,
      price_note: form.priceNote || null,
      rain_policy: form.rainPolicy || null,
      items_to_bring: form.itemsToBring?.length ? form.itemsToBring : null,
      access: form.access || null,
      child_friendly: form.childFriendly ?? false,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
      prefecture: form.prefecture || null,
      city: form.city || null,
      area: form.area || null,
      tags: form.tags?.length ? form.tags : null,
      sponsor_ticket_prices: form.sponsorTicketPrices?.length ? form.sponsorTicketPrices : null,
      sponsor_perks: form.sponsorPerks && Object.keys(form.sponsorPerks).length ? form.sponsorPerks : null,
      priority_slots: form.prioritySlots ?? null,
      english_guide_available: form.englishGuideAvailable ?? false,
      capacity: form.capacity ?? null,
      requires_registration: (form.participationMode ?? (form.requiresRegistration ? "required" : "none")) === "required",
      participation_mode: form.participationMode ?? (form.requiresRegistration ? "required" : "none"),
      registration_deadline: form.registrationDeadline || null,
      registration_note: form.registrationNote?.trim() || null,
      image_url: form.imageUrl?.trim() || null,
    })
    .select("id")
    .single();

  if (error) throw error;

  const { createSponsorTiersForEvent } = await import("./sponsors");
  await createSponsorTiersForEvent(supabase, data.id);

  const event = await fetchEventById(supabase, data.id);
  if (!event) throw new Error("Failed to fetch created event");
  return event;
}

function formToDb(form: EventFormData): Record<string, unknown> {
  return {
    title: form.title,
    description: form.description,
    date: form.date,
    start_time: form.startTime,
    end_time: form.endTime || null,
    location: form.location,
    address: form.address,
    price: form.price,
    price_note: form.priceNote || null,
    rain_policy: form.rainPolicy || null,
    items_to_bring: form.itemsToBring?.length ? form.itemsToBring : null,
    access: form.access || null,
    child_friendly: form.childFriendly ?? false,
    latitude: form.latitude ?? null,
    longitude: form.longitude ?? null,
    prefecture: form.prefecture || null,
    city: form.city || null,
    area: form.area || null,
    tags: form.tags?.length ? form.tags : null,
    sponsor_ticket_prices: form.sponsorTicketPrices?.length ? form.sponsorTicketPrices : null,
    sponsor_perks: form.sponsorPerks && Object.keys(form.sponsorPerks).length ? form.sponsorPerks : null,
    priority_slots: form.prioritySlots ?? null,
    english_guide_available: form.englishGuideAvailable ?? false,
    capacity: form.capacity ?? null,
    requires_registration: (form.participationMode ?? (form.requiresRegistration ? "required" : "none")) === "required",
    participation_mode: form.participationMode ?? (form.requiresRegistration ? "required" : "none"),
    registration_deadline: form.registrationDeadline || null,
    registration_note: form.registrationNote?.trim() || null,
  };
}

export async function updateEvent(
  supabase: SupabaseClient,
  id: string,
  form: EventFormData
): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ ...formToDb(form), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** イベントを公開（status=published, published_at=now） */
export async function publishEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("events")
    .update({ status: "published", published_at: now, updated_at: now })
    .eq("id", eventId);

  if (error) throw error;
}

export async function deleteEvent(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// 参加申込
export async function joinEvent(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.from("event_participants").insert({
    event_id: eventId,
    user_id: userId,
    status: "applied",
  });
  if (error) throw error;
}

export async function leaveEvent(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function fetchEventParticipants(
  supabase: SupabaseClient,
  eventId: string
): Promise<{ user_id: string; display_name: string | null; email: string | null }[]> {
  const { data, error } = await supabase
    .from("event_participants")
    .select("user_id, profiles(display_name, email)")
    .eq("event_id", eventId);

  if (error) return [];
  return (data ?? []).map((row: Record<string, unknown>) => {
    const p = row.profiles as { display_name: string | null; email: string | null } | null;
    return {
      user_id: row.user_id as string,
      display_name: p?.display_name ?? null,
      email: p?.email ?? null,
    };
  });
}

export type ParticipantStatus = "applied" | "confirmed" | "declined" | "change_requested" | "checked_in" | "completed";

export async function getParticipantStatus(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<ParticipantStatus | null> {
  const { data } = await supabase
    .from("event_participants")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();
  return data?.status ?? null;
}

/** 参加者ステータスを更新（upsert: 存在しなければ作成） */
export async function updateParticipantStatus(
  supabase: SupabaseClient,
  eventId: string,
  userId: string,
  status: ParticipantStatus
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_participants")
      .update({ status })
      .eq("event_id", eventId)
      .eq("user_id", userId);
    return !error;
  }
  const { error } = await supabase.from("event_participants").insert({
    event_id: eventId,
    user_id: userId,
    status,
  });
  return !error;
}
