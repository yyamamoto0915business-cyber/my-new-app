import type { SupabaseClient } from "@supabase/supabase-js";
import { formatTimeToHm } from "@/lib/format-date";
import { getJstTodayYmd } from "@/lib/jst-date";
import type { ParticipationPass } from "@/lib/participation-pass";
import type { EventParticipantStatus } from "@/lib/db/types";
import type { ApplicationStatus } from "@/lib/db/recruitments-mvp";

const PASS_ELIGIBLE_STATUSES: EventParticipantStatus[] = [
  "applied",
  "confirmed",
  "checked_in",
  "completed",
];

const VOLUNTEER_PASS_STATUSES: ApplicationStatus[] = [
  "accepted",
  "confirmed",
  "checked_in",
  "completed",
];

const FALLBACK_EVENT_IMAGE =
  "https://placehold.co/800x600/eef2ee/6a7468?text=Event";

type EventJoinRow = {
  id: string;
  title: string;
  image_url: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  address: string | null;
  price: number | null;
  payment_method: "online" | "onsite" | "both" | null;
  check_in_method: "qr" | "manual" | null;
};

type ParticipantJoinRow = {
  id: string;
  event_id: string;
  status: EventParticipantStatus;
  events: EventJoinRow | EventJoinRow[] | null;
};

type OrderRow = {
  event_id: string;
  status: "pending" | "paid" | "refunded" | "failed";
};

type VolunteerAppJoinRow = {
  id: string;
  recruitment_id: string;
  status: ApplicationStatus;
  role_assigned: string | null;
  recruitments: {
    id: string;
    event_id: string | null;
    title: string | null;
    role: string | null;
    roles: unknown;
    meeting_place: string | null;
    events: EventJoinRow | EventJoinRow[] | null;
  } | {
    id: string;
    event_id: string | null;
    title: string | null;
    role: string | null;
    roles: unknown;
    meeting_place: string | null;
    events: EventJoinRow | EventJoinRow[] | null;
  }[] | null;
};

function asEventRow(events: EventJoinRow | EventJoinRow[] | null): EventJoinRow | null {
  if (!events) return null;
  return Array.isArray(events) ? (events[0] ?? null) : events;
}

function asRecruitmentRow(
  recruitments: VolunteerAppJoinRow["recruitments"]
): NonNullable<Exclude<VolunteerAppJoinRow["recruitments"], unknown[]>> | null {
  if (!recruitments) return null;
  return Array.isArray(recruitments) ? (recruitments[0] ?? null) : recruitments;
}

function toHmPadded(time?: string | null, fallback = "00:00"): string {
  const hm = formatTimeToHm(time) || fallback;
  const [h = "0", m = "00"] = hm.split(":");
  return `${String(Number(h)).padStart(2, "0")}:${m.padStart(2, "0")}`;
}

function toEventIso(dateYmd: string, timeHm: string): string {
  return `${dateYmd}T${toHmPadded(timeHm)}:00+09:00`;
}

export function buildReceptionNumber(id: string): string {
  const short = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `MG-${short}`;
}

function resolvePaymentStatus(options: {
  price: number;
  paymentMethod: EventJoinRow["payment_method"];
  orderStatus: OrderRow["status"] | null;
}): ParticipationPass["paymentStatus"] {
  const { price, paymentMethod, orderStatus } = options;
  if (price <= 0) return "free";
  if (orderStatus === "paid") return "paid";
  if (paymentMethod === "onsite" || paymentMethod === "both") return "onsite";
  return "paid";
}

/**
 * チケット取得済みか。
 * - 無料: applied 以降（辞退・変更希望を除く）
 * - 有料オンライン: 支払い済み or confirmed 以降（未払いの applied は除外）
 * - 現地払い: applied 以降を取得済み扱い
 * - 返金済み: 履歴の cancelled として残す
 */
