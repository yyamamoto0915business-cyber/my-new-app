/**
 * MachiGlyph MVP: 募集・応募・チャット用のDB操作
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type RecruitmentStatus = "draft" | "public" | "closed";

export type RecruitmentRole = { name: string; count: number };

export type RecruitmentMvp = {
  id: string;
  organizer_id: string;
  event_id: string | null;
  type: string;
  title: string;
  description: string;
  status: RecruitmentStatus;
  start_at: string | null;
  end_at: string | null;
  meeting_place: string | null;
  meeting_lat: number | null;
  meeting_lng: number | null;
  roles: RecruitmentRole[];
  capacity: number | null;
  items_to_bring: string | null;
  provisions: string | null;
  notes: string | null;
  role: string | null;
  time_slot: string | null;
  compensation_type: string | null;
  compensation_note: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "canceled"
  | "applied"
  | "confirmed"
  | "checked_in"
  | "completed";

export type RecruitmentApplicationMvp = {
  id: string;
  recruitment_id: string;
  user_id: string;
  status: ApplicationStatus;
  message: string | null;
  checked_in_at: string | null;
  role_assigned: string | null;
  created_at: string;
};

function parseRoles(v: unknown): RecruitmentRole[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is { name?: string; count?: number } => r != null && typeof r === "object")
    .map((r) => ({ name: String(r.name ?? ""), count: Number(r.count ?? 0) }));
}

/** 公開中の募集を取得（おすすめ・一覧用） */
export async function fetchPublicRecruitments(
  supabase: SupabaseClient,
  options?: { limit?: number; hasMeetingPlace?: boolean }
): Promise<(RecruitmentMvp & { organizers?: { organization_name: string | null }; events?: { title: string; date: string } | null })[]> {
  const limit = options?.limit ?? 50;
  let query = supabase
    .from("recruitments")
    .select("*, organizers(organization_name), events(title, date)")
    .eq("status", "public")
    .order("start_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (options?.hasMeetingPlace) {
    query = query.not("meeting_place", "is", null);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((r) => ({
    ...r,
    roles: parseRoles(r.roles),
  })) as (RecruitmentMvp & {
    organizers?: { organization_name: string | null };
    events?: { title: string; date: string } | null;
  })[];
}

/** おすすめ3件（公開中・直近の開始日） */
export async function fetchRecommendedRecruitments(
  supabase: SupabaseClient,
  limit = 3
): Promise<(RecruitmentMvp & { organizers?: { organization_name: string | null } })[]> {
  const { data, error } = await supabase
    .from("recruitments")
    .select("*, organizers(organization_name)")
    .eq("status", "public")
    .not("meeting_place", "is", null)
    .order("start_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((r) => ({
    ...r,
    roles: parseRoles(r.roles),
  })) as (RecruitmentMvp & { organizers?: { organization_name: string | null } })[];
}

/** 募集1件取得 */
export async function fetchRecruitmentById(
  supabase: SupabaseClient,
  id: string
): Promise<(RecruitmentMvp & { organizers?: { organization_name: string | null; contact_email: string | null } }) | null> {
  const { data, error } = await supabase
    .from("recruitments")
    .select("*, organizers(organization_name, contact_email)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return { ...data, roles: parseRoles(data.roles) } as RecruitmentMvp & {
    organizers?: { organization_name: string | null; contact_email: string | null };
  };
}

/** 主催者の募集一覧 */
export async function fetchRecruitmentsByOrganizer(
  supabase: SupabaseClient,
  organizerId: string
): Promise<RecruitmentMvp[]> {
  const { data, error } = await supabase
    .from("recruitments")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r) => ({ ...r, roles: parseRoles(r.roles) })) as RecruitmentMvp[];
}

