import type { SupabaseClient } from "@supabase/supabase-js";

export type RecruitmentType = "volunteer" | "paid_spot" | "job" | "tech_volunteer";
export type TechSlot = "consultation" | "light" | "project";

export type Recruitment = {
  id: string;
  event_id: string | null;
  organizer_id: string;
  type: RecruitmentType;
  title: string;
  description: string;
  role: string | null;
  time_slot: string | null;
  compensation_type: string | null;
  compensation_note: string | null;
  pay_type: string | null;
  pay_amount: number | null;
  work_hours: string | null;
  work_content: string | null;
  payment_method: string | null;
  employer_name: string | null;
  employment_type: string | null;
  work_conditions: string | null;
  application_method: string | null;
  tech_slot: TechSlot | null;
  deliverable_scope: string | null;
  created_at: string;
  updated_at: string;
};

export type RecruitmentFormData = {
  event_id?: string | null;
  type: RecruitmentType;
  title: string;
  description: string;
  role?: string;
  time_slot?: string;
  compensation_type?: string;
  compensation_note?: string;
  pay_type?: string;
  pay_amount?: number;
  work_hours?: string;
  work_content?: string;
  payment_method?: string;
  employer_name?: string;
  employment_type?: string;
  work_conditions?: string;
  application_method?: string;
  tech_slot?: TechSlot;
  deliverable_scope?: string;
};

export async function fetchRecruitments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("recruitments")
    .select("*, events(title, date), organizers(organization_name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchRecruitmentById(
  supabase: SupabaseClient,
  id: string
) {
  const { data, error } = await supabase
    .from("recruitments")
    .select("*, events(id, title, date), organizers(organization_name, contact_email)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function fetchRecruitmentsByOrganizer(
  supabase: SupabaseClient,
  organizerId: string
) {
  const { data, error } = await supabase
    .from("recruitments")
    .select("*, events(id, title, date)")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createRecruitment(
  supabase: SupabaseClient,
  organizerId: string,
  form: RecruitmentFormData
) {
  const { data, error } = await supabase
    .from("recruitments")
    .insert({
      organizer_id: organizerId,
      event_id: form.event_id ?? null,
      type: form.type,
      title: form.title,
      description: form.description,
      role: form.role ?? null,
      time_slot: form.time_slot ?? null,
      compensation_type: form.compensation_type ?? null,
      compensation_note: form.compensation_note ?? null,
      pay_type: form.pay_type ?? null,
      pay_amount: form.pay_amount ?? null,
      work_hours: form.work_hours ?? null,
      work_content: form.work_content ?? null,
      payment_method: form.payment_method ?? null,
      employer_name: form.employer_name ?? null,
      employment_type: form.employment_type ?? null,
      work_conditions: form.work_conditions ?? null,
      application_method: form.application_method ?? null,
      tech_slot: form.tech_slot ?? null,
      deliverable_scope: form.deliverable_scope ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function applyRecruitment(
  supabase: SupabaseClient,
  recruitmentId: string,
  userId: string,
  message?: string
) {
  const { error } = await supabase.from("recruitment_applications").insert({
    recruitment_id: recruitmentId,
    user_id: userId,
    status: "applied",
    message: message ?? null,
  });
  if (error) throw error;
}

export async function getApplicationStatus(
  supabase: SupabaseClient,
  recruitmentId: string,
  userId: string
) {
  const { data } = await supabase
    .from("recruitment_applications")
    .select("status")
    .eq("recruitment_id", recruitmentId)
    .eq("user_id", userId)
    .single();
  return data?.status ?? null;
}