function resolvePassVisibility(options: {
  participantStatus: EventParticipantStatus;
  price: number;
  paymentMethod: EventJoinRow["payment_method"];
  orderStatus: OrderRow["status"] | null;
}): "show" | "cancelled" | "hide" {
  const { participantStatus, price, paymentMethod, orderStatus } = options;

  if (
    participantStatus === "declined" ||
    participantStatus === "change_requested"
  ) {
    return "hide";
  }

  if (orderStatus === "refunded") {
    return "cancelled";
  }

  if (price > 0) {
    const allowsOnsite =
      paymentMethod === "onsite" || paymentMethod === "both";
    const paidOrConfirmed =
      orderStatus === "paid" ||
      participantStatus === "confirmed" ||
      participantStatus === "checked_in" ||
      participantStatus === "completed";
    // オンライン支払いのみ: 未払いの applied はパス未取得
    if (!allowsOnsite && !paidOrConfirmed) return "hide";
  }

  return "show";
}

function resolveUiStatus(
  eventDateYmd: string,
  cancelled: boolean,
  now: Date
): ParticipationPass["status"] {
  if (cancelled) return "cancelled";
  const today = getJstTodayYmd(now);
  if (eventDateYmd > today) return "upcoming";
  if (eventDateYmd === today) return "today";
  return "completed";
}

function firstRoleName(roles: unknown, fallback: string | null): string | null {
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  if (!Array.isArray(roles)) return null;
  for (const r of roles) {
    if (r != null && typeof r === "object" && "name" in r) {
      const name = String((r as { name?: unknown }).name ?? "").trim();
      if (name) return name;
    }
  }
  return null;
}

function toParticipationPass(options: {
  participantId: string;
  event: EventJoinRow;
  attendeeName: string;
  orderStatus: OrderRow["status"] | null;
  cancelled: boolean;
  now: Date;
}): ParticipationPass {
  const { participantId, event, attendeeName, orderStatus, cancelled, now } =
    options;
  const price = event.price ?? 0;
  const startAt = toEventIso(event.date, event.start_time || "00:00");
  const endAt = toEventIso(
    event.date,
    event.end_time || event.start_time || "23:59"
  );
  const receptionNumber = buildReceptionNumber(participantId);
  const receptionType = event.check_in_method === "qr" ? "qr" : "staff";

  return {
    id: participantId,
    eventId: event.id,
    eventTitle: event.title,
    eventImage: event.image_url?.trim() || FALLBACK_EVENT_IMAGE,
    startAt,
    endAt,
    venueName: event.location?.trim() || "会場未設定",
    venueAddress: event.address?.trim() || undefined,
    attendeeName,
    receptionNumber,
    paymentStatus: resolvePaymentStatus({
      price,
      paymentMethod: event.payment_method,
      orderStatus,
    }),
    receptionType,
    ticketLabel: "大人",
    quantity: 1,
    qrValue:
      receptionType === "qr" ? `mg-pass:${participantId}` : undefined,
    expiresAt: endAt,
    status: resolveUiStatus(event.date, cancelled, now),
    kind: "visitor",
  };
}

function toVolunteerPass(options: {
  applicationId: string;
  recruitmentId: string;
  event: EventJoinRow;
  attendeeName: string;
  roleLabel: string;
  now: Date;
}): ParticipationPass {
  const { applicationId, recruitmentId, event, attendeeName, roleLabel, now } =
    options;
  const startAt = toEventIso(event.date, event.start_time || "00:00");
  const endAt = toEventIso(
    event.date,
    event.end_time || event.start_time || "23:59"
  );
  const receptionNumber = buildReceptionNumber(applicationId);
  // スタッフパスは常に QR 受付（来場者の check_in_method に依存しない）
  const receptionType = "qr" as const;

  return {
    id: applicationId,
    eventId: event.id,
    eventTitle: event.title,
    eventImage: event.image_url?.trim() || FALLBACK_EVENT_IMAGE,
    startAt,
    endAt,
    venueName: event.location?.trim() || "会場未設定",
    venueAddress: event.address?.trim() || undefined,
    attendeeName,
    receptionNumber,
    paymentStatus: "free",
    receptionType,
    ticketLabel: roleLabel,
    quantity: 1,
    qrValue: `mg-pass:${applicationId}`,
    expiresAt: endAt,
    status: resolveUiStatus(event.date, false, now),
    kind: "volunteer",
    roleLabel,
    recruitmentId,
  };
}

