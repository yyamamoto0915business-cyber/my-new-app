import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbEvent, Event, EventFormData } from "./types";
import { filterOutSampleEvents, isPublicEventLike } from "../sample-events";
import { getJstTodayYmd } from "../jst-date";
import { normalizeEventStatus, PUBLIC_EVENT_STATUSES } from "../public-events";

function participationModeFromDb(
  db: DbEvent & { participation_mode?: string | null }
): "required" | "optional" | "none" {
  const mode = db.participation_mode;
  if (mode === "required" || mode === "optional" || mode === "none")
    return mode;
  return db.requires_registration ? "required" : "none";
}

/** organizers 結合済みの行 → Event（fetchEventById / createEvent 共通） */
function mapJoinedEventRowToEvent(row: Record<string, unknown>): Event {
  const org = row.organizers as {
    organization_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    profile: { display_name: string | null; email: string | null };
  } | null;
  const name =
    org?.organization_name ??
    org?.profile?.display_name ??
    org?.profile?.email ??
    "主催者";
  const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
  return dbEventToEvent(row as unknown as DbEvent, name, contact);
}

function dbEventToEvent(
  db: DbEvent & { image_url?: string | null; participation_mode?: string | null },
  organizerName: string,
  organizerContact?: string
): Event {
  const participationMode = participationModeFromDb(db);
  return {
    id: db.id,
    status: normalizeEventStatus(db.status),
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
    isPublic: db.is_public ?? null,
    isSample: db.is_sample ?? null,
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
        profile:profile_id (
          display_name,
          email
        )
      )
    `
    )
    // Legacy compatibility: older rows may use status="public"
    .in("status", [...PUBLIC_EVENT_STATUSES])
    .order("date", { ascending: true });

  if (error) throw error;

  const events = (data ?? []).map((row: Record<string, unknown>) => {
    const dbRow = row as unknown as DbEvent & { organizer_id?: string };
    const org = row.organizers as {
      organization_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      profile: { display_name: string | null; email: string | null };
    } | null;
    const name =
      org?.organization_name ??
      org?.profile?.display_name ??
      org?.profile?.email ??
      "主催者";
    const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
    const event = dbEventToEvent(row as unknown as DbEvent, name, contact);
    return { ...event, organizerId: dbRow.organizer_id ?? null };
  });

  const withoutSample = filterOutSampleEvents(events);
  const publicEvents = withoutSample.filter((e) => isPublicEventLike(e));

  // 公開API用: status / isPublic / isSample 判定でフィルタ
  return publicEvents;
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
        profile:profile_id (
          display_name,
          email
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return mapJoinedEventRowToEvent(data as Record<string, unknown>);
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
        profile:profile_id (
          display_name,
          email
        )
      )
    `
    )
    .eq("id", id)
    .in("status", [...PUBLIC_EVENT_STATUSES])
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const org = row.organizers as {
    organization_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    profile: { display_name: string | null; email: string | null };
  } | null;
  const name =
    org?.organization_name ??
    org?.profile?.display_name ??
    org?.profile?.email ??
    "主催者";
  const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
  const event = dbEventToEvent(row as unknown as DbEvent, name, contact);

  // 公開詳細: サンプル/非公開イベントは 404 扱い
  if (!isPublicEventLike(event)) return null;

  return event;
}

export type EventWithOrganizerInfo = Event & {
  organizerId?: string | null;
  organizerAvatarUrl?: string | null;
  organizerRegion?: string | null;
  organizerBio?: string | null;
};

/** 公開イベント1件 + 主催者情報（イベント詳細ページ用） */
export async function fetchPublishedEventWithOrganizerInfo(
  supabase: SupabaseClient,
  id: string
): Promise<EventWithOrganizerInfo | null> {
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organizers (
        id,
        organization_name,
        contact_email,
        contact_phone,
        profile:profile_id (
          display_name,
          email,
          avatar_url,
          region,
          bio
        )
      )
    `
    )
    .eq("id", id)
    .in("status", [...PUBLIC_EVENT_STATUSES])
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const org = row.organizers as {
    id?: string;
    organization_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    profile?: {
      display_name: string | null;
      email: string | null;
      avatar_url?: string | null;
      region?: string | null;
      bio?: string | null;
    };
  } | null;

  const name =
    org?.organization_name ??
    org?.profile?.display_name ??
    org?.profile?.email ??
    "主催者";
  const contact = org?.contact_phone ?? org?.contact_email ?? undefined;

  const event = dbEventToEvent(row as unknown as DbEvent, name, contact);

  // 公開詳細: サンプル/非公開イベントは 404 扱い
  if (!isPublicEventLike(event)) return null;

  return {
    ...event,
    organizerId: org?.id ?? null,
    organizerAvatarUrl: org?.profile?.avatar_url ?? null,
    organizerRegion: org?.profile?.region ?? null,
    organizerBio: org?.profile?.bio ?? null,
  };
}

/** 同じ主催者の他の公開イベント（指定件数・現在のイベント除外） */
export async function fetchOtherPublishedEventsByOrganizer(
  supabase: SupabaseClient,
  organizerId: string,
  excludeEventId: string,
  limit: number = 3
): Promise<Event[]> {
  const today = getJstTodayYmd();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organizers!inner (
        organization_name,
        contact_email,
        contact_phone,
        profile:profile_id (
          display_name,
          email
        )
      )
    `
    )
    .eq("organizer_id", organizerId)
    .in("status", [...PUBLIC_EVENT_STATUSES])
    .neq("id", excludeEventId)
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(limit);

  if (error) return [];

  const events = (data ?? []).map((r: Record<string, unknown>) => {
    const org = r.organizers as {
      organization_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      profile: { display_name: string | null; email: string | null };
    };
    const name =
      org?.organization_name ??
      org?.profile?.display_name ??
      org?.profile?.email ??
      "主催者";
    const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
    return dbEventToEvent(r as unknown as DbEvent, name, contact);
  });

  // 関連イベントもサンプル/非公開は除外
  return filterOutSampleEvents(events).filter((e) => isPublicEventLike(e));
}

