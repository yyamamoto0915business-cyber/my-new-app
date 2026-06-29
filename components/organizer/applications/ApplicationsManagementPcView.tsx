"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  MessageCircle,
  Pencil,
  Search,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Application } from "./ApplicationCard";
import type { SortOption, StatusFilter } from "./ApplicationToolbar";

const BULK_TEMPLATE_OPTIONS = [
  { value: "", label: "カスタム" },
  { value: "reminder", label: "前日リマインド" },
  { value: "venue_change", label: "集合場所変更" },
  { value: "thanks", label: "お礼メッセージ" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "created_desc", label: "申込が新しい順" },
  { value: "created_asc", label: "申込が古い順" },
  { value: "name_asc", label: "名前順" },
];

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべてのステータス" },
  { value: "pending", label: "未確認" },
  { value: "accepted", label: "承認済み" },
  { value: "rejected", label: "却下" },
];

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
  filteredApplications: Application[];
  total: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  onStatusSelect: (status: StatusFilter) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  bulkTemplate: string;
  onBulkTemplateChange: (v: string) => void;
  bulkMessage: string;
  onBulkMessageChange: (v: string) => void;
  bulkSending: boolean;
  onBulkSend: () => void;
  bulkResult: BulkMessageResult | null;
  onEdit: () => void;
  onAccept: (appId: string) => void;
  onReject: (appId: string) => void;
  onChat: (userId: string) => void;
  onDetail: (app: Application) => void;
};

type KpiTone = "neutral" | "success" | "warning" | "danger";