async function fetchVisitorPasses(
  supabase: SupabaseClient,
  userId: string,
  attendeeName: string,
  now: Date
): Promise<ParticipationPass[]> {
  const { data: rows, error } = await supabase
    .from("event_participants")
    .select(
      `
      id,
      event_id,
      status,
      events (
        id,
        title,
        image_url,
        date,
        start_time,
        end_time,
        location,
        address,
        price,
        payment_method,
        check_in_method
      )
    `
    )
    .eq("user_id", userId)
    .in("status", PASS_ELIGIBLE_STATUSES)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchMyParticipationPasses visitors:", error.message);
    return [];
  }

  const participants = (rows ?? []) as ParticipantJoinRow[];
  if (participants.length === 0) return [];

  const eventIds = [
    ...new Set(
      participants
        .map((row) => asEventRow(row.events)?.id ?? row.event_id)
        .filter(Boolean)
    ),
  ];

  const { data: orderRows, error: orderError } = await supabase
    .from("event_orders")
    .select("event_id, status")
    .eq("user_id", userId)
    .in("event_id", eventIds)
    .in("status", ["paid", "refunded"]);

  if (orderError) {
    console.error("fetchMyParticipationPasses orders:", orderError.message);
  }

  const orderByEvent = new Map<string, OrderRow["status"]>();
  for (const order of (orderRows ?? []) as OrderRow[]) {
    const current = orderByEvent.get(order.event_id);
    // paid を優先（同一イベントに paid / refunded が並んでも paid を採用）
    if (current === "paid") continue;
    orderByEvent.set(order.event_id, order.status);
  }

  const passes: ParticipationPass[] = [];
  for (const row of participants) {
    const event = asEventRow(row.events);
    if (!event) continue;

    const orderStatus = orderByEvent.get(event.id) ?? null;
    const visibility = resolvePassVisibility({
      participantStatus: row.status,
      price: event.price ?? 0,
      paymentMethod: event.payment_method,
      orderStatus,
    });
    if (visibility === "hide") continue;

    passes.push(
      toParticipationPass({
        participantId: row.id,
        event,
        attendeeName,
        orderStatus,
        cancelled: visibility === "cancelled",
        now,
      })
    );
  }

  return passes;
}

async function fetchVolunteerPasses(
  supabase: SupabaseClient,
  userId: string,
  attendeeName: string,
  now: Date
): Promise<ParticipationPass[]> {
  const { data: rows, error } = await supabase
    .from("recruitment_applications")
    .select(
      `
      id,
      recruitment_id,
      status,
      role_assigned,
      recruitments (
        id,
        event_id,
        title,
        role,
        roles,
        meeting_place,
        events (
          id,
          title,
          image_url,
          date,
          start_time,
          end_time,
          location,
          address,
          price,
          payment_method,
          check_in_method
        )
      )
    `
    )
    .eq("user_id", userId)
    .in("status", VOLUNTEER_PASS_STATUSES)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchMyParticipationPasses volunteers:", error.message);
    return [];
  }

  const apps = (rows ?? []) as VolunteerAppJoinRow[];
  const passes: ParticipationPass[] = [];

  for (const app of apps) {
    const recruitment = asRecruitmentRow(app.recruitments);
    if (!recruitment?.event_id) continue;

    const event = asEventRow(recruitment.events);
    if (!event) continue;

    const roleLabel =
      (typeof app.role_assigned === "string" && app.role_assigned.trim()) ||
      firstRoleName(recruitment.roles, recruitment.role) ||
      "ボランティア";

    passes.push(
      toVolunteerPass({
        applicationId: app.id,
        recruitmentId: recruitment.id,
        event,
        attendeeName,
        roleLabel,
        now,
      })
    );
  }

  return passes;
}

/** ログイン中ユーザーの取得済み参加パスを返す（来場者＋承認済みボランティア） */
export async function fetchMyParticipationPasses(
  supabase: SupabaseClient,
  userId: string,
  attendeeName: string,
  now: Date = new Date()
): Promise<ParticipationPass[]> {
  const [visitorPasses, volunteerPasses] = await Promise.all([
    fetchVisitorPasses(supabase, userId, attendeeName, now),
    fetchVolunteerPasses(supabase, userId, attendeeName, now),
  ]);

  return [...visitorPasses, ...volunteerPasses].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
}
