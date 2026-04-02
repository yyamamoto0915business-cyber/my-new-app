"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { VOLUNTEER_ROLE_LABELS } from "@/lib/volunteer-roles-mock";
import {
  type VolunteerRoleWithEvent,
  type BenefitFilter,
  type VolunteerSort,
  resolveBenefits,
  getCategoryLabel,
  getDisplayBenefits,
  sortEmergencyRoles,
  sortVolunteerRoles,
  filterByBenefit,
} from "@/lib/volunteer-utils";
import { VolunteerHero } from "@/components/VolunteerHero";
import { VolunteerTrustSection } from "@/components/VolunteerTrustSection";
import { VolunteerFilters } from "@/components/VolunteerFilters";
import { VolunteerCard } from "@/components/VolunteerCard";
import { VolunteerCardSkeleton } from "@/components/VolunteerCardSkeleton";
import { VolunteerEmptyState } from "@/components/VolunteerEmptyState";
import { useSearchParamsNoSuspend } from "@/lib/use-search-params-no-suspend";
import { PREFECTURES } from "@/lib/prefectures";

const QUICK_FILTERS: { value: BenefitFilter; label: string; icon: string }[] = [
  { value: "EMERGENCY", label: "緊急のみ", icon: "⚡" },
  { value: "TRANSPORT", label: "交通費", icon: "🚃" },
  { value: "LODGING", label: "宿泊", icon: "🏨" },
  { value: "MEAL", label: "食事", icon: "🍱" },
  { value: "REWARD", label: "謝礼", icon: "🎁" },
  { value: "INSURANCE", label: "保険", icon: "🛡️" },
  { value: "SHUTTLE", label: "送迎", icon: "🚌" },
];

const SORT_OPTIONS: { value: VolunteerSort; label: string }[] = [
  { value: "recommended", label: "おすすめ" },
  { value: "newest", label: "新着" },
  { value: "soonest", label: "日程が近い" },
];

