/**
 * 再設計後の管理画面向け取得系
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type PanelDashboardData = {
  usersTotal: number;
  organizersTotal: number;
  publishedEvents: number;
  identityPending: number;
  eventReviewPending: number;
  openInquiries: number;
  todoIdentity: number;
  todoEventReview: number;
  todoReports: number;
  todoRefunds: number;
  newUsers30d: number;
  newEvents30d: number;
  applications30d: number;
  sales30d: number;
  recentLogs: Array<{
    id: string;
    createdAt: string;
    actionType: string;
    adminName: string | null;
    organizerName: string | null;
  }>;
  recentInquiries: Array<{
    id: string;
    subject: string;
    category: string;
    status: string;
    createdAt: string;
    userName: string | null;
  }>;
  recentEvents: Array<{
    id: string;
    title: string;
    date: string;
    status: string | null;
    organizerName: string | null;
    updatedAt: string | null;
    participantCount: number;
  }>;
};

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function getPanelDashboard(
  supabase: SupabaseClient
): Promise<PanelDashboardData> {
  const since30 = daysAgoIso(30);

  const [
    usersRes,
    orgsRes,
    publishedRes,
    openInquiriesRes,
    refundedRes,
    newUsersRes,
    newEventsRes,
    appsRes,
    salesRes,
    logsRes,
    inquiriesRes,
    eventsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("organizers").select("id", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("contact_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("event_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "refunded"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since30),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since30),
    supabase
      .from("event_participants")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since30),
    supabase
      .from("event_orders")
      .select("amount")
      .eq("status", "paid")
      .gte("created_at", since30),
    supabase
      .from("admin_logs")
      .select(
        `
        id,
        created_at,
        action_type,
        admin:admin_user_id ( display_name, email ),
        organizer:target_organizer_id ( organization_name )
      `
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("contact_inquiries")
      .select(
        `
        id,
        subject,
        category,
        status,
        created_at,
        profile:user_id ( display_name )
      `
      )
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("events")
      .select(
        `
        id,
        title,
        date,
        status,
        updated_at,
        organizer:organizer_id ( organization_name )
      `
      )
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  const sales30d = ((salesRes.data ?? []) as { amount: number }[]).reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0
  );

  const recentLogs = (logsRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown> & {
      admin?: { display_name?: string | null; email?: string | null } | null;
      organizer?: { organization_name?: string | null } | null;
    };
    return {
      id: r.id as string,
      createdAt: r.created_at as string,
      actionType: r.action_type as string,
      adminName:
        (r.admin?.display_name as string | null) ??
        (r.admin?.email as string | null) ??
        null,
      organizerName:
        (r.organizer?.organization_name as string | null) ?? null,
    };
  });

  const recentInquiries = (inquiriesRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown> & {
      profile?: { display_name?: string | null } | null;
    };
    return {
      id: r.id as string,
      subject: r.subject as string,
      category: r.category as string,
      status: r.status as string,
      createdAt: r.created_at as string,
      userName: (r.profile?.display_name as string | null) ?? null,
    };
  });

  const eventRows = (eventsRes.data ?? []) as Array<{
    id: string;
    title: string;
    date: string;
    status: string | null;
    updated_at: string | null;
    organizer?: { organization_name?: string | null } | null;
  }>;

  const eventIds = eventRows.map((e) => e.id);
  let participantCounts = new Map<string, number>();
  if (eventIds.length > 0) {
    const { data: parts } = await supabase
      .from("event_participants")
      .select("event_id")
      .in("event_id", eventIds);
    participantCounts = new Map();
    for (const p of parts ?? []) {
      const id = (p as { event_id: string }).event_id;
      participantCounts.set(id, (participantCounts.get(id) ?? 0) + 1);
    }
  }

  return {
    usersTotal: usersRes.count ?? 0,
    organizersTotal: orgsRes.count ?? 0,
    publishedEvents: publishedRes.count ?? 0,
    identityPending: 0,
    eventReviewPending: 0,
    openInquiries: openInquiriesRes.count ?? 0,
    todoIdentity: 0,
    todoEventReview: 0,
    todoReports: 0,
    todoRefunds: refundedRes.count ?? 0,
    newUsers30d: newUsersRes.count ?? 0,
    newEvents30d: newEventsRes.count ?? 0,
    applications30d: appsRes.count ?? 0,
    sales30d,
    recentLogs,
    recentInquiries,
    recentEvents: eventRows.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      status: e.status,
      organizerName: e.organizer?.organization_name ?? null,
      updatedAt: e.updated_at,
      participantCount: participantCounts.get(e.id) ?? 0,
    })),
  };
}

export type AdminEventListItem = {
  id: string;
  title: string;
  date: string;
  status: string | null;
  prefecture: string | null;
  city: string | null;
  price: number | null;
  updatedAt: string | null;
  organizerName: string | null;
  organizerId: string | null;
  participantCount: number;
  checkinCount: number;
};

export async function getAdminEvents(
  supabase: SupabaseClient,
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<{ items: AdminEventListItem[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("events")
    .select(
      `
      id,
      title,
      date,
      status,
      prefecture,
      city,
      price,
      updated_at,
      organizer_id,
      organizer:organizer_id ( organization_name )
    `,
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.q?.trim()) {
    query = query.ilike("title", `%${params.q.trim()}%`);
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("getAdminEvents:", error.message);
    return { items: [], total: 0, page, pageSize };
  }

  const rows = (data ?? []) as Array<{
    id: string;
    title: string;
    date: string;
    status: string | null;
    prefecture: string | null;
    city: string | null;
    price: number | null;
    updated_at: string | null;
    organizer_id: string | null;
    organizer?: { organization_name?: string | null } | null;
  }>;

  const ids = rows.map((r) => r.id);
  const participantCounts = new Map<string, number>();
  const checkinCounts = new Map<string, number>();

  if (ids.length > 0) {
    const [partsRes, checkinsRes] = await Promise.all([
      supabase.from("event_participants").select("event_id").in("event_id", ids),
      supabase.from("event_checkins").select("event_id").in("event_id", ids),
    ]);
    for (const p of partsRes.data ?? []) {
      const id = (p as { event_id: string }).event_id;
      participantCounts.set(id, (participantCounts.get(id) ?? 0) + 1);
    }
    for (const c of checkinsRes.data ?? []) {
      const id = (c as { event_id: string }).event_id;
      checkinCounts.set(id, (checkinCounts.get(id) ?? 0) + 1);
    }
  }

  return {
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      date: r.date,
      status: r.status,
      prefecture: r.prefecture,
      city: r.city,
      price: r.price,
      updatedAt: r.updated_at,
      organizerName: r.organizer?.organization_name ?? null,
      organizerId: r.organizer_id,
      participantCount: participantCounts.get(r.id) ?? 0,
      checkinCount: checkinCounts.get(r.id) ?? 0,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export type AdminPassListItem = {
  id: string;
  eventId: string;
  eventTitle: string | null;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  status: string;
  paymentStatus: string;
  checkedIn: boolean;
  createdAt: string | null;
  amount: number | null;
};

export async function getAdminPasses(
  supabase: SupabaseClient,
  params: { q?: string; page?: number; pageSize?: number }
): Promise<{ items: AdminPassListItem[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from("event_participants")
    .select(
      `
      id,
      event_id,
      user_id,
      status,
      created_at,
      events ( id, title ),
      profile:user_id ( display_name, email )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("getAdminPasses:", error.message);
    return { items: [], total: 0, page, pageSize };
  }

  const rows = (data ?? []) as Array<{
    id: string;
    event_id: string;
    user_id: string;
    status: string;
    created_at: string | null;
    events?: { id: string; title: string } | { id: string; title: string }[] | null;
    profile?: { display_name?: string | null; email?: string | null } | null;
  }>;

  const pairs = rows.map((r) => ({ eventId: r.event_id, userId: r.user_id }));
  const orderMap = new Map<string, { status: string; amount: number }>();
  if (pairs.length > 0) {
    const eventIds = [...new Set(pairs.map((p) => p.eventId))];
    const userIds = [...new Set(pairs.map((p) => p.userId))];
    const { data: orders } = await supabase
      .from("event_orders")
      .select("event_id, user_id, status, amount")
      .in("event_id", eventIds)
      .in("user_id", userIds);
    for (const o of orders ?? []) {
      const row = o as {
        event_id: string;
        user_id: string;
        status: string;
        amount: number;
      };
      orderMap.set(`${row.event_id}:${row.user_id}`, {
        status: row.status,
        amount: row.amount,
      });
    }
  }

  const checkinSet = new Set<string>();
  if (pairs.length > 0) {
    const eventIds = [...new Set(pairs.map((p) => p.eventId))];
    const { data: checkins } = await supabase
      .from("event_checkins")
      .select("event_id, user_id")
      .in("event_id", eventIds);
    for (const c of checkins ?? []) {
      const row = c as { event_id: string; user_id: string | null };
      if (row.user_id) checkinSet.add(`${row.event_id}:${row.user_id}`);
    }
  }

  const items: AdminPassListItem[] = rows.map((r) => {
    const event = Array.isArray(r.events) ? r.events[0] : r.events;
    const order = orderMap.get(`${r.event_id}:${r.user_id}`);
    return {
      id: r.id,
      eventId: r.event_id,
      eventTitle: event?.title ?? null,
      userId: r.user_id,
      userName: r.profile?.display_name ?? null,
      userEmail: r.profile?.email ?? null,
      status: r.status,
      paymentStatus: order?.status ?? "free",
      checkedIn:
        r.status === "checked_in" ||
        checkinSet.has(`${r.event_id}:${r.user_id}`),
      createdAt: r.created_at,
      amount: order?.amount ?? null,
    };
  });

  let filtered = items;
  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    filtered = items.filter(
      (i) =>
        i.eventTitle?.toLowerCase().includes(q) ||
        i.userName?.toLowerCase().includes(q) ||
        i.userEmail?.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
    );
  }

  return {
    items: filtered,
    total: params.q?.trim() ? filtered.length : count ?? 0,
    page,
    pageSize,
  };
}

export type AdminOrderListItem = {
  id: string;
  amount: number;
  status: string;
  createdAt: string | null;
  eventTitle: string | null;
  userName: string | null;
  userEmail: string | null;
  stripePaymentIntentId: string | null;
};

export async function getAdminOrders(
  supabase: SupabaseClient,
  params: { page?: number; pageSize?: number; status?: string }
): Promise<{ items: AdminOrderListItem[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("event_orders")
    .select(
      `
      id,
      amount,
      status,
      created_at,
      stripe_payment_intent_id,
      events ( title ),
      profile:user_id ( display_name, email )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("getAdminOrders:", error.message);
    return { items: [], total: 0, page, pageSize };
  }

  const items = ((data ?? []) as Array<{
    id: string;
    amount: number;
    status: string;
    created_at: string | null;
    stripe_payment_intent_id: string | null;
    events?: { title?: string } | { title?: string }[] | null;
    profile?: { display_name?: string | null; email?: string | null } | null;
  }>).map((r) => {
    const event = Array.isArray(r.events) ? r.events[0] : r.events;
    return {
      id: r.id,
      amount: r.amount,
      status: r.status,
      createdAt: r.created_at,
      eventTitle: event?.title ?? null,
      userName: r.profile?.display_name ?? null,
      userEmail: r.profile?.email ?? null,
      stripePaymentIntentId: r.stripe_payment_intent_id,
    };
  });

  return { items, total: count ?? 0, page, pageSize };
}
