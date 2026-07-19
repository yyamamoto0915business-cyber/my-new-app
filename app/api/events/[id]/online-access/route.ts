import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getParticipantStatus } from "@/lib/db/events";
import {
  ONLINE_SERVICE_LABEL,
  formatJstHmFromMs,
  isOnlineCapableFormat,
  isOnlineLinkVisibleNow,
  normalizeEventFormat,
  normalizeOnlineLinkDisplayTiming,
  normalizeOnlineService,
  onlineLinkWaitingMessage,
  resolveOnlineLinkAvailableAtMs,
  type EventOnlineAccessResponse,
} from "@/lib/event-online";
import { toJstTimestamp } from "@/lib/jst-date";
import { formatTimeToHm } from "@/lib/format-date";

type Params = { params: Promise<{ id: string }> };

const PASS_ELIGIBLE = new Set([
  "applied",
  "confirmed",
  "checked_in",
  "completed",
]);

/**
 * 参加パス保有者向けオンライン参加情報。
 * 公開ページ用 API とは分離し、権限・表示タイミングをサーバーで判定する。
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id: eventId } = await params;
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "データベースに接続できません" },
      { status: 503 }
    );
  }

  const status = await getParticipantStatus(supabase, eventId, user.id);
  if (!status || !PASS_ELIGIBLE.has(status)) {
    return NextResponse.json(
      { error: "有効な参加パスがありません" },
      { status: 403 }
    );
  }

  const { data: event, error } = await supabase
    .from("events")
    .select(
      `
      id,
      title,
      date,
      start_time,
      end_time,
      price,
      payment_method,
      event_format,
      online_service,
      online_join_url,
      online_meeting_id,
      online_passcode,
      online_guide_message,
      online_link_display_timing
    `
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    return NextResponse.json(
      { error: "イベントが見つかりません" },
      { status: 404 }
    );
  }

  const price = Number(event.price ?? 0);
  const paymentMethod = event.payment_method as
    | "online"
    | "onsite"
    | "both"
    | null;

  if (price > 0 && paymentMethod === "online") {
    const { data: order } = await supabase
      .from("event_orders")
      .select("status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const orderStatus = order?.status as string | undefined;
    const paidOrConfirmed =
      orderStatus === "paid" ||
      status === "confirmed" ||
      status === "checked_in" ||
      status === "completed";
    if (!paidOrConfirmed) {
      return NextResponse.json(
        { error: "有効な参加パスがありません" },
        { status: 403 }
      );
    }
  }

  const eventFormat = normalizeEventFormat(event.event_format);
  if (!isOnlineCapableFormat(eventFormat)) {
    return NextResponse.json(
      { error: "このイベントにオンライン参加情報はありません" },
      { status: 404 }
    );
  }

  const startTime = formatTimeToHm(String(event.start_time ?? ""));
  const timing = normalizeOnlineLinkDisplayTiming(
    event.online_link_display_timing
  );
  const nowMs = Date.now();
  const linkVisible = isOnlineLinkVisibleNow({
    date: String(event.date),
    startTime,
    timing,
    nowMs,
  });

  const startTs = toJstTimestamp(String(event.date), startTime);
  const availableAtMs = resolveOnlineLinkAvailableAtMs(
    String(event.date),
    startTime,
    timing
  );
  const onlineService = normalizeOnlineService(event.online_service);

  const base: EventOnlineAccessResponse = {
    eventFormat,
    linkVisible,
    waitingMessage: linkVisible ? null : onlineLinkWaitingMessage(timing),
    joinAvailableAt:
      availableAtMs != null
        ? new Date(availableAtMs).toISOString()
        : startTs != null
          ? new Date(startTs).toISOString()
          : null,
    eventStartAt: startTs != null ? new Date(startTs).toISOString() : null,
    onlineService,
    onlineServiceLabel: onlineService
      ? ONLINE_SERVICE_LABEL[onlineService]
      : null,
    onlineJoinUrl: null,
    onlineMeetingId: null,
    onlinePasscode: null,
    onlineGuideMessage: null,
    passIssued: true,
  };

  if (!linkVisible) {
    return NextResponse.json(base);
  }

  return NextResponse.json({
    ...base,
    onlineJoinUrl: String(event.online_join_url ?? "").trim() || null,
    onlineMeetingId: String(event.online_meeting_id ?? "").trim() || null,
    onlinePasscode: String(event.online_passcode ?? "").trim() || null,
    onlineGuideMessage: String(event.online_guide_message ?? "").trim() || null,
    joinAvailableAtHm:
      availableAtMs != null ? formatJstHmFromMs(availableAtMs) : null,
    eventStartAtHm: startTs != null ? formatJstHmFromMs(startTs) : null,
  });
}
