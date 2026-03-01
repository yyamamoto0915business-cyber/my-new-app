"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { EventCard } from "@/app/events/event-card";
import type { Event } from "@/lib/db/types";
import { ProfileLink } from "@/components/profile-link";
import { Breadcrumb } from "@/components/breadcrumb";

type CollectionWithEvents = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  eventIds: string[];
  events: Event[];
};

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [data, setData] = useState<CollectionWithEvents | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/collections/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl border border-[var(--border)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <p className="text-[var(--foreground-muted)]">特集が見つかりません</p>
          <Link href="/collections" className="mt-4 text-sm text-[var(--accent)] hover:underline">
            特集一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex justify-end">
            <ProfileLink />
          </div>
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "特集", href: "/collections" },
              { label: data.title },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="mb-10">
          {data.imageUrl && (
            <div className="relative mb-6 h-48 w-full overflow-hidden rounded-xl sm:h-64">
              <Image
                src={data.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 1024px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h1 className="absolute bottom-4 left-4 right-4 font-serif text-2xl font-semibold text-white sm:text-3xl">
                {data.title}
              </h1>
            </div>
          )}
          {!data.imageUrl && (
            <h1 className="mb-4 font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {data.title}
            </h1>
          )}
          {data.description && (
            <p className="text-[var(--foreground-muted)]">{data.description}</p>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">
            イベント（{data.events.length}件）
          </h2>
          {data.events.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)]">該当するイベントがありません</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.events.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-8">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← 特集一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
