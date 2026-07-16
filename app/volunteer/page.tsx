"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { isAbortLikeError } from "@/lib/is-abort-like-error";
import {
  type VolunteerRoleWithEvent,
  type BenefitFilter,
  type VolunteerSort,
  getCategoryLabel,
  getDisplayBenefits,
  sortEmergencyRoles,
  sortVolunteerRoles,
  filterByBenefit,
} from "@/lib/volunteer-utils";
import { useSearchParamsNoSuspend } from "@/lib/use-search-params-no-suspend";
import { matchesVolunteerDiscoverCategory } from "@/lib/volunteer-discover-categories";
import { PcVolunteerHero } from "@/components/volunteer/pc/PcVolunteerHero";
import type { ConditionKey } from "@/components/volunteer/pc/PcVolunteerConditionTags";
import { PcVolunteerCategorySidebar } from "@/components/volunteer/pc/PcVolunteerCategorySidebar";
import {
  PcVolunteerRecommendedRow,
  type PcVolunteerCardItem,
} from "@/components/volunteer/pc/PcVolunteerRecommendedRow";
import { PcVolunteerCard } from "@/components/volunteer/pc/PcVolunteerCard";
import { PcVolunteerCtaBanners } from "@/components/volunteer/pc/PcVolunteerCtaBanners";
import { MobileVolunteerHero } from "@/components/volunteer/mobile/MobileVolunteerHero";
import { MobileVolunteerPopularTags } from "@/components/volunteer/mobile/MobileVolunteerPopularTags";
import { MobileVolunteerRecommendedCarousel } from "@/components/volunteer/mobile/MobileVolunteerRecommendedCarousel";
import { MobileVolunteerCtaBanners } from "@/components/volunteer/mobile/MobileVolunteerCtaBanners";
import {
  MobileVolunteerFilterSheet,
  type MobileVolunteerFilterKind,
} from "@/components/volunteer/mobile/MobileVolunteerFilterSheet";
import type { MobileVolunteerCardItem } from "@/components/volunteer/mobile/MobileVolunteerCard";

