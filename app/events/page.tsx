"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getEventsByDateRange,
  filterEventsByPrice,
  filterEventsByChildFriendly,
  searchEvents,
  calcDistanceKm,
  type Event,
} from "../../lib/events";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { ProfileLink } from "@/components/profile-link";
import { TagFilter } from "@/components/tag-filter";
import { Breadcrumb } from "@/components/breadcrumb";

type EventWithDistance = Event & { distanceKm?: number };

const EventsMap = dynamic(() => import("../../components/events-map").then((m) => m.EventsMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/60 dark:border-zinc-700/60 dark:bg-zinc-800/60">
      <p className="text-sm text-zinc-600">地図を読み込み中...</p>
    </div>
  ),
});

function EventsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const tagsParam = searchParams.get("tags") ?? "";
  const selectedTags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

  const [view, setView] = useState<"list" | "map">("list");
  const [dateRange, setDateRange] = useState<"today" | "week">("week");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [childFriendlyOnly, setChildFriendlyOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
      router.push("/events" + (qs ? `?${qs}` : ""));
    },
    [router, searchParams]
  );

  const today = new Date().toISOString().split("T")[0];
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split("T")[0];
  const start = dateRange === "today" ? today : today;
  const end = dateRange === "today" ? today : weekEndStr;

  useEffect(() => {
    setListError(null);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    const qs = params.toString();
    fetchWithTimeout(`/api/events${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((data: Event[]) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {
        setEvents([]);
        setListError("通信に失敗しました");
      })
      .finally(() => setLoading(false));
  }, [prefecture, city, selectedTags.join(",")]);

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
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    fetchWithTimeout(`/api/events/map?${params}`)
      .then((res) => res.json())
      .then((data) => setMapEvents(Array.isArray(data?.events) ? data.events : []))
      .catch(() => setMapEvents([]))
      .finally(() => setMapLoading(false));
  }, [view, userPos, start, end, priceFilter, childFriendlyOnly, prefecture, city, selectedTags]);

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
    result = getEventsByDateRange(result, dateRange);
    result = filterEventsByPrice(result, priceFilter);
    result = filterEventsByChildFriendly(result, childFriendlyOnly);
    result = searchEvents(result, searchQuery);
    if (userPos) {
      result = [...result]
        .filter((e) => e.latitude != null && e.longitude != null)
        .map((e) => ({
          ...e,
          distanceKm: calcDistanceKm(
            userPos.lat,
            userPos.lng,
            e.latitude!,
            e.longitude!
          ),
        }))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }
    return result;
  }, [events, dateRange, priceFilter, childFriendlyOnly, searchQuery, userPos]);

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumb items={[{ label: "トップ", href: "/" }, { label: "イベント一覧" }]} />
            <ProfileLink />
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            イベント一覧
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              view === "list"
                ? "bg-[var(--accent)] text-white"
                : "border border-zinc-200/60 dark:border-zinc-700"
            }`}
          >
            一覧
          </button>
          <button
            onClick={() => setView("map")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              view === "map"
                ? "bg-[var(--accent)] text-white"
                : "border border-zinc-200/60 dark:border-zinc-700"
            }`}
          >
            地図
          </button>
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-200/60 bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/80">
          <input
            type="search"
            placeholder="イベント名・主催者・場所で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/60 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateRange("today")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                dateRange === "today"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-zinc-200/60 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              今日
            </button>
            <button
              onClick={() => setDateRange("week")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                dateRange === "week"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-zinc-200/60 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              今週
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">タグで絞り込み</p>
            <TagFilter selectedTags={selectedTags} onTagsChange={handleTagsChange} />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "free", "paid"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPriceFilter(filter)}
                className={`rounded-xl px-4 py-2 text-sm ${
                  priceFilter === filter
                    ? "bg-[var(--accent)] text-white"
                    : "border border-zinc-200/60 dark:border-zinc-700"
                }`}
              >
                {filter === "all" ? "すべて" : filter === "free" ? "無料" : "有料"}
              </button>
            ))}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200/60 px-4 py-2 text-sm dark:border-zinc-700">
              <input
                type="checkbox"
                checked={childFriendlyOnly}
                onChange={(e) => setChildFriendlyOnly(e.target.checked)}
              />
              子連れOKのみ
            </label>
          </div>
        </div>

        {view === "list" ? (
          <>
            {loading ? (
              <p className="mt-6 text-center text-sm text-zinc-500">読み込み中...</p>
            ) : listError ? (
              <div className="mt-6 rounded-2xl border border-zinc-200/60 bg-white/80 p-6 text-center dark:border-zinc-700/60 dark:bg-zinc-900/80">
                <p className="text-sm text-red-600">{listError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-[var(--accent)] underline"
                >
                  再読み込み
                </button>
              </div>
            ) : (
              <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.length === 0 ? (
                  <li className="col-span-full rounded-2xl border border-zinc-200/60 bg-white/80 p-8 text-center text-sm text-zinc-500 shadow-lg backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/80">
                    該当するイベントがありません
                  </li>
                ) : (
                  filteredEvents.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/events/${event.id}`}
                        className="block rounded-2xl border border-zinc-200/60 bg-white/80 p-4 shadow-md backdrop-blur-sm transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:hover:border-zinc-600"
                      >
                        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {event.title}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-400">
                          {event.date} {event.startTime}〜 {event.location}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {event.childFriendly && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              子連れOK
                            </span>
                          )}
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                              event.price === 0
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {event.price === 0 ? "無料" : `¥${event.price}`}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </>
        ) : (
          <div className="mt-6">
            {!userPos && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
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
                <div className="flex h-[400px] items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/60 dark:border-zinc-700/60 dark:bg-zinc-800/60">
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
                className="absolute right-4 top-4 z-[1000] rounded-xl border border-zinc-200/60 bg-white/90 px-3 py-2 text-sm shadow-md backdrop-blur-sm hover:bg-white dark:border-zinc-700/60 dark:bg-zinc-900/90 dark:hover:bg-zinc-800"
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

        <div className="mt-8">
          <Link
            href="/organizer/events"
            className="text-sm text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
          >
            主催者向け：イベント管理 →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-zinc-500">読み込み中...</div>}>
      <EventsPageContent />
    </Suspense>
  );
}