/** 関連する公開イベント（同タグ優先→同都道府県フォールバック） */
export async function fetchRelatedPublishedEvents(
  supabase: SupabaseClient,
  base: Pick<Event, "id" | "tags" | "prefecture">,
  limit: number = 4
): Promise<Event[]> {
  const today = getJstTodayYmd();
  const seen = new Set<string>([base.id]);
  const result: Event[] = [];

  const pushUnique = (events: Event[]) => {
    for (const e of events) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      result.push(e);
      if (result.length >= limit) break;
    }
  };

  const selectJoin = `
      *,
      organizers!inner (
        organization_name,
        contact_email,
        contact_phone,
        profile:profile_id (
          display_name,
          email
        )
      )
    `;

  // 1) タグ一致（先頭タグで軽く関連付け）
  const firstTag = base.tags?.[0];
  if (firstTag) {
    const { data, error } = await supabase
      .from("events")
      .select(selectJoin)
      .in("status", [...PUBLIC_EVENT_STATUSES])
      .neq("id", base.id)
      .gte("date", today)
      .contains("tags", [firstTag])
      .order("date", { ascending: true })
      .limit(limit);
    if (!error && data) {
      const byTag = (data ?? []).map((r: Record<string, unknown>) => {
        const org = r.organizers as {
          organization_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          profile: { display_name: string | null; email: string | null };
        };
        const name =
          org?.organization_name ??
          org?.profile?.display_name ??
          org?.profile?.email ??
          "主催者";
        const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
        return dbEventToEvent(r as unknown as DbEvent, name, contact);
      });
      pushUnique(filterOutSampleEvents(byTag).filter((e) => isPublicEventLike(e)));
    }
  }

  // 2) 都道府県一致（足りない場合のフォールバック）
  if (result.length < limit && base.prefecture) {
    const { data, error } = await supabase
      .from("events")
      .select(selectJoin)
      .in("status", [...PUBLIC_EVENT_STATUSES])
      .neq("id", base.id)
      .gte("date", today)
      .eq("prefecture", base.prefecture)
      .order("date", { ascending: true })
      .limit(limit);
    if (!error && data) {
      const byPref = (data ?? []).map((r: Record<string, unknown>) => {
        const org = r.organizers as {
          organization_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          profile: { display_name: string | null; email: string | null };
        };
        const name =
          org?.organization_name ??
          org?.profile?.display_name ??
          org?.profile?.email ??
          "主催者";
        const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
        return dbEventToEvent(r as unknown as DbEvent, name, contact);
      });
      pushUnique(filterOutSampleEvents(byPref).filter((e) => isPublicEventLike(e)));
    }
  }

  return result.slice(0, limit);
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
        profile:profile_id (
          display_name,
          email
        )
      )
    `
    )
    .in("id", ids)
    .in("status", [...PUBLIC_EVENT_STATUSES]);

  if (error) return [];
  const today = getJstTodayYmd();
  const events = (data ?? [])
    .map((row: Record<string, unknown>) => {
      const org = row.organizers as {
        organization_name: string | null;
        contact_email: string | null;
        contact_phone: string | null;
        profile: { display_name: string | null; email: string | null };
      } | null;
      const name =
        org?.organization_name ??
        org?.profile?.display_name ??
        org?.profile?.email ??
        "主催者";
      const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
      return dbEventToEvent(row as unknown as DbEvent, name, contact);
    });

  const publicEvents = filterOutSampleEvents(events).filter((e) => isPublicEventLike(e));

  return publicEvents
    .filter((e) => e.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.startTime || "").localeCompare(b.startTime || "")
    );
}

/** 主催者の公開イベント一覧（公開プロフィールページ用・未来のイベント優先） */
export async function fetchPublishedEventsByOrganizer(
  supabase: SupabaseClient,
  organizerId: string,
  limit: number = 20
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
        profile:profile_id (
          display_name,
          email
        )
      )
    `
    )
    .eq("organizer_id", organizerId)
    .in("status", [...PUBLIC_EVENT_STATUSES])
    .order("date", { ascending: true })
    .limit(limit);

  if (error) return [];

  const events = (data ?? []).map((row: Record<string, unknown>) => {
    const org = row.organizers as {
      organization_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      profile: { display_name: string | null; email: string | null };
    };
    const name =
      org?.organization_name ??
      org?.profile?.display_name ??
      org?.profile?.email ??
      "主催者";
    const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
    return dbEventToEvent(row as unknown as DbEvent, name, contact);
  });

  // 主催者公開ページもサンプル/非公開除外
  return filterOutSampleEvents(events).filter((e) => isPublicEventLike(e));
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
        profile:profile_id (
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
      profile: { display_name: string | null; email: string | null };
    };
    const name =
      org?.organization_name ??
      org?.profile?.display_name ??
      org?.profile?.email ??
      "主催者";
    const contact = org?.contact_phone ?? org?.contact_email ?? undefined;
    return dbEventToEvent(row as unknown as DbEvent, name, contact);
  });
}

