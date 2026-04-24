import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchEventsByOrganizer,
  fetchEventParticipants,
} from "@/lib/db/events";
import { getEventReactionCounts } from "@/lib/db/event-reactions";
import {
  getOrganizerIdByProfileId,
  fetchRecruitmentsByOrganizer,
} from "@/lib/db/recruitments-mvp";
import { mockEvents } from "@/lib/events-mock";
import { getCreatedEvents } from "@/lib/created-events-store";
import type { Event } from "@/lib/db/types";
import { getJstTodayYmd } from "@/lib/jst-date";
import { isPublicEventStatus } from "@/lib/public-events";
import { getMonthlyPublishedCount } from "@/lib/billing";
import { buildPlanSummary, type PlanSummary } from "@/lib/organizer-plan-summary";

const MOCK_ORGANIZER_NAME = "地域振興会";

function getEventEndAtJst(date: string, endTime?: string | null): Date {
  const t = endTime && endTime.trim() ? endTime : "23:59";
  return new Date(`${date}T${t}:00+09:00`);
}

function getEventStatus(event: {
  date: string;
  status?: string;
  endTime?: string | null;
}): "public" | "draft" | "ended" {
  if (event.status === "draft") return "draft";
  if (event.status && !isPublicEventStatus(event.status)) return "ended";
  const endAtJst = getEventEndAtJst(event.date, event.endTime);
  return endAtJst.getTime() >= Date.now() ? "public" : "ended";
}

export type DashboardEvent = Omit<Event, "status"> & {
  status: "public" | "draft" | "ended";
  /** DB上の公開状態（公開/非公開の実体） */
  visibilityStatus: "draft" | "published" | "archived";
  participantCount: number;
  plannedCount: number;
  interestedCount: number;
  applicationCount: number;
  unreadCount: number;
  recruitmentIds: string[];
};

export type DashboardTodo = {
  id: string;
  type: "unread" | "pending_application" | "approval_waiting" | "day_of";
  title: string;
  eventId?: string;
  recruitmentId?: string;
  href: string;
};

export type DashboardKpis = {
  hosting: number;
  needsAction: number;
  pendingApplications: number;
  unreadMessages: number;
};

export type BillingSummary = {
  totalSales: number;
  pendingPayout: number;
  paymentSetupStatus: "unset" | "partial" | "ok";
  stripeAccountChargesEnabled: boolean;
};

export type { PlanSummary };

export type DashboardResponse = {
  kpis: DashboardKpis;
  todos: DashboardTodo[];
  events: DashboardEvent[];
  billingSummary?: BillingSummary;
  planSummary?: PlanSummary;
  organizationName?: string;
};

/** フォールバック: モックデータでダッシュボードを構築 */
async function buildMockDashboard(): Promise<DashboardResponse> {
  const allEvents = [...mockEvents, ...getCreatedEvents()];
  const myEvents = allEvents.filter((e) => e.organizerName === MOCK_ORGANIZER_NAME);
  const today = getJstTodayYmd();

  const events: DashboardEvent[] = myEvents.map((e) => ({
    ...e,
    status: getEventStatus({
      date: e.date,
      status: (e as unknown as { status?: string }).status,
      endTime: (e as unknown as { endTime?: string | null }).endTime ?? null,
    }),
    visibilityStatus: ((e as unknown as { status?: string }).status ?? "draft") as
      | "draft"
      | "published"
      | "archived",
    participantCount: e.participantCount ?? 0,
    plannedCount: 0,
    interestedCount: 0,
    applicationCount: 0,
    unreadCount: 0,
    recruitmentIds: [],
  }));

  const hosting = events.filter((e) => e.status === "public").length;

  const todos: DashboardTodo[] = [];

  return {
    kpis: {
      hosting,
      needsAction: 0,
      pendingApplications: 0,
      unreadMessages: 0,
    },
    todos,
    events: events.sort((a, b) => (a.date >= today && b.date >= today ? a.date.localeCompare(b.date) : a.date > b.date ? 1 : -1)),
    billingSummary: {
      totalSales: 0,
      pendingPayout: 0,
      paymentSetupStatus: "unset",
      stripeAccountChargesEnabled: false,
    },
    planSummary: buildPlanSummary(
      { subscription_status: null, founder30_end_at: null },
      0
    ),
    organizationName: MOCK_ORGANIZER_NAME,
  };
}

