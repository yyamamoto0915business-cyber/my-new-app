"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getJstTodayYmd } from "@/lib/jst-date";
import type { DashboardEvent } from "@/app/api/organizer/dashboard/route";
import {
  getEventDayPhaseFromDashboard,
  eventDayPhaseLabel,
  eventDayPhaseBadgeClass,
} from "./day-management-shared";

function formatEventDateShort(date: string) {
  const d = new Date(`${date}T12:00:00+09:00`);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

type EventGroup = {
  key: "today" | "upcoming" | "past";
  label: string;
  events: DashboardEvent[];
};

function groupSwitchableEvents(events: DashboardEvent[], currentId: string, today: string): EventGroup[] {
  const others = events.filter((e) => e.id !== currentId);

  const todayEvents = others.filter((e) => e.date === today && e.status === "public");
  const upcomingEvents = others
    .filter((e) => e.status === "public" && e.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents = others
    .filter((e) => e.status === "ended")
    .sort((a, b) => b.date.localeCompare(a.date));

  const groups: EventGroup[] = [
    { key: "today" as const, label: "本日開催", events: todayEvents },
    { key: "upcoming" as const, label: "開催予定", events: upcomingEvents },
    { key: "past" as const, label: "過去", events: pastEvents },
  ].filter((g) => g.events.length > 0);

  return groups;
}

function groupSelectableEvents(events: DashboardEvent[], today: string): EventGroup[] {
  const todayEvents = events.filter((e) => e.date === today && e.status === "public");
  const upcomingEvents = events
    .filter((e) => e.status === "public" && e.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const groups: EventGroup[] = [
    { key: "today" as const, label: "本日開催", events: todayEvents },
    { key: "upcoming" as const, label: "開催予定", events: upcomingEvents },
  ].filter((g) => g.events.length > 0);

  return groups;
}

function groupPastEvents(events: DashboardEvent[]): DashboardEvent[] {
  return events
    .filter((e) => e.status === "ended")
    .sort((a, b) => b.date.localeCompare(a.date));
}

type Props = {
  currentEventId?: string;
  currentTitle?: string;
  events: DashboardEvent[];
  loading?: boolean;
  variant?: "current" | "empty";
  compact?: boolean;
  className?: string;
};

function EventDropdownList({
  groups,
  currentEventId,
  onSelect,
}: {
  groups: EventGroup[];
  currentEventId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.key}>
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#566358]/70">
            {group.label}
          </p>
          <ul>
            {group.events.map((event) => {
              const phase = getEventDayPhaseFromDashboard(event);
              const selected = event.id === currentEventId;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onSelect(event.id)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F5F8F5]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#1A2214]">
                          {event.title}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${eventDayPhaseBadgeClass(phase)}`}
                        >
                          {eventDayPhaseLabel(phase)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#566358]">
                        {formatEventDateShort(event.date)}
                      </p>
                    </div>
                    {selected ? (
                      <Check size={14} className="mt-0.5 shrink-0 text-[#2D7A4F]" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

export function DayManagementEventSwitcher({
  currentEventId = "",
  currentTitle = "",
  events,
  loading = false,
  variant = "current",
  compact = false,
  className = "",
}: Props) {
  const router = useRouter();
  const [selectOpen, setSelectOpen] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => getJstTodayYmd(), []);

  const switchGroups = useMemo(
    () => groupSwitchableEvents(events, currentEventId, today),
    [events, currentEventId, today]
  );
  const selectGroups = useMemo(() => groupSelectableEvents(events, today), [events, today]);
  const pastEvents = useMemo(() => groupPastEvents(events), [events]);

  const hasAlternatives = switchGroups.some((g) => g.events.length > 0);
  const pastCount = switchGroups.find((g) => g.key === "past")?.events.length ?? 0;
  const hasSelectable = selectGroups.some((g) => g.events.length > 0);

  const toggleLabel =
    pastCount > 0 ? "過去のイベントを見る" : hasAlternatives ? "イベントを切り替え" : null;

  useEffect(() => {
    if (!selectOpen && !pastOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setSelectOpen(false);
        setPastOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectOpen(false);
        setPastOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectOpen, pastOpen]);

  const handleSelect = (id: string) => {
    setSelectOpen(false);
    setPastOpen(false);
    if (id !== currentEventId) {
      router.push(`/organizer/events/${id}/day`);
    }
  };

  const dropdownPanelClass =
    "absolute top-[calc(100%+6px)] z-20 max-h-[min(320px,60vh)] overflow-y-auto rounded-xl border border-[#DDE8DF] bg-white py-2 shadow-lg";

  if (loading) {
    return (
      <div className={`animate-pulse rounded-xl border border-[#DDE8DF] bg-white/90 p-4 ${className}`}>
        <div className="h-3 w-24 rounded bg-[#e8e6e0]" />
        <div className="mt-3 h-10 rounded-lg bg-[#e8e6e0]" />
      </div>
    );
  }

  if (variant === "empty") {
    return (
      <div ref={rootRef} className={`relative ${className}`}>
        {!compact ? (
          <p className="text-[11px] font-semibold tracking-wide text-[#566358] min-[900px]:text-[12px]">
            イベントを切り替え
          </p>
        ) : null}

        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border border-[#DDE8DF] bg-white/95 shadow-sm min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-2",
            compact ? "p-2 min-[900px]:px-3 min-[900px]:py-2" : "mt-2 p-3 min-[900px]:gap-3 min-[900px]:px-4 min-[900px]:py-3"
          )}
        >
          <div className="relative min-w-0 flex-1">
            {events.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-[#DDE8DF] bg-[#F5F8F5] px-3 py-2.5">
                <CalendarDays size={16} className="shrink-0 text-[#566358]/50" />
                <p className="text-[13px] text-[#566358]">公開イベントがありません</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setPastOpen(false);
                    setSelectOpen((v) => !v);
                  }}
                  aria-expanded={selectOpen}
                  aria-haspopup="listbox"
                  disabled={!hasSelectable}
                  className="flex w-full items-center gap-3 rounded-lg border border-[#DDE8DF] bg-[#F5F8F5] px-3 py-2.5 text-left transition-colors hover:border-[#2D7A4F] hover:bg-[#EAF4ED] disabled:cursor-default disabled:opacity-60 min-[900px]:bg-white"
                >
                  <CalendarDays size={16} className="shrink-0 text-[#2D7A4F]" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#566358] min-[900px]:text-[14px]">
                    {hasSelectable ? "イベントを選択してください" : "開催予定のイベントはありません"}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-[#566358] transition-transform ${selectOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {selectOpen && hasSelectable ? (
                  <div
                    className={`${dropdownPanelClass} left-0 right-0 min-[900px]:w-full`}
                    role="listbox"
                    aria-label="イベントを選択"
                  >
                    <EventDropdownList groups={selectGroups} onSelect={handleSelect} />
                  </div>
                ) : null}
              </>
            )}
          </div>

          {pastEvents.length > 0 ? (
            <div className="relative shrink-0 min-[900px]:ml-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectOpen(false);
                  setPastOpen((v) => !v);
                }}
                aria-expanded={pastOpen}
                aria-haspopup="listbox"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#DDE8DF] bg-[#F5F8F5] px-3 py-2 text-[12px] font-medium text-[#2D7A4F] transition-colors hover:border-[#2D7A4F] hover:bg-[#EAF4ED] min-[900px]:w-auto min-[900px]:bg-white"
              >
                過去のイベントを見る
                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform ${pastOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {pastOpen ? (
                <div
                  className={`${dropdownPanelClass} left-0 right-0 min-[900px]:left-auto min-[900px]:w-[min(100vw-2rem,360px)] min-[900px]:right-0`}
                  role="listbox"
                  aria-label="過去のイベント"
                >
                  <EventDropdownList
                    groups={[{ key: "past", label: "過去", events: pastEvents }]}
                    onSelect={handleSelect}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <Link
            href="/organizer/events/new"
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-[#2D7A4F] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#245f3e]",
              compact ? "min-[900px]:ml-auto" : "w-full min-[900px]:w-auto"
            )}
          >
            <span aria-hidden>＋</span>
            イベントを作成する
          </Link>
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <p className="text-[11px] font-semibold tracking-wide text-[#566358] min-[900px]:text-[12px]">
        イベントを切り替え
      </p>

      <div className="mt-2 flex flex-col gap-2 rounded-xl border border-[#DDE8DF] bg-white/95 p-3 shadow-sm min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-4 min-[900px]:px-4 min-[900px]:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF4ED]">
            <CalendarDays size={16} className="text-[#2D7A4F]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[14px] font-semibold text-[#1A2214] min-[900px]:text-[15px]">
                {currentTitle}
              </p>
              <span className="shrink-0 rounded-full bg-[#EAF4ED] px-2 py-0.5 text-[10px] font-bold text-[#2D7A4F]">
                現在のイベント
              </span>
            </div>
          </div>
        </div>

        {toggleLabel && hasAlternatives ? (
          <div className="relative shrink-0 min-[900px]:ml-auto">
            <button
              type="button"
              onClick={() => setSelectOpen((v) => !v)}
              aria-expanded={selectOpen}
              aria-haspopup="listbox"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#DDE8DF] bg-[#F5F8F5] px-3 py-2 text-[12px] font-medium text-[#2D7A4F] transition-colors hover:border-[#2D7A4F] hover:bg-[#EAF4ED] min-[900px]:w-auto min-[900px]:bg-white"
            >
              {toggleLabel}
              <ChevronDown
                size={14}
                className={`shrink-0 transition-transform ${selectOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {selectOpen ? (
              <div
                className={`${dropdownPanelClass} left-0 right-0 min-[900px]:left-auto min-[900px]:w-[min(100vw-2rem,360px)] min-[900px]:right-0`}
                role="listbox"
                aria-label="切り替え先のイベント"
              >
                <EventDropdownList
                  groups={switchGroups}
                  currentEventId={currentEventId}
                  onSelect={handleSelect}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