/** profile_id から organizer_id を取得 */
export async function getOrganizerIdByProfileId(
  supabase: SupabaseClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("organizers")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

export type RecruitmentCreateInput = {
  title: string;
  description: string;
  status?: RecruitmentStatus;
  start_at?: string | null;
  end_at?: string | null;
  meeting_place?: string | null;
  meeting_lat?: number | null;
  meeting_lng?: number | null;
  roles?: RecruitmentRole[];
  capacity?: number | null;
  items_to_bring?: string | null;
  provisions?: string | null;
  notes?: string | null;
  event_id?: string | null;
  type?: string;
};

/** 募集作成 */
export async function createRecruitmentMvp(
  supabase: SupabaseClient,
  organizerId: string,
  input: RecruitmentCreateInput
): Promise<string> {
  const { data, error } = await supabase
    .from("recruitments")
    .insert({
      organizer_id: organizerId,
      event_id: input.event_id ?? null,
      type: input.type ?? "volunteer",
      title: input.title.trim(),
      description: input.description.trim(),
      status: input.status ?? "draft",
      start_at: input.start_at ?? null,
      end_at: input.end_at ?? null,
      meeting_place: input.meeting_place?.trim() || null,
      meeting_lat: input.meeting_lat ?? null,
      meeting_lng: input.meeting_lng ?? null,
      roles: input.roles ?? [],
      capacity: input.capacity ?? null,
      items_to_bring: input.items_to_bring?.trim() || null,
      provisions: input.provisions?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

/** 募集更新 */
export async function updateRecruitmentMvp(
  supabase: SupabaseClient,
  recruitmentId: string,
  organizerId: string,
  input: Partial<RecruitmentCreateInput>
): Promise<void> {
  const { error } = await supabase
    .from("recruitments")
    .update({
      ...(input.title != null && { title: input.title.trim() }),
      ...(input.description != null && { description: input.description.trim() }),
      ...(input.status != null && { status: input.status }),
      ...(input.start_at !== undefined && { start_at: input.start_at }),
      ...(input.end_at !== undefined && { end_at: input.end_at }),
      ...(input.meeting_place !== undefined && { meeting_place: input.meeting_place?.trim() || null }),
      ...(input.meeting_lat !== undefined && { meeting_lat: input.meeting_lat }),
      ...(input.meeting_lng !== undefined && { meeting_lng: input.meeting_lng }),
      ...(input.roles !== undefined && { roles: input.roles }),
      ...(input.capacity !== undefined && { capacity: input.capacity }),
      ...(input.items_to_bring !== undefined && { items_to_bring: input.items_to_bring?.trim() || null }),
      ...(input.provisions !== undefined && { provisions: input.provisions?.trim() || null }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", recruitmentId)
    .eq("organizer_id", organizerId);

  if (error) throw error;
}

/** 応募作成（status: pending） */
export async function createApplication(
  supabase: SupabaseClient,
  recruitmentId: string,
  userId: string,
  message?: string
): Promise<string> {
  const { data, error } = await supabase
    .from("recruitment_applications")
    .insert({
      recruitment_id: recruitmentId,
      user_id: userId,
      status: "pending",
      message: message?.trim() || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

/** 応募ステータス取得 */
export async function getApplicationStatus(
  supabase: SupabaseClient,
  recruitmentId: string,
  userId: string
): Promise<ApplicationStatus | null> {
  const { data, error } = await supabase
    .from("recruitment_applications")
    .select("status")
    .eq("recruitment_id", recruitmentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.status as ApplicationStatus;
}

/** 募集の応募者一覧（主催者用） */
export async function fetchApplicationsByRecruitment(
  supabase: SupabaseClient,
  recruitmentId: string
): Promise<(RecruitmentApplicationMvp & { user?: { display_name: string | null; email: string | null } })[]> {
  const { data, error } = await supabase
    .from("recruitment_applications")
    .select("*, user:profiles(display_name, email)")
    .eq("recruitment_id", recruitmentId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as (RecruitmentApplicationMvp & {
    user?: { display_name: string | null; email: string | null };
  })[];
}

/** 応募ステータス更新（採用/不採用/チェックイン/役割） */
export async function updateApplicationStatus(
  supabase: SupabaseClient,
  applicationId: string,
  updates: {
    status?: ApplicationStatus;
    checked_in_at?: string | null;
    role_assigned?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("recruitment_applications")
    .update({
      ...(updates.status != null && { status: updates.status }),
      ...(updates.checked_in_at !== undefined && { checked_in_at: updates.checked_in_at }),
      ...(updates.role_assigned !== undefined && { role_assigned: updates.role_assigned }),
    })
    .eq("id", applicationId);

  if (error) throw error;
}