function SummaryCard({
  value,
  label,
  icon,
  tone,
  active,
  onClick,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  tone: KpiTone;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = cn("mg-apps-mgmt-pc__kpi", active && "is-active");
  const iconClass = cn("mg-apps-mgmt-pc__kpi-icon", `mg-apps-mgmt-pc__kpi-icon--${tone}`);

  const inner = (
    <>
      <div className={iconClass}>{icon}</div>
      <div className="min-w-0 text-left">
        <p className="mg-apps-mgmt-pc__kpi-value">
          {value}
          <span className="mg-apps-mgmt-pc__kpi-unit">名</span>
        </p>
        <p className="mg-apps-mgmt-pc__kpi-label">{label}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} aria-pressed={active}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

function ApplicationRowPc({
  application,
  index,
  onAccept,
  onReject,
  onChat,
  onDetail,
}: {
  application: Application;
  index: number;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onChat: (userId: string) => void;
  onDetail: (app: Application) => void;
}) {
  const name = resolveDisplayName(application);
  const email = application.user?.email ?? "";
  const isPending = application.status === "pending";
  const isAccepted =
    application.status === "accepted" || application.status === "confirmed";
  const isRejected = application.status === "rejected";

  const statusLabel = isPending
    ? "未確認"
    : isAccepted
      ? "承認済み"
      : isRejected
        ? "却下"
        : application.status;

  const statusClass = isPending
    ? "border-amber-200/90 bg-amber-50/90 text-amber-800"
    : isAccepted
      ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-800"
      : isRejected
        ? "border-red-200/80 bg-red-50/90 text-red-700"
        : "border-[#e8e6e0] bg-[#f5f4f0] text-[#6b6762]";

  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const message =
    application.message?.trim() || "自己紹介・応募メッセージはまだ入力されていません。";

  return (
    <article
      className={cn("mg-apps-mgmt-pc__row-card", isPending && "is-pending")}
      style={{ animationDelay: `${0.2 + index * 0.04}s` }}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mg-apps-mgmt-pc__avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
            avatarColor
          )}
        >
          {initialsFromName(name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-medium tracking-[0.01em] text-[#1a2818]">{name}</h3>
          {email ? (
            <p className="mt-0.5 truncate text-[11px] text-[#8a9e80]" title={email}>
              {email}
            </p>
          ) : null}
          <p className="mt-0.5 text-[10px] text-[#b0bab0]">
            応募日時: {formatApplicationDate(application.created_at)}
          </p>
          <p className="mt-1 line-clamp-1 text-[12px] leading-snug text-[#6b7569]">
            {message}
          </p>
        </div>

        <div className="mg-apps-mgmt-pc__action-col">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                statusClass
              )}
            >
            {statusLabel}
          </span>
          <div className="mg-apps-mgmt-pc__action-btns">
            <button
              type="button"
              onClick={() => onDetail(application)}
              className="mg-apps-mgmt-pc__btn-outline mg-apps-mgmt-pc__btn-sm"
            >
              詳細を見る
            </button>
            <button
              type="button"
              onClick={() => onChat(application.user_id)}
              className="mg-apps-mgmt-pc__btn-outline mg-apps-mgmt-pc__btn-sm inline-flex items-center gap-1"
            >
              <MessageCircle className="h-3 w-3" aria-hidden />
              チャット
            </button>
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => onAccept(application.id)}
                  className="mg-apps-mgmt-pc__btn-approve"
                >
                  承認
                </button>
                <button
                  type="button"
                  onClick={() => onReject(application.id)}
                  className="mg-apps-mgmt-pc__btn-reject"
                >
                  却下
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ApplicationsManagementPcView({
  recruitmentId,
  recruitmentTitle,
  recruitmentDescription,
  filteredApplications,
  total,
  pendingCount,
  acceptedCount,
  rejectedCount,
  statusFilter,
  onStatusFilterChange,
  onStatusSelect,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onResetFilters,
  hasActiveFilters,
  bulkTemplate,
  onBulkTemplateChange,
  bulkMessage,
  onBulkMessageChange,
  bulkSending,
  onBulkSend,
  bulkResult,
  onEdit,
  onAccept,
  onReject,
  onChat,
  onDetail,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(8);
  const [contentOpen, setContentOpen] = useState(false);

  const visibleApps = filteredApplications.slice(0, visibleCount);
  const hasMore = filteredApplications.length > visibleCount;

  return (
    <div className="mg-apps-mgmt-pc w-full">
      {/* ページヘッダー */}
      <header className="mg-apps-mgmt-pc__header">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="mg-apps-mgmt-pc__title">応募管理</h1>
            <p className="mg-apps-mgmt-pc__meta-line">
              <span>{recruitmentTitle}</span>
              <span className="mx-1.5 text-[#d0d6cc]" aria-hidden>
                ·
              </span>
              <span className="mg-apps-mgmt-pc__desc-inline">
                参加者情報や応募状況を確認・対応できます
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
        </div>
      </header>

      <div className="mg-apps-mgmt-pc__sections">
      {/* KPI */}
      <div className="flex gap-2">
        <SummaryCard
          value={total}
          label="総応募数"
          tone="neutral"
          icon={<Users className="h-4 w-4 text-[#2B3A6B]" />}
          active={statusFilter === "all"}
          onClick={() => onStatusSelect("all")}
        />
        <SummaryCard
          value={acceptedCount}
          label="承認済み"
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          active={statusFilter === "accepted"}
          onClick={() => onStatusSelect("accepted")}
        />
        <SummaryCard
          value={pendingCount}
          label="未確認"
          tone="warning"
          icon={<Clock className="h-4 w-4 text-amber-600" />}
          active={statusFilter === "pending"}
          onClick={() => onStatusSelect("pending")}
        />
        <SummaryCard
          value={rejectedCount}
          label="却下"
          tone="danger"
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          active={statusFilter === "rejected"}
          onClick={() => onStatusSelect("rejected")}
        />
      </div>

      {/* 一斉連絡 */}
      {acceptedCount > 0 && (
        <section className="mg-apps-mgmt-pc__panel mg-apps-mgmt-pc__panel--bulk px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="mg-apps-mgmt-pc__icon-ring">
              <Send className="h-3 w-3 text-[#9a6b2f]" aria-hidden />
            </div>
            <p className="mg-apps-mgmt-pc__section-title-sans">承認済み参加者へ一斉連絡</p>
          </div>
          <div className="mg-apps-mgmt-pc__bulk-row">
            <select
              value={bulkTemplate}
              onChange={(e) => onBulkTemplateChange(e.target.value)}
              className="mg-apps-mgmt-pc__select w-[132px] shrink-0"
              aria-label="メッセージテンプレート"
            >
              {BULK_TEMPLATE_OPTIONS.map((o) => (
                <option key={o.value || "custom"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <textarea
              value={bulkMessage}
              onChange={(e) => onBulkMessageChange(e.target.value)}
              placeholder="送信内容を入力（任意）"
              rows={1}
              className="mg-apps-mgmt-pc__textarea min-w-0 flex-1 resize-y"
            />
            <button
              type="button"
              onClick={onBulkSend}
              disabled={bulkSending || (!bulkMessage.trim() && !bulkTemplate)}
              className="mg-apps-mgmt-pc__btn-gold shrink-0"
            >
              <Send className="h-3 w-3" aria-hidden />
              {bulkSending ? "送信中..." : `一斉送信（${acceptedCount}名）`}
            </button>
          </div>
          {bulkResult && bulkResult.failed > 0 && (
            <p className="mt-1.5 text-[10px] text-amber-800">
              直近の送信: 成功 {bulkResult.sent}件 / 失敗 {bulkResult.failed}件
            </p>
          )}
        </section>
      )}

      {/* 検索・フィルター */}
      <section className="mg-apps-mgmt-pc__filter-bar flex items-center gap-2">
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
            className="mg-apps-mgmt-pc__input w-full border-0 bg-transparent py-1.5 pl-8 pr-2 text-[12px] shadow-none focus:shadow-none"
          />
        </div>
        <div className="h-5 w-px shrink-0 bg-[#e8e6e0]" aria-hidden />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          className="mg-apps-mgmt-pc__select w-[132px] shrink-0 border-0 bg-transparent px-1.5 py-1.5 text-[12px] shadow-none"
          aria-label="ステータス"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="h-5 w-px shrink-0 bg-[#e8e6e0]" aria-hidden />
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="mg-apps-mgmt-pc__select w-[132px] shrink-0 border-0 bg-transparent px-1.5 py-1.5 text-[12px] shadow-none"
          aria-label="並び替え"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="shrink-0 text-[12px] font-medium text-[#8a9e80] underline-offset-2 hover:text-[#526448] hover:underline"
          >
            リセット
          </button>
        )}
      </section>

      {/* 応募者一覧 */}
      <section>
        <h2 className="mg-apps-mgmt-pc__section-title mb-2">
          応募者一覧
          <span className="mg-apps-mgmt-pc__caption ml-2 font-normal">
            {filteredApplications.length}件
          </span>
        </h2>

        {filteredApplications.length === 0 ? (
          <div className="mg-apps-mgmt-pc__panel border-dashed px-4 py-10 text-center">
            <p className="text-[13px] font-medium text-[#526448]">該当する応募がありません</p>
            <p className="mt-1 text-[11px] text-[#8a9e80]">検索条件を変更してください</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleApps.map((app, i) => (
              <ApplicationRowPc
                key={app.id}
                application={app}
                index={i}
                onAccept={onAccept}
                onReject={onReject}
                onChat={onChat}
                onDetail={onDetail}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 6)}
              className="mg-apps-mgmt-pc__load-more inline-flex items-center gap-1.5"
            >
              さらに読み込む
              <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
            </button>
          </div>
        )}
      </section>

      {/* 募集内容 */}
      {recruitmentDescription ? (
        <section className="mg-apps-mgmt-pc__panel overflow-hidden">
          <button
            type="button"
            onClick={() => setContentOpen((o) => !o)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-[#fafaf8]/80"
          >
            <span className="mg-apps-mgmt-pc__section-title">募集内容</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[#8a9e80] transition-transform duration-200",
                contentOpen && "rotate-180"
              )}
              aria-hidden
            />
          </button>
          {contentOpen && (
            <div className="border-t border-[#f0f2ec] px-3 py-2.5">
              <div className="max-w-none text-[12px] leading-relaxed text-[#526448]">
                {recruitmentDescription.split(/\n\n+/).map((p, i) => (
                  <p key={i} className="mb-2 last:mb-0">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}
      </div>
    </div>
  );
}
