"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProfileEmptyCard } from "@/components/profile/profile-empty-card";
import { getVolunteerApplications, type VolunteerApplication } from "@/lib/profile-dashboard-data";

type Props = {
  userId: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  確認中: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  確定: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  見送り: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
};

export function VolunteerTab({ userId }: Props) {
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [emergencyOn, setEmergencyOn] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setApplications(getVolunteerApplications(userId));
  }, [userId]);

  const nextShift = applications.find((a) => a.status === "確定") ?? applications[0];
  const cumulativeCount = applications.filter((a) => a.status === "確定").length;

  return (
    <div className="space-y-6">
      {/* 1) 直近の稼働予定 */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">直近の稼働予定</h2>
        {!userId ? (
          <ProfileEmptyCard
            title="ログインが必要です"
            description="ボランティアの稼働予定を表示するにはログインしてください"
            ctaLabel="ログイン"
            ctaHref="/login?returnTo=/profile"
          />
        ) : !nextShift ? (
          <ProfileEmptyCard
            title="稼働予定がありません"
            description="ボランティア募集を探して応募してみましょう"
            ctaLabel="募集を探す"
            ctaHref="/volunteer"
          />
        ) : (
          <Link
            href={`/volunteer/${nextShift.volunteerRoleId}`}
            className="block rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/90"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{nextShift.roleTitle}</h3>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">{nextShift.eventTitle}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                  <span>📅</span>
                  {nextShift.dateTime}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_BADGE[nextShift.status] ?? STATUS_BADGE.確認中
                }`}
              >
                {nextShift.status}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--accent)]">詳細を見る →</p>
          </Link>
        )}
      </section>

      {/* 2) 応募中一覧 */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">応募中</h2>
        {applications.length === 0 ? (
          <ProfileEmptyCard
            title="応募中の募集がありません"
            description="ボランティア募集に応募するとここに表示されます"
            ctaLabel="募集を探す"
            ctaHref="/volunteer"
          />
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <Link
                key={app.id}
                href={`/volunteer/${app.volunteerRoleId}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900/90"
              >
                <div>
                  <p className="font-medium">{app.roleTitle}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">{app.eventTitle}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_BADGE[app.status] ?? STATUS_BADGE.確認中
                  }`}
                >
                  {app.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 3) 緊急募集通知設定 */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">緊急募集通知</h2>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90">
          <div className="flex items-center justify-between">
            <span className="text-sm">通知を受け取る</span>
            <button
              type="button"
              role="switch"
              aria-checked={emergencyOn}
              onClick={() => setEmergencyOn(!emergencyOn)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                emergencyOn ? "bg-[var(--accent)]" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  emergencyOn ? "left-6 translate-x-[-100%]" : "left-1"
                }`}
              />
            </button>
          </div>
          {emergencyOn && (
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              地域・カテゴリの設定は準備中です
            </p>
          )}
        </div>
      </section>

      {/* 4) レポ/実績 */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">レポ・実績</h2>
        <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/90">
          <p className="text-3xl font-bold text-[var(--accent)]">{cumulativeCount}</p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">累積稼働件数</p>
        </div>
      </section>
    </div>
  );
}
