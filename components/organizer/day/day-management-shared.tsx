"use client";

import { useEffect, type ReactNode } from "react";
import { Download, Send, Save, AlertTriangle } from "lucide-react";
import { getJstTodayYmd } from "@/lib/jst-date";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const MOCK_EVENT = {
  title: "モヤっと対話",
  date: "2026/05/10（土）10:00〜16:00",
  venue: "バタカラカフェ",
  status: "開催中",
};

export interface EventInfo {
  title: string;
  date: string;
  venue: string;
  status: string;
}

export const EMPTY_DAY_EVENT: EventInfo = {
  title: "本日の開催はありません",
  date: "",
  venue: "",
  status: "",
};

export const EMPTY_CHECKIN = { checkedIn: 0, notChecked: 0, cancelled: 0, total: 0 };

export const MOCK_CHECKIN = { checkedIn: 28, notChecked: 18, cancelled: 4, total: 50 };

export const MOCK_STAFF = [
  { name: "山本雄太", role: "リーダー", status: "ok" as const },
  { name: "佐藤花子", role: "受付", status: "ok" as const },
  { name: "鈴木一郎", role: "運営", status: "ok" as const },
  { name: "田中美映", role: "案内", status: "late" as const },
  { name: "高橋健", role: "音響", status: "absent" as const },
  { name: "小林誠", role: "記録", status: "ok" as const },
];

export const MOCK_SCHEDULE = [
  { time: "10:00 - 10:30", name: "オープニング・受付", status: "done" as const },
  { time: "10:30 - 12:00", name: "モヤっと対話ワークショップ", status: "live" as const },
  { time: "13:00 - 14:30", name: "グループ共有", status: "wait" as const },
  { time: "14:45 - 15:30", name: "クロージング", status: "wait" as const },
];

export const MOCK_NOTICES = [
  { type: "urg" as const, text: "ワークショップ会場をBからAに変更しました", time: "9:15" },
  { type: "info" as const, text: "お昼休憩は12:00〜13:00です", time: "8:45" },
];

export type ModalType = "qr" | "announce" | "message" | "emergency" | "memo" | null;

export type EventDayPhase = "live" | "upcoming" | "past";

export type DayHubTab = "today" | "upcoming" | "past" | "all";

export function getEventDayPhase(input: {
  date: string;
  status?: string;
  endTime?: string | null;
  startTime?: string | null;
}): EventDayPhase {
  const date = input.date?.slice(0, 10) ?? "";
  const today = getJstTodayYmd();

  if (date > today) return "upcoming";
  if (date < today) return "past";

  const endTime = (input.endTime?.trim() || input.startTime?.trim() || "23:59");
  const endTs = Date.parse(`${date}T${endTime}:00+09:00`);
  if (!Number.isNaN(endTs) && Date.now() > endTs) return "past";

  return "live";
}

export function getEventDayPhaseFromDashboard(event: {
  date: string;
  status: "public" | "draft" | "ended" | "archived";
}): EventDayPhase {
  if (event.status === "ended" || event.status === "archived") return "past";
  const today = getJstTodayYmd();
  if (event.date > today) return "upcoming";
  if (event.date < today) return "past";
  return "live";
}

export function eventDayPhaseLabel(phase: EventDayPhase): string {
  if (phase === "live") return "開催中";
  if (phase === "upcoming") return "開催予定";
  return "終了";
}

export function eventDayPhaseBadgeClass(phase: EventDayPhase): string {
  if (phase === "live") return "bg-[#EAF4ED] text-[#2D7A4F]";
  if (phase === "upcoming") return "bg-[#E3F2FD] text-[#1976D2]";
  return "bg-[#f0f0f0] text-[#566358]";
}

export function isManageableDayEvent(event: {
  status: "public" | "draft" | "ended" | "archived";
}): boolean {
  return event.status === "public" || event.status === "ended";
}

// ---------------------------------------------------------------------------
// Donut Chart
// ---------------------------------------------------------------------------

export interface DonutSegment {
  color: string;
  value: number;
}