function parseDateStart(dateTime: string): Date | null {
  const match = dateTime.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const d = new Date(`${match[1]}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getWeekRange(now: Date): { start: Date; end: Date } {
  const d = new Date(now);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function matchesDateFilter(dateTime: string, filter: string): boolean {
  if (!filter) return true;
  const d = parseDateStart(dateTime);
  if (!d) return true;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === "today") {
    return d.getTime() === today.getTime();
  }
  if (filter === "week") {
    const { start, end } = getWeekRange(now);
    return d >= start && d <= end;
  }
  if (filter === "month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  return true;
}

function matchesKeyword(role: VolunteerRoleWithEvent, keyword: string): boolean {
  if (!keyword.trim()) return true;
  const q = keyword.trim().toLowerCase();
  const haystack = [
    role.title,
    role.description,
    role.location,
    getCategoryLabel(role.roleType),
    role.event?.title ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesConditionTags(role: VolunteerRoleWithEvent, active: Set<ConditionKey>): boolean {
  if (active.size === 0) return true;
  if (active.has("beginner") && !role.beginnerFriendly) return false;
  if (active.has("shortTime") && !role.oneDayOk) return false;
  if (active.has("student")) {
    const text = `${role.title} ${role.description}`.toLowerCase();
    if (!/学生|student/.test(text)) return false;
  }
  if (active.has("family")) {
    const text = `${role.title} ${role.description}`.toLowerCase();
    if (!/親子|家族|子ども|kids|family/.test(text)) return false;
  }
  if (active.has("senior")) {
    const text = `${role.title} ${role.description}`.toLowerCase();
    if (!/シニア|高齢|senior/.test(text)) return false;
  }
  return true;
}

function matchesPrefecture(role: VolunteerRoleWithEvent, prefecture: string): boolean {
  if (!prefecture) return true;
  if (role.event?.prefecture === prefecture) return true;
  return role.location.includes(prefecture);
}

function matchesRoleType(role: VolunteerRoleWithEvent, roleType: string): boolean {
  return matchesVolunteerDiscoverCategory(role, roleType);
}

function formatVolunteerDateLabel(dateTime: string): string {
  const d = parseDateStart(dateTime);
  if (!d) return dateTime;
  const base = d.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  if (!dateTime.includes("T")) return base;
  const time = dateTime.split("T")[1]?.slice(0, 5) ?? "";
  return time ? `${base} ${time}` : base;
}

function toCardItem(r: VolunteerRoleWithEvent): PcVolunteerCardItem {
  const dateLabel = formatVolunteerDateLabel(r.dateTime);
  const areaLabel = r.event?.prefecture ?? r.location;
  const trustTags = [
    r.beginnerFriendly ? "初心者OK" : null,
    r.oneDayOk ? "短時間OK" : null,
  ].filter(Boolean) as string[];
  const { chips } = getDisplayBenefits(r);
  const benefitTags = chips.slice(0, 2 - trustTags.length).map((c) => c.label);
  const tags = [...trustTags, ...benefitTags].slice(0, 2);

  return {
    id: r.id,
    title: r.title,
    imageUrl: r.thumbnailUrl,
    dateLabel,
    areaLabel,
    tags,
    href: `/volunteer/${r.id}`,
  };
}

function toMobileCardItem(r: VolunteerRoleWithEvent): MobileVolunteerCardItem {
  const dateLabel = formatVolunteerDateLabel(r.dateTime);
  const areaLabel = r.event?.prefecture ?? r.location;
  const categoryLabel = getCategoryLabel(r.roleType);
  const conditionTag = r.beginnerFriendly
    ? "初めてOK"
    : r.oneDayOk
    ? "短時間OK"
    : null;
  const tags = [categoryLabel, conditionTag].filter(Boolean).slice(0, 2) as string[];

  return {
    id: r.id,
    title: r.title,
    imageUrl: r.thumbnailUrl,
    dateLabel,
    areaLabel,
    tags,
    href: `/volunteer/${r.id}`,
  };
}

function VolunteerPageContent() {
  const searchParams = useSearchParamsNoSuspend();
  const router = useRouter();
  const [roleType, setRoleType] = useState("");
  const [prefecture, setPrefecture] = useState("");

  const [roles, setRoles] = useState<VolunteerRoleWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [benefitFilter, setBenefitFilter] = useState<BenefitFilter | "">("");
  const [sort] = useState<VolunteerSort>("recommended");

  const [keyword, setKeyword] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [conditionTags, setConditionTags] = useState<Set<ConditionKey>>(new Set());
  const [draftKeyword, setDraftKeyword] = useState("");
  const [draftPrefecture, setDraftPrefecture] = useState(prefecture);
  const [draftRoleType, setDraftRoleType] = useState(roleType);
  const [draftDateFilter, setDraftDateFilter] = useState("");
  const [draftBenefitFilter, setDraftBenefitFilter] = useState<BenefitFilter | "">("");

  const [mobileKeyword, setMobileKeyword] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState<MobileVolunteerFilterKind | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setRoleType(searchParams.get("roleType") ?? "");
    setPrefecture(searchParams.get("prefecture") ?? "");
  }, [searchParams]);

  useEffect(() => {
    setDraftPrefecture(prefecture);
    setDraftRoleType(roleType);
  }, [prefecture, roleType]);

  const pushQuery = useCallback(
    (updates: { roleType?: string; prefecture?: string }) => {
      const nextRoleType =
        updates.roleType !== undefined ? updates.roleType : roleType;
      const nextPrefecture =
        updates.prefecture !== undefined ? updates.prefecture : prefecture;

      setRoleType(nextRoleType);
      setPrefecture(nextPrefecture);

      const p = new URLSearchParams();
      if (nextPrefecture) p.set("prefecture", nextPrefecture);
      if (nextRoleType) p.set("roleType", nextRoleType);
      const qs = p.toString();
      router.push(`/volunteer${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, roleType, prefecture]
  );

  const load = useCallback(async () => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout("/api/volunteer/roles", {
        signal: controller.signal,
        next: { revalidate: 120 },
      });
      if (controller.signal.aborted || res.status === 499) return;
      if (!res.ok) {
        console.error(`[volunteer] API error: ${res.status} ${res.statusText}`);
        setRoles([]);
        setError("読み込みに失敗しました");
        return;
      }
      const data = await res.json();
      if (controller.signal.aborted) return;
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      if (controller.signal.aborted || isAbortLikeError(err)) return;
      console.error("[volunteer] fetch error:", err);
      setRoles([]);
      setError("読み込みに失敗しました");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => loadAbortRef.current?.abort();
  }, [load]);

  const emergencyRoles = useMemo(() => {
    const emergency = roles.filter((r) => r.emergency?.isEmergency === true);
    if (benefitFilter && benefitFilter !== "EMERGENCY") {
      return filterByBenefit(emergency, benefitFilter);
    }
    return sortEmergencyRoles(emergency);
  }, [roles, benefitFilter]);

  const normalRoles = useMemo(() => {
    const normal = roles.filter((r) => r.emergency?.isEmergency !== true);
    if (benefitFilter === "EMERGENCY") return [];
    if (benefitFilter) {
      return filterByBenefit(normal, benefitFilter);
    }
    return sortVolunteerRoles(normal, sort);
  }, [roles, benefitFilter, sort]);

  const items = useMemo(() => {
    if (benefitFilter === "EMERGENCY") return emergencyRoles;
    return [...emergencyRoles, ...normalRoles];
  }, [benefitFilter, emergencyRoles, normalRoles]);

  const pcItems = useMemo(() => {
    return items.filter(
      (r) =>
        matchesPrefecture(r, prefecture) &&
        matchesRoleType(r, roleType) &&
        matchesKeyword(r, keyword) &&
        matchesDateFilter(r.dateTime, dateFilter) &&
        matchesConditionTags(r, conditionTags)
    );
  }, [items, prefecture, roleType, keyword, dateFilter, conditionTags]);

  const pcCardItems = useMemo(() => pcItems.map(toCardItem), [pcItems]);
  const mobileCardItems = useMemo(() => pcItems.map(toMobileCardItem), [pcItems]);
  const isPcEmpty = pcItems.length === 0;

  const handlePcSearch = () => {
    setKeyword(draftKeyword);
    setDateFilter(draftDateFilter);
    setBenefitFilter(draftBenefitFilter);
    pushQuery({ roleType: draftRoleType, prefecture: draftPrefecture });
  };

  const toggleConditionTag = (key: ConditionKey) => {
    setConditionTags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleMobileSearch = () => {
    setKeyword(mobileKeyword);
    setDraftKeyword(mobileKeyword);
  };

  const handleMobileKeywordChange = (value: string) => {
    setMobileKeyword(value);
    setKeyword(value);
    setDraftKeyword(value);
  };

  const hasMobileActiveFilters =
    Boolean(prefecture) ||
    Boolean(roleType) ||
    Boolean(dateFilter) ||
    Boolean(benefitFilter) ||
    Boolean(keyword) ||
    conditionTags.size > 0;

  const resetAllFilters = () => {
    setKeyword("");
    setDraftKeyword("");
    setMobileKeyword("");
    setDateFilter("");
    setDraftDateFilter("");
    setBenefitFilter("");
    setDraftBenefitFilter("");
    setConditionTags(new Set());
    pushQuery({ roleType: "", prefecture: "" });
  };

  const handleMobilePrefecture = (value: string) => {
    setDraftPrefecture(value);
    pushQuery({ prefecture: value, roleType });
  };

  const handleMobileRoleType = (value: string) => {
    setDraftRoleType(value);
    pushQuery({ roleType: value, prefecture });
  };

  const handleMobileDateFilter = (value: string) => {
    setDateFilter(value);
    setDraftDateFilter(value);
  };

  const handleMobileBenefitFilter = (value: BenefitFilter | "") => {
    setBenefitFilter(value);
    setDraftBenefitFilter(value);
  };

  return (
    <>
      {/* ─── PC (900px+) ─── */}
      <div className="hidden min-[900px]:block bg-[#f3f4f1] px-6 py-4">
        <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[16px] border border-[#DDE8DF]/80 shadow-sm">
          <PcVolunteerHero
            keyword={draftKeyword}
            prefecture={draftPrefecture}
            roleType={draftRoleType}
            dateFilter={draftDateFilter}
            benefitFilter={draftBenefitFilter}
            conditionTags={conditionTags}
            onKeywordChange={setDraftKeyword}
            onPrefectureChange={setDraftPrefecture}
            onRoleTypeChange={setDraftRoleType}
            onDateFilterChange={setDraftDateFilter}
            onBenefitFilterChange={setDraftBenefitFilter}
            onToggleConditionTag={toggleConditionTag}
            onSearch={handlePcSearch}
          />

          <div className="mg-volunteer-pc-dots flex items-start gap-0">
            <PcVolunteerCategorySidebar
              activeRoleType={roleType}
              onSelect={(v) => pushQuery({ roleType: v })}
            />

            <div className="min-w-0 flex-1 px-4 pb-5 pt-4">
            <PcVolunteerRecommendedRow
              items={pcCardItems}
              loading={loading}
              totalCount={pcItems.length}
            />

            {!loading && pcItems.length > 4 && (
              <section id="volunteer-results" aria-label="すべての募集" className="mt-6 space-y-2">
                <h2 className="text-[14px] font-semibold text-[#1A2214]">すべての募集</h2>
                <div className="grid grid-cols-4 items-stretch gap-3">
                  {pcCardItems.slice(4).map((item) => (
                    <PcVolunteerCard key={item.id} {...item} />
                  ))}
                </div>
              </section>
            )}

            {!loading && isPcEmpty && !error && (
              <div className="mt-4 rounded-[12px] border border-[#DDE8DF] bg-white p-8 text-center">
                <p className="text-[13px] text-[#566358]">条件に合う募集がありません</p>
                <button
                  type="button"
                  onClick={() => {
                    setKeyword("");
                    setDraftKeyword("");
                    setMobileKeyword("");
                    setDateFilter("");
                    setDraftDateFilter("");
                    setBenefitFilter("");
                    setDraftBenefitFilter("");
                    setConditionTags(new Set());
                    pushQuery({ roleType: "", prefecture: "" });
                  }}
                  className="mt-3 text-[12px] font-medium text-[#2D7A4F] hover:underline"
                >
                  条件をリセット
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-[12px] border border-[#DDE8DF] bg-white p-6">
                <p className="text-[13px] text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-2 text-[12px] text-[#2D7A4F] underline"
                >
                  再読み込み
                </button>
              </div>
            )}

            <PcVolunteerCtaBanners />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile (below 900px) ─── */}
      <div className="mg-volunteer-mobile-page min-[900px]:hidden min-h-screen w-full space-y-1.5 bg-[#f7fbf8] px-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-0.5">
        <MobileVolunteerHero
          keyword={mobileKeyword}
          prefecture={prefecture}
          roleType={roleType}
          dateFilter={dateFilter}
          benefitFilter={benefitFilter}
          onKeywordChange={handleMobileKeywordChange}
          onSearch={handleMobileSearch}
          onOpenFilter={setMobileFilterOpen}
          hasActiveFilters={hasMobileActiveFilters}
          onSettingsClick={() => {
            if (hasMobileActiveFilters) resetAllFilters();
            else setMobileFilterOpen("benefit");
          }}
        />

        <MobileVolunteerPopularTags active={conditionTags} onToggle={toggleConditionTag} />

        <MobileVolunteerRecommendedCarousel
          items={mobileCardItems}
          loading={loading}
          totalCount={pcItems.length}
          onResetFilters={resetAllFilters}
        />

        <MobileVolunteerCtaBanners />

        <MobileVolunteerFilterSheet
          kind={mobileFilterOpen}
          prefecture={prefecture}
          roleType={roleType}
          dateFilter={dateFilter}
          benefitFilter={benefitFilter}
          onClose={() => setMobileFilterOpen(null)}
          onSelectPrefecture={handleMobilePrefecture}
          onSelectRoleType={handleMobileRoleType}
          onSelectDateFilter={handleMobileDateFilter}
          onSelectBenefitFilter={handleMobileBenefitFilter}
        />

        {error && (
          <div className="rounded-[18px] border border-[#dde9e1] bg-white p-4">
            <p className="text-[13px] text-red-600">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-2 text-[12px] text-[#2D7A4F] underline"
            >
              再読み込み
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function VolunteerPage() {
  return <VolunteerPageContent />;
}
