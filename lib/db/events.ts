import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbEvent, Event, EventFormData } from "./types";

function dbEventToEvent(
  db: DbEvent & { image_url?: string | null },
  organizerName: string,
  organizerContact?: string
): Event {
  return {
    id: db.id,
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
    })
    .select("id")
    .single();

  if (error) throw error;
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

export async function getParticipantStatus(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<"applied" | "confirmed" | "checked_in" | "completed" | null> {
  const { data } = await supabase
    .from("event_participants")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();
  return data?.status ?? null;
}
