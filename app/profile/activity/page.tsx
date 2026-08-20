"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, CalendarDays, Heart, Pencil, Users } from "lucide-react";
import {
  prefetchMypageSummary,
  type MypageSummaryResponse,
} from "@/lib/prefetch-mypage-summary";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

export default function ProfileActivityPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const [summary, setSummary] = useState<MypageSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    prefetchMypageSummary()
      .then((data) => setSummary(data))
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
          <h1 className="text-lg font-semibold text-[#1A2214]">実績・履歴</h1>
          <p className="mt-0.5 text-[13px] text-[#566358]">
            参加・投稿・ボランティアの記録をまとめて確認できます
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4 min-[900px]:max-w-4xl">
        {loading || authLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-white" />
        ) : !user ? (
          <div className="rounded-xl border border-[#DDE8DF] bg-white p-6 text-center text-sm text-[#566358]">
            ログインすると実績を確認できます
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  label: "イベント参加",
                  value: summary?.stats.participated ?? 0,
                  icon: <CalendarDays className="h-4 w-4" />,
                  href: "/pass",
                },
                {
                  label: "投稿",
                  value: summary?.stats.posts ?? 0,
                  icon: <Pencil className="h-4 w-4" />,
                  href: "/posts",
                },
                {
                  label: "ボランティア",
                  value: summary?.stats.volunteer ?? 0,
                  icon: <Users className="h-4 w-4" />,
                  href: "/profile/volunteer",
                },
                {
                  label: "お気に入り",
                  value: summary?.stats.favorites ?? 0,
                  icon: <Heart className="h-4 w-4" />,
                  href: "/saved",
                },
              ].map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="flex flex-col items-center gap-1 rounded-xl border border-[#DDE8DF] bg-white px-2 py-3 text-center transition-colors hover:bg-[#EAF6EF]"
                >
                  <span className="text-[#2F8F57]">{s.icon}</span>
                  <span className="text-[11px] text-[#7B817C]">{s.label}</span>
                  <span className="text-[16px] font-bold tabular-nums text-[#1A2214]">
                    {s.value}
                  </span>
                </Link>
              ))}
            </section>

            <section className="overflow-hidden rounded-xl border border-[#DDE8DF] bg-white">
              <header className="border-b border-[#E5E7E2] px-4 py-3">
                <h2 className="text-[13px] font-semibold text-[#1A2214]">最近の動き</h2>
              </header>
              {(summary?.activity?.length ?? 0) === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-[#7B817C]">
                  まだ動きがありません
                </p>
              ) : (
                <ul>
                  {summary!.activity.map((item) => (
                    <li key={item.id} className="border-b border-[#E5E7E2] last:border-b-0">
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#EAF6EF]"
                      >
                        {item.thumbUrl ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F3F4F1]">
                            <Image
                              src={item.thumbUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-[#EAF6EF]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-[#1A2214]">{item.text}</p>
                          <p className="text-[11px] text-[#7B817C]">{item.dateLabel}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {(summary?.posts?.length ?? 0) > 0 && (
              <section className="overflow-hidden rounded-xl border border-[#DDE8DF] bg-white">
                <header className="flex items-center justify-between border-b border-[#E5E7E2] px-4 py-3">
                  <h2 className="text-[13px] font-semibold text-[#1A2214]">自分の投稿</h2>
                  <Link href="/posts" className="text-[12px] font-medium text-[#2F8F57]">
                    すべて見る
                  </Link>
                </header>
                <div className="flex gap-3 overflow-x-auto p-3">
                  {summary!.posts.map((post) => (
                    <Link
                      key={post.id}
                      href={post.href}
                      className="w-[140px] shrink-0 overflow-hidden rounded-lg border border-[#E5E7E2]"
                    >
                      <div className="relative aspect-[4/3] bg-[#F3F4F1]">
                        {post.imageUrl && (
                          <Image
                            src={post.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="140px"
                          />
                        )}
                      </div>
                      <p className="line-clamp-2 p-2 text-[12px] font-medium text-[#1A2214]">
                        {post.title}
                      </p>
                    </Link>
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
