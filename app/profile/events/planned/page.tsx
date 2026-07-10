"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, CalendarDays } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { formatEventDateTime } from "@/lib/format-date";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

export default function PlannedEventsPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchWithTimeout("/api/me/event-reactions")
      .then((r) => (r.ok ? r.json() : { planned: [] }))
      .then((data: { planned?: Event[] }) => {
        setEvents(Array.isArray(data.planned) ? data.planned : []);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-[#F5F8F5]">
      <header className="sticky top-[var(--mg-mobile-top-header-h,0px)] z-30 border-b border-[#DDE8DF] bg-white/95 backdrop-blur-sm min-[900px]:top-0">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3 min-[900px]:max-w-4xl">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2D7A4F]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            マイページ
          </Link>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-3 min-[900px]:max-w-4xl">
          <h1 className="text-lg font-semibold text-[#1A2214]">参加予定のイベント</h1>
          <p className="mt-0.5 text-[13px] text-[#566358]">
            イベント詳細で「参加予定にする」を押すとここに表示されます
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 min-[900px]:max-w-4xl">
        {authLoading || loading ? (
          <div className="py-12 text-center text-sm text-[#566358]">読み込み中...</div>
        ) : !user ? (
          <div className="rounded-xl border border-[#DDE8DF] bg-white p-8 text-center">
            <p className="text-sm text-[#566358]">ログインすると参加予定を確認できます</p>
            <Link
              href="/auth?next=/profile/events/planned"
              className="mt-4 inline-block rounded-lg bg-[#2D7A4F] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D8E61]"
            >
              ログイン
            </Link>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-[#DDE8DF] bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF4ED]">
              <CalendarDays className="h-6 w-6 text-[#2D7A4F]" aria-hidden />
            </div>
            <p className="mt-4 text-sm font-medium text-[#1A2214]">参加予定のイベントはありません</p>
            <p className="mt-1 text-[13px] text-[#566358]">
              気になるイベントを見つけたら「参加予定にする」を押してみましょう
            </p>
            <Link
              href="/events"
              className="mt-5 inline-block rounded-lg bg-[#2D7A4F] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D8E61]"
            >
              イベントを探す
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="flex overflow-hidden rounded-xl border border-[#DDE8DF] bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative h-[88px] w-[120px] shrink-0 sm:h-[96px] sm:w-[140px]">
                    <EventThumbnail
                      imageUrl={event.imageUrl}
                      alt={event.title}
                      rounded="none"
                      className="!aspect-auto h-full w-full"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2.5 sm:px-4">
                    <h2 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#1A2214]">
                      {event.title}
                    </h2>
                    <p className="mt-1 text-[12px] text-[#566358]">
                      {formatEventDateTime(event.date, event.startTime)}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-[#566358]">{event.location}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
