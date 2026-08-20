"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STORE_SCHEDULE_STATUS_LABEL,
  formatStoreDateJa,
  type StoreScheduleRecord,
  type StoreScheduleStatus,
} from "@/lib/stores/types";

type Props = {
  storeId: string;
  schedules: StoreScheduleRecord[];
  onSchedulesChange: (schedules: StoreScheduleRecord[]) => void;
};

type Mode = "list" | "create" | "edit";

function statusClass(status: StoreScheduleStatus): string {
  switch (status) {
    case "scheduled":
      return "bg-[#E8F5EC] text-[#2D7A4F]";
    case "adjusting":
      return "bg-[#FFF1E6] text-[#C45C12]";
    case "cancelled":
      return "bg-[#F0F0F0] text-[#6B6B6B]";
  }
}

function formatTimeRange(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  if (start && end) return `${start}～${end}`;
  return start || end || "—";
}

function ScheduleEditForm({
  storeId,
  initial,
  onCancel,
  onSaved,
}: {
  storeId: string;
  initial: StoreScheduleRecord | null;
  onCancel: () => void;
  onSaved: (s: StoreScheduleRecord) => void;
}) {
  const isEdit = Boolean(initial);
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? "");
  const [eventName, setEventName] = useState(initial?.eventName ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [stallArea, setStallArea] = useState(initial?.stallArea ?? "");
  const [status, setStatus] = useState<StoreScheduleStatus>(
    initial?.status ?? "scheduled",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName.trim()) {
      setError("イベント／場所名を入力してください");
      return;
    }
    if (!eventDate) {
      setError("出店日を入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = isEdit
        ? `/api/organizer/stores/${storeId}/schedules/${initial!.id}`
        : `/api/organizer/stores/${storeId}/schedules`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDate,
          eventName: eventName.trim(),
          location: location.trim() || null,
          startTime: startTime || null,
          endTime: endTime || null,
          stallArea: stallArea.trim() || null,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "保存に失敗しました");
        return;
      }
      onSaved(json as StoreScheduleRecord);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="org-store-news-form" onSubmit={(e) => void handleSubmit(e)}>
      <div className="org-store-news-form__head">
        <h3>{isEdit ? "出店スケジュールを編集" : "出店スケジュールを追加"}</h3>
        <button
          type="button"
          className="org-store-news-form__close"
          onClick={onCancel}
          aria-label="閉じる"
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="org-store-news-form__grid">
        <label className="org-store-news-form__field">
          <span>
            出店日 <em>*</em>
          </span>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </label>

        <label className="org-store-news-form__field">
          <span>ステータス</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StoreScheduleStatus)}
          >
            <option value="scheduled">出店予定</option>
            <option value="adjusting">調整中</option>
            <option value="cancelled">中止</option>
          </select>
        </label>

        <label className="org-store-news-form__field org-store-news-form__field--full">
          <span>
            イベント／場所名 <em>*</em>
          </span>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="例: まちフェス2024"
            required
            maxLength={120}
          />
        </label>

        <label className="org-store-news-form__field org-store-news-form__field--full">
          <span>場所の詳細</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: 代々木公園 / 駅前広場"
            maxLength={120}
          />
        </label>

        <label className="org-store-news-form__field">
          <span>開始時間</span>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>

        <label className="org-store-news-form__field">
          <span>終了時間</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>

        <label className="org-store-news-form__field org-store-news-form__field--full">
          <span>出店エリア</span>
          <input
            type="text"
            value={stallArea}
            onChange={(e) => setStallArea(e.target.value)}
            placeholder="例: A区画 / キッチンカーゾーン"
            maxLength={80}
          />
        </label>
      </div>

      {error ? <p className="org-store-news-form__error">{error}</p> : null}

      <div className="org-store-news-form__actions">
        <button
          type="button"
          className="org-store-news-form__cancel"
          onClick={onCancel}
          disabled={saving}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="org-store-news-form__save"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              保存中…
            </>
          ) : isEdit ? (
            "変更を保存"
          ) : (
            "追加する"
          )}
        </button>
      </div>
    </form>
  );
}

