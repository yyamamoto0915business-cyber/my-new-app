"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParamsNoSuspend } from "@/lib/use-search-params-no-suspend";
import dynamic from "next/dynamic";
import {
  getEventsByDateRange,
  filterEventsByPrice,
  filterEventsByChildFriendly,
  filterEventsByAvailableOnly,
  filterEventsByTags,
  filterEventsByRegion,
  searchEvents,
  sortEvents,
  type Event,
  type DateRangeFilter,
  type EventSort,
} from "../../lib/events";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { ProfileLink } from "@/components/profile-link";
import { Breadcrumb } from "@/components/breadcrumb";
import { EventCard } from "./event-card";
import { EventCardSkeleton } from "./event-card-skeleton";
import { EventSearchSection } from "./event-search-section";

type EventWithDistance = Event & { distanceKm?: number };

const EventsMap = dynamic(() => import("../../components/events-map").then((m) => m.EventsMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-2xl border border-zinc-200 bg-white/60 dark:border-zinc-700 dark:bg-zinc-800/60">
      <p className="text-sm text-zinc-600">地図を読み込み中...</p>
    </div>
  ),
});

function EventsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParamsNoSuspend();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const tagsParam = searchParams.get("tags") ?? "";
  const urlTags = useMemo(
    () => (tagsParam ? tagsParam.split(",").filter(Boolean) : []),
    [tagsParam]
  );

  const eventListRef = useRef<HTMLElement | null>(null);

  const [view, setView] = useState<"list" | "map">("list");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<EventSort>("date_asc");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [childFriendlyOnly, setChildFriendlyOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [mapEvents, setMapEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tags.length) params.set("tags", tags.join(","));
      else params.delete("tags");
      const qs = params.toString();
      router.push("/events" + (qs ? `?${qs}` : ""), { scroll: false });
    },
    [router, searchParams]
  );

  const { today, end } = useMemo(() => {
    const now = new Date();
    const t = now.toISOString().split("T")[0];
    const we = new Date(now.getTime());
    we.setDate(we.getDate() + 7);
    const wes = we.toISOString().split("T")[0];
    const future = new Date(now.getTime());
    future.setDate(future.getDate() + 90);
    const e =
      dateRange === "today"
        ? t
        : dateRange === "all"
          ? future.toISOString().split("T")[0]
          : wes;
    return { today: t, end: e };
  }, [dateRange]);

  const start = today;

  useEffect(() => {
    setListError(null);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    if (urlTags.length) params.set("tags", urlTags.join(","));
    const qs = params.toString();
    fetchWithTimeout(`/api/events${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((data: Event[]) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {
        setEvents([]);
        setListError("通信に失敗しました");
      })
      .finally(() => setLoading(false));
  }, [prefecture, city, tagsParam, urlTags]);

  useEffect(() => {
    if (view !== "map") return;
    setMapLoading(true);
    const lat = userPos?.lat ?? 35.6812;
    const lng = userPos?.lng ?? 139.7671;
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: "50",
      start,
      end,
      price: priceFilter,
      child_friendly: String(childFriendlyOnly),
      limit: "100",
    });
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    if (urlTags.length) params.set("tags", urlTags.join(","));
    fetchWithTimeout(`/api/events/map?${params}`)
      .then((res) => res.json())
      .then((data) => setMapEvents(Array.isArray(data?.events) ? data.events : []))
      .catch(() => setMapEvents([]))
      .finally(() => setMapLoading(false));
  }, [view, userPos, start, end, priceFilter, childFriendlyOnly, prefecture, city, urlTags]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { enableHighAccuracy: false }
      );
    }
  }, []);

  const filteredEvents = useMemo(() => {
    let result = events;
    result = getEventsByDateRange(result, dateRange, selectedDate);
    result = filterEventsByRegion(result, undefined, selectedArea || undefined);
    result = filterEventsByPrice(result, priceFilter);
    result = filterEventsByChildFriendly(result, childFriendlyOnly);
    result = filterEventsByAvailableOnly(result, availableOnly);
    result = filterEventsByTags(result, urlTags);
    result = searchEvents(result, searchQuery);
    result = sortEvents(result, sortOrder);
    return result;
  }, [
    events,
    dateRange,
    selectedDate,
    selectedArea,
    priceFilter,
    childFriendlyOnly,
    availableOnly,
    urlTags,
    searchQuery,
    sortOrder,
  ]);

  const handleSearch = useCallback(() => {
    eventListRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleCenterToCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { enableHighAccuracy: false }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumb
              items={[
                { label: "トップ", href: "/?mode=select" },
                { label: "練馬区のイベント情報", href: "/events" },
                { label: "イベント検索" },
              ]}
            />
            <ProfileLink />
          </div>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            練馬区で開催予定のイベント
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`rounded px-4 py-2 text-sm font-medium ${
              view === "list"
                ? "bg-[var(--accent)] text-white"
                : "border border-zinc-200 dark:border-zinc-700"
            }`}
          >
            一覧
          </button>
          <button
            onClick={() => setView("map")}
            className={`rounded px-4 py-2 text-sm font-medium ${
              view === "map"
                ? "bg-[var(--accent)] text-white"
                : "border border-zinc-200 dark:border-zinc-700"
            }`}
          >
            地図
          </button>
        </div>

        {view === "list" ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-zinc-200 pb-4 text-sm dark:border-zinc-700">
              <span className="text-zinc-500 dark:text-zinc-400">絞り込み:</span>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value as DateRangeFilter);
                  setSelectedDate(null);
                }}
                className="rounded border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="all">すべて</option>
                <option value="today">今日</option>
                <option value="week">今週</option>
                <option value="weekend">週末</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as EventSort)}
                className="rounded border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="date_asc">開催日が近い順</option>
                <option value="date_desc">開催日が遠い順</option>
                <option value="newest">新着順</option>
              </select>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span className="text-zinc-700 dark:text-zinc-300">募集中のみ</span>
              </label>
              <div className="flex gap-1">
                {(["all", "free", "paid"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPriceFilter(f)}
                    className={`rounded px-2 py-1 text-xs ${
                      priceFilter === f
                        ? "bg-[var(--accent)] text-white"
                        : "border border-zinc-200 dark:border-zinc-600"
                    }`}
                  >
                    {f === "all" ? "すべて" : f === "free" ? "無料" : "有料"}
                  </button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={childFriendlyOnly}
                  onChange={(e) => setChildFriendlyOnly(e.target.checked)}
                />
                <span className="text-zinc-700 dark:text-zinc-300">子連れOK</span>
              </label>
            </div>

            <section ref={eventListRef} className="scroll-mt-4">
              {loading ? (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <li key={i}>
                      <EventCardSkeleton />
                    </li>
                  ))}
                </ul>
              ) : listError ? (
                <div className="rounded border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="text-sm text-red-600">{listError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm text-[var(--accent)] underline"
                  >
                    再読み込み
                  </button>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="rounded border border-zinc-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    該当するイベントがありません
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDateRange("all");
                      setSelectedDate(null);
                      setSelectedArea("");
                      setAvailableOnly(false);
                      setPriceFilter("all");
                      setChildFriendlyOnly(false);
                      handleTagsChange([]);
                      setSearchQuery("");
                    }}
                    className="mt-4 rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    条件を緩める
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                    全{filteredEvents.length}件
                  </p>
                  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredEvents.map((event) => (
                      <li key={event.id}>
                        <EventCard event={event} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <EventSearchSection
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              selectedTags={urlTags}
              onTagsChange={handleTagsChange}
              selectedArea={selectedArea}
              onAreaChange={setSelectedArea}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={handleSearch}
            />
          </>
        ) : (
          <div className="mt-6">
            {!userPos && (
              <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                位置情報が許可されていません。デフォルトの地域を表示しています。
                <button
                  type="button"
                  onClick={handleCenterToCurrentLocation}
                  className="ml-2 underline"
                >
                  現在地を取得
                </button>
              </div>
            )}
            <div className="relative">
              {mapLoading ? (
                <div className="flex h-[400px] items-center justify-center rounded border border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm text-zinc-600">読み込み中...</p>
                </div>
              ) : (
                <EventsMap
                  events={mapEvents}
                  center={userPos}
                  selectedEventId={selectedEventId}
                  onSelectEvent={setSelectedEventId}
                  dateRange={dateRange}
                  priceFilter={priceFilter}
                  childFriendlyOnly={childFriendlyOnly}
                />
              )}
              <button
                type="button"
                onClick={handleCenterToCurrentLocation}
                className="absolute right-4 top-4 z-[1000] rounded border border-zinc-200 bg-white px-3 py-2 text-sm shadow hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                title="現在地に移動"
              >
                現在地
              </button>
            </div>
            {mapEvents.length === 0 && !mapLoading && (
              <p className="mt-4 text-center text-sm text-zinc-500">
                該当するイベントがありません
              </p>
            )}
          </div>
        )}

        <div className="mt-8 pb-8">
          <Link
            href="/organizer/events"
            className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            主催者向け：イベント管理 →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function EventsPage() {
  return <EventsPageContent />;
}
