"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProfileLink } from "@/components/profile-link";
import { Breadcrumb } from "@/components/breadcrumb";

type FeaturedCollection = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  eventIds: string[];
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<FeaturedCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collections")
      .then((res) => res.json())
      .then((data) => setCollections(Array.isArray(data) ? data : []))
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumb
              items={[
                { label: "トップ", href: "/" },
                { label: "特集一覧" },
              ]}
            />
            <ProfileLink />
          </div>
          <h1 className="mt-2 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            特集
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--background)]"
              />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-10 text-center dark:bg-[var(--background)]">
            <p className="text-sm text-[var(--foreground-muted)]">特集はありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="group overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-all hover:border-[var(--accent)] hover:shadow-md dark:bg-[var(--background)]"
              >
                <div className="relative h-40 w-full">
                  {c.imageUrl ? (
                    <Image
                      src={c.imageUrl}
                      alt=""
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-100 dark:bg-zinc-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <h2 className="absolute bottom-4 left-4 right-4 font-serif text-lg font-semibold text-white">
                    {c.title}
                  </h2>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm text-[var(--foreground-muted)]">
                    {c.description ?? `${c.eventIds.length}件のイベント`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            イベント一覧を見る
            <span aria-hidden>→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
