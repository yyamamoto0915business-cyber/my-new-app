"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

type AppRow = {
  id: string;
  recruitmentId: string;
  title: string;
  roleLabel: string | null;
  status: string;
  statusLabel: string;
  startAt: string | null;
  meetingPlace: string | null;
  createdAt: string;
};

const BADGE: Record<string, string> = {
  確認中: "bg-amber-50 text-amber-800",
  確定: "bg-emerald-50 text-emerald-800",
  完了: "bg-slate-100 text-slate-700",
  見送り: "bg-zinc-100 text-zinc-600",
  キャンセル: "bg-zinc-100 text-zinc-500",
};

export default function VolunteerApplicationsPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setApps([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchWithTimeout("/api/me/volunteer-applications")
      .then((r) => (r.ok ? r.json() : { applications: [] }))
      .then((data: { applications?: AppRow[] }) => {
        setApps(Array.isArray(data.applications) ? data.applications : []);
      })
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-[#F5F8F5]">
      <header className="sticky top-[var(--mg-mobile-top-header-h,0px)] z-30 border-b border-[#DDE8DF] bg-white/95 backdrop-blur-sm min-[900px]:top-0">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3 min-[900px]:max-w-4xl">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2D7A4F]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            マイページ
          </Link>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-3 min-[900px]:max-w-4xl">
          <h1 className="text-lg font-semibold text-[#1A2214]">ボランティア応募履歴</h1>
          <p className="mt-0.5 text-[13px] text-[#566358]">
            応募した募集の状況を確認できます
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 min-[900px]:max-w-4xl">
        {loading || authLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        ) : !user ? (
          <div className="rounded-xl border border-[#DDE8DF] bg-white p-6 text-center">
            <p className="text-sm text-[#566358]">ログインすると応募履歴を確認できます</p>
            <Link
              href="/auth?next=/profile/volunteer"
              className="mt-3 inline-block rounded-lg bg-[#2F8F57] px-4 py-2 text-sm font-medium text-white"
            >
              ログイン
            </Link>
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-xl border border-[#DDE8DF] bg-white px-5 py-10 text-center">
            <Users className="mx-auto h-8 w-8 text-[#2F8F57]" aria-hidden />
            <p className="mt-3 text-sm font-medium text-[#1A2214]">まだ応募履歴がありません</p>
            <p className="mt-1 text-[13px] text-[#566358]">できそうな募集を探してみましょう</p>
            <Link
              href="/?kind=volunteer"
              className="mt-4 inline-block rounded-lg bg-[#2F8F57] px-4 py-2 text-sm font-medium text-white"
            >
              募集を探す
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {apps.map((app) => (
              <li key={app.id}>
                <Link
                  href={`/recruitments/${app.recruitmentId}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#DDE8DF] bg-white p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[#1A2214]">
                      {app.title}
                    </p>
                    {app.roleLabel && (
                      <p className="mt-0.5 text-[12px] text-[#566358]">{app.roleLabel}</p>
                    )}
                    {app.meetingPlace && (
                      <p className="mt-1 text-[11px] text-[#7B817C]">{app.meetingPlace}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      BADGE[app.statusLabel] ?? BADGE["確認中"]
                    }`}
                  >
                    {app.statusLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
