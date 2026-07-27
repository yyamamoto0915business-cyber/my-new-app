"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageCircle,
  Pencil,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/breadcrumb";
import type { Application } from "./ApplicationCard";
import type { StatusFilter } from "./ApplicationToolbar";

const QUICK_NOTIFY_MESSAGES = [
  {
    label: "前日リマインド",
    content:
      "【前日リマインド】明日の集合をお忘れなく。集合時刻・場所を再度確認の上、余裕を持ってお越しください。",
  },
  {
    label: "集合場所変更",
    content:
      "【集合場所変更】大変お手数ですが、集合場所が変更になりました。最新のお知らせをご確認ください。",
  },
  {
    label: "お礼",
    content: "【お礼】本日はお疲れさまでした。ご協力ありがとうございました。",
  },
];

type BulkMessageResult = {
  sent: number;
  total: number;
  failed: number;
  failedParticipantIds: string[];
};

type Props = {
  recruitmentId: string;
  recruitmentTitle: string;
  recruitmentDescription?: string;
  eventTitle?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  capacity?: number | null;
  roles?: { name: string; count: number }[];
  filteredApplications: Application[];
  total: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  onHoldCount: number;
  statusFilter: StatusFilter;
  onStatusSelect: (status: StatusFilter) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedId: string | null;
  onSelect: (app: Application) => void;
  onEdit: () => void;
  onAccept: (appId: string) => void;
  onReject: (appId: string) => void;
  onHold: (appId: string) => void;
  onChat: (userId: string) => void;
  onSaveMemo: (appId: string, memo: string) => Promise<void>;
  bulkSending: boolean;
  onBulkSend: (content: string, targetUserIds?: string[]) => void | Promise<boolean | void>;
  bulkResult: BulkMessageResult | null;
};

const AVATAR_COLORS = [
  "bg-[#dce8f4] text-[#2B3A6B]",
  "bg-[#e8f0e4] text-[#3a633d]",
  "bg-[#f5ebe0] text-[#8b5a2b]",
  "bg-[#ede8f5] text-[#5a4a7a]",
  "bg-[#f0e8dc] text-[#6b5344]",
];

function initialsFromName(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  if (/^[a-zA-Z]/.test(t)) return t.slice(0, 2).toUpperCase();
  return t.slice(0, 1);
}

function resolveDisplayName(app: Application): string {
  const profileName = app.user?.display_name?.trim();
  if (profileName) return profileName;
  const email = app.user?.email?.trim();
  if (email?.includes("@")) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return "応募者";
}

function formatApplicationDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} ${time}`;
}

function formatEventDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function formatTimeRange(startAt: string | null | undefined, endAt: string | null | undefined): string {
  const start =
    startAt && typeof startAt === "string" && startAt.length > 10 ? startAt.slice(11, 16) : "";
  const end = endAt && typeof endAt === "string" && endAt.length > 10 ? endAt.slice(11, 16) : "";
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  return "—";
}

function statusMeta(status: string): { label: string; className: string } {
  if (status === "pending") {
    return { label: "未確認", className: "border-amber-200/90 bg-amber-50/90 text-amber-800" };
  }
  if (status === "on_hold") {
    return { label: "保留", className: "border-yellow-200 bg-yellow-50 text-yellow-800" };
  }
  if (status === "accepted" || status === "confirmed") {
    return { label: "承認済み", className: "border-emerald-200/80 bg-emerald-50/90 text-emerald-800" };
  }
  if (status === "rejected") {
    return { label: "却下", className: "border-red-200/80 bg-red-50/90 text-red-700" };
  }
  return { label: status, className: "border-[#e8e6e0] bg-[#f5f4f0] text-[#6b6762]" };
}

function ApplicantListItem({
  application,
  index,
  selected,
  checked,
  onToggleCheck,
  onSelect,
}: {
  application: Application;
  index: number;
  selected: boolean;
  checked: boolean;
  onToggleCheck: () => void;
  onSelect: () => void;
}) {
  const name = resolveDisplayName(application);
  const email = application.user?.email ?? "";
  const meta = statusMeta(application.status);
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const message = application.message?.trim() || "メッセージ未入力";
  const roleLabel = application.role_assigned?.trim() || "未指定";

  return (
    <article
      className={cn("mg-apps-split__list-item", selected && "is-selected")}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            e.stopPropagation();
            onToggleCheck();
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 h-3.5 w-3.5 rounded border-[#d0d6cc]"
          aria-label={`${name}を選択`}
        />
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
            avatarColor
          )}
        >
          {initialsFromName(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#1a2818]">{name}</p>
              {email ? (
                <p className="mt-0.5 truncate text-[11px] text-[#8a9e80]" title={email}>
                  {email}
                </p>
              ) : null}
            </div>
            <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", meta.className)}>
              {meta.label}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#6b7569]">
            希望役割: {roleLabel}
            <span className="mx-1.5 text-[#d0d6cc]">·</span>
            応募日時: {formatApplicationDate(application.created_at)}
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#6b7569]">{message}</p>
          <button
            type="button"
            className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-[#2B3A6B] hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            詳細
            <ChevronRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

function DetailPanel({
  application,
  recruitmentTimeLabel,
  onAccept,
  onReject,
  onHold,
  onChat,
  onSaveMemo,
}: {
  application: Application | null;
  recruitmentTimeLabel: string;
  onAccept: (appId: string) => void;
  onReject: (appId: string) => void;
  onHold: (appId: string) => void;
  onChat: (userId: string) => void;
  onSaveMemo: (appId: string, memo: string) => Promise<void>;
}) {
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMemo(application?.organizer_memo ?? "");
  }, [application?.id, application?.organizer_memo]);

  if (!application) {
    return (
      <div className="mg-apps-split__detail flex min-h-0 items-center justify-center px-6 py-16 text-center">
        <div>
          <p className="text-[13px] font-medium text-[#526448]">応募者を選択してください</p>
          <p className="mt-1 text-[11px] text-[#8a9e80]">左の一覧から詳細を確認できます</p>
        </div>
      </div>
    );
  }

  const name = resolveDisplayName(application);
  const email = application.user?.email ?? "";
  const meta = statusMeta(application.status);
  const isPending = application.status === "pending" || application.status === "on_hold";
  const isAccepted = application.status === "accepted" || application.status === "confirmed";
  const isRejected = application.status === "rejected";
  const roleLabel = application.role_assigned?.trim() || "未指定";
  const message =
    application.message?.trim() || "自己紹介・応募メッセージはまだ入力されていません。";

  const handleSaveMemo = async () => {
    setSaving(true);
    try {
      await onSaveMemo(application.id, memo.slice(0, 500));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mg-apps-split__detail flex min-h-0 flex-col">
      <div className="shrink-0 border-b border-[#f0f2ec] px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0e4] text-[12px] font-bold text-[#3a633d]">
            {initialsFromName(name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-[#1a2818]">{name}</h2>
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", meta.className)}>
                {meta.label}
              </span>
            </div>
            {email ? <p className="mt-0.5 truncate text-[11px] text-[#8a9e80]">{email}</p> : null}
            <p className="mt-0.5 text-[10px] text-[#b0bab0]">
              応募日時: {formatApplicationDate(application.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#f0f2ec] bg-[#fafcf8] px-2.5 py-2">
            <p className="text-[10px] font-medium text-[#8a9e80]">希望役割</p>
            <p className="mt-0.5 text-[12px] font-medium text-[#1a2818]">{roleLabel}</p>
          </div>
          <div className="rounded-lg border border-[#f0f2ec] bg-[#fafcf8] px-2.5 py-2">
            <p className="text-[10px] font-medium text-[#8a9e80]">募集時間帯</p>
            <p className="mt-0.5 text-[12px] font-medium text-[#1a2818]">{recruitmentTimeLabel}</p>
          </div>
        </div>

        <section>
          <h3 className="text-[11px] font-semibold text-[#526448]">自己紹介 / 応募メッセージ</h3>
          <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-[#f0f2ec] bg-white px-2.5 py-2 text-[12px] leading-relaxed text-[#3a3428]">
            {message}
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-semibold text-[#526448]">メモ (主催者用)</h3>
            <span className="text-[10px] tabular-nums text-[#b0bab0]">{memo.length} / 500</span>
          </div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value.slice(0, 500))}
            onBlur={() => {
              if ((application.organizer_memo ?? "") !== memo) {
                void handleSaveMemo();
              }
            }}
            placeholder="メモを入力 (この内容は応募者には表示されません)"
            rows={2}
            className="mg-apps-mgmt-pc__textarea mt-1.5 w-full resize-y"
          />
          {saving ? <p className="mt-1 text-[10px] text-[#8a9e80]">保存中…</p> : null}
        </section>
      </div>

      <div className="shrink-0 border-t border-[#f0f2ec] px-4 py-2.5">
        <div className="flex flex-wrap gap-2">
          {isPending ? (
            <>
              <button
                type="button"
                onClick={() => onAccept(application.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#3d6b2f] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#345a28]"
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
                承認する
              </button>
              <button
                type="button"
                onClick={() => onHold(application.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8c96a] bg-[#fffbeb] px-3 py-1.5 text-[12px] font-semibold text-[#8a6a10] hover:bg-[#fef3c7]"
              >
                <Clock className="h-3.5 w-3.5" aria-hidden />
                保留
              </button>
              <button
                type="button"
                onClick={() => onReject(application.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0b8b0] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#a33a2c] hover:bg-[#fef0ee]"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                却下
              </button>
            </>
          ) : null}
          {isAccepted ? (
            <button
              type="button"
              onClick={() => onChat(application.user_id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3d6b2f] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#345a28]"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              チャットで連絡
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChat(application.user_id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e6e0] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#3a3428] hover:bg-[#fafaf8]"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              チャット
            </button>
          )}
          {isRejected ? (
            <button
              type="button"
              onClick={() => onAccept(application.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e6e0] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#3a3428] hover:bg-[#fafaf8]"
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              承認に戻す
            </button>
          ) : null}
        </div>
        {isPending || isAccepted ? (
          <p className="mt-1.5 text-[10px] text-[#8a9e80]">
            {isPending
              ? "※ 承認すると参加者に通知が送信されます。"
              : "※ 個別連絡はチャット、一斉連絡は左の通知欄をご利用ください。"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ApplicationsManagementPcView({
  recruitmentId,
  recruitmentTitle,
  eventTitle,
  startAt,
  endAt,
  capacity,
  roles,
  filteredApplications,
  total,
  pendingCount,
  acceptedCount,
  rejectedCount,
  onHoldCount,
  statusFilter,
  onStatusSelect,
  searchQuery,
  onSearchChange,
  selectedId,
  onSelect,
  onEdit,
  onAccept,
  onReject,
  onHold,
  onChat,
  onSaveMemo,
  bulkSending,
  onBulkSend,
  bulkResult,
}: Props) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  const selected =
    filteredApplications.find((a) => a.id === selectedId) ?? filteredApplications[0] ?? null;

  const unconfirmedCount = pendingCount + onHoldCount;
  const roleSummary = (roles ?? []).map((r) => r.name).filter(Boolean).join("・") || "—";
  const timeLabel = formatTimeRange(startAt, endAt);

  const allVisibleChecked =
    filteredApplications.length > 0 &&
    filteredApplications.every((a) => checkedIds.has(a.id));

  const acceptedCheckedUserIds = filteredApplications
    .filter(
      (a) =>
        checkedIds.has(a.id) && (a.status === "accepted" || a.status === "confirmed")
    )
    .map((a) => a.user_id);

  const notifyTargetLabel =
    acceptedCheckedUserIds.length > 0
      ? `選択中 ${acceptedCheckedUserIds.length}名へ送信`
      : `承認済み全員（${acceptedCount}名）へ送信`;

  const handleSendNotify = async () => {
    const content = bulkMessage.trim();
    if (!content) return;
    const result = await onBulkSend(
      content,
      acceptedCheckedUserIds.length > 0 ? acceptedCheckedUserIds : undefined
    );
    if (result !== false) setBulkMessage("");
  };

  const statusTabs = [
    { key: "all" as const, label: "すべて", count: total },
    { key: "pending" as const, label: "未確認", count: unconfirmedCount },
    { key: "accepted" as const, label: "承認済み", count: acceptedCount },
    { key: "rejected" as const, label: "却下", count: rejectedCount },
  ];

  return (
    <div
      className="mg-apps-mgmt-pc flex min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden"
      data-apps-mgmt
    >
      <div className="shrink-0 space-y-2">
        <Breadcrumb
          className="text-[12px]"
          items={[
            { label: "スタッフ募集管理", href: "/organizer/recruitments" },
            { label: recruitmentTitle, href: `/organizer/recruitments/${recruitmentId}` },
            { label: "応募確認" },
          ]}
        />

        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-[18px] font-semibold tracking-wide text-[#1a2818]">応募確認</h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#6b7569]">
              <span className="font-medium text-[#1a2818]">{recruitmentTitle}</span>
              {eventTitle?.trim() || roleSummary !== "—" ? (
                <span className="text-[#8a9e80]">{eventTitle?.trim() || roleSummary}</span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#8a9e80]" aria-hidden />
                {formatEventDate(startAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#8a9e80]" aria-hidden />
                {timeLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3 text-[#8a9e80]" aria-hidden />
                応募 {total}
                {capacity != null && capacity > 0 ? (
                  <>
                    <span className="text-[#c5d4c0]">·</span>
                    定員 {capacity}
                  </>
                ) : null}
                <span className="text-[#c5d4c0]">·</span>
                <span className={unconfirmedCount > 0 ? "font-semibold text-[#c45a1a]" : undefined}>
                  未確認 {unconfirmedCount}
                </span>
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={onEdit} className="mg-apps-mgmt-pc__btn-outline">
              <Pencil className="h-3 w-3 opacity-70" aria-hidden />
              編集
            </button>
            <Link
              href={`/organizer/recruitments/${recruitmentId}/day-of`}
              className="mg-apps-mgmt-pc__btn-gold"
            >
              <CalendarDays className="h-3 w-3" aria-hidden />
              当日管理へ
            </Link>
          </div>
        </header>

        <div
          className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-xl border border-[#e8e6e0] bg-[#f3f1ec] p-0.5"
          role="tablist"
          aria-label="応募ステータス"
        >
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onStatusSelect(tab.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition-colors",
                  active
                    ? "bg-white text-[#1a2818] shadow-sm ring-1 ring-[#e0ddd6]"
                    : "text-[#6b7569] hover:bg-white/60 hover:text-[#3a3428]"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    active
                      ? tab.key === "pending" && tab.count > 0
                        ? "bg-amber-100 text-amber-800"
                        : tab.key === "rejected"
                          ? "bg-red-50 text-red-700"
                          : tab.key === "accepted"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-[#eaf6de] text-[#3a7a10]"
                      : "bg-[#e8e6e0]/70 text-[#8a9e80]"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mg-apps-split mg-apps-split--fill min-h-0 flex-1">
        <section className="mg-apps-split__list flex min-h-0 flex-col">
          <div className="shrink-0 border-b border-[#f0f2ec] bg-[#fafcf8]">
            <button
              type="button"
              onClick={() => setBulkOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
              aria-expanded={bulkOpen}
            >
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#3a3428]">
                <Send className="h-3.5 w-3.5 text-[#8a9e80]" aria-hidden />
                一斉通知
                <span className="font-normal text-[#8a9e80]">
                  {acceptedCount > 0 ? `（承認済み ${acceptedCount}名）` : ""}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[#8a9e80] transition-transform",
                  bulkOpen && "rotate-180"
                )}
                aria-hidden
              />
            </button>
            {bulkOpen ? (
              <div className="space-y-2 border-t border-[#f0f2ec] px-3 py-2">
                <p className="text-[10px] text-[#8a9e80]">
                  承認済みスタッフの通知に届きます（ダッシュボードのお知らせと同じ）
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_NOTIFY_MESSAGES.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      disabled={acceptedCount === 0}
                      onClick={() => setBulkMessage(m.content)}
                      className="rounded-lg border border-[#e8e6e0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#3a3428] hover:bg-[#f5f4f0] disabled:opacity-50"
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    placeholder="メッセージを入力してください"
                    disabled={acceptedCount === 0}
                    className="min-w-0 flex-1 rounded-lg border border-[#e8e6e0] bg-white px-3 py-1.5 text-[12px] outline-none focus:border-[#2B3A6B] focus:ring-2 focus:ring-[#2B3A6B]/10 disabled:opacity-50"
                    aria-label="通知メッセージ"
                  />
                  <button
                    type="button"
                    disabled={bulkSending || acceptedCount === 0 || !bulkMessage.trim()}
                    onClick={handleSendNotify}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#3d6b2f] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#345a28] disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    送信
                  </button>
                </div>
                <p className="text-[10px] text-[#8a9e80]">{notifyTargetLabel}</p>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-b border-[#f0f2ec] px-3 py-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#b0bab0]"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="名前・メール・メッセージで検索"
                className="mg-apps-mgmt-pc__input w-full py-1.5 pl-8 pr-2 text-[12px]"
              />
            </div>
            <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-[#526448]">
              <input
                type="checkbox"
                checked={allVisibleChecked}
                onChange={() => {
                  if (allVisibleChecked) {
                    setCheckedIds(new Set());
                  } else {
                    setCheckedIds(new Set(filteredApplications.map((a) => a.id)));
                  }
                }}
                className="h-3.5 w-3.5 rounded border-[#d0d6cc]"
              />
              選択 ({checkedIds.size})
            </label>
          </div>

          {bulkResult && bulkResult.failed > 0 ? (
            <p className="shrink-0 border-b border-[#f0f2ec] px-3 py-1.5 text-[10px] text-amber-800">
              直近の送信: 成功 {bulkResult.sent}件 / 失敗 {bulkResult.failed}件
            </p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredApplications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] font-medium text-[#526448]">該当する応募がありません</p>
                <p className="mt-1 text-[11px] text-[#8a9e80]">検索条件を変更してください</p>
              </div>
            ) : (
              filteredApplications.map((app, i) => (
                <ApplicantListItem
                  key={app.id}
                  application={app}
                  index={i}
                  selected={(selectedId ?? selected?.id) === app.id}
                  checked={checkedIds.has(app.id)}
                  onToggleCheck={() => {
                    setCheckedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(app.id)) next.delete(app.id);
                      else next.add(app.id);
                      return next;
                    });
                  }}
                  onSelect={() => onSelect(app)}
                />
              ))
            )}
          </div>

          <p className="shrink-0 border-t border-[#f0f2ec] px-3 py-1.5 text-[11px] text-[#8a9e80]">
            {filteredApplications.length}名を表示
          </p>
        </section>

        <DetailPanel
          application={selected}
          recruitmentTimeLabel={timeLabel}
          onAccept={onAccept}
          onReject={onReject}
          onHold={onHold}
          onChat={onChat}
          onSaveMemo={onSaveMemo}
        />
      </div>
    </div>
  );
}
