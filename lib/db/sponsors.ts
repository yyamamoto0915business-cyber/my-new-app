import type { SupabaseClient } from "@supabase/supabase-js";
import type { SponsorTier, SponsorPurchase, SponsorApplication } from "./types";
import { DEFAULT_SPONSOR_TIERS } from "@/lib/sponsorDefaults";

function parseBenefits(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") return v.split(/[・、]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

function rowToTier(row: Record<string, unknown>): SponsorTier {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    type: row.type as "individual" | "company",
    price: row.price as number,
    name: row.name as string,
    description: row.description as string | null,
    benefits: parseBenefits(row.benefits),
    sortOrder: (row.sort_order as number) ?? 0,
    isActive: (row.is_active as boolean) ?? true,
  };
}

function rowToPurchase(row: Record<string, unknown>): SponsorPurchase {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    tierId: row.tier_id as string,
    amount: row.amount as number,
    quantity: (row.quantity as number) ?? 1,
    displayName: row.display_name as string | null,
    isAnonymous: (row.is_anonymous as boolean) ?? false,
    comment: row.comment as string | null,
    status: row.status as SponsorPurchase["status"],
    stripeSessionId: row.stripe_session_id as string | null,
    createdAt: row.created_at as string,
  };
}

function rowToApplication(row: Record<string, unknown>): SponsorApplication {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    tierId: row.tier_id as string,
    companyName: row.company_name as string,
    personName: row.person_name as string,
    email: row.email as string,
    phone: row.phone as string | null,
    invoiceInfo: row.invoice_info as string | null,
    message: row.message as string | null,
    logoUrl: row.logo_url as string | null,
    status: row.status as SponsorApplication["status"],
    createdAt: row.created_at as string,
  };
}

export async function fetchSponsorTiersByEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<SponsorTier[]> {
  const { data, error } = await supabase
    .from("sponsor_tiers")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []).map((row) => rowToTier(row as Record<string, unknown>));
}

/** 指定 eventId の company tier が存在するか検証（tierId 不正防止） */
export async function getCompanyTierByEventAndId(
  supabase: SupabaseClient,
  eventId: string,
  tierId: string
): Promise<SponsorTier | null> {
  const { data, error } = await supabase
    .from("sponsor_tiers")
    .select("*")
    .eq("id", tierId)
    .eq("event_id", eventId)
    .eq("type", "company")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return rowToTier(data as Record<string, unknown>);
}

export async function fetchSponsorPurchasesByEvent(
  supabase: SupabaseClient,
  eventId: string,
  status: "paid" = "paid"
): Promise<SponsorPurchase[]> {
  const { data, error } = await supabase
    .from("sponsor_purchases")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => rowToPurchase(row as Record<string, unknown>));
}

export async function fetchSponsorApplicationsByEvent(
  supabase: SupabaseClient,
  eventId: string,
  status: "approved"
): Promise<SponsorApplication[]> {
  const { data, error } = await supabase
    .from("sponsor_applications")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => rowToApplication(row as Record<string, unknown>));
}

/** 主催者用：全ステータスの申込を取得 */
export async function fetchSponsorApplicationsAllByEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<SponsorApplication[]> {
  const { data, error } = await supabase
    .from("sponsor_applications")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => rowToApplication(row as Record<string, unknown>));
}

export async function updateSponsorApplicationStatus(
  supabase: SupabaseClient,
  applicationId: string,
  status: "approved" | "rejected"
): Promise<boolean> {
  const { error } = await supabase
    .from("sponsor_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  return !error;
}

/**
 * イベント作成時に SponsorTier を一括作成（重複はスキップ）
 */
export async function createSponsorTiersForEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<void> {
  const rows = DEFAULT_SPONSOR_TIERS.map((t) => ({
    event_id: eventId,
    type: t.type,
    price: t.price,
    name: t.name,
    description: t.description,
    benefits: t.benefits,
    sort_order: t.sortOrder,
    is_active: true,
  }));

  const { error } = await supabase
    .from("sponsor_tiers")
    .upsert(rows, {
      onConflict: "event_id,type,sort_order",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error("createSponsorTiersForEvent:", error);
  }
}

export async function getTotalSponsoredAmount(
  supabase: SupabaseClient,
  eventId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("sponsor_purchases")
    .select("amount, quantity")
    .eq("event_id", eventId)
    .eq("status", "paid");

  if (error) return 0;
  return (data ?? []).reduce((sum, r) => sum + (r.amount ?? 0) * (r.quantity ?? 1), 0);
}

export async function createSponsorPurchase(
  supabase: SupabaseClient,
  data: {
    eventId: string;
    tierId: string;
    amount: number;
    quantity?: number;
    displayName?: string;
    isAnonymous?: boolean;
    comment?: string;
    status?: string;
    stripeSessionId?: string;
  }
): Promise<SponsorPurchase | null> {
  const { data: inserted, error } = await supabase
    .from("sponsor_purchases")
    .insert({
      event_id: data.eventId,
      tier_id: data.tierId,
      amount: data.amount,
      quantity: data.quantity ?? 1,
      display_name: data.displayName ?? null,
      is_anonymous: data.isAnonymous ?? false,
      comment: data.comment ?? null,
      status: data.status ?? "pending",
      stripe_session_id: data.stripeSessionId ?? null,
    })
    .select()
    .single();

  if (error) return null;
  return rowToPurchase(inserted as Record<string, unknown>);
}

export async function updateSponsorPurchaseStatus(
  supabase: SupabaseClient,
  stripeSessionId: string,
  status: "paid" | "failed"
): Promise<boolean> {
  const { error } = await supabase
    .from("sponsor_purchases")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("stripe_session_id", stripeSessionId);

  return !error;
}

export async function ensureDefaultTiers(
  supabase: SupabaseClient,
  eventId: string
): Promise<SponsorTier[]> {
  try {
    const existing = await fetchSponsorTiersByEvent(supabase, eventId);
    if (existing.length > 0) return existing;

    const rows = DEFAULT_SPONSOR_TIERS.map((t) => ({
      event_id: eventId,
      type: t.type,
      price: t.price,
      name: t.name,
      description: t.description,
      benefits: t.benefits,
      sort_order: t.sortOrder,
      is_active: true,
    }));

  const { data: inserted, error } = await supabase
    .from("sponsor_tiers")
    .insert(rows)
    .select();

  if (error) return [];
    return (inserted ?? []).map((row) => rowToTier(row as Record<string, unknown>));
  } catch {
    return [];
  }
}


export async function createSponsorApplication(
  supabase: SupabaseClient,
  data: {
    eventId: string;
    tierId: string;
    companyName: string;
    personName: string;
    email: string;
    phone?: string;
    invoiceInfo?: string;
    message?: string;
    logoUrl?: string;
  }
): Promise<SponsorApplication | null> {
  const { data: inserted, error } = await supabase
    .from("sponsor_applications")
    .insert({
      event_id: data.eventId,
      tier_id: data.tierId,
      company_name: data.companyName,
      person_name: data.personName,
      email: data.email,
      phone: data.phone ?? null,
      invoice_info: data.invoiceInfo ?? null,
      message: data.message ?? null,
      logo_url: data.logoUrl ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return null;
  return rowToApplication(inserted as Record<string, unknown>);
}
