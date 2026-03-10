/**
 * 管理画面 取得系
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organizer } from "@/lib/db/types";
import { resolveEffectivePlan } from "@/lib/admin-organizer-plan";
import {
  planStatusLabel,
  billingStatusLabel,
} from "./dto";

type OrganizerRow = Organizer & {
  manual_grant_active?: boolean;
  manual_grant_expires_at?: string | null;
  manual_grant_plan?: string | null;
  manual_grant_reason?: string | null;
  billing_source?: string | null;
};

export type DashboardStats = {
  totalOrganizers: number;
  freeCount: number;
  paidCount: number;
  manualGrantCount: number;
  expiringSoonCount: number;
  recentLogs: RecentLogItem[];
};

export type RecentLogItem = {
  id: string;
  createdAt: string;
  actionType: string;
  reason: string | null;
  adminName: string | null;
  organizerName: string | null;
};

export async function getAdminDashboard(
  supabase: SupabaseClient
): Promise<DashboardStats | null> {
  const [orgRes, logRes] = await Promise.all([
    supabase.from("organizers").select(`
      id,
      plan,
      manual_grant_active,
      manual_grant_expires_at,
      subscription_status,
      current_period_end
    `),
    supabase
      .from("admin_logs")
      .select(`
        id,
        created_at,
        action_type,
        reason,
        admin:admin_user_id ( display_name, email ),
        organizer:target_organizer_id ( organization_name )
      `)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (orgRes.error || logRes.error) return null;

  const organizers = (orgRes.data ?? []) as unknown as OrganizerRow[];
  const now = new Date();
  let freeCount = 0;
  let paidCount = 0;
  let manualGrantCount = 0;
  let expiringSoonCount = 0;

  for (const o of organizers) {
    const info = resolveEffectivePlan(o);
    if (info.currentPlan === "free") freeCount += 1;
    else paidCount += 1;
    if (info.manualGrantActive) {
      manualGrantCount += 1;
      if (info.manualGrantExpiresAt) {
        const expires = new Date(info.manualGrantExpiresAt);
        const diff =
          (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diff >= 0 && diff <= 7) expiringSoonCount += 1;
      }
    }
  }

  const recentLogs: RecentLogItem[] = (logRes.data ?? []).map((row: any) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    actionType: row.action_type as string,
    reason: (row.reason as string | null) ?? null,
    adminName:
      (row.admin?.display_name as string | null) ??
      (row.admin?.email as string | null) ??
      null,
    organizerName: (row.organizer?.organization_name as string | null) ?? null,
  }));

  return {
    totalOrganizers: organizers.length,
    freeCount,
    paidCount,
    manualGrantCount,
    expiringSoonCount,
    recentLogs,
  };
}

export type OrganizerListItem = {
  organizerId: string;
  displayName: string | null;
  email: string | null;
  role: string | null;
  currentPlan: string;
  billingSource: string;
  manualGrantActive: boolean;
  manualGrantExpiresAt: string | null;
  grantReason: string | null;
  eventCount: number;
  publishedEventCount: number;
  updatedAt: string | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
  planStatusLabel: string;
  billingStatusLabel: string;
  effectivePlan: string;
};

export type OrganizersResult = {
  items: OrganizerListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getAdminOrganizers(
  supabase: SupabaseClient,
  params: {
    q?: string;
    filter?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<OrganizersResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const filter = params.filter ?? "all";
  const q = (params.q ?? "").trim().toLowerCase();

  const { data: orgRows } = await supabase
    .from("organizers")
    .select(`
      id,
      profile_id,
      organization_name,
      contact_email,
      plan,
      manual_grant_active,
      manual_grant_plan,
      manual_grant_expires_at,
      manual_grant_reason,
      billing_source,
      subscription_status,
      current_period_end,
      updated_at,
      profile:profile_id ( display_name, email, role )
    `)
    .order("created_at", { ascending: true });

  const organizers = (orgRows ?? []) as unknown as Array<
    OrganizerRow & {
      profile?: { display_name?: string | null; email?: string | null; role?: string | null } | null;
    }
  >;

  const { data: events } = await supabase
    .from("events")
    .select("id, organizer_id, status");

  const eventCountByOrg: Record<string, number> = {};
  const publishedCountByOrg: Record<string, number> = {};
  for (const e of events ?? []) {
    const r = e as { organizer_id?: string | null; status?: string };
    const oid = r.organizer_id;
    if (!oid) continue;
    eventCountByOrg[oid] = (eventCountByOrg[oid] ?? 0) + 1;
    if (r.status === "published") {
      publishedCountByOrg[oid] = (publishedCountByOrg[oid] ?? 0) + 1;
    }
  }

  const now = new Date();
  let items: OrganizerListItem[] = organizers.map((o) => {
    const info = resolveEffectivePlan(o);
    const expiresAt = info.manualGrantExpiresAt
      ? new Date(info.manualGrantExpiresAt)
      : null;
    const diff =
      expiresAt != null
        ? (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        : null;
    const isExpired = expiresAt != null && expiresAt.getTime() < now.getTime();
    const isExpiringSoon =
      info.manualGrantActive &&
      diff != null &&
      diff >= 0 &&
      diff <= 7 &&
      !isExpired;

    return {
      organizerId: o.id,
      displayName:
        o.profile?.display_name ?? o.organization_name ?? null,
      email: o.contact_email ?? o.profile?.email ?? null,
      role: o.profile?.role ?? null,
      currentPlan: info.currentPlan,
      billingSource: info.billingSource,
      manualGrantActive: info.manualGrantActive,
      manualGrantExpiresAt: info.manualGrantExpiresAt,
      grantReason: (o as any).manual_grant_reason ?? null,
      eventCount: eventCountByOrg[o.id] ?? 0,
      publishedEventCount: publishedCountByOrg[o.id] ?? 0,
      updatedAt: (o as any).updated_at ?? null,
      isExpiringSoon,
      isExpired: !!info.manualGrantActive && isExpired,
      planStatusLabel: planStatusLabel(
        info.currentPlan,
        info.manualGrantActive,
        isExpired
      ),
      billingStatusLabel: billingStatusLabel(info.billingSource),
      effectivePlan: info.currentPlan,
    };
  });

  if (q) {
    items = items.filter(
      (i) =>
        (i.displayName ?? "").toLowerCase().includes(q) ||
        (i.email ?? "").toLowerCase().includes(q)
    );
  }

  if (filter !== "all") {
    if (filter === "free")
      items = items.filter((i) => i.effectivePlan === "free");
    else if (filter === "paid")
      items = items.filter((i) => i.effectivePlan !== "free");
    else if (filter === "manual")
      items = items.filter((i) => i.manualGrantActive && !i.isExpired);
    else if (filter === "expiring") items = items.filter((i) => i.isExpiringSoon);
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  items = items.slice(start, start + pageSize);

  return { items, total, page, pageSize };
}

export type OrganizerDetailData = {
  profile: {
    displayName: string | null;
    email: string | null;
    role: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  subscription: {
    currentPlan: string;
    billingSource: string;
    manualGrantActive: boolean;
    manualGrantPlan: string | null;
    manualGrantExpiresAt: string | null;
    grantReason: string | null;
    effectivePlan: string;
    planStatusLabel: string;
    billingStatusLabel: string;
    isExpiringSoon: boolean;
    isExpired: boolean;
  };
  notes: Array<{ id: string; note: string; createdAt: string; createdBy: string | null }>;
  recentLogs: Array<{
    id: string;
    createdAt: string;
    actionType: string;
    reason: string | null;
    adminName: string | null;
    beforeValue: unknown;
    afterValue: unknown;
  }>;
  stats: { eventCount: number; publishedEventCount: number };
};

export async function getAdminOrganizerDetail(
  supabase: SupabaseClient,
  organizerId: string
): Promise<OrganizerDetailData | null> {
  const { data: organizer, error } = await supabase
    .from("organizers")
    .select(`
      id,
      profile_id,
      organization_name,
      contact_email,
      plan,
      manual_grant_active,
      manual_grant_plan,
      manual_grant_expires_at,
      manual_grant_reason,
      billing_source,
      subscription_status,
      current_period_end,
      created_at,
      updated_at,
      profile:profile_id ( display_name, email, role, created_at, updated_at )
    `)
    .eq("id", organizerId)
    .single();

  if (error || !organizer) return null;

  const [eventsRes, notesRes, logsRes] = await Promise.all([
    supabase.from("events").select("id, status").eq("organizer_id", organizerId),
    supabase
      .from("organizer_notes")
      .select("id, note, created_at, created_by")
      .eq("organizer_id", organizerId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("admin_logs")
      .select(`
        id,
        created_at,
        action_type,
        reason,
        before_value,
        after_value,
        admin:admin_user_id ( display_name, email )
      `)
      .eq("target_organizer_id", organizerId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const org = organizer as unknown as OrganizerRow & {
    profile?: {
      display_name?: string | null;
      email?: string | null;
      role?: string | null;
      created_at?: string | null;
      updated_at?: string | null;
    } | null;
  };

  const info = resolveEffectivePlan(org);
  const expiresAt = info.manualGrantExpiresAt
    ? new Date(info.manualGrantExpiresAt)
    : null;
  const diff =
    expiresAt != null
      ? (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      : null;
  const isExpired = expiresAt != null && expiresAt.getTime() < new Date().getTime();
  const isExpiringSoon =
    info.manualGrantActive && diff != null && diff >= 0 && diff <= 7 && !isExpired;

  const events = eventsRes.data ?? [];
  const eventCount = events.length;
  const publishedEventCount = events.filter(
    (e: { status?: string }) => e.status === "published"
  ).length;

  const notes = (notesRes.data ?? []).map((n: Record<string, unknown>) => ({
    id: n.id as string,
    note: n.note as string,
    createdAt: n.created_at as string,
    createdBy: n.created_by as string | null,
  }));

  const recentLogs = (logsRes.data ?? []).map((row: any) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    actionType: row.action_type as string,
    reason: (row.reason as string | null) ?? null,
    adminName:
      (row.admin?.display_name as string | null) ??
      (row.admin?.email as string | null) ??
      null,
    beforeValue: row.before_value,
    afterValue: row.after_value,
  }));

  return {
    profile: {
      displayName: org.profile?.display_name ?? org.organization_name ?? null,
      email: org.contact_email ?? org.profile?.email ?? null,
      role: org.profile?.role ?? null,
      createdAt: org.profile?.created_at ?? org.created_at ?? null,
      updatedAt: org.profile?.updated_at ?? org.updated_at ?? null,
    },
    subscription: {
      currentPlan: info.currentPlan,
      billingSource: info.billingSource,
      manualGrantActive: info.manualGrantActive,
      manualGrantPlan: org.manual_grant_plan ?? null,
      manualGrantExpiresAt: info.manualGrantExpiresAt,
      grantReason: org.manual_grant_reason ?? null,
      effectivePlan: info.currentPlan,
      planStatusLabel: planStatusLabel(
        info.currentPlan,
        info.manualGrantActive,
        isExpired
      ),
      billingStatusLabel: billingStatusLabel(info.billingSource),
      isExpiringSoon,
      isExpired: !!info.manualGrantActive && isExpired,
    },
    notes,
    recentLogs,
    stats: { eventCount, publishedEventCount },
  };
}

export type LogItem = {
  id: string;
  createdAt: string;
  adminUserId: string;
  adminEmail: string | null;
  targetOrganizerId: string;
  targetOrganizerName: string | null;
  actionType: string;
  reason: string | null;
  beforeValue: unknown;
  afterValue: unknown;
  metadata: unknown;
};

export type LogsResult = {
  items: LogItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getAdminLogs(
  supabase: SupabaseClient,
  params: {
    q?: string;
    actionType?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<LogsResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 30;

  let query = supabase
    .from("admin_logs")
    .select(
      `
      id,
      created_at,
      admin_user_id,
      admin_email,
      target_organizer_id,
      action_type,
      reason,
      before_value,
      after_value,
      metadata,
      admin:admin_user_id ( email, display_name ),
      organizer:target_organizer_id ( organization_name )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (params.actionType) {
    query = query.eq("action_type", params.actionType);
  }

  const q = params.q?.trim();
  if (q) {
    query = query.or(`action_type.ilike.%${q}%,reason.ilike.%${q}%`);
  }

  const { data, count } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1
  );

  const items = (data ?? []).map((row: Record<string, unknown>) => {
    const admin = row.admin as { email?: string | null; display_name?: string | null } | null;
    const organizer = row.organizer as { organization_name?: string | null } | null;
    return {
      id: row.id as string,
      createdAt: row.created_at as string,
      adminUserId: row.admin_user_id as string,
      adminEmail: (row.admin_email as string | null) ?? admin?.email ?? null,
      targetOrganizerId: row.target_organizer_id as string,
      targetOrganizerName: organizer?.organization_name ?? null,
      actionType: row.action_type as string,
      reason: (row.reason as string | null) ?? null,
      beforeValue: row.before_value,
      afterValue: row.after_value,
      metadata: row.metadata ?? {},
    };
  });

  return {
    items,
    total: count ?? items.length,
    page,
    pageSize,
  };
}
