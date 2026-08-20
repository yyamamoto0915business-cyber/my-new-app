"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { StoreRecord } from "@/lib/stores/types";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import {
  buildMachiFeed,
  filterMachiFeed,
  type MachiKindTab,
} from "@/lib/machi/feed";
import { MachiFeedCard } from "@/components/machi/MachiFeedCard";

type Props = {
  kind: "store" | "volunteer" | "kitchen";
  searchQuery: string;
};

export function TownInfoKindFeed({ kind, searchQuery }: Props) {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerRoleWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const tasks: Promise<void>[] = [];

    // お店・キッチンカーは stores、ボランティアは roles を利用
    if (kind === "store" || kind === "kitchen") {
      tasks.push(
        fetchWithTimeout("/api/stores?limit=50")
          .then((r) => r.json())
          .then((data) => {
            if (!cancelled) {
              setStores(Array.isArray(data) ? data : []);
            }
          })
          .catch(() => {
            if (!cancelled) setStores([]);
          }),
      );
    }
    if (kind === "volunteer") {
      tasks.push(
        fetchWithTimeout("/api/volunteer/roles")
          .then((r) => r.json())
          .then((data) => {
            if (!cancelled) {
              setVolunteers(Array.isArray(data) ? data : []);
            }
          })
          .catch(() => {
            if (!cancelled) setVolunteers([]);
          }),
      );
    }

    Promise.all(tasks).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [kind]);

  const kindTab: MachiKindTab =
    kind === "store" ? "store" : kind === "volunteer" ? "volunteer" : "all";

  const items = useMemo(() => {
    const feed = buildMachiFeed(stores, volunteers);
    if (kind === "kitchen") {
      const q = searchQuery.trim().toLowerCase();
      return feed.filter((item) => {
        if (item.kind !== "kitchen_car") return false;
        if (!q) return true;
        const hay = `${item.title} ${item.areaLabel} ${item.tags.join(" ")}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return filterMachiFeed(feed, {
      chip: "all",
      category: "",
      area: "",
      query: searchQuery,
      kindTab,
    });
  }, [kind, stores, volunteers, searchQuery, kindTab]);

  const title =
    kind === "store"
      ? "お店"
      : kind === "volunteer"
        ? "ボランティア募集"
        : "キッチンカー";

  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="text-[15px] font-semibold text-[#1e2818]">{title}</h2>
        <span className="text-[12px] text-[#8a9088]">
          {loading ? "読み込み中…" : `${items.length}件`}
        </span>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-[14px] bg-[#e8eee8]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-[#ddd6cc] bg-white px-4 py-10 text-center text-[13px] text-[#8a9088]">
          条件に合う{title}はまだありません
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 min-[900px]:gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <MachiFeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
