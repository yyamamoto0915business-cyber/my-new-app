"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { VOLUNTEER_ROLE_LABELS } from "@/lib/volunteer-roles-mock";

type VolunteerRole = {
  id: string;
  roleType: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  capacity: number;
  perksText?: string;
  hasTransportSupport: boolean;
  hasHonorarium: boolean;
};

type Props = {
  eventId: string;
};

export function EventVolunteerSection({ eventId }: Props) {
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchWithTimeout(`/api/events/${eventId}/volunteer-roles`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => {
        setError("読み込みに失敗しました");
        setRoles([]);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          ボランティア募集
        </h2>
        <p className="mt-2 text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          ボランティア募集
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-2 text-sm text-[var(--accent)] underline"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (roles.length === 0) return null;

  return (
    <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        ボランティア募集
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        イベント運営をお手伝いいただける方を募集しています
      </p>
      <ul className="mt-3 space-y-3">
        {roles.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-zinc-200/60 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
          >
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              {VOLUNTEER_ROLE_LABELS[r.roleType as keyof typeof VOLUNTEER_ROLE_LABELS] ?? r.roleType}
            </span>
            <h3 className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">
              {r.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {r.description}
            </p>
            <dl className="mt-2 space-y-1 text-sm">
              <div>
                <dt className="inline text-zinc-500">日時・場所：</dt>
                <dd className="inline">{r.dateTime} / {r.location}</dd>
              </div>
              <div>
                <dt className="inline text-zinc-500">定員：</dt>
                <dd className="inline">{r.capacity}名</dd>
              </div>
              {(r.hasTransportSupport || r.hasHonorarium || r.perksText) && (
                <div>
                  <dt className="inline text-zinc-500">特典：</dt>
                  <dd className="inline">
                    {[
                      r.hasTransportSupport && "交通費支給",
                      r.hasHonorarium && "謝礼あり",
                      r.perksText,
                    ]
                      .filter(Boolean)
                      .join("、")}
                  </dd>
                </div>
              )}
            </dl>
            <Link
              href={`/recruitments?event=${eventId}`}
              className="mt-3 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              応募する
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
