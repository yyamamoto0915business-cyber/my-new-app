"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  HandHeart,
  Users,
  ShoppingBasket,
  Tag,
  Megaphone,
  ChevronDown,
  UtensilsCrossed,
  LayoutGrid,
} from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { StoreRecord } from "@/lib/stores/types";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import {
  buildMachiFeed,
  filterMachiFeed,
  MACHI_CATEGORIES,
  MACHI_KIND_TABS,
  MACHI_QUICK_FILTERS,
  type MachiFeedItem,
  type MachiKindTab,
} from "@/lib/machi/feed";
import { PREFECTURES } from "@/lib/prefectures";
import { MachiPcHero, MachiMobileHero } from "@/components/machi/MachiHero";
import { MachiFeedCard } from "@/components/machi/MachiFeedCard";
import { useSearchParamsNoSuspend } from "@/lib/use-search-params-no-suspend";
import { cn } from "@/lib/utils";

const QUICK_FILTER_KEYS = new Set(
  MACHI_QUICK_FILTERS.map((f) => f.key),
);
const CATEGORY_KEYS = new Set(MACHI_CATEGORIES.map((c) => c.key));
const KIND_TAB_KEYS = new Set(MACHI_KIND_TABS.map((t) => t.key));

const ACCENT = "#E66B27";

/** モック準拠の並び（初期表示） */
const FEATURED_PREFECTURES = [
  "東京都",
  "神奈川県",
  "埼玉県",
  "千葉県",
  "大阪府",
  "愛知県",
  "北海道",
  "宮城県",
  "福岡県",
  "広島県",
  "京都府",
  "兵庫県",
] as const;

const CATEGORY_ICONS = {
  restaurant: UtensilsCrossed,
  shop: ShoppingBasket,
  sale: Tag,
  news: Megaphone,
  volunteer: HandHeart,
  local: Users,
} as const;

const CATEGORY_COLORS = {
  restaurant: "#E66B27",
  shop: "#2f7d4e",
  sale: "#c45a1a",
  news: "#4a78b8",
  volunteer: "#2D7A4F",
  local: "#8868b8",
} as const;

function NewArrivalChip({ item }: { item: MachiFeedItem }) {
  return (
    <Link
      href={item.href}
      className="flex w-[220px] shrink-0 items-center gap-2.5 rounded-[12px] border border-[#ebe4dc] bg-white px-2.5 py-2 transition hover:border-[#e0c4a8]"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[#f3ebe3]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] font-medium text-[#9a7a58]">
            {item.kindLabel}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#9a7a58]">{item.metaLabel}</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
              item.kind === "volunteer"
                ? "bg-[#e8f4ec] text-[#2D7A4F]"
                : "bg-[#f5ebe0] text-[#b56a2e]",
            )}
          >
            {item.kindLabel}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-[#1A2214]">{item.title}</p>
      </div>
    </Link>
  );
}

function NewArrivalRow({ item }: { item: MachiFeedItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 rounded-[12px] border border-[#ebe4dc] bg-white px-3 py-2.5 transition active:bg-[#faf7f3]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f3ebe3]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-medium text-[#9a7a58]">{item.kindLabel}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-[#9a7a58]">{item.metaLabel}</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
              item.kind === "volunteer"
                ? "bg-[#e8f4ec] text-[#2D7A4F]"
                : "bg-[#f5ebe0] text-[#b56a2e]",
            )}
          >
            {item.kindLabel}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[13px] font-semibold text-[#1A2214]">{item.title}</p>
        <p className="truncate text-[11px] text-[#7a6a58]">{item.areaLabel}</p>
      </div>
    </Link>
  );
}

