"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FilePenLine,
  Heart,
  Info,
  Mail,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type PendingFormItem = {
  applicationId: string;
  recruitmentId: string;
  title: string;
  roleLabel: string | null;
  formUrl: string;
  requiredLabels: string[];
  createdAt: string;
};

export type PendingFollowItem = {
  followId: string;
  fromUserId: string;
  fromName: string;
  createdAt: string;
};

type TabId = "all" | "unread" | "action";
type SortId = "newest" | "oldest";

type ListItem =
  | { kind: "notification"; notification: NotificationItem; pending: PendingFormItem | null; follow: PendingFollowItem | null }
  | { kind: "pending"; pending: PendingFormItem }
  | { kind: "follow"; follow: PendingFollowItem };

const GREEN = "#2E7D32";

function isFormActionNotification(n: NotificationItem): boolean {
  return Boolean(
    n.link?.includes("/application-form") || n.title.includes("応募フォーム")
  );
}

function formatDate(s: string) {
  const d = new Date(s);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "たった今";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
  if (diff < 172800000) return "昨日";
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}日前`;
  return d.toLocaleDateString("ja-JP");
}

function contextLine(pending: PendingFormItem | null) {
  if (!pending) return null;
  return [pending.roleLabel, pending.title].filter(Boolean).join(" ｜ ");
}

function resolveIcon(title: string, isAction: boolean) {
  if (isAction || title.includes("応募フォーム")) {
    return { Icon: FilePenLine, bg: "bg-[#e8f5e9]", color: "text-[#2E7D32]" };
  }
  if (title.includes("いいね")) {
    return { Icon: Heart, bg: "bg-[#fdecea]", color: "text-[#E04444]" };
  }
  if (title.includes("受け付け") || title.includes("確認しました")) {
    return { Icon: CheckCircle2, bg: "bg-[#e8f5e9]", color: "text-[#2E7D32]" };
  }
  if (title.includes("メッセージ")) {
    return { Icon: Mail, bg: "bg-[#e3f2fd]", color: "text-[#1976d2]" };
  }
  if (title.includes("リマインド") || title.includes("リマインダー")) {
    return { Icon: Bell, bg: "bg-[#fff3e0]", color: "text-[#ef6c00]" };
  }
  if (title.includes("完了") || title.includes("ありがとう") || title.includes("メダル")) {
    return { Icon: Award, bg: "bg-[#fff8e1]", color: "text-[#f9a825]" };
  }
  if (title.includes("検索") || title.includes("見つかり")) {
    return { Icon: Search, bg: "bg-[#f3e5f5]", color: "text-[#8e24aa]" };
  }
  return { Icon: Bell, bg: "bg-[#f5f5f5]", color: "text-[#757575]" };
}

export type NotificationsViewProps = {
  notifications: NotificationItem[];
  pendingForms: PendingFormItem[];
  pendingFollows?: PendingFollowItem[];
  unreadCount: number;
  previewBanner?: string | null;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onRespondFollow?: (followId: string, action: "accept" | "reject") => void;
  markingAll?: boolean;
};

export function NotificationsView({
  notifications,
  pendingForms,
  pendingFollows = [],
  unreadCount,
  previewBanner,
  onMarkAsRead,
  onMarkAllAsRead,
  onRespondFollow,
  markingAll = false,
}: NotificationsViewProps) {
  const [tab, setTab] = useState<TabId>("all");
  const [sort, setSort] = useState<SortId>("newest");
  const [deferredIds, setDeferredIds] = useState<Set<string>>(() => new Set());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const actionCount = pendingForms.length + pendingFollows.length;
  const primaryPending = pendingForms[0] ?? null;

  const listItems = useMemo(() => {
    const coveredRecruitmentIds = new Set<string>();
    const coveredFollowIds = new Set<string>();
    const items: ListItem[] = [];

    for (const n of notifications) {
      const pending =
        pendingForms.find((p) => n.link?.includes(p.recruitmentId)) ?? null;
      if (pending && isFormActionNotification(n)) {
        coveredRecruitmentIds.add(pending.recruitmentId);
      }
      const follow =
        pendingFollows.find((f) => n.link?.includes(f.followId)) ??
        (n.type === "follow_request"
          ? pendingFollows.find((f) => n.title.includes(f.fromName)) ?? null
          : null);
      if (follow) coveredFollowIds.add(follow.followId);
      items.push({ kind: "notification", notification: n, pending, follow });
    }

    for (const pending of pendingForms) {
      if (coveredRecruitmentIds.has(pending.recruitmentId)) continue;
      items.push({ kind: "pending", pending });
    }

    for (const follow of pendingFollows) {
      if (coveredFollowIds.has(follow.followId)) continue;
      items.push({ kind: "follow", follow });
    }

    const filtered = items.filter((item) => {
      if (tab === "unread") {
        return item.kind !== "notification" || !item.notification.read_at;
      }
      if (tab === "action") {
        if (item.kind === "pending" || item.kind === "follow") return true;
        return (
          (isFormActionNotification(item.notification) && Boolean(item.pending)) ||
          Boolean(item.follow)
        );
      }
      return true;
    });

    filtered.sort((a, b) => {
      const aDate =
        a.kind === "pending"
          ? a.pending.createdAt
          : a.kind === "follow"
            ? a.follow.createdAt
            : a.notification.created_at;
      const bDate =
        b.kind === "pending"
          ? b.pending.createdAt
          : b.kind === "follow"
            ? b.follow.createdAt
            : b.notification.created_at;
      const cmp = aDate.localeCompare(bDate);
      return sort === "newest" ? -cmp : cmp;
    });

    return filtered;
  }, [notifications, pendingForms, pendingFollows, tab, sort]);

  const effectiveSelectedKey = useMemo(() => {
    if (selectedKey && listItems.some((item) => itemKey(item) === selectedKey)) {
      return selectedKey;
    }
    const firstAction = listItems.find((item) => {
      if (item.kind === "pending" || item.kind === "follow") return true;
      return (
        (isFormActionNotification(item.notification) && Boolean(item.pending)) ||
        Boolean(item.follow)
      );
    });
    return firstAction ? itemKey(firstAction) : listItems[0] ? itemKey(listItems[0]) : null;
  }, [selectedKey, listItems]);

  const selectedPending = useMemo(() => {
    const item = listItems.find((i) => itemKey(i) === effectiveSelectedKey);
    if (!item) return primaryPending;
    if (item.kind === "pending") return item.pending;
    if (item.kind === "follow") return primaryPending;
    return item.pending ?? primaryPending;
  }, [listItems, effectiveSelectedKey, primaryPending]);

  return (
    <div className="min-h-screen bg-[#fafbfa]">
      {previewBanner ? (
        <div className="border-b border-[#cfe4c8] bg-[#e8f5e9] px-4 py-2 text-center text-[12px] font-medium text-[#1b5e20]">
          {previewBanner}
        </div>
      ) : null}

      <main className="mx-auto max-w-[1100px] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-5 min-[980px]:flex-row min-[980px]:items-start min-[980px]:gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: "all" as const, label: "すべて", count: null as number | null },
                    { id: "unread" as const, label: "未読", count: unreadCount || null },
                    { id: "action" as const, label: "対応が必要", count: actionCount || null },
                  ] as const
                ).map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition-colors",
                        active
                          ? "border-[#2E7D32] bg-[#e8f5e9] font-semibold text-[#2E7D32]"
                          : "border-[#e0e5de] bg-white text-[#5a6558] hover:border-[#c5d0c3]"
                      )}
                    >
                      {t.label}
                      {t.count != null && t.count > 0 ? (
                        <span
                          className={cn(
                            "inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
                            active ? "bg-[#2E7D32]" : "bg-[#66a06a]"
                          )}
                        >
                          {t.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2.5">
                {unreadCount > 0 && onMarkAllAsRead ? (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    disabled={markingAll}
                    className="text-[12px] text-[#2E7D32] hover:underline disabled:opacity-50"
                  >
                    {markingAll ? "処理中..." : "すべて既読"}
                  </button>
                ) : null}
                <label className="inline-flex items-center gap-1 rounded-lg border border-[#e0e5de] bg-white px-2 py-1 text-[12px] text-[#566358]">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortId)}
                    className="appearance-none bg-transparent pr-4 outline-none"
                    aria-label="並び替え"
                  >
                    <option value="newest">新しい順</option>
                    <option value="oldest">古い順</option>
                  </select>
                  <ChevronDown className="-ml-3 h-3.5 w-3.5 opacity-60" strokeWidth={1.6} />
                </label>
              </div>
            </div>

            {listItems.length === 0 ? (
              <div className="rounded-2xl border border-[#e4ebe0] bg-white p-10 text-center">
                <p className="text-sm font-medium text-[#1a2818]">お知らせはありません</p>
                <p className="mt-1 text-sm text-[#6b7569]">
                  イベントを探して、参加やチャットを始めましょう
                </p>
                <Link
                  href="/events"
                  className="mt-4 inline-block rounded-xl px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                  style={{ backgroundColor: GREEN }}
                >
                  イベント一覧を見る
                </Link>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {listItems.map((item) => {
                  const key = itemKey(item);
                  const selected = key === effectiveSelectedKey;

                  if (item.kind === "follow") {
                    return (
                      <li key={key}>
                        <NotificationListRow
                          selected={selected}
                          unread
                          isAction
                          title={`${item.follow.fromName}さんからフォロー申請が届きました`}
                          subtitle={null}
                          preview="承認すると、非公開のアルバムも見られるようになります。"
                          createdAt={item.follow.createdAt}
                          showFollowButtons
                          onSelect={() => setSelectedKey(key)}
                          onAcceptFollow={() =>
                            onRespondFollow?.(item.follow.followId, "accept")
                          }
                          onRejectFollow={() =>
                            onRespondFollow?.(item.follow.followId, "reject")
                          }
                        />
                      </li>
                    );
                  }

                  if (item.kind === "pending") {
                    const deferred = deferredIds.has(item.pending.applicationId);
                    return (
                      <li key={key}>
                        <NotificationListRow
                          selected={selected}
                          unread={!deferred}
                          isAction
                          title="応募フォームの入力が必要です"
                          subtitle={contextLine(item.pending)}
                          preview="必須項目を入力して提出しないと、応募は完了しません。"
                          createdAt={item.pending.createdAt}
                          formUrl={item.pending.formUrl}
                          showActionButtons={!deferred}
                          onSelect={() => setSelectedKey(key)}
                          onDefer={() => {
                            setDeferredIds((prev) => new Set(prev).add(item.pending.applicationId));
                            setSelectedKey(null);
                          }}
                        />
                      </li>
                    );
                  }

                  const { notification: n, pending, follow } = item;
                  const isAction =
                    (isFormActionNotification(n) && Boolean(pending)) ||
                    Boolean(follow);
                  const deferred =
                    pending != null && deferredIds.has(pending.applicationId);

                  return (
                    <li key={key}>
                      <NotificationListRow
                        selected={selected && isAction}
                        unread={!n.read_at}
                        isAction={isAction && !deferred}
                        title={n.title}
                        subtitle={
                          isAction && pending
                            ? contextLine(pending)
                            : null
                        }
                        preview={
                          follow
                            ? "承認すると、非公開のアルバムも見られるようになります。"
                            : isAction
                            ? "必須項目を入力して提出しないと、応募は完了しません。"
                            : n.body
                        }
                        createdAt={n.created_at}
                        href={!isAction ? n.link : null}
                        formUrl={pending?.formUrl ?? null}
                        showActionButtons={Boolean(pending) && isAction && !deferred}
                        showFollowButtons={Boolean(follow)}
                        onSelect={() => {
                          setSelectedKey(key);
                          if (!n.read_at) onMarkAsRead?.(n.id);
                        }}
                        onDefer={
                          pending
                            ? () => {
                                setDeferredIds((prev) =>
                                  new Set(prev).add(pending.applicationId)
                                );
                                if (!n.read_at) onMarkAsRead?.(n.id);
                              }
                            : undefined
                        }
                        onOpen={() => {
                          if (!n.read_at) onMarkAsRead?.(n.id);
                        }}
                        onAcceptFollow={
                          follow
                            ? () => onRespondFollow?.(follow.followId, "accept")
                            : undefined
                        }
                        onRejectFollow={
                          follow
                            ? () => onRespondFollow?.(follow.followId, "reject")
                            : undefined
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <aside className="hidden w-[300px] shrink-0 min-[980px]:block">
            <div className="sticky top-20 overflow-hidden rounded-2xl border border-[#e6ebe4] bg-white shadow-[0_6px_20px_rgba(40,70,40,0.05)]">
              <div className="border-b border-[#eef2ec] px-4 py-2.5">
                <p className="text-[12px] font-semibold text-[#3a4638]">
                  対応が必要な応募
                </p>
              </div>
              {selectedPending ? (
                <div className="px-4 pb-4 pt-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative flex h-[72px] w-[72px] items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-[#e8f5e9]" />
                      <ClipboardList
                        className="relative h-9 w-9 text-[#2E7D32]"
                        strokeWidth={1.35}
                      />
                      <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2E7D32] text-white shadow-sm">
                        <Check className="h-3 w-3" strokeWidth={2.4} />
                      </span>
                    </div>
                    <p className="mt-3 text-[14px] font-semibold text-[#1a2818]">
                      応募フォームの入力が必要です
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#6b7569]">
                      {contextLine(selectedPending)}
                    </p>
                    <Link
                      href={selectedPending.formUrl}
                      className="mt-3 w-full rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: GREEN }}
                    >
                      フォームを入力する
                    </Link>
                  </div>

                  {selectedPending.requiredLabels.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold text-[#5a6558]">
                        入力が必要な項目
                      </p>
                      <ul className="mt-2 space-y-2">
                        {selectedPending.requiredLabels.map((label) => (
                          <li
                            key={label}
                            className="flex items-center gap-2 text-[12px] text-[#1a2818]"
                          >
                            <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-[#e8f5e9] text-[#2E7D32]">
                              <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                            </span>
                            {label === "希望役割" ? "希望する役割" : label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#e8f5e9] px-3 py-2 text-[11px] leading-relaxed text-[#2f5a2c]">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                    入力後に応募が完了します
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center px-4 pb-6 pt-6 text-center">
                  <div className="relative flex h-[88px] w-[88px] items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[#eef5ec]" />
                    <div className="absolute inset-3 rounded-full border border-dashed border-[#c5dcc4]" />
                    <CheckCircle2
                      className="relative h-10 w-10 text-[#7aab7a]"
                      strokeWidth={1.35}
                    />
                  </div>
                  <p className="mt-4 text-[14px] font-semibold text-[#1a2818]">
                    いま対応が必要な応募はありません
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#6b7569]">
                    新しい案内が届くと、ここに表示されます
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#d5ddd2] bg-white px-4 py-2 text-[12px] font-medium text-[#2d4a28] transition-colors hover:bg-[#f5f7f4]"
                  >
                    まちの情報を探す
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function itemKey(item: ListItem): string {
  if (item.kind === "pending") return `pending-${item.pending.applicationId}`;
  if (item.kind === "follow") return `follow-${item.follow.followId}`;
  return `n-${item.notification.id}`;
}

function NotificationListRow({
  selected,
  unread,
  isAction,
  title,
  subtitle,
  preview,
  createdAt,
  href,
  formUrl,
  showActionButtons,
  showFollowButtons,
  onSelect,
  onDefer,
  onOpen,
  onAcceptFollow,
  onRejectFollow,
}: {
  selected: boolean;
  unread: boolean;
  isAction: boolean;
  title: string;
  subtitle: string | null;
  preview: string | null;
  createdAt: string;
  href?: string | null;
  formUrl?: string | null;
  showActionButtons?: boolean;
  showFollowButtons?: boolean;
  onSelect: () => void;
  onDefer?: () => void;
  onOpen?: () => void;
  onAcceptFollow?: () => void;
  onRejectFollow?: () => void;
}) {
  const { Icon, bg, color } = resolveIcon(title, isAction);

  const body = (
    <>
      <div className="flex gap-2.5">
        <div className="flex w-2.5 shrink-0 justify-center pt-2.5">
          {unread ? (
            <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
          ) : null}
        </div>

        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            bg,
            color
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.6} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p
                  className={cn(
                    "text-[13px] leading-snug",
                    unread || selected ? "font-semibold text-[#1a2818]" : "font-medium text-[#2a3428]"
                  )}
                >
                  {title}
                </p>
                {isAction ? (
                  <span className="rounded-md bg-[#fdecee] px-1.5 py-0.5 text-[10px] font-semibold text-[#c62828]">
                    対応が必要
                  </span>
                ) : null}
              </div>
              {subtitle ? (
                <p className="mt-0.5 text-[11px] leading-snug text-[#6b7569]">{subtitle}</p>
              ) : null}
              {preview ? (
                <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-[#7a8576]">
                  {preview}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-0.5 pt-0.5 text-[#9aa396]">
              <span className="text-[10px]">{formatDate(createdAt)}</span>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
            </div>
          </div>

          {showFollowButtons ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRejectFollow?.();
                }}
                className="rounded-lg border border-[#d5ddd2] bg-white px-3 py-1.5 text-[11px] font-medium text-[#3a4638] transition-colors hover:bg-[#f5f7f4]"
              >
                拒否する
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAcceptFollow?.();
                }}
                className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: GREEN }}
              >
                承認する
              </button>
            </div>
          ) : null}

          {showActionButtons && formUrl ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDefer?.();
                }}
                className="rounded-lg border border-[#d5ddd2] bg-white px-3 py-1.5 text-[11px] font-medium text-[#3a4638] transition-colors hover:bg-[#f5f7f4]"
              >
                後で入力する
              </button>
              <Link
                href={formUrl}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen?.();
                }}
                className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: GREEN }}
              >
                フォームを入力する
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );

  const className = cn(
    "block w-full rounded-xl border-[1.5px] px-2.5 py-2.5 text-left transition-colors sm:px-3",
    selected || (isAction && showActionButtons)
      ? "border-[#7ab87a] bg-[#f1f8f1]"
      : "border-[#b8c4b6] bg-white hover:bg-[#fafcf9]"
  );

  if (href && !showActionButtons && !showFollowButtons) {
    return (
      <Link
        href={href}
        onClick={() => {
          onSelect();
          onOpen?.();
        }}
        className={className}
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(className, "cursor-pointer")}
    >
      {body}
    </div>
  );
}
