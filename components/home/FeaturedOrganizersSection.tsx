"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { OrganizerCard } from "./OrganizerCard";
import { SectionHeader } from "./SectionHeader";
import type { FeaturedOrganizer } from "@/lib/db/organizers";

export function FeaturedOrganizersSection() {
  const [organizers, setOrganizers] = useState<FeaturedOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const mobileDisplay = organizers.slice(0, 3);

  const load = useCallback(() => {
    setLoading(true);
    fetchWithTimeout("/api/organizers/featured", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setOrganizers(Array.isArray(data) ? data : []))
      .catch(() => setOrganizers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <section className="space-y-4" aria-label="注目の主催者">
        <SectionHeader
        title="注目の主催者"
        subtitle="地域で活動する主催者を見つけられます"
      />
        <div className="grid gap-4 sm:hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[140px] animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-700/50"
            />
          ))}
        </div>
        <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[140px] animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-700/50"
            />
          ))}
        </div>
      </section>
    );
  }

  if (organizers.length === 0) {
    return (
      <section className="space-y-4" aria-label="注目の主催者">
        <SectionHeader
        title="注目の主催者"
        subtitle="地域で活動する主催者を見つけられます"
      />
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            現在公開中の主催者情報を準備中です
          </p>
          <p className="mt-1 text-xs text-slate-400">
            地域で活動する主催者がここに表示されます
          </p>
          <Link
            href="/organizers"
            className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            主催者一覧を見る →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="注目の主催者">
      <SectionHeader
        title="注目の主催者"
        subtitle="地域で活動する主催者を見つけられます"
        href="/organizers"
        linkLabel="もっと見る"
      />
      <div className="sm:hidden grid gap-4">
        {mobileDisplay.map((org) => (
          <OrganizerCard key={org.id} organizer={org} />
        ))}
      </div>
      <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {organizers.map((org) => (
          <OrganizerCard key={org.id} organizer={org} />
        ))}
      </div>
    </section>
  );
}
