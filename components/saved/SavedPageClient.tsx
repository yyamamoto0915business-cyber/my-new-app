"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getBookmarks, toggleBookmark } from "@/lib/bookmark-storage";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { Event } from "@/lib/db/types";
import type { CommunityPost } from "@/lib/posts/mock-feed";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { PostsFeedCard } from "@/components/posts/PostsFeedCard";
import { formatEventDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

type Tab = "posts" | "events";

function parseTab(value: string | null): Tab {
  return value === "events" ? "events" : "posts";
}

export function SavedPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const setTab = useCallback(
    (next: Tab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "posts") params.delete("tab");
      else params.set("tab", next);
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="relative z-[1] min-h-svh bg-white">
      <header className="border-b border-[var(--border)] bg-white px-4 py-2">
        <h1 className="text-[16px] font-semibold leading-tight text-zinc-900">
          お気に入り
        </h1>
        <p className="mt-px text-[12px] leading-snug text-zinc-500">
          いいねした投稿と、保存したまちの情報
        </p>
        <div className="mt-1.5 flex gap-0.5 rounded-lg bg-[#EEF3EE] p-0.5">
          <button
            type="button"
            onClick={() => setTab("posts")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors",
              tab === "posts"
                ? "bg-white text-[#1A2214] shadow-sm"
                : "text-[#566358]",
            )}
          >
            投稿
          </button>
          <button
            type="button"
            onClick={() => setTab("events")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors",
              tab === "events"
                ? "bg-white text-[#1A2214] shadow-sm"
                : "text-[#566358]",
            )}
          >
            まちの情報
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 pb-24 min-[900px]:max-w-2xl">
        {tab === "posts" ? <LikedPostsPanel /> : <SavedEventsPanel />}
      </main>
    </div>
  );
}

function LikedPostsPanel() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWithTimeout("/api/me/liked-posts")
      .then(async (r) => {
        if (r.status === 401) {
          if (!cancelled) setUnauthorized(true);
          return;
        }
        const data = (await r.json()) as { posts?: CommunityPost[] };
        if (!cancelled) setPosts(Array.isArray(data.posts) ? data.posts : []);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">読み込み中...</div>
    );
  }
  if (unauthorized) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500">
          ログインすると、いいねした投稿を確認できます
        </p>
        <Link
          href="/auth?next=/saved"
          className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          ログイン
        </Link>
      </div>
    );
  }
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500">いいねした投稿はまだありません</p>
        <Link
          href="/posts"
          className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          投稿を見る
        </Link>
      </div>
    );
  }

  return (
    <div className="posts-grid posts-grid--mobile">
      {posts.map((post, i) => (
        <PostsFeedCard key={post.id} post={post} index={i} />
      ))}
    </div>
  );
}

function SavedEventsPanel() {
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBookmarkIds(getBookmarks());
  }, []);

  useEffect(() => {
    if (bookmarkIds.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchWithTimeout("/api/events")
      .then((r) => r.json())
      .then((data: Event[]) => {
        const map = new Map(data.map((e) => [e.id, e]));
        setEvents(
          bookmarkIds
            .map((id) => map.get(id))
            .filter((e): e is Event => e != null),
        );
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [bookmarkIds.join(",")]);

  const handleBookmarkToggle = (eventId: string) => {
    toggleBookmark(eventId);
    setBookmarkIds(getBookmarks());
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">読み込み中...</div>
    );
  }
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500">保存したまちの情報がありません</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          まちの情報を探す
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            href={`/events/${event.id}`}
            className="block overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/50"
          >
            <EventThumbnail
              imageUrl={event.imageUrl}
              alt={event.title}
              rounded="none"
            />
            <div className="flex items-start justify-between gap-2 p-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-zinc-900 line-clamp-2 dark:text-zinc-100">
                  {event.title}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatEventDateTime(event.date, event.startTime)} ・{" "}
                  {event.location}
                </p>
              </div>
              <BookmarkToggle
                eventId={event.id}
                isActive={bookmarkIds.includes(event.id)}
                onToggle={() => handleBookmarkToggle(event.id)}
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
