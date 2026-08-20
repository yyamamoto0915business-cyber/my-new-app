"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Pencil,
  Send,
  Users,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { cn } from "@/lib/utils";

type Application = {
  id: string;
  user_id: string;
  status: string;
  role_assigned: string | null;
  checked_in_at: string | null;
  user?: { display_name: string | null; email: string | null };
};

type Props = {
  recruitmentId: string;
  title: string;
  meetingPlace: string | null;
  startAt: string | null;
  endAt: string | null;
  roleOptions: string[];
  accepted: Application[];
  filter: "all" | "arrived" | "not_arrived";
  onFilterChange: (f: "all" | "arrived" | "not_arrived") => void;
  filtered: Application[];
  bulkSending: boolean;
  onBulkMessage: (content: string) => void;
  onCheckIn: (appId: string) => void;
  onRoleAssign: (appId: string, role: string) => void;
  onChat?: (userId: string) => void;
  onEdit?: () => void;
};

function formatEventDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function formatTimeRange(startAt: string | null, endAt: string | null): string {
  const start =
    startAt && typeof startAt === "string" && startAt.length > 10 ? startAt.slice(11, 16) : "";
  const end = endAt && typeof endAt === "string" && endAt.length > 10 ? endAt.slice(11, 16) : "";
  if (start && end) return `${start}–${end}`;
  if (start) return start;
  return "—";
}

function displayName(app: Application): string {
  return app.user?.display_name?.trim() || app.user?.email?.split("@")[0] || "スタッフ";
}

const QUICK_MESSAGES = [
  {
    label: "集合を案内",
    content: "集合場所・時刻を再度ご確認のうえ、余裕を持ってお集まりください。",
  },
  {
    label: "休憩のお知らせ",
    content: "これから休憩に入ります。戻りましたらお知らせください。",
  },
  {
    label: "片付け開始",
    content: "片付けを開始します。集まってください。",
  },
];

