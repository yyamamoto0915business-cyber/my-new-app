"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import styles from "./MypagePointsCard.module.css";

type BadgeItem = {
  id: string;
  label: string;
  image_url: string;
};

/** compact：スマホのマイページ用の細い1行（ポイントとバッジを横に並べる） */
export function MypagePointsCard({ compact = false }: { compact?: boolean } = {}) {
  const { user } = useSupabaseUser();
  const [balance, setBalance] = useState<number | null>(null);
  const [badges, setBadges] = useState<BadgeItem[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    void Promise.all([
      supabase.from("user_points").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("user_badges")
        .select("id, label, image_url")
        .eq("user_id", user.id)
        .order("awarded_at", { ascending: false })
        .limit(4),
    ]).then(([points, owned]) => {
      if (cancelled) return;
      const next = points.data?.balance;
      setBalance(typeof next === "number" ? next : 0);
      setBadges((owned.data ?? []) as BadgeItem[]);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (compact) {
    return (
      <Link
        href="/points"
        className="flex min-h-[56px] items-center gap-3 rounded-[14px] border border-[#e8e6e0] bg-white px-4 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,.06),0_1px_3px_rgba(0,0,0,.04)] active:bg-[#f7fbf8]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fdf3d8] text-[#b8860b]" aria-hidden>
          <Sparkles className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-[#7b817c]">マイポイント</span>
          <span className="flex items-baseline gap-1">
            <strong className="text-[19px] font-bold leading-tight tabular-nums text-[#2f8f57]">
              {balance === null ? "…" : balance.toLocaleString("ja-JP")}
            </strong>
            <span className="text-[11px] text-[#7b817c]">pt</span>
          </span>
        </span>
        {badges.length > 0 ? (
          <span className="flex shrink-0 -space-x-2" aria-label={`バッジ ${badges.length}個`}>
            {badges.slice(0, 3).map((badge) =>
              badge.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={badge.id}
                  src={badge.image_url}
                  alt={badge.label}
                  className="h-8 w-8 rounded-full border-2 border-white bg-[#f3f1ea] object-cover"
                />
              ) : null
            )}
          </span>
        ) : (
          <span className="shrink-0 text-[11px] text-[#9a9890]">バッジを集めよう</span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-[#c5c9c3]" aria-hidden />
      </Link>
    );
  }

  return (
    <Link href="/points" className={styles.card}>
      <div className={styles.head}>
        <div>
          <p className={styles.kicker}>ポイント・バッジ</p>
          <h2>マイポイント</h2>
        </div>
        <ChevronRight className={styles.chevron} aria-hidden />
      </div>
      <p className={styles.balance}>
        <strong>{balance === null ? "…" : balance.toLocaleString("ja-JP")}</strong>
        <span>ポイント</span>
      </p>
      {badges.length > 0 ? (
        <ul className={styles.badges} aria-label="もらったバッジ">
          {badges.map((badge) => (
            <li key={badge.id}>
              {badge.image_url ? <img src={badge.image_url} alt={badge.label} /> : <span>{badge.label}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>スタンプラリーのバッジが、ここに残ります。</p>
      )}
    </Link>
  );
}
