import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DashboardStaffMember,
  StaffLifecycleStatus,
} from "@/lib/organizer/day-ops-types";
import type { ApplicationStatus } from "@/lib/db/recruitments-mvp";

type AppRow = {
  id: string;
  status: ApplicationStatus;
  message: string | null;
  checked_in_at: string | null;
  role_assigned: string | null;
  created_at: string;
  user_id: string;
  user?:
    | { display_name: string | null; email: string | null }
    | { display_name: string | null; email: string | null }[]
    | null;
};

function profileOf(row: AppRow): { display_name: string | null; email: string | null } | null {
  if (!row.user) return null;
  return Array.isArray(row.user) ? (row.user[0] ?? null) : row.user;
}

function firstRoleFromMessage(message: string | null): string | null {
  if (!message?.trim()) return null;
  // 応募メッセージに役割が含まれるケース向けの簡易抽出はせず、固定フォールバックを使う
  return null;
}

export function mapApplicationToLifecycle(
  status: ApplicationStatus,
  checkedInAt: string | null
): StaffLifecycleStatus {
  if (status === "rejected") return "rejected";
  if (status === "canceled") return "declined";
  if (status === "pending" || status === "applied") return "pending_review";
  if (status === "checked_in" || checkedInAt) {
    // Phase 6: on_duty / on_break 手動切替は後続。checked_in として扱う
    return "checked_in";
  }
  if (status === "completed") return "finished";
  if (status === "accepted" || status === "confirmed") return "scheduled";
  return "pending_review";
}

function formatAppliedAtLabel(createdAt: string, now = new Date()): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "応募済み";

  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${Math.max(1, diffMin)}分前に応募`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前に応募`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) {
    const hm = created.toLocaleTimeString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `昨日${hm}に応募`;
  }
  if (diffDay < 7) return `${diffDay}日前に応募`;
  return `${diffDay}日前に応募`;
}

function formatDetailLabel(
  status: StaffLifecycleStatus,
  checkedInAt: string | null
): string | undefined {
  if (status === "checked_in" || status === "on_duty") {
    if (checkedInAt) {
      return new Date(checkedInAt).toLocaleTimeString("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return undefined;
  }
  if (status === "scheduled" || status === "approved" || status === "confirmed") {
    return "待機中";
  }
  if (status === "absent") return "連絡待ち";
  return undefined;
}

/** イベントに紐づく募集の応募者を DashboardStaffMember に変換 */
export async function fetchEventStaffMembers(
  supabase: SupabaseClient,
  eventId: string
): Promise<DashboardStaffMember[]> {
  const { data: recruitments, error: recError } = await supabase
    .from("recruitments")
    .select("id, role, roles")
    .eq("event_id", eventId);

  if (recError) {
    console.error("fetchEventStaffMembers recruitments:", recError.message);
    return [];
  }

  const recruitmentIds = (recruitments ?? []).map((r) => r.id as string);
  if (recruitmentIds.length === 0) return [];

  const recruitmentMeta = new Map<
    string,
    { role: string | null; roles: unknown }
  >();
  for (const r of recruitments ?? []) {
    recruitmentMeta.set(r.id as string, {
      role: (r.role as string | null) ?? null,
      roles: r.roles,
    });
  }

  const { data: apps, error: appError } = await supabase
    .from("recruitment_applications")
    .select(
      "id, status, message, checked_in_at, role_assigned, created_at, user_id, recruitment_id, user:profiles(display_name, email)"
    )
    .in("recruitment_id", recruitmentIds)
    .order("created_at", { ascending: false });

  if (appError) {
    console.error("fetchEventStaffMembers applications:", appError.message);
    return [];
  }

  const now = new Date();
  const members: DashboardStaffMember[] = [];

  for (const raw of apps ?? []) {
    const row = raw as AppRow & { recruitment_id: string };
    const profile = profileOf(row);
    const name =
      profile?.display_name?.trim() ||
      profile?.email?.split("@")[0] ||
      "スタッフ";

    const meta = recruitmentMeta.get(row.recruitment_id);
    let roleFallback: string | null = meta?.role?.trim() || null;
    if (!roleFallback && Array.isArray(meta?.roles)) {
      for (const r of meta.roles) {
        if (r != null && typeof r === "object" && "name" in r) {
          const n = String((r as { name?: unknown }).name ?? "").trim();
          if (n) {
            roleFallback = n;
            break;
          }
        }
      }
    }

    const role =
      row.role_assigned?.trim() ||
      firstRoleFromMessage(row.message) ||
      roleFallback ||
      "ボランティア";

    const status = mapApplicationToLifecycle(row.status, row.checked_in_at);

    members.push({
      id: row.id,
      name,
      role,
      status,
      appliedAtLabel: formatAppliedAtLabel(row.created_at, now),
      detailLabel: formatDetailLabel(status, row.checked_in_at),
    });
  }

  return members;
}
