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
import { ApplicationsEmptyState } from "./ApplicationsEmptyState";

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
  failedApplicationNames?: string[];
  onBulkRetryFailed?: () => void;
  onEdit: () => void;
  onAccept: (appId: string) => void;
  onReject: (appId: string) => void;
  onChat: (userId: string) => void;
  onDetail: (app: Application) => void;
};

type KpiTone = "neutral" | "success" | "warning" | "danger";

function KpiCard({
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
  const className = cn("mg-apps-mgmt-m__kpi", active && "is-active");
  const inner = (
    <>
      <div className={cn("mg-apps-mgmt-m__kpi-icon", `mg-apps-mgmt-m__kpi-icon--${tone}`)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="mg-apps-mgmt-m__kpi-label">{label}</p>
        <p className="mg-apps-mgmt-m__kpi-value">
          {value}
          <span className="mg-apps-mgmt-m__kpi-unit">名</span>
        </p>
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

function ApplicationRowMobile({
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
    ? "border-amber-200/90 bg-amber-50 text-amber-800"
    : isAccepted
      ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
      : isRejected
        ? "border-red-200/80 bg-red-50 text-red-700"
        : "border-[#e8e6e0] bg-[#f5f4f0] text-[#6b6762]";

  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const messageRaw = application.message?.trim() ?? "";
  const message = messageRaw || null;
  const emailLocal = email.includes("@") ? email.split("@")[0]?.trim() : "";
  const showEmailLine =
    Boolean(email) && name !== email && name !== emailLocal;

  return (
    <article className={cn("mg-apps-mgmt-m__row-card", isPending && "is-pending")}>
      <div className="flex gap-2.5">
        <div
          className={cn(
            "mg-apps-mgmt-m__avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
            avatarColor
          )}
        >
          {initialsFromName(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="min-w-0 truncate text-[13px] font-semibold text-[#1a2818]">
              {name}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full border px-1.5 py-px text-[9px] font-medium leading-tight",
                statusClass
              )}
            >
              {statusLabel}
            </span>
          </div>
          {showEmailLine ? (
            <p className="truncate text-[10px] text-[#8a9e80]" title={email}>
              {email}
            </p>
          ) : null}
          <p className="text-[9px] text-[#b0bab0]">
            {formatApplicationDate(application.created_at)}
          </p>
          {message ? (
            <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-[#6b7569]">
              {message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mg-apps-mgmt-m__row-actions">
        <button
          type="button"
          onClick={() => onDetail(application)}
          className="mg-apps-mgmt-m__btn-row"
        >
          詳細を見る
        </button>
        <button
          type="button"
          onClick={() => onChat(application.user_id)}
          className="mg-apps-mgmt-m__btn-row inline-flex items-center gap-0.5"
        >
          <MessageCircle className="h-3 w-3" aria-hidden />
          チャット
        </button>
        {isPending && (
          <>
            <button
              type="button"
              onClick={() => onAccept(application.id)}
              className="mg-apps-mgmt-m__btn-approve"
            >
              承認
            </button>
            <button
              type="button"
              onClick={() => onReject(application.id)}
              className="mg-apps-mgmt-m__btn-reject"
            >
              却下
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export function ApplicationsManagementMobileView({
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
  failedApplicationNames = [],
  onBulkRetryFailed,
  onEdit,
  onAccept,
  onReject,
  onChat,
  onDetail,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(6);
  const [contentOpen, setContentOpen] = useState(false);

  const visibleApps = filteredApplications.slice(0, visibleCount);
  const hasMore = filteredApplications.length > visibleCount;

  return (
    <div className="mg-apps-mgmt-m min-h-screen pb-24">
      <div className="px-4 pt-3">
        {/* ヘッダー */}
        <header className="mg-apps-mgmt-m__header">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="mg-apps-mgmt-m__title">応募管理</h1>
              <p className="mg-apps-mgmt-m__subtitle">{recruitmentTitle}</p>
              <p className="mg-apps-mgmt-m__desc">
                参加者情報や応募状況を確認・対応できます
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-1.5">
              <button type="button" onClick={onEdit} className="mg-apps-mgmt-m__btn-outline">
                <Pencil className="h-3.5 w-3.5 opacity-70" aria-hidden />
                編集
              </button>
              <Link href={`/organizer/recruitments/${recruitmentId}/day-of`} className="mg-apps-mgmt-m__btn-gold">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                当日管理へ
              </Link>
            </div>
          </div>
        </header>

        {/* KPI 2x2 */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <KpiCard
            value={total}
            label="総応募数"
            tone="neutral"
            icon={<Users className="h-4 w-4 text-[#2B3A6B]" />}
            active={statusFilter === "all"}
            onClick={() => onStatusSelect("all")}
          />
          <KpiCard
            value={acceptedCount}
            label="承認済み"
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            active={statusFilter === "accepted"}
            onClick={() => onStatusSelect("accepted")}
          />
          <KpiCard
            value={pendingCount}
            label="未確認"
            tone="warning"
            icon={<Clock className="h-4 w-4 text-amber-600" />}
            active={statusFilter === "pending"}
            onClick={() => onStatusSelect("pending")}
          />
          <KpiCard
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
          <section className="mg-apps-mgmt-m__panel mg-apps-mgmt-m__panel--bulk mt-3 p-3">
            <div className="flex items-center gap-2">
              <div className="mg-apps-mgmt-m__icon-ring">
                <Send className="h-3.5 w-3.5 text-[#9a6b2f]" aria-hidden />
              </div>
              <p className="mg-apps-mgmt-m__panel-title">承認済み参加者へ一斉連絡</p>
            </div>
            <select
              value={bulkTemplate}
              onChange={(e) => onBulkTemplateChange(e.target.value)}
              className="mg-apps-mgmt-m__input mt-2.5 w-full"
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
              rows={3}
              className="mg-apps-mgmt-m__input mg-apps-mgmt-m__textarea mt-2 w-full"
            />
            <button
              type="button"
              onClick={onBulkSend}
              disabled={bulkSending || (!bulkMessage.trim() && !bulkTemplate)}
              className="mg-apps-mgmt-m__btn-gold mt-2.5 w-full justify-center"
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              {bulkSending ? "送信中..." : `一斉送信（${acceptedCount}名）`}
            </button>
            {bulkResult && bulkResult.failed > 0 && (
              <p className="mt-2 text-[10px] text-amber-800">
                直近: 成功 {bulkResult.sent}件 / 失敗 {bulkResult.failed}件
                {failedApplicationNames.length > 0 && onBulkRetryFailed ? (
                  <button
                    type="button"
                    onClick={onBulkRetryFailed}
                    disabled={bulkSending}
                    className="ml-2 font-medium underline"
                  >
                    再送
                  </button>
                ) : null}
              </p>
            )}
          </section>
        )}

        {/* 検索・フィルター */}
        <section className="mt-3 space-y-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b0bab0]"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="名前・メール・メッセージで検索"
              className="mg-apps-mgmt-m__input w-full py-2.5 pl-9 pr-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
              className="mg-apps-mgmt-m__input w-full"
              aria-label="ステータス"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="mg-apps-mgmt-m__input w-full"
              aria-label="並び替え"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] font-medium text-[#8a9e80] underline-offset-2 hover:underline"
            >
              条件をリセット
            </button>
          )}
        </section>

        {/* 応募者一覧 */}
        <section className="mt-3">
          <h2 className="mg-apps-mgmt-m__section-title mg-apps-mgmt-m__section-title--list mb-1.5">
            応募者一覧
            <span className="mg-apps-mgmt-m__caption ml-1">{filteredApplications.length}件</span>
          </h2>

          {filteredApplications.length === 0 ? (
            <ApplicationsEmptyState
              hasFilter={hasActiveFilters}
              recruitmentId={recruitmentId}
            />
          ) : (
            <div className="space-y-1.5">
              {visibleApps.map((app, i) => (
                <ApplicationRowMobile
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
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 6)}
                className="mg-apps-mgmt-m__load-more inline-flex items-center gap-1"
              >
                さらに読み込む
                <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
              </button>
            </div>
          )}
        </section>

        {/* 募集内容 */}
        {recruitmentDescription ? (
          <section className="mg-apps-mgmt-m__panel mt-4 overflow-hidden">
            <button
              type="button"
              onClick={() => setContentOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-3 text-left"
            >
              <span className="mg-apps-mgmt-m__section-title !text-[14px]">募集内容</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[#8a9e80] transition-transform",
                  contentOpen && "rotate-180"
                )}
                aria-hidden
              />
            </button>
            {contentOpen && (
              <div className="border-t border-[#f0f2ec] px-3 py-3 text-[12px] leading-relaxed text-[#526448]">
                {recruitmentDescription.split(/\n\n+/).map((p, i) => (
                  <p key={i} className="mb-2 last:mb-0">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