/** Supabase でダッシュボードを構築 */
async function buildSupabaseDashboard(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizerId: string,
  profileId: string,
  unreadTotal: number
): Promise<DashboardResponse> {
  type SbResult<T> = { data: T | null; error: unknown };
  type OrgRow = {
    stripe_account_charges_enabled?: boolean | null;
    subscription_status?: string | null;
    founder30_end_at?: string | null;
    organization_name?: string | null;
  };
  type PlanStateRow = {
    stripe_status?: string | null;
    manual_grant_active?: boolean | null;
    manual_grant_expires_at?: string | null;
  };

  const [eventsData, recruitmentsData, unreadResult, organizerRow] = await Promise.all([
    fetchEventsByOrganizer(supabase, organizerId),
    fetchRecruitmentsByOrganizer(supabase, organizerId),
    (async () => {
      try {
        return await supabase.rpc("get_unread_total");
      } catch {
        return { data: 0, error: null };
      }
    })(),
    Promise.all([
      supabase
        .from("organizers")
        .select("stripe_account_charges_enabled, subscription_status, founder30_end_at, organization_name")
        .eq("id", organizerId)
        .single(),
      supabase
        .from("organizer_plan_state")
        .select("stripe_status, manual_grant_active, manual_grant_expires_at")
        .eq("organizer_id", organizerId)
        .maybeSingle(),
    ]),
  ]);

  const unreadMessages = typeof unreadResult.data === "bigint"
    ? Number(unreadResult.data)
    : typeof unreadResult.data === "number"
      ? unreadResult.data
      : Number(unreadResult.data ?? 0) || 0;

  const today = getJstTodayYmd();

  const todos: DashboardTodo[] = [];
  let pendingApplications = 0;

  const eventIds = eventsData.map((e) => e.id);
  const recruitmentIds = recruitmentsData.map((r) => r.id);

  // イベント参加申請とボランティア応募を一括取得（N+1クエリを排除）
  const [{ data: appliedParticipants }, { data: allRecruitmentApps }] = await Promise.all([
    eventIds.length > 0
      ? supabase
          .from("event_participants")
          .select("event_id")
          .in("event_id", eventIds)
          .eq("status", "applied")
      : { data: [] as { event_id: string }[] },
    recruitmentIds.length > 0
      ? supabase
          .from("recruitment_applications")
          .select("id, status, recruitment_id")
          .in("recruitment_id", recruitmentIds)
      : { data: [] as { id: string; status: string; recruitment_id: string }[] },
  ]);

  const appliedCountByEvent: Record<string, number> = {};
  for (const p of appliedParticipants ?? []) {
    appliedCountByEvent[p.event_id] = (appliedCountByEvent[p.event_id] ?? 0) + 1;
  }

  for (const ev of eventsData) {
    const count = appliedCountByEvent[ev.id] ?? 0;
    if (count > 0) {
      const recForEvent = recruitmentsData.find((r) => r.event_id === ev.id);
      todos.push({
        id: `ep-${ev.id}`,
        type: "approval_waiting",
        title: `「${ev.title}」に${count}件の参加申請`,
        eventId: ev.id,
        recruitmentId: recForEvent?.id,
        href: recForEvent
          ? `/organizer/recruitments/${recForEvent.id}`
          : `/organizer/recruitments`,
      });
    }
  }

  const pendingEventParticipants = Object.values(appliedCountByEvent).reduce((a, b) => a + b, 0);

  // 一括取得済みのデータを recruitment_id でグループ化
  const appsByRecruitment = new Map<string, { id: string; status: string }[]>();
  for (const app of allRecruitmentApps ?? []) {
    const existing = appsByRecruitment.get(app.recruitment_id) ?? [];
    existing.push({ id: app.id, status: app.status });
    appsByRecruitment.set(app.recruitment_id, existing);
  }

  for (const r of recruitmentsData) {
    const apps = appsByRecruitment.get(r.id) ?? [];
    const pending = apps.filter((a) => a.status === "pending").length;
    pendingApplications += pending;

    if (pending > 0) {
      todos.push({
        id: `app-${r.id}`,
        type: "pending_application",
        title: `「${r.title}」に${pending}件の応募待ち`,
        recruitmentId: r.id,
        eventId: r.event_id ?? undefined,
        href: `/organizer/recruitments/${r.id}`,
      });
    }

    const startDate = r.start_at ? (typeof r.start_at === "string" ? r.start_at.slice(0, 10) : null) : null;
    if (startDate === today) {
      todos.push({
        id: `day-${r.id}`,
        type: "day_of",
        title: `「${r.title}」当日管理`,
        recruitmentId: r.id,
        eventId: r.event_id ?? undefined,
        href: `/organizer/recruitments/${r.id}/day-of`,
      });
    }
  }

  const appCountByRecruitment: Record<string, number> = {};
  for (const [recruitmentId, apps] of appsByRecruitment) {
    appCountByRecruitment[recruitmentId] = apps.length;
  }

  const events: DashboardEvent[] = await Promise.all(
    eventsData.map(async (e) => {
      const [participants, reactionCounts, recruitmentsForEvent] = await Promise.all([
        fetchEventParticipants(supabase, e.id),
        getEventReactionCounts(supabase, e.id).catch(() => ({ planned: 0, interested: 0 })),
        recruitmentsData.filter((r) => r.event_id === e.id),
      ]);
      const applicationCount = recruitmentsForEvent.reduce(
        (sum, r) => sum + (appCountByRecruitment[r.id] ?? 0),
        0
      );

      return {
        ...e,
        status: getEventStatus({ date: e.date, status: e.status, endTime: e.endTime ?? null }),
        visibilityStatus: (e.status ?? "draft") as "draft" | "published" | "archived",
        participantCount: participants.length,
        plannedCount: reactionCounts.planned,
        interestedCount: reactionCounts.interested,
        applicationCount,
        unreadCount: 0,
        recruitmentIds: recruitmentsForEvent.map((r) => r.id),
      };
    })
  );

  if (unreadMessages > 0) {
    todos.unshift({
      id: "unread-messages",
      type: "unread",
      title: `未読メッセージが${unreadMessages}件あります`,
      href: "/messages",
    });
  }

  const hosting = events.filter((e) => e.status === "public").length;
  const needsAction = Math.min(todos.length, 99);

  const [orgRes, planRes] = organizerRow as unknown as [SbResult<OrgRow>, SbResult<PlanStateRow>];
  const orgRow = orgRes?.data && !orgRes.error ? orgRes.data : null;
  const planRow = planRes?.data && !planRes.error ? planRes.data : null;
  const chargesEnabled = orgRow ? orgRow.stripe_account_charges_enabled === true : false;
  const paymentSetupStatus: "unset" | "partial" | "ok" = chargesEnabled ? "ok" : "unset";

  const monthlyPublished = await getMonthlyPublishedCount(supabase, organizerId);
  const planSummary = buildPlanSummary(
    {
      subscription_status: orgRow?.subscription_status ?? null,
      stripe_status: planRow?.stripe_status ?? null,
      founder30_end_at: orgRow?.founder30_end_at ?? null,
      manual_grant_active: planRow?.manual_grant_active ?? false,
      manual_grant_expires_at: planRow?.manual_grant_expires_at ?? null,
    },
    monthlyPublished
  );

  return {
    kpis: {
      hosting,
      needsAction,
      pendingApplications: pendingApplications + pendingEventParticipants,
      unreadMessages,
    },
    todos,
    events: events.sort((a, b) => (a.date >= today && b.date >= today ? a.date.localeCompare(b.date) : a.date > b.date ? 1 : -1)),
    billingSummary: {
      totalSales: 0,
      pendingPayout: 0,
      paymentSetupStatus,
      stripeAccountChargesEnabled: chargesEnabled,
    },
    planSummary,
    organizationName: orgRow?.organization_name ?? undefined,
  };
}

/** GET: 主催者ダッシュボードデータ */
export async function GET(_request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const isProduction = process.env.NODE_ENV === "production";
  const supabase = await createClient();
  if (!supabase) {
    // 本番環境ではモックダッシュボードにフォールバックしない
    return NextResponse.json(
      isProduction
        ? { error: "Supabase が未設定です" }
        : await buildMockDashboard(),
      { status: isProduction ? 500 : 200 }
    );
  }

  try {
    const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
    if (!organizerId) {
      // 本番環境ではモックダッシュボードにフォールバックしない
      return NextResponse.json(
        isProduction
          ? { error: "主催者アカウントが見つかりません" }
          : await buildMockDashboard(),
        { status: isProduction ? 404 : 200 }
      );
    }
    // unread は buildSupabaseDashboard 内で安全に取得する
    const data = await buildSupabaseDashboard(supabase, organizerId, user.id, 0);
    return NextResponse.json(data);
  } catch (e) {
    console.error("organizer dashboard GET:", e);
    return NextResponse.json(
      isProduction
        ? { error: "ダッシュボードの取得に失敗しました" }
        : await buildMockDashboard(),
      { status: isProduction ? 500 : 200 }
    );
  }
}
