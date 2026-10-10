"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import styles from "./MypagePointsCard.module.css";

type BadgeItem = {
  id: string;
  label: string;
  image_url: string;
};

export function MypagePointsCard() {
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

  return (
    <Link href="/points" className={styles.card}>
      <div className={styles.head}>
        <div>
          <p className={styles.kicker}>アカウント</p>
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