function isMissingEventsColumnError(err: unknown): boolean {
  const m = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : String(err);
  return (
    m.includes("schema cache") ||
    (m.includes("Could not find") && m.includes("column") && m.includes("events"))
  );
}

export async function createEvent(
  supabase: SupabaseClient,
  organizerId: string,
  form: EventFormData
): Promise<Event> {
  const selectJoin = `
      *,
      organizers (
        organization_name,
        contact_email,
        contact_phone,
        profile:profile_id (
          display_name,
          email
        )
      )
    `;

  const fullPayload = {
    organizer_id: organizerId,
    status: "draft" as const,
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
    requires_registration:
      (form.participationMode ?? (form.requiresRegistration ? "required" : "none")) === "required",
    participation_mode: form.participationMode ?? (form.requiresRegistration ? "required" : "none"),
    registration_deadline: form.registrationDeadline || null,
    registration_note: form.registrationNote?.trim() || null,
    image_url: form.imageUrl?.trim() || null,
  };

  let { data, error } = await supabase.from("events").insert(fullPayload).select(selectJoin).single();

  if (error && isMissingEventsColumnError(error)) {
    const rest = { ...fullPayload };
    delete (rest as { requires_registration?: unknown }).requires_registration;
    delete (rest as { participation_mode?: unknown }).participation_mode;
    delete (rest as { registration_deadline?: unknown }).registration_deadline;
    delete (rest as { registration_note?: unknown }).registration_note;
    console.warn(
      "[createEvent] Retrying without registration/participation columns (DB migration may be pending)"
    );
    ({ data, error } = await supabase.from("events").insert(rest).select(selectJoin).single());
  }

  if (error) throw error;
  if (!data) throw new Error("イベントの保存結果を取得できませんでした");

  const row = data as Record<string, unknown>;
  const event = mapJoinedEventRowToEvent(row);

  try {
    const { createSponsorTiersForEvent } = await import("./sponsors");
    await createSponsorTiersForEvent(supabase, event.id);
  } catch (tierErr) {
    console.error("createSponsorTiersForEvent failed (event was saved):", tierErr);
  }

  return event;
}

function formToDb(form: EventFormData): Record<string, unknown> {
  return {
    title: form.title,
    description: form.description,
    image_url: form.imageUrl?.trim() || null,
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
  const { data: existing, error: existingError } = await supabase
    .from("events")
    .select("published_at")
    .eq("id", eventId)
    .single();
  if (existingError) throw existingError;

  const publishedAt =
    existing?.published_at && typeof existing.published_at === "string"
      ? existing.published_at
      : now;

  const { error } = await supabase
    .from("events")
    .update({ status: "published", published_at: publishedAt, updated_at: now })
    .eq("id", eventId);

  if (error) throw error;
}

/** イベント公開状態を更新（draft / published / archived） */
export async function updateEventStatus(
  supabase: SupabaseClient,
  eventId: string,
  status: "draft" | "published" | "archived"
): Promise<void> {
  const now = new Date().toISOString();
  const payload: Record<string, string | null> = {
    status,
    updated_at: now,
  };
  // published_at は「初回公開日時」として保持する（非公開化で消さない）
  if (status === "published") {
    const { data: existing, error: existingError } = await supabase
      .from("events")
      .select("published_at")
      .eq("id", eventId)
      .single();
    if (existingError) throw existingError;
    payload.published_at =
      existing?.published_at && typeof existing.published_at === "string"
        ? existing.published_at
        : now;
  }

  const { error } = await supabase.from("events").update(payload).eq("id", eventId);
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
