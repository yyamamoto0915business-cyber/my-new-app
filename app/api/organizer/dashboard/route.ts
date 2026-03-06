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

const MOCK_ORGANIZER_NAME = "地域振興会";

function getEventStatus(event: { date: string; status?: string }): "public" | "draft" | "ended" {
  if (event.status === "draft") return "draft";
  const today = new Date().toISOString().split("T")[0];
  return event.date >= today ? "public" : "ended";
}

export type DashboardEvent = Omit<Event, "status"> & {
  status: "public" | "draft" | "ended";
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

export type DashboardResponse = {
  kpis: DashboardKpis;
  todos: DashboardTodo[];
  events: DashboardEvent[];
};

/** フォールバック: モックデータでダッシュボードを構築 */
async function buildMockDashboard(): Promise<DashboardResponse> {
  const allEvents = [...mockEvents, ...getCreatedEvents()];
  const myEvents = allEvents.filter((e) => e.organizerName === MOCK_ORGANIZER_NAME);
  const today = new Date().toISOString().split("T")[0];

  const events: DashboardEvent[] = myEvents.map((e) => ({
    ...e,
    status: getEventStatus(e),
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
  };
}

/** Supabase でダッシュボードを構築 */
async function buildSupabaseDashboard(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizerId: string,
  profileId: string,
  unreadTotal: number
): Promise<DashboardResponse> {
  const [eventsData, recruitmentsData, unreadResult] = await Promise.all([
    fetchEventsByOrganizer(supabase, organizerId),
    fetchRecruitmentsByOrganizer(supabase, organizerId),
    (async () => {
      try {
        return await supabase.rpc("get_unread_total");
      } catch {
        return { data: 0, error: null };
      }
    })(),
  ]);

  const unreadMessages = typeof unreadResult.data === "bigint"
    ? Number(unreadResult.data)
    : typeof unreadResult.data === "number"
      ? unreadResult.data
      : Number(unreadResult.data ?? 0) || 0;

  const today = new Date().toISOString().split("T")[0];

  const todos: DashboardTodo[] = [];
  let pendingApplications = 0;

  const eventIds = eventsData.map((e) => e.id);
  const { data: appliedParticipants } = eventIds.length > 0
    ? await supabase
        .from("event_participants")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("status", "applied")
    : { data: [] };

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

  for (const r of recruitmentsData) {
    const { data: apps } = await supabase
      .from("recruitment_applications")
      .select("id, status")
      .eq("recruitment_id", r.id);

    const pending = (apps ?? []).filter((a) => a.status === "pending").length;
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

  const recruitmentIds = recruitmentsData.map((r) => r.id);
  const { data: allApps } = recruitmentIds.length > 0
    ? await supabase
        .from("recruitment_applications")
        .select("recruitment_id")
        .in("recruitment_id", recruitmentIds)
    : { data: [] };

  const appCountByRecruitment: Record<string, number> = {};
  for (const a of allApps ?? []) {
    appCountByRecruitment[a.recruitment_id] = (appCountByRecruitment[a.recruitment_id] ?? 0) + 1;
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
        status: getEventStatus(e),
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

  return {
    kpis: {
      hosting,
      needsAction,
      pendingApplications: pendingApplications + pendingEventParticipants,
      unreadMessages,
    },
    todos,
    events: events.sort((a, b) => (a.date >= today && b.date >= today ? a.date.localeCompare(b.date) : a.date > b.date ? 1 : -1)),
  };
}

/** GET: 主催者ダッシュボードデータ */
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
    const unreadResult = await supabase.rpc("get_unread_total");
    const unreadTotal = typeof unreadResult.data === "bigint"
      ? Number(unreadResult.data)
      : Number(unreadResult.data ?? 0) || 0;
    const data = await buildSupabaseDashboard(supabase, organizerId, user.id, unreadTotal);
    return NextResponse.json(data);
  } catch (e) {
    console.error("organizer dashboard GET:", e);
    return NextResponse.json(await buildMockDashboard());
  }
}
