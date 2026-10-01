"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import type { OrganizerGame } from "@/lib/organizer/games";

export function OrganizerGameAnalyticsEntry() {
  const router = useRouter();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/organizer/games", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as { games?: OrganizerGame[] };
      if (cancelled) return;
      const game = json.games?.[0];
      if (game?.id) {
        router.replace(`/organizer/games/${game.id}/analytics`);
        return;
      }
      setMissing(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="org-ga__empty">
      <BarChart3 className="h-7 w-7" aria-hidden />
      <p>{missing ? "まだ分析できるゲームがありません" : "分析できるゲームを探しています…"}</p>
      <p>ゲームを作ると、参加者が地域をどう歩いたかが見えるようになります。</p>
      <Link href="/organizer/games" className="org-games__create">
        ゲーム機能に戻る
      </Link>
    </div>
  );
}