export function DonutChart({ segments, total }: { segments: DonutSegment[]; total: number }) {
  const r = 44;
  const cx = 54;
  const cy = 54;
  const strokeWidth = 10;
  const gap = 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const computed = segments.map((seg) => {
    const ratio = total > 0 ? seg.value / total : 0;
    const dashLen = circumference * ratio - gap;
    const result = {
      color: seg.color,
      dashArray: `${Math.max(0, dashLen)} ${circumference - Math.max(0, dashLen)}`,
      dashOffset: -offset,
    };
    offset += circumference * ratio;
    return result;
  });

  return (
    <svg width="108" height="108" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e0e0e0" strokeWidth={strokeWidth} />
      {computed.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={seg.dashArray}
          strokeDashoffset={seg.dashOffset}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  titleClassName,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleClassName?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-base font-bold ${titleClassName ?? "text-[#1A2214]"}`}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#566358] transition-colors hover:bg-[#EAF4ED]"
            aria-label="閉じる"
          >
            <span className="text-lg leading-none" aria-hidden>
              ×
            </span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function QrPlaceholder() {
  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      className="mx-auto block"
      aria-label="QRコードプレースホルダー"
    >
      <rect width="160" height="160" fill="#f5f5f5" rx="8" />
      <rect x="12" y="12" width="44" height="44" fill="none" stroke="#1A2214" strokeWidth="4" rx="3" />
      <rect x="22" y="22" width="24" height="24" fill="#1A2214" rx="2" />
      <rect x="104" y="12" width="44" height="44" fill="none" stroke="#1A2214" strokeWidth="4" rx="3" />
      <rect x="114" y="22" width="24" height="24" fill="#1A2214" rx="2" />
      <rect x="12" y="104" width="44" height="44" fill="none" stroke="#1A2214" strokeWidth="4" rx="3" />
      <rect x="22" y="114" width="24" height="24" fill="#1A2214" rx="2" />
      {[68, 80, 92].map((x) =>
        [68, 80, 92, 104, 116, 128, 140].map((y, yi) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="8"
            height="8"
            fill="#1A2214"
            rx="1"
            opacity={yi % 2 === 0 ? 1 : 0.35}
          />
        ))
      )}
    </svg>
  );
}

export function staffChip(status: "ok" | "late" | "absent") {
  if (status === "ok")
    return (
      <span className="rounded-full bg-[#EAF4ED] px-2 py-0.5 text-[11px] font-medium text-[#2D7A4F]">
        出勤中
      </span>
    );
  if (status === "late")
    return (
      <span className="rounded-full bg-[#FDF6E3] px-2 py-0.5 text-[11px] font-medium text-[#CF9010]">
        遅刻気味
      </span>
    );
  return (
    <span className="rounded-full bg-[#FFEBEE] px-2 py-0.5 text-[11px] font-medium text-[#E53935]">
      未出勤
    </span>
  );
}

export function scheduleChip(status: "done" | "live" | "wait") {
  if (status === "done")
    return (
      <span className="rounded-full bg-[#f0f0f0] px-2.5 py-0.5 text-[11px] font-medium text-[#566358]">
        終了
      </span>
    );
  if (status === "live")
    return (
      <span className="rounded-full bg-[#EAF4ED] px-2.5 py-0.5 text-[11px] font-medium text-[#2D7A4F]">
        進行中
      </span>
    );
  return (
    <span className="rounded-full border border-[#DDE8DF] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#566358]">
      未開始
    </span>
  );
}

export function noticeBadge(type: "urg" | "info") {
  if (type === "urg")
    return (
      <span className="shrink-0 rounded-full bg-[#FFEBEE] px-2 py-0.5 text-[10px] font-bold text-[#E53935]">
        重要
      </span>
    );
  return (
    <span className="shrink-0 rounded-full bg-[#E3F2FD] px-2 py-0.5 text-[10px] font-bold text-[#1976D2]">
      更新
    </span>
  );
}

export function countStaffPresent(staff: typeof MOCK_STAFF) {
  return staff.filter((s) => s.status === "ok" || s.status === "late").length;
}

export function countScheduleProgress(schedule: typeof MOCK_SCHEDULE) {
  return schedule.filter((s) => s.status === "done" || s.status === "live").length;
}

// ---------------------------------------------------------------------------
// Modals bundle
// ---------------------------------------------------------------------------

type ModalsProps = {
  modal: ModalType;
  onClose: () => void;
  eventId: string;
  announceText: string;
  onAnnounceChange: (v: string) => void;
  messageText: string;
  onMessageChange: (v: string) => void;
  emergencyText: string;
  onEmergencyChange: (v: string) => void;
  memoText: string;
  onMemoChange: (v: string) => void;
};

export function DayManagementModals({
  modal,
  onClose,
  eventId,
  announceText,
  onAnnounceChange,
  messageText,
  onMessageChange,
  emergencyText,
  onEmergencyChange,
  memoText,
  onMemoChange,
}: ModalsProps) {
  return (
    <>
      <Modal open={modal === "qr"} onClose={onClose} title="受付QRコード">
        <p className="mb-4 text-[13px] text-[#566358]">
          来場者にこのQRコードをスキャンしてもらうことでチェックインできます。
        </p>
        <div className="rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] p-4">
          <QrPlaceholder />
        </div>
        <p className="mt-3 text-center text-[11px] text-[#566358]">
          イベントID: {eventId || "—"} の受付QRコード
        </p>
        <button
          type="button"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D7A4F] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#245f3e]"
        >
          <Download size={15} />
          QRコードをダウンロード
        </button>
      </Modal>

      <Modal open={modal === "announce"} onClose={onClose} title="アナウンス送信">
        <p className="mb-3 text-[13px] text-[#566358]">
          参加者全員にアナウンスを送信します。重要な変更やお知らせにご利用ください。
        </p>
        <textarea
          value={announceText}
          onChange={(e) => onAnnounceChange(e.target.value)}
          rows={4}
          placeholder="アナウンス内容を入力..."
          className="w-full resize-none rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] p-3 text-[13px] text-[#1A2214] placeholder:text-[#566358]/60 focus:border-[#2D7A4F] focus:outline-none focus:ring-2 focus:ring-[#2D7A4F]/20"
        />
        <button
          type="button"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D7A4F] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#245f3e]"
        >
          <Send size={15} />
          送信する
        </button>
      </Modal>

      <Modal open={modal === "message"} onClose={onClose} title="来場者にメッセージ">
        <p className="mb-3 text-[13px] text-[#566358]">
          来場者個別またはグループにメッセージを送信します。
        </p>
        <textarea
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={4}
          placeholder="メッセージを入力..."
          className="w-full resize-none rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] p-3 text-[13px] text-[#1A2214] placeholder:text-[#566358]/60 focus:border-[#1976D2] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20"
        />
        <button
          type="button"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1976D2] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1565c0]"
        >
          <Send size={15} />
          送信する
        </button>
      </Modal>

      <Modal
        open={modal === "emergency"}
        onClose={onClose}
        title="⚠️ 緊急連絡"
        titleClassName="text-[#E53935]"
      >
        <div className="mb-3 rounded-xl border border-[#FFCDD2] bg-[#FFEBEE] p-3">
          <p className="text-[13px] font-medium text-[#E53935]">
            緊急連絡はすべての参加者・スタッフに即時通知されます。慎重にご利用ください。
          </p>
        </div>
        <textarea
          value={emergencyText}
          onChange={(e) => onEmergencyChange(e.target.value)}
          rows={4}
          placeholder="緊急連絡の内容を入力..."
          className="w-full resize-none rounded-xl border border-[#FFCDD2] bg-[#FFEBEE]/50 p-3 text-[13px] text-[#1A2214] placeholder:text-[#566358]/60 focus:border-[#E53935] focus:outline-none focus:ring-2 focus:ring-[#E53935]/20"
        />
        <button
          type="button"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E53935] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#c62828]"
        >
          <AlertTriangle size={15} />
          緊急連絡を送信する
        </button>
      </Modal>

      <Modal open={modal === "memo"} onClose={onClose} title="記録・メモ">
        <p className="mb-3 text-[13px] text-[#566358]">
          当日の出来事や気づきを記録しておきましょう。イベント終了後も参照できます。
        </p>
        <textarea
          value={memoText}
          onChange={(e) => onMemoChange(e.target.value)}
          rows={7}
          placeholder="メモを入力..."
          className="w-full resize-none rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] p-3 text-[13px] text-[#1A2214] placeholder:text-[#566358]/60 focus:border-[#CF9010] focus:outline-none focus:ring-2 focus:ring-[#CF9010]/20"
        />
        <button
          type="button"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#CF9010] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#b07d0d]"
        >
          <Save size={15} />
          保存する
        </button>
      </Modal>
    </>
  );
}
