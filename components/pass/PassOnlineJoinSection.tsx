"use client";

import { useEffect, useState } from "react";
import {
  CalendarPlus,
  Lock,
  Mail,
  Monitor,
  Video,
} from "lucide-react";
import Link from "next/link";
import {
  EVENT_FORMAT_LABEL,
  isOnlineCapableFormat,
  type EventFormat,
  type EventOnlineAccessResponse,
} from "@/lib/event-online";
import type { ParticipationPass } from "@/lib/participation-pass";

type Props = {
  pass: ParticipationPass;
  organizerContact?: string | null;
  /** デモ用。指定時は API を呼ばずこの内容を表示する */
  demoAccess?: EventOnlineAccessResponse | null;
  /** デモ用リマインダー初期値 */
  demoReminderEnabled?: boolean;
  /** オンライン専用パス向けのコンパクト表示 */
  dense?: boolean;
  /** 親チケット内に埋め込み（枠・影なし） */
  embedded?: boolean;
};

function buildCalendarUrl(pass: ParticipationPass): string {
  const start = pass.startAt.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = pass.endAt.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: pass.eventTitle,
    dates: `${start}/${end}`,
    details: pass.venueName,
    location: pass.venueAddress ?? pass.venueName,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatHmFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export function PassOnlineJoinSection({
  pass,
  organizerContact,
  demoAccess,
  demoReminderEnabled = false,
  dense = false,
  embedded = false,
}: Props) {
  const format = (pass.eventFormat ?? "onsite") as EventFormat;
  const onlineCapable = isOnlineCapableFormat(format);
  const isDemo = demoAccess !== undefined;
  const [access, setAccess] = useState<EventOnlineAccessResponse | null>(
    demoAccess ?? null
  );
  const [loading, setLoading] = useState(onlineCapable && !isDemo);
  const [reminderOn, setReminderOn] = useState(demoReminderEnabled);
  const [reminderBusy, setReminderBusy] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setAccess(demoAccess ?? null);
      setLoading(false);
      setReminderOn(demoReminderEnabled);
      return;
    }
    if (!onlineCapable) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [accessRes, reminderRes] = await Promise.all([
          fetch(`/api/events/${pass.eventId}/online-access`),
          fetch(`/api/events/${pass.eventId}/reminder`),
        ]);
        if (!cancelled && accessRes.ok) {
          setAccess((await accessRes.json()) as EventOnlineAccessResponse);
        }
        if (!cancelled && reminderRes.ok) {
          const data = (await reminderRes.json()) as { enabled?: boolean };
          setReminderOn(Boolean(data.enabled));
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demoAccess, demoReminderEnabled, isDemo, onlineCapable, pass.eventId]);

  const toggleReminder = async () => {
    if (reminderBusy) return;
    if (isDemo) {
      setReminderOn((prev) => !prev);
      return;
    }
    setReminderBusy(true);
    const next = !reminderOn;
    try {
      const res = await fetch(`/api/events/${pass.eventId}/reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) setReminderOn(next);
    } finally {
      setReminderBusy(false);
    }
  };

  const mailto =
    organizerContact && organizerContact.includes("@")
      ? `mailto:${organizerContact}`
      : organizerContact && /^\+?[\d\s\-()]+$/.test(organizerContact)
        ? `tel:${organizerContact.replace(/\s/g, "")}`
        : null;

  const joinAvailableHm =
    formatHmFromIso(access?.joinAvailableAt) ??
    (access as { joinAvailableAtHm?: string } | null)?.joinAvailableAtHm;
  const eventStartHm =
    formatHmFromIso(access?.eventStartAt) ??
    (access as { eventStartAtHm?: string } | null)?.eventStartAtHm;

  return (
    <div className={dense ? "space-y-1.5" : "space-y-2.5"}>
      {onlineCapable ? (
        <div
          className={[
            embedded
              ? "bg-transparent"
              : "border border-[#dce8de] bg-white",
            embedded
              ? "p-0"
              : dense
                ? "rounded-xl p-2.5"
                : "rounded-2xl p-3.5 shadow-[0_2px_10px_rgba(40,60,48,0.05)]",
          ].join(" ")}
        >
          <div className={`flex flex-wrap items-center gap-1.5 ${dense ? "mb-1.5" : "mb-2"}`}>
            <h4
              className={`flex items-center gap-1.5 font-semibold text-[#1a2818] ${
                dense ? "text-[12.5px]" : "text-[13px]"
              }`}
            >
              <Monitor className="h-3.5 w-3.5 text-[#2B3A6B]" aria-hidden />
              オンライン参加情報
            </h4>
            {!dense ? (
              <span className="rounded-full bg-[#eef8e8] px-2 py-0.5 text-[10px] font-semibold text-[#3a7a10]">
                {EVENT_FORMAT_LABEL[format]}
              </span>
            ) : null}
            {access?.passIssued && !dense ? (
              <span className="rounded-full border border-[#c8dece] bg-[#f7fbf8] px-2 py-0.5 text-[10px] font-medium text-[#2d7a4f]">
                参加パス発行済み
              </span>
            ) : null}
            {access?.linkVisible ? (
              <span className="rounded-full bg-[#2B3A6B] px-2 py-0.5 text-[10px] font-semibold text-white">
                リンク表示中
              </span>
            ) : null}
          </div>

          {loading ? (
            <p className="text-[12px] text-[#6a7468]">読み込み中…</p>
          ) : access?.linkVisible ? (
            <div className={dense ? "space-y-1.5" : "space-y-2.5"}>
              <div
                className={
                  dense
                    ? "grid grid-cols-2 gap-x-3 gap-y-0.5"
                    : "space-y-2.5"
                }
              >
                {access.onlineServiceLabel ? (
                  <Row label="配信サービス" value={access.onlineServiceLabel} dense={dense} />
                ) : null}
                {joinAvailableHm ? (
                  <Row label="参加開始" value={joinAvailableHm} dense={dense} />
                ) : null}
                {!dense && eventStartHm ? (
                  <Row label="イベント開始時刻" value={eventStartHm} />
                ) : null}
                {dense && access.onlineMeetingId ? (
                  <Row label="ミーティングID" value={access.onlineMeetingId} dense />
                ) : null}
                {dense && access.onlinePasscode ? (
                  <Row label="パスコード" value={access.onlinePasscode} dense />
                ) : null}
              </div>

              {access.onlineJoinUrl ? (
                <a
                  href={access.onlineJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2B3A6B] font-semibold text-white transition hover:bg-[#243159] ${
                    dense ? "h-9 text-[12.5px]" : "h-10 text-[13px]"
                  }`}
                >
                  <Video className="h-4 w-4" aria-hidden />
                  参加する
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5c9d4] font-semibold text-white ${
                    dense ? "h-9 text-[12.5px]" : "h-10 text-[13px]"
                  }`}
                >
                  <Video className="h-4 w-4" aria-hidden />
                  参加する
                </button>
              )}

              {!dense && access.onlineMeetingId ? (
                <Row label="ミーティングID" value={access.onlineMeetingId} />
              ) : null}
              {!dense && access.onlinePasscode ? (
                <Row label="パスコード" value={access.onlinePasscode} />
              ) : null}
              {access.onlineGuideMessage ? (
                <p
                  className={`rounded-xl border border-[#e4ebe4] bg-[#f7fbf8] leading-relaxed text-[#3a4840] ${
                    dense ? "px-2.5 py-1.5 text-[11.5px] line-clamp-2" : "px-3 py-2 text-[12px]"
                  }`}
                >
                  {access.onlineGuideMessage}
                </p>
              ) : null}
            </div>
          ) : (
            <div className={dense ? "space-y-1.5" : "space-y-2.5"}>
              {access?.onlineServiceLabel ? (
                <Row label="配信サービス" value={access.onlineServiceLabel} dense={dense} />
              ) : null}
              <p
                className={`rounded-xl border border-[#e8e6e0] bg-[#fafaf8] leading-snug text-[#4a584c] ${
                  dense ? "px-2.5 py-2 text-[12px]" : "px-3 py-2.5 text-[12.5px]"
                }`}
              >
                {access?.waitingMessage ??
                  "オンライン参加リンクは、開始前に表示されます"}
              </p>
              <button
                type="button"
                disabled
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5c9d4] font-semibold text-white ${
                  dense ? "h-9 text-[12.5px]" : "h-10 text-[13px]"
                }`}
              >
                <Video className="h-4 w-4" aria-hidden />
                参加する
              </button>
            </div>
          )}

          <p
            className={`flex items-start gap-1.5 leading-snug text-[#6a7468] ${
              dense ? "mt-1.5 text-[10.5px]" : "mt-3 text-[11px]"
            }`}
          >
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            参加リンクはパス取得者のみに表示
          </p>
        </div>
      ) : null}

      <div className={`grid grid-cols-2 gap-1.5 ${dense ? "" : "min-[420px]:grid-cols-4"}`}>
        {mailto ? (
          <a
            href={mailto}
            className={`inline-flex items-center justify-center gap-1 rounded-xl border border-[#d0dcd2] bg-white px-2 font-medium text-[#3a4840] hover:bg-[#f4f8f5] ${
              dense ? "h-8 text-[10.5px]" : "h-9 text-[11px]"
            }`}
          >
            <Mail className="h-3 w-3" aria-hidden />
            問い合わせ
          </a>
        ) : (
          <Link
            href={`/events/${pass.eventId}`}
            className={`inline-flex items-center justify-center gap-1 rounded-xl border border-[#d0dcd2] bg-white px-2 font-medium text-[#3a4840] hover:bg-[#f4f8f5] ${
              dense ? "h-8 text-[10.5px]" : "h-9 text-[11px]"
            }`}
          >
            <Mail className="h-3 w-3" aria-hidden />
            問い合わせ
          </Link>
        )}
        {!dense ? (
          <Link
            href={`/events/${pass.eventId}`}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d0dcd2] bg-white px-2 text-[11px] font-medium text-[#3a4840] hover:bg-[#f4f8f5]"
          >
            イベント詳細
          </Link>
        ) : null}
        <a
          href={buildCalendarUrl(pass)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-1 rounded-xl border border-[#d0dcd2] bg-white px-2 font-medium text-[#3a4840] hover:bg-[#f4f8f5] ${
            dense ? "h-8 text-[10.5px]" : "h-9 text-[11px]"
          }`}
        >
          <CalendarPlus className="h-3 w-3" aria-hidden />
          カレンダー
        </a>
        <button
          type="button"
          onClick={toggleReminder}
          disabled={reminderBusy}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d0dcd2] bg-white px-2 font-medium text-[#3a4840] hover:bg-[#f4f8f5] ${
            dense ? "h-8 text-[10.5px] col-span-2" : "h-9 text-[11px]"
          }`}
          aria-pressed={reminderOn}
        >
          <span
            className={[
              "relative h-4 w-7 rounded-full transition",
              reminderOn ? "bg-[#6BBF3E]" : "bg-[#d0dcd2]",
            ].join(" ")}
            aria-hidden
          >
            <span
              className={[
                "absolute top-0.5 h-3 w-3 rounded-full bg-white transition",
                reminderOn ? "left-3.5" : "left-0.5",
              ].join(" ")}
            />
          </span>
          リマインダー
        </button>
      </div>
      {reminderOn ? (
        <p className={`text-center text-[#5a665c] ${dense ? "text-[10.5px]" : "text-[11px]"}`}>
          開始30分前に通知します
        </p>
      ) : null}

      {onlineCapable && !dense ? (
        <p className="text-center text-[11px] leading-relaxed text-[#6a7468]">
          この参加情報はあなたの参加パスにのみ表示されています。
          <br />
          第三者への共有や公開はお控えください。
        </p>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  dense,
}: {
  label: string;
  value: string;
  dense?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-2 ${
        dense ? "text-[11.5px]" : "gap-3 text-[12.5px]"
      }`}
    >
      <span className="shrink-0 text-[#6a7468]">{label}</span>
      <span className="text-right font-semibold text-[#1a2818]">{value}</span>
    </div>
  );
}
