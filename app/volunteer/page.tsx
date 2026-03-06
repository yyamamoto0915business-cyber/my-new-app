"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { VOLUNTEER_ROLE_LABELS } from "@/lib/volunteer-roles-mock";
import {
  type VolunteerRoleWithEvent,
  type BenefitFilter,
  type VolunteerSort,
  sortEmergencyRoles,
  sortVolunteerRoles,
  filterByBenefit,
} from "@/lib/volunteer-utils";
import { VolunteerCard } from "@/components/volunteer-card";
import { VolunteerEmergencySection } from "@/components/volunteer-emergency-section";
import { GlyphSectionTitle } from "@/components/glyph/glyph-section-title";
import { GlyphCardShell } from "@/components/glyph/glyph-card-shell";
import { useSearchParamsNoSuspend } from "@/lib/use-search-params-no-suspend";

const QUICK_FILTERS: { value: BenefitFilter; label: string }[] = [
  { value: "EMERGENCY", label: "緊急のみ" },
  { value: "TRANSPORT", label: "交通費" },
  { value: "LODGING", label: "宿泊" },
  { value: "MEAL", label: "食事" },
  { value: "REWARD", label: "謝礼" },
  { value: "INSURANCE", label: "保険" },
  { value: "SHUTTLE", label: "送迎" },
];

const SORT_OPTIONS: { value: VolunteerSort; label: string }[] = [
  { value: "recommended", label: "おすすめ" },
  { value: "newest", label: "新着" },
  { value: "soonest", label: "日程が近い" },
];

function VolunteerPageContent() {
  const searchParams = useSearchParamsNoSuspend();
  const roleType = searchParams.get("roleType") ?? "";
  const prefecture = searchParams.get("prefecture") ?? "";

  const [roles, setRoles] = useState<VolunteerRoleWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [benefitFilter, setBenefitFilter] = useState<BenefitFilter | "">("");
  const [sort, setSort] = useState<VolunteerSort>("recommended");

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

  const showEmergencySection = emergencyRoles.length > 0;
  const showMainSection =
    !benefitFilter || benefitFilter !== "EMERGENCY" ? normalRoles : [];
  const isEmpty = !showEmergencySection && showMainSection.length === 0;

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <header className="sticky top-12 z-50 border-b bg-white/95 shadow-sm backdrop-blur-md sm:top-0 dark:bg-zinc-900/95 [border-color:var(--mg-line)]">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb
            items={[{ label: "トップ", href: "/" }, { label: "ボランティア募集" }]}
          />
          <GlyphSectionTitle as="h1" className="mt-2 text-2xl">
            ボランティア募集
          </GlyphSectionTitle>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <section className="mb-6 space-y-4 rounded-xl border border-zinc-200/60 bg-white/80 p-4 dark:border-zinc-700/60 dark:bg-zinc-900/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div>
              <label className="block text-xs text-zinc-500">種別</label>
              <select
                value={roleType}
                onChange={(e) => {
                  const p = new URLSearchParams(searchParams.toString());
                  if (e.target.value) p.set("roleType", e.target.value);
                  else p.delete("roleType");
                  window.location.search = p.toString();
                }}
                className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
              >
                <option value="">すべて</option>
                {Object.entries(VOLUNTEER_ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <span className="block text-xs text-zinc-500">クイックフィルター</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {QUICK_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setBenefitFilter((prev) => (prev === value ? "" : value))
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      benefitFilter === value
                        ? "bg-[var(--accent)] text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500">並び替え</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as VolunteerSort)}
                className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {prefecture && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              地域: {prefecture} で絞り込み中
            </p>
          )}
        </section>

        {loading ? (
          <p className="text-zinc-500">読み込み中...</p>
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
          <p className="rounded-xl border border-zinc-200/60 bg-white/80 p-8 text-center text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-900/80">
            {roles.length === 0 && !benefitFilter
              ? "募集がまだありません"
              : "該当する募集はありません"}
          </p>
        ) : (
          <>
            {showEmergencySection && (
              <VolunteerEmergencySection roles={emergencyRoles} maxItems={5} />
            )}

            {showMainSection.length > 0 && (
              <section>
                <GlyphSectionTitle className="mb-4">
                  {showEmergencySection ? "その他の募集" : "募集一覧"}
                </GlyphSectionTitle>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {showMainSection.map((r, i) => (
                    <GlyphCardShell key={r.id}>
                      <VolunteerCard
                        role={r}
                        priority={i < 3}
                      />
                    </GlyphCardShell>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

      </main>
    </div>
  );
}

export default function VolunteerPage() {
  return <VolunteerPageContent />;
}