export function DayOfRecruitmentPcView({
  recruitmentId,
  title,
  meetingPlace,
  startAt,
  endAt,
  roleOptions,
  accepted,
  filter,
  onFilterChange,
  filtered,
  bulkSending,
  onBulkMessage,
  onCheckIn,
  onRoleAssign,
  onChat,
  onEdit,
}: Props) {
  const [customMessage, setCustomMessage] = useState("");
  const arrived = accepted.filter((a) => a.checked_in_at).length;
  const notArrived = accepted.length - arrived;

  return (
    <div className="mg-dayof-pc w-full space-y-3">
      <Breadcrumb
        className="text-[12px]"
        items={[
          { label: "ボランティア募集管理", href: "/organizer/recruitments" },
          { label: title, href: `/organizer/recruitments/${recruitmentId}` },
          { label: "当日管理" },
        ]}
      />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold tracking-wide text-[#1a2818]">当日管理</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b7569]">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#8a9e80]" aria-hidden />
              {formatEventDate(startAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#8a9e80]" aria-hidden />
              {formatTimeRange(startAt, endAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#8a9e80]" aria-hidden />
              {meetingPlace || "集合場所未定"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-[#8a9e80]" aria-hidden />
              承認 {accepted.length}名
              <span className="text-[#c5d4c0]">·</span>
              到着 {arrived}
              <span className="text-[#c5d4c0]">·</span>
              <span className={notArrived > 0 ? "font-semibold text-[#c45a1a]" : undefined}>
                未到着 {notArrived}
              </span>
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/organizer/recruitments/${recruitmentId}`}
            className="inline-flex items-center rounded-lg border border-[#e8e6e0] bg-white px-3 py-2 text-[12px] font-medium text-[#3a3428] hover:bg-[#fafaf8]"
          >
            ← 応募確認へ戻る
          </Link>
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e6e0] bg-white px-3 py-2 text-[12px] font-medium text-[#3a3428] hover:bg-[#fafaf8]"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              編集
            </button>
          ) : (
            <Link
              href={`/organizer/recruitments/new?editId=${recruitmentId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e6e0] bg-white px-3 py-2 text-[12px] font-medium text-[#3a3428] hover:bg-[#fafaf8]"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              編集
            </Link>
          )}
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-[#e8e6e0] bg-white shadow-sm">
        <div className="space-y-2 border-b border-[#f0f2ec] bg-[#fafcf8] px-3 py-2.5">
          <p className="text-[11px] text-[#8a9e80]">
            承認済みスタッフの通知に届きます（ダッシュボードのお知らせと同じ）
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_MESSAGES.map((m) => (
              <button
                key={m.label}
                type="button"
                disabled={accepted.length === 0}
                onClick={() => setCustomMessage(m.content)}
                className="rounded-lg border border-[#e8e6e0] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#3a3428] hover:bg-[#f5f4f0] disabled:opacity-50"
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="メッセージを入力してください"
              className="min-w-0 flex-1 rounded-lg border border-[#e8e6e0] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#2B3A6B] focus:ring-2 focus:ring-[#2B3A6B]/10"
              aria-label="自由入力メッセージ"
            />
            <button
              type="button"
              disabled={bulkSending || accepted.length === 0 || !customMessage.trim()}
              onClick={() => {
                onBulkMessage(customMessage.trim());
                setCustomMessage("");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3d6b2f] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#345a28] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              送信
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 border-b border-[#f0f2ec] px-3 py-2">
          {(
            [
              { key: "all", label: "全員", count: accepted.length },
              { key: "arrived", label: "到着", count: arrived },
              { key: "not_arrived", label: "未到着", count: notArrived },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onFilterChange(tab.key)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[12px] font-medium",
                filter === tab.key
                  ? "bg-[#eaf6de] text-[#3a7a10]"
                  : "text-[#8a9e80] hover:bg-[#f5f4f0] hover:text-[#526448]"
              )}
            >
              {tab.label}
              <span className="ml-1 tabular-nums opacity-80">{tab.count}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-[#8a9e80]">
            {accepted.length === 0 ? "採用者がいません" : "該当するスタッフがいません"}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2ec] bg-[#fafaf8] text-left text-[10px] font-semibold text-[#8a9e80]">
                <th className="px-4 py-2">名前</th>
                <th className="px-4 py-2">役割</th>
                <th className="px-4 py-2">状態</th>
                <th className="px-4 py-2">到着時刻</th>
                <th className="px-4 py-2">連絡</th>
                <th className="px-4 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const arrivedAt = app.checked_in_at
                  ? new Date(app.checked_in_at).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })
                  : null;
                const name = displayName(app);
                const initials = /^[a-zA-Z]/.test(name.trim())
                  ? name.trim().slice(0, 2).toUpperCase()
                  : name.trim().slice(0, 1);
                return (
                  <tr key={app.id} className="border-b border-[#f0f2ec] last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f0e4] text-[11px] font-bold text-[#3a633d]">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[#1a2818]">{name}</p>
                          {app.user?.email ? (
                            <p className="truncate text-[11px] text-[#8a9e80]">{app.user.email}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={app.role_assigned ?? ""}
                        onChange={(e) => onRoleAssign(app.id, e.target.value || "")}
                        className="rounded-lg border border-[#e8e6e0] bg-white px-2 py-1.5 text-[12px]"
                      >
                        <option value="">未割当</option>
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      {arrivedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" aria-hidden />
                          到着
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                          未到着
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] tabular-nums text-[#526448]">
                      {arrivedAt ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {!arrivedAt ? (
                          <button
                            type="button"
                            onClick={() => onCheckIn(app.id)}
                            className="rounded-lg bg-[#3d6b2f] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#345a28]"
                          >
                            到着にする
                          </button>
                        ) : null}
                        {onChat ? (
                          <button
                            type="button"
                            onClick={() => onChat(app.user_id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#e8e6e0] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#3a3428] hover:bg-[#fafaf8]"
                          >
                            <MessageCircle className="h-3 w-3" aria-hidden />
                            チャット
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/organizer/recruitments/${recruitmentId}`}
                          className="rounded-lg border border-[#e8e6e0] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#3a3428] hover:bg-[#fafaf8]"
                        >
                          詳細
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