export function StoreSchedulePanel({
  storeId,
  schedules,
  onSchedulesChange,
}: Props) {
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [monthKey, setMonthKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const editing = useMemo(
    () =>
      editingId ? (schedules.find((s) => s.id === editingId) ?? null) : null,
    [editingId, schedules],
  );

  const filtered = useMemo(() => {
    return schedules.filter((s) => s.eventDate.startsWith(monthKey));
  }, [schedules, monthKey]);

  const monthLabel = useMemo(() => {
    const [y, m] = monthKey.split("-");
    return `${y}年${Number(m)}月`;
  }, [monthKey]);

  function shiftMonth(delta: number) {
    const [y, m] = monthKey.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonthKey(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  useEffect(() => {
    if (schedules.length === 0) return;
    const hasCurrent = schedules.some((s) => s.eventDate.startsWith(monthKey));
    if (!hasCurrent) {
      const first = schedules[0]?.eventDate?.slice(0, 7);
      if (first) setMonthKey(first);
    }
    // 初回のみ寄せる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  async function handleDelete(id: string) {
    if (!window.confirm("この出店スケジュールを削除しますか？")) return;
    setDeletingId(id);
    try {
      const res = await fetch(
        `/api/organizer/stores/${storeId}/schedules/${id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        onSchedulesChange(schedules.filter((s) => s.id !== id));
        if (editingId === id) {
          setMode("list");
          setEditingId(null);
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (mode === "create" || (mode === "edit" && editing)) {
    return (
      <section
        className="org-store-mgmt__panel"
        aria-labelledby="store-schedule-form-heading"
      >
        <h2 id="store-schedule-form-heading" className="sr-only">
          出店スケジュール編集
        </h2>
        <ScheduleEditForm
          storeId={storeId}
          initial={mode === "edit" ? editing : null}
          onCancel={() => {
            setMode("list");
            setEditingId(null);
          }}
          onSaved={(saved) => {
            if (mode === "edit") {
              onSchedulesChange(
                schedules
                  .map((s) => (s.id === saved.id ? saved : s))
                  .sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
              );
            } else {
              onSchedulesChange(
                [...schedules.filter((s) => s.id !== saved.id), saved].sort(
                  (a, b) => a.eventDate.localeCompare(b.eventDate),
                ),
              );
            }
            setMode("list");
            setEditingId(null);
          }}
        />
      </section>
    );
  }

  return (
    <section
      className="org-store-mgmt__panel"
      aria-labelledby="store-schedule-heading"
    >
      <div className="org-store-mgmt__panel-head">
        <div className="org-store-mgmt__panel-heading">
          <h2 id="store-schedule-heading" className="org-store-mgmt__panel-title">
            出店スケジュール
          </h2>
          <p className="org-store-mgmt__panel-desc">
            イベントやマルシェへの出店予定を登録できます。
          </p>
        </div>
        <button
          type="button"
          className="org-store-mgmt__create-btn"
          onClick={() => {
            setMode("create");
            setEditingId(null);
          }}
        >
          <Plus className="size-3.5" strokeWidth={2.6} aria-hidden />
          出店スケジュールを追加
        </button>
      </div>

      <div className="org-store-mgmt__schedule-toolbar">
        <div className="org-store-mgmt__schedule-month">
          <button
            type="button"
            className="org-store-mgmt__schedule-month-btn"
            onClick={() => shiftMonth(-1)}
            aria-label="前の月"
          >
            ‹
          </button>
          <span>
            <CalendarDays className="size-3.5" strokeWidth={2.2} aria-hidden />
            {monthLabel}
          </span>
          <button
            type="button"
            className="org-store-mgmt__schedule-month-btn"
            onClick={() => shiftMonth(1)}
            aria-label="次の月"
          >
            ›
          </button>
        </div>
        <p className="org-store-mgmt__schedule-count">
          {filtered.length}件
          {schedules.length !== filtered.length
            ? `（全${schedules.length}件）`
            : ""}
        </p>
      </div>

      <div className="org-store-mgmt__table-wrap org-store-mgmt__schedule-table-wrap">
        <table className="org-store-mgmt__table">
          <thead>
            <tr>
              <th>日付</th>
              <th>イベント／場所</th>
              <th>時間</th>
              <th>出店エリア</th>
              <th>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="whitespace-nowrap">
                  {formatStoreDateJa(s.eventDate)}
                </td>
                <td>
                  <div className="font-medium text-[#2a2a2a]">{s.eventName}</div>
                  {s.location ? (
                    <div className="mt-0.5 text-[12px] text-[#6b6b6b]">
                      {s.location}
                    </div>
                  ) : null}
                </td>
                <td className="whitespace-nowrap">
                  {formatTimeRange(s.startTime, s.endTime)}
                </td>
                <td>{s.stallArea || "—"}</td>
                <td>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      statusClass(s.status),
                    )}
                  >
                    {STORE_SCHEDULE_STATUS_LABEL[s.status]}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="org-store-mgmt__icon-action"
                      aria-label="編集"
                      onClick={() => {
                        setEditingId(s.id);
                        setMode("edit");
                      }}
                    >
                      <Pencil className="size-3.5" strokeWidth={2.2} />
                    </button>
                    <button
                      type="button"
                      className="org-store-mgmt__icon-action"
                      aria-label="削除"
                      disabled={deletingId === s.id}
                      onClick={() => void handleDelete(s.id)}
                    >
                      {deletingId === s.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" strokeWidth={2.2} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="org-store-mgmt__empty-cell">
                  この月の出店予定はありません
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* モバイルカード */}
      <ul className="org-store-mgmt__schedule-cards">
        {filtered.map((s) => (
          <li key={s.id} className="org-store-mgmt__schedule-card">
            <div className="org-store-mgmt__schedule-card-top">
              <span className="org-store-mgmt__schedule-card-date">
                {formatStoreDateJa(s.eventDate)}
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  statusClass(s.status),
                )}
              >
                {STORE_SCHEDULE_STATUS_LABEL[s.status]}
              </span>
            </div>
            <p className="org-store-mgmt__schedule-card-title">{s.eventName}</p>
            {s.location ? (
              <p className="org-store-mgmt__schedule-card-loc">{s.location}</p>
            ) : null}
            <p className="org-store-mgmt__schedule-card-meta">
              {formatTimeRange(s.startTime, s.endTime)}
              {s.stallArea ? ` · ${s.stallArea}` : ""}
            </p>
            <div className="org-store-mgmt__schedule-card-actions">
              <button
                type="button"
                onClick={() => {
                  setEditingId(s.id);
                  setMode("edit");
                }}
              >
                編集
              </button>
              <button
                type="button"
                disabled={deletingId === s.id}
                onClick={() => void handleDelete(s.id)}
              >
                削除
              </button>
            </div>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="org-store-mgmt__empty-cell py-6 text-center">
            この月の出店予定はありません。「出店スケジュールを追加」から登録できます。
          </li>
        ) : null}
      </ul>
    </section>
  );
}
