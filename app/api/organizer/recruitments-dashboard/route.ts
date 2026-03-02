import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  getOrganizerIdByProfileId,
  fetchRecruitmentsByOrganizer,
} from "@/lib/db/recruitments-mvp";
import type { RecruitmentMvp } from "@/lib/db/recruitments-mvp";

export type RecruitmentDashboardKpis = {
  active: number;
  totalApplications: number;
  pendingApproval: number;
  todayCount: number;
};

export type RecruitmentDashboardTodo = {
  id: string;
  type: "pending_approval" | "day_of";
  title: string;
  recruitmentId: string;
  count?: number;
  href: string;
};

export type RecruitmentDashboardItem = RecruitmentMvp & {
  eventTitle?: string | null;
  applicationCount: number;
  approvedCount: number;
  pendingCount: number;
};

export type RecruitmentDashboardResponse = {
  kpis: RecruitmentDashboardKpis;
  todos: RecruitmentDashboardTodo[];
  recruitments: RecruitmentDashboardItem[];
};

/** フォールバック: 空のダッシュボード */
async function buildMockDashboard(): Promise<RecruitmentDashboardResponse> {
  return {
    kpis: { active: 0, totalApplications: 0, pendingApproval: 0, todayCount: 0 },
    todos: [],
    recruitments: [],
  };
}

/** Supabase で募集管理ダッシュボードを構築 */
async function buildSupabaseDashboard(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizerId: string
): Promise<RecruitmentDashboardResponse> {
  const recruitments = await fetchRecruitmentsByOrganizer(supabase, organizerId);
  const recruitmentIds = recruitments.map((r) => r.id);

  const today = new Date().toISOString().split("T")[0];

  let appCountByRec: Record<string, { total: number; pending: number; approved: number }> = {};
  if (recruitmentIds.length > 0) {
    const { data: apps } = await supabase
      .from("recruitment_applications")
      .select("recruitment_id, status")
      .in("recruitment_id", recruitmentIds);

    for (const a of apps ?? []) {
      const r = a.recruitment_id;
      if (!appCountByRec[r]) appCountByRec[r] = { total: 0, pending: 0, approved: 0 };
      appCountByRec[r].total += 1;
      if (a.status === "pending") appCountByRec[r].pending += 1;
      if (a.status === "accepted" || a.status === "confirmed") appCountByRec[r].approved += 1;
    }
  }

  const eventIds = [...new Set(recruitments.map((r) => r.event_id).filter(Boolean))] as string[];
  let eventTitles: Record<string, string> = {};
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, title")
      .in("id", eventIds);
    for (const e of events ?? []) {
      eventTitles[e.id] = e.title ?? "";
    }
  }

  const items: RecruitmentDashboardItem[] = recruitments.map((r) => {
    const counts = appCountByRec[r.id] ?? { total: 0, pending: 0, approved: 0 };
    return {
      ...r,
      eventTitle: r.event_id ? eventTitles[r.event_id] ?? null : null,
      applicationCount: counts.total,
      approvedCount: counts.approved,
      pendingCount: counts.pending,
    };
  });

  const todos: RecruitmentDashboardTodo[] = [];
  let pendingApproval = 0;
  let todayCount = 0;

  for (const r of items) {
    if (r.pendingCount > 0) {
      pendingApproval += r.pendingCount;
      todos.push({
        id: `pending-${r.id}`,
        type: "pending_approval",
        title: `「${r.title}」に${r.pendingCount}件の承認待ち`,
        recruitmentId: r.id,
        count: r.pendingCount,
        href: `/organizer/recruitments/${r.id}`,
      });
    }
    const startDate = r.start_at ? (typeof r.start_at === "string" ? r.start_at.slice(0, 10) : null) : null;
    if (startDate === today) {
      todayCount += 1;
      todos.push({
        id: `day-${r.id}`,
        type: "day_of",
        title: `「${r.title}」当日管理`,
        recruitmentId: r.id,
        href: `/organizer/recruitments/${r.id}/day-of`,
      });
    }
  }

  const active = items.filter((r) => r.status === "public").length;
  const totalApplications = items.reduce((s, r) => s + r.applicationCount, 0);

  const kpis: RecruitmentDashboardKpis = {
    active,
    totalApplications,
    pendingApproval,
    todayCount,
  };

  const sorted = [...items].sort((a, b) => {
    const aDate = a.start_at ? String(a.start_at).slice(0, 10) : "";
    const bDate = b.start_at ? String(b.start_at).slice(0, 10) : "";
    if (aDate && bDate) return aDate.localeCompare(bDate);
    if (aDate) return -1;
    if (bDate) return 1;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });

  return {
    kpis,
    todos,
    recruitments: sorted,
  };
}

/** GET: 募集管理ダッシュボード */
export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(await buildMockDashboard());
  }

  try {
    const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
    if (!organizerId) {
      return NextResponse.json(await buildMockDashboard());
    }
    const data = await buildSupabaseDashboard(supabase, organizerId);
    return NextResponse.json(data);
  } catch (e) {
    console.error("recruitments-dashboard GET:", e);
    return NextResponse.json(await buildMockDashboard());
  }
}