function parseDateStart(dateTime: string): Date | null {
  const match = dateTime.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const d = new Date(`${match[1]}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getWeekRange(now: Date): { start: Date; end: Date } {
  // 月曜開始の今週（日本の感覚に寄せる）
  const d = new Date(now);
  const day = d.getDay(); // 0:日曜, 1:月曜...
  const diffToMonday = (day + 6) % 7; // 月曜までの差分
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function VolunteerPageContent() {
  const searchParams = useSearchParamsNoSuspend();
  const router = useRouter();
  const roleType = searchParams.get("roleType") ?? "";
  const prefecture = searchParams.get("prefecture") ?? "";

  const [roles, setRoles] = useState<VolunteerRoleWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [benefitFilter, setBenefitFilter] = useState<BenefitFilter | "">("");
  const [sort, setSort] = useState<VolunteerSort>("recommended");

  const pushQuery = useCallback(
    (updates: { roleType?: string; prefecture?: string }) => {
      const p = new URLSearchParams(searchParams.toString());
      if (updates.roleType !== undefined) {
        if (updates.roleType) p.set("roleType", updates.roleType);
        else p.delete("roleType");
      }
      if (updates.prefecture !== undefined) {
        if (updates.prefecture) p.set("prefecture", updates.prefecture);
        else p.delete("prefecture");
      }
      const qs = p.toString();
      router.push(`/volunteer${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (roleType) params.set("roleType", roleType);
    try {
      const res = await fetchWithTimeout(`/api/volunteer/roles?${params}`);
      if (!res.ok) {
        console.error(`[volunteer] API error: ${res.status} ${res.statusText}`);
        setRoles([]);
        setError("読み込みに失敗しました");
        return;
      }
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[volunteer] fetch error:", err);
      setRoles([]);
      setError("読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [prefecture, roleType]);

  useEffect(() => {
    load();
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
  const isEmpty = items.length === 0;

  const now = useMemo(() => new Date(), []);
  const weekRange = useMemo(() => getWeekRange(now), [now]);

  const summary = useMemo(() => {
    const total = roles.length;
    const thisWeek = roles.filter((r) => {
      const d = parseDateStart(r.dateTime);
      if (!d) return false;
      return d >= weekRange.start && d <= weekRange.end;
    }).length;

    const transport = roles.filter((r) => resolveBenefits(r).includes("TRANSPORT")).length;
    const beginner = roles.filter((r) => r.beginnerFriendly === true).length;

    return { total, thisWeek, transport, beginner };
  }, [roles, weekRange]);

  const recommendedRoleTypes = useMemo(() => {
    const counts = new Map<string, number>();
    roles.forEach((r) => {
      counts.set(r.roleType, (counts.get(r.roleType) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([roleType]) => roleType);
  }, [roles]);

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <header className="sticky top-[calc(var(--mg-mobile-top-header-h)+env(safe-area-inset-top,0px))] z-30 border-b bg-white/95 shadow-sm backdrop-blur-md sm:top-0 sm:z-50 dark:bg-zinc-900/95 [border-color:var(--mg-line)]">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb
            items={[{ label: "トップ", href: "/" }, { label: "ボランティア募集" }]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:pb-6">
        <VolunteerHero
          totalCount={summary.total}
          thisWeekCount={summary.thisWeek}
          beginnerFriendlyCount={summary.beginner}
          travelSupportCount={summary.transport}
          isLoading={loading}
        />

        <VolunteerTrustSection
          beginnerFriendlyCount={summary.beginner}
          isLoading={loading}
        />

        <VolunteerFilters
          category={roleType}
          prefecture={prefecture}
          quickFilters={{
            urgentOnly: benefitFilter === "EMERGENCY",
            travelFee: benefitFilter === "TRANSPORT",
            lodging: benefitFilter === "LODGING",
            meal: benefitFilter === "MEAL",
            reward: benefitFilter === "REWARD",
            insurance: benefitFilter === "INSURANCE",
            pickup: benefitFilter === "SHUTTLE",
          }}
          sort={sort}
          onChangeCategory={(v) => pushQuery({ roleType: v })}
          onChangePrefecture={(v) => pushQuery({ prefecture: v })}
          onToggleQuickFilter={(key) => {
            const map: Record<string, BenefitFilter> = {
              urgentOnly: "EMERGENCY",
              travelFee: "TRANSPORT",
              lodging: "LODGING",
              meal: "MEAL",
              reward: "REWARD",
              insurance: "INSURANCE",
              pickup: "SHUTTLE",
            };
            const next = map[key];
            setBenefitFilter((prev) => (prev === next ? "" : next));
          }}
          onChangeSort={(v) => setSort(v)}
          onReset={() => {
            setBenefitFilter("");
            setSort("recommended");
            pushQuery({ roleType: "", prefecture: "" });
          }}
        />

        {loading ? (
          <VolunteerCardSkeleton count={6} />
        ) : error ? (
          <div>
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-2 text-sm text-[var(--accent)] underline"
            >
              再読み込み
            </button>
          </div>
        ) : isEmpty ? (
          <VolunteerEmptyState
            onReset={() => {
              setBenefitFilter("");
              setSort("recommended");
              pushQuery({ roleType: "", prefecture: "" });
            }}
            onViewNewest={() => {
              setBenefitFilter("");
              setSort("newest");
            }}
            onViewRecommended={() => {
              const rt = recommendedRoleTypes[0];
              if (!rt) return;
              setBenefitFilter("");
              setSort("recommended");
              pushQuery({ roleType: rt, prefecture });
            }}
          />
        ) : (
          <section>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((r) => {
                const { chips, overflowCount } = getDisplayBenefits(r);
                const badges = [
                  ...chips.map((c) => c.label),
                  ...(overflowCount > 0 ? [`+${overflowCount}`] : []),
                ];
                const trustBadges = [
                  r.beginnerFriendly ? "初心者歓迎" : null,
                  r.oneDayOk ? "1日だけOK" : null,
                  r.organizerVerified ? "主催者確認済み" : null,
                  r.contactAvailable ? "問い合わせ可" : null,
                ].filter(Boolean) as string[];

                const d = parseDateStart(r.dateTime);
                const dateLabel = d
                  ? d.toLocaleDateString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      weekday: "short",
                    })
                  : r.dateTime;

                const areaLabel = r.event?.prefecture ?? r.location;

                return (
                  <VolunteerCard
                    key={r.id}
                    id={r.id}
                    title={r.title}
                    imageUrl={r.thumbnailUrl}
                    dateLabel={dateLabel}
                    areaLabel={areaLabel}
                    roleLabel={`${getCategoryLabel(r.roleType)}・定員${r.capacity}名`}
                    shortDescription={r.description}
                    badges={badges}
                    trustBadges={trustBadges}
                    href={`/volunteer/${r.id}`}
                  />
                );
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

export default function VolunteerPage() {
  return <VolunteerPageContent />;
}
