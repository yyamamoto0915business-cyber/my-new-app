import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildReceptionNumber,
  parsePassQr,
} from "@/lib/checkin/parse-pass-qr";

const VOLUNTEER_ELIGIBLE = [
  "accepted",
  "confirmed",
  "checked_in",
  "completed",
] as const;

export type ResolvedPass =
  | {
      kind: "visitor";
      participantId: string;
      eventId: string;
      userId: string | null;
      status: string;
    }
  | {
      kind: "volunteer";
      applicationId: string;
      eventId: string;
      userId: string;
      recruitmentId: string;
      status: string;
      checkedInAt: string | null;
      roleAssigned: string | null;
    };

type ParticipantRow = {
  id: string;
  event_id: string;
  user_id: string | null;
  status: string;
};

type ApplicationRow = {
  id: string;
  user_id: string;
  status: string;
  checked_in_at: string | null;
  role_assigned: string | null;
  recruitment_id: string;
  recruitments:
    | { id: string; event_id: string | null }
    | { id: string; event_id: string | null }[]
    | null;
};

function asRecruitment(
  recruitments: ApplicationRow["recruitments"]
): { id: string; event_id: string | null } | null {
  if (!recruitments) return null;
  return Array.isArray(recruitments) ? (recruitments[0] ?? null) : recruitments;
}

async function resolveByUuid(
  supabase: SupabaseClient,
  uuid: string,
  eventId?: string
): Promise<ResolvedPass | null> {
  const { data: participant } = await supabase
    .from("event_participants")
    .select("id, event_id, user_id, status")
    .eq("id", uuid)
    .maybeSingle();

  if (participant) {
    const row = participant as ParticipantRow;
    if (eventId && row.event_id !== eventId) return null;
    return {
      kind: "visitor",
      participantId: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      status: row.status,
    };
  }

  const { data: application } = await supabase
    .from("recruitment_applications")
    .select(
      `
      id,
      user_id,
      status,
      checked_in_at,
      role_assigned,
      recruitment_id,
      recruitments ( id, event_id )
    `
    )
    .eq("id", uuid)
    .maybeSingle();

  if (!application) return null;

  const app = application as ApplicationRow;
  if (!VOLUNTEER_ELIGIBLE.includes(app.status as (typeof VOLUNTEER_ELIGIBLE)[number])) {
    return null;
  }

  const recruitment = asRecruitment(app.recruitments);
  if (!recruitment?.event_id) return null;
  if (eventId && recruitment.event_id !== eventId) return null;

  return {
    kind: "volunteer",
    applicationId: app.id,
    eventId: recruitment.event_id,
    userId: app.user_id,
    recruitmentId: recruitment.id,
    status: app.status,
    checkedInAt: app.checked_in_at,
    roleAssigned: app.role_assigned,
  };
}

async function resolveByReceptionNumber(
  supabase: SupabaseClient,
  receptionNumber: string,
  eventId?: string
): Promise<ResolvedPass | null> {
  const suffix = receptionNumber.replace(/^MG-/i, "").toUpperCase();
  if (suffix.length !== 8) return null;

  // 来場者: 対象イベントの参加者を取得して先頭8桁照合
  let participantQuery = supabase
    .from("event_participants")
    .select("id, event_id, user_id, status");

  if (eventId) {
    participantQuery = participantQuery.eq("event_id", eventId);
  }

  const { data: participants } = await participantQuery.limit(500);
  for (const row of (participants ?? []) as ParticipantRow[]) {
    if (buildReceptionNumber(row.id) === `MG-${suffix}`) {
      return {
        kind: "visitor",
        participantId: row.id,
        eventId: row.event_id,
        userId: row.user_id,
        status: row.status,
      };
    }
  }

  // ボランティア: 承認済み応募を取得して先頭8桁照合
  const { data: applications } = await supabase
    .from("recruitment_applications")
    .select(
      `
      id,
      user_id,
      status,
      checked_in_at,
      role_assigned,
      recruitment_id,
      recruitments ( id, event_id )
    `
    )
    .in("status", [...VOLUNTEER_ELIGIBLE])
    .limit(500);

  for (const app of (applications ?? []) as ApplicationRow[]) {
    if (buildReceptionNumber(app.id) !== `MG-${suffix}`) continue;
    const recruitment = asRecruitment(app.recruitments);
    if (!recruitment?.event_id) continue;
    if (eventId && recruitment.event_id !== eventId) continue;
    return {
      kind: "volunteer",
      applicationId: app.id,
      eventId: recruitment.event_id,
      userId: app.user_id,
      recruitmentId: recruitment.id,
      status: app.status,
      checkedInAt: app.checked_in_at,
      roleAssigned: app.role_assigned,
    };
  }

  return null;
}

/**
 * 参加パスQR / 受付番号を解釈し、来場者 or ボランティアを返す。
 * eventId を渡すとそのイベントに紐づくものだけを許可する。
 */
export async function resolvePassQr(
  supabase: SupabaseClient,
  raw: string,
  eventId?: string
): Promise<ResolvedPass | null> {
  const parsed = parsePassQr(raw);
  if (!parsed) return null;

  if (parsed.type === "participant") {
    return resolveByUuid(supabase, parsed.participantId, eventId);
  }

  return resolveByReceptionNumber(supabase, parsed.receptionNumber, eventId);
}

/** 会場QR自己チェックイン用: ユーザーの承認済みボランティア応募を探す */
export async function findApprovedVolunteerForEvent(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<ResolvedPass | null> {
  const { data: applications } = await supabase
    .from("recruitment_applications")
    .select(
      `
      id,
      user_id,
      status,
      checked_in_at,
      role_assigned,
      recruitment_id,
      recruitments!inner ( id, event_id )
    `
    )
    .eq("user_id", userId)
    .in("status", ["accepted", "confirmed", "checked_in", "completed"]);

  for (const app of (applications ?? []) as ApplicationRow[]) {
    const recruitment = asRecruitment(app.recruitments);
    if (!recruitment?.event_id || recruitment.event_id !== eventId) continue;
    return {
      kind: "volunteer",
      applicationId: app.id,
      eventId: recruitment.event_id,
      userId: app.user_id,
      recruitmentId: recruitment.id,
      status: app.status,
      checkedInAt: app.checked_in_at,
      roleAssigned: app.role_assigned,
    };
  }

  return null;
}

/** ボランティア応募をチェックイン済みにする */
export async function checkInVolunteerApplication(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{ checkedInAt: string }> {
  const checkedInAt = new Date().toISOString();
  const { error } = await supabase
    .from("recruitment_applications")
    .update({
      status: "checked_in",
      checked_in_at: checkedInAt,
    })
    .eq("id", applicationId);

  if (error) throw error;
  return { checkedInAt };
}
