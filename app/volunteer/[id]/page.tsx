"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { Breadcrumb } from "@/components/breadcrumb";
import { LoginBenefitsBanner } from "@/components/login-benefits-banner";
import { VolunteerThumbnail } from "@/components/volunteer-thumbnail";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import {
  getCategoryLabel,
  getDisplayBenefits,
  type VolunteerRoleWithEvent,
} from "@/lib/volunteer-utils";
import type { SupportDetail } from "@/lib/volunteer-roles-mock";
import { BENEFIT_LABELS } from "@/lib/volunteer-roles-mock";

export default function VolunteerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useSupabaseUser();
  const [role, setRole] = useState<VolunteerRoleWithEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchWithTimeout(`/api/volunteer/roles/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found"))))
      .then(setRole)
      .catch(() => setError("募集が見つかりません"))
      .finally(() => setLoading(false));
  }, [id]);

  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  const handleApply = async () => {
    if (!role) return;
    if (!user && !authDisabled) {
      router.push(`/login?returnTo=${encodeURIComponent(`/volunteer/${id}`)}`);
      return;
    }
    setApplying(true);
    try {
      const res = await fetchWithTimeout("/api/volunteer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerRoleId: role.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "応募に失敗しました");
      }
    } catch {
      setError("通信に失敗しました");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-zinc-500">
          読み込み中...
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <p className="text-red-600">{error ?? "募集が見つかりません"}</p>
          <Link
            href="/volunteer"
            className="mt-4 inline-block text-sm text-[var(--accent)] underline"
          >
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const { chips } = getDisplayBenefits(role);
  const categoryLabel = getCategoryLabel(role.roleType);
  const isEmergency = role.emergency?.isEmergency === true;
  const supportDetail = (role as { supportDetail?: SupportDetail }).supportDetail;
  const event = role.event;
  const isEventEnded =
    event?.date && event.date < new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "ボランティア募集", href: "/volunteer" },
              { label: role.title.length > 24 ? `${role.title.slice(0, 24)}…` : role.title },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-2xl border border-zinc-200/60 bg-white/95 overflow-hidden shadow-lg dark:border-zinc-700/60 dark:bg-zinc-900/95">
          <div className="relative">
            <VolunteerThumbnail
              imageUrl={role.thumbnailUrl}
              alt={role.title}
              roleType={categoryLabel}
              rounded="none"
            />
            {isEmergency && (
              <span className="absolute top-3 left-3 rounded-md bg-red-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                緊急募集
              </span>
            )}
          </div>

          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-sm font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                {categoryLabel}
              </span>
              {chips.map(({ benefit, label }) => (
                <span
                  key={benefit}
                  className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                >
                  {label}
                </span>
              ))}
            </div>

            <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {role.title}
            </h1>

            {event && (
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {event.title}
                {event.prefecture && ` · ${event.prefecture}`}
              </p>
            )}

            <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
              {role.description}
            </p>

            <LoginBenefitsBanner returnTo={`/volunteer/${id}`} />

            <dl className="mt-6 space-y-4">
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                  <span aria-hidden>📅</span>
                  日時
                </dt>
                <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                  {role.dateTime}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                  <span aria-hidden>📍</span>
                  場所
                </dt>
                <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                  {isEmergency && !user && !authDisabled ? (
                    <span className="text-zinc-500">
                      ログインすると集合場所の詳細を表示します
                    </span>
                  ) : (
                    role.location
                  )}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                  <span aria-hidden>👥</span>
                  定員
                </dt>
                <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                  {role.capacity}名
                </dd>
              </div>
            </dl>

            {supportDetail &&
              (supportDetail.transport?.enabled ||
                supportDetail.lodging?.enabled ||
                supportDetail.meal?.enabled ||
                supportDetail.reward?.enabled ||
                supportDetail.insurance?.enabled) && (
                <section className="mt-8 rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/30">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    待遇の詳細
                  </h2>
                  <dl className="mt-3 space-y-2 text-sm">
                    {supportDetail.transport?.enabled && (
                      <div>
                        <dt className="text-zinc-500">{BENEFIT_LABELS.TRANSPORT}</dt>
                        <dd>
                          {supportDetail.transport.maxYen != null
                            ? `上限 ¥${supportDetail.transport.maxYen.toLocaleString()}`
                            : "支給あり"}
                          {supportDetail.transport.note && `（${supportDetail.transport.note}）`}
                        </dd>
                      </div>
                    )}
                    {supportDetail.lodging?.enabled && (
                      <div>
                        <dt className="text-zinc-500">{BENEFIT_LABELS.LODGING}</dt>
                        <dd>
                          {supportDetail.lodging.maxYen != null
                            ? `上限 ¥${supportDetail.lodging.maxYen.toLocaleString()}`
                            : "あり"}
                          {supportDetail.lodging.note && `（${supportDetail.lodging.note}）`}
                        </dd>
                      </div>
                    )}
                    {supportDetail.meal?.enabled && (
                      <div>
                        <dt className="text-zinc-500">{BENEFIT_LABELS.MEAL}</dt>
                        <dd>{supportDetail.meal.note ?? "提供あり"}</dd>
                      </div>
                    )}
                    {supportDetail.reward?.enabled && (
                      <div>
                        <dt className="text-zinc-500">{BENEFIT_LABELS.REWARD}</dt>
                        <dd>{supportDetail.reward.note ?? "謝礼あり"}</dd>
                      </div>
                    )}
                    {supportDetail.insurance?.enabled && (
                      <div>
                        <dt className="text-zinc-500">{BENEFIT_LABELS.INSURANCE}</dt>
                        <dd>{supportDetail.insurance.note ?? "加入済"}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="rounded-lg bg-[var(--accent)] px-6 py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {applying ? "処理中..." : "応募する"}
              </button>
              {isEventEnded && event && (
                <Link
                  href={`/report/new?eventId=${event.id}`}
                  className="rounded-lg border border-zinc-200 px-6 py-3 text-center text-base font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  レポを書く
                </Link>
              )}
            </div>
          </div>
        </article>

        <div className="mt-6">
          <Link
            href="/volunteer"
            className="text-sm text-zinc-500 underline hover:text-zinc-700"
          >
            ← 一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