export function MachiHubClient() {
  const searchParams = useSearchParamsNoSuspend();
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerRoleWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [kindTab, setKindTab] = useState<MachiKindTab>("all");
  const [areaExpanded, setAreaExpanded] = useState(false);

  useEffect(() => {
    const kind = searchParams.get("kind");
    if (kind && KIND_TAB_KEYS.has(kind as MachiKindTab)) {
      setKindTab(kind as MachiKindTab);
    }

    const chip = searchParams.get("chip");
    if (chip && QUICK_FILTER_KEYS.has(chip as (typeof MACHI_QUICK_FILTERS)[number]["key"])) {
      setActiveChip(chip);
      setSelectedCategory("");
      if (!kind) {
        if (chip === "volunteer" || chip === "local" || chip === "all") setKindTab("all");
        else setKindTab("store");
      }
    }

    const category = searchParams.get("category");
    if (category && CATEGORY_KEYS.has(category as (typeof MACHI_CATEGORIES)[number]["key"])) {
      setSelectedCategory(category);
      setActiveChip("all");
    }

    const area = searchParams.get("area") ?? searchParams.get("prefecture");
    if (area) setSelectedArea(area);

    const q = searchParams.get("q") ?? searchParams.get("keyword");
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [storesRes, rolesRes] = await Promise.all([
          fetchWithTimeout("/api/stores?limit=50"),
          fetchWithTimeout("/api/volunteer/roles"),
        ]);
        const storesJson = storesRes.ok ? await storesRes.json() : [];
        const rolesJson = rolesRes.ok ? await rolesRes.json() : [];
        if (cancelled) return;
        setStores(Array.isArray(storesJson) ? storesJson : []);
        setVolunteers(Array.isArray(rolesJson) ? rolesJson : []);
      } catch {
        if (!cancelled) {
          setStores([]);
          setVolunteers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const feed = useMemo(
    () => buildMachiFeed(stores, volunteers),
    [stores, volunteers],
  );

  const filtered = useMemo(
    () =>
      filterMachiFeed(feed, {
        chip: activeChip,
        category: selectedCategory,
        area: selectedArea,
        query: searchQuery,
        kindTab,
      }),
    [feed, activeChip, selectedCategory, selectedArea, searchQuery, kindTab],
  );

  const recommended = filtered.slice(0, 8);
  const newArrivals = filtered.slice(0, 8);
  const mobileRecommended = filtered.slice(0, 6);

  const handleChipClick = useCallback((key: string) => {
    if (key === "all") {
      setActiveChip("all");
      setSelectedCategory("");
      setSearchQuery("");
      setKindTab("all");
    } else {
      setActiveChip(key);
      setSelectedCategory("");
      if (key === "volunteer" || key === "local") setKindTab("all");
      else setKindTab("store");
    }
  }, []);

  const handleSelectCategory = useCallback((key: string) => {
    setSelectedCategory((prev) => (prev === key ? "" : key));
    setActiveChip("all");
  }, []);

  const resetFilters = useCallback(() => {
    setActiveChip("all");
    setSelectedCategory("");
    setSelectedArea("");
    setSearchQuery("");
    setKindTab("all");
  }, []);

  const visiblePrefectures = areaExpanded
    ? [...PREFECTURES]
    : [...FEATURED_PREFECTURES];

  return (
    <div className="min-h-screen min-[900px]:bg-[#f5f5f4]">
      {/* ── PC（モック準拠） ── */}
      <main className="mx-auto hidden max-w-[1280px] space-y-4 bg-[#f5f5f4] px-8 py-4 pb-8 min-[900px]:block">
        <MachiPcHero
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          activeChip={activeChip}
          onChipClick={handleChipClick}
        />

        {/* 地域＋カテゴリ（1枠・左右配置） */}
        <section
          aria-label="地域とカテゴリから探す"
          className="rounded-[16px] border border-[#e5e0da] bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
        >
          <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-6 lg:gap-8">
            {/* 左：地域 */}
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <MapPin className="h-4 w-4" style={{ color: ACCENT }} aria-hidden />
                <h2 className="text-[14px] font-semibold text-[#0e1610]">地域で探す</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedArea("")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                    !selectedArea
                      ? "border-transparent text-white"
                      : "border-[#e5ddd2] bg-white text-[#4a4a4a] hover:border-[#d4b898]",
                  )}
                  style={!selectedArea ? { background: ACCENT } : undefined}
                >
                  すべての地域
                </button>
                {visiblePrefectures.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedArea(p === selectedArea ? "" : p)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                      selectedArea === p
                        ? "border-transparent text-white"
                        : "border-[#e5ddd2] bg-white text-[#4a4a4a] hover:border-[#d4b898]",
                    )}
                    style={selectedArea === p ? { background: ACCENT } : undefined}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAreaExpanded((v) => !v)}
                  className="inline-flex items-center gap-0.5 rounded-full border border-[#e5ddd2] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6a6a6a] transition hover:border-[#d4b898]"
                >
                  {areaExpanded ? "閉じる" : "もっと見る"}
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition", areaExpanded && "rotate-180")}
                    aria-hidden
                  />
                </button>
              </div>
            </div>

            {/* 右：カテゴリ */}
            <div>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" style={{ color: ACCENT }} aria-hidden />
                  <h2 className="text-[14px] font-semibold text-[#0e1610]">カテゴリから探す</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("");
                    setActiveChip("all");
                    setKindTab("all");
                  }}
                  className="shrink-0 text-[12px] font-medium hover:underline"
                  style={{ color: ACCENT }}
                >
                  すべて見る &gt;
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {MACHI_CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.key];
                  const color = CATEGORY_COLORS[cat.key];
                  const active = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => handleSelectCategory(cat.key)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-[12px] border px-1.5 py-2.5 text-center transition",
                        active
                          ? "border-[#e0b890] bg-[#fbf4ec]"
                          : "border-[#ebe4dc] bg-white hover:border-[#d4b898]",
                      )}
                    >
                      <Icon className="h-6 w-6" style={{ color }} aria-hidden />
                      <span className="text-[10px] font-semibold leading-snug text-[#1A2214]">
                        {cat.label.includes("・") ? (
                          <>
                            {cat.label.split("・")[0]}
                            <br />
                            {cat.label.split("・")[1]}
                          </>
                        ) : (
                          cat.label
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="まち情報一覧"
          className="rounded-[16px] border border-[#ebe4dc] bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {MACHI_KIND_TABS.map((tab) => {
                const active = kindTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setKindTab(tab.key)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition",
                      active
                        ? "border-transparent text-white"
                        : "border-[#e5ddd2] bg-[#faf8f5] text-[#5a4a38] hover:border-[#d4b898]",
                    )}
                    style={active ? { background: ACCENT } : undefined}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#9a8a78]">おすすめ順</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-[14px] border border-[#ebe4dc] bg-white"
                >
                  <div className="aspect-[16/10] animate-pulse bg-[#f3ebe3]" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-1/2 animate-pulse rounded bg-[#f3ebe3]" />
                    <div className="h-8 w-full animate-pulse rounded bg-[#f3ebe3]" />
                  </div>
                </div>
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#e5ddd2] p-10 text-center text-[13px] text-[#7a6a58]">
              条件に合うまち情報はまだありません
            </div>
          ) : (
            <div className="grid grid-cols-4 items-stretch gap-3">
              {recommended.slice(0, 4).map((item) => (
                <MachiFeedCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section
          aria-label="新着情報"
          className="rounded-[16px] border border-[#ebe4dc] bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-[#1A2214]">新着情報</h2>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[12px] font-medium hover:underline"
              style={{ color: ACCENT }}
            >
              すべて見る &gt;
            </button>
          </div>
          {loading ? (
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 w-[220px] shrink-0 animate-pulse rounded-[12px] bg-[#f3ebe3]"
                />
              ))}
            </div>
          ) : newArrivals.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[#7a6a58]">新着はまだありません</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {newArrivals.map((item) => (
                <NewArrivalChip key={`new-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── モバイル（イベント元UI準拠） ── */}
      <main className="w-full space-y-2 bg-[#f7f4f0] px-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-1 min-[900px]:hidden">
        <MachiMobileHero
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          activeChip={activeChip}
          onChipClick={handleChipClick}
        />

        <section aria-label="おすすめ" className="mg-mobile-section">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h2 className="mg-mobile-section-title">おすすめ</h2>
            {!loading && filtered.length > 0 ? (
              <span className="text-[10px] text-[#9a8a78]">{filtered.length}件</span>
            ) : null}
          </div>
          {loading ? (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 scrollbar-hide">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[200px] w-[148px] shrink-0 animate-pulse rounded-[16px] bg-[#f3ebe3]"
                />
              ))}
            </div>
          ) : mobileRecommended.length === 0 ? (
            <p className="rounded-[16px] border border-[#ebe4dc] bg-white p-6 text-center text-[12px] text-[#7a6a58]">
              条件に合うまち情報はまだありません
            </p>
          ) : (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 scrollbar-hide snap-x snap-mandatory">
              {mobileRecommended.map((item) => (
                <MachiFeedCard key={item.id} item={item} compact />
              ))}
            </div>
          )}
        </section>

        <section aria-label="カテゴリと地域で探す" className="mg-mobile-section space-y-2.5">
          <div>
            <h2 className="mg-mobile-section-title mb-1.5">カテゴリから探す</h2>
            <div className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-0.5 scrollbar-hide">
              {MACHI_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.key];
                const color = CATEGORY_COLORS[cat.key];
                const active = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleSelectCategory(cat.key)}
                    className={cn(
                      "flex h-[86px] w-[76px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[18px] border p-2 transition",
                      active
                        ? "border-[#e0b890] bg-[#fbf4ec]"
                        : "border-[#dde9e1] bg-white active:bg-[#fafcf9]",
                    )}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ background: "#f7f1ea", color }}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="line-clamp-2 text-center text-[9px] font-semibold leading-tight text-[#1A2214]">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#eef2ef] pt-2">
            <div className="mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" style={{ color: ACCENT }} aria-hidden />
              <h2 className="mg-mobile-section-title">地域で探す</h2>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              <button
                type="button"
                onClick={() => setSelectedArea("")}
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                  !selectedArea
                    ? "border-transparent text-white"
                    : "border-[#e5ddd2] bg-white text-[#5a4a38]",
                )}
                style={!selectedArea ? { background: "#1e2818" } : undefined}
              >
                すべて
              </button>
              {FEATURED_PREFECTURES.slice(0, 8).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedArea(p === selectedArea ? "" : p)}
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    selectedArea === p
                      ? "border-transparent text-white"
                      : "border-[#e5ddd2] bg-white text-[#5a4a38]",
                  )}
                  style={selectedArea === p ? { background: ACCENT } : undefined}
                >
                  {p.replace(/(都|道|府|県)$/, "")}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="新着情報" className="mg-mobile-section">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h2 className="mg-mobile-section-title">新着情報</h2>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-medium"
              style={{ color: ACCENT }}
            >
              すべて見る →
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-[12px] bg-[#f3ebe3]" />
              ))}
            </div>
          ) : newArrivals.length === 0 ? (
            <p className="rounded-[16px] border border-[#ebe4dc] bg-white p-6 text-center text-[12px] text-[#7a6a58]">
              新着はまだありません
            </p>
          ) : (
            <div className="space-y-2">
              {newArrivals.slice(0, 5).map((item) => (
                <NewArrivalRow key={`m-new-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
