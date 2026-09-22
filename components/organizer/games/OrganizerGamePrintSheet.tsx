"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { GameQrCard } from "@/components/organizer/games/GameQrCard";
import { ORGANIZER_GAME_SPOT_KIND_LABEL } from "@/lib/organizer/game-tokens";
import type { OrganizerGame, OrganizerGameSpot } from "@/lib/organizer/games";

export function OrganizerGamePrintSheet() {
  const params = useParams();
  const gameId = typeof params?.id === "string" ? params.id : "";
  const [game, setGame] = useState<OrganizerGame | null>(null);
  const [spots, setSpots] = useState<OrganizerGameSpot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/organizer/games/${gameId}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "読み込みに失敗しました");
        if (cancelled) return;
        setGame(json.game as OrganizerGame);
        setSpots((json.spots ?? []) as OrganizerGameSpot[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "読み込みに失敗しました");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (error) {
    return (
      <p className="text-[13px] text-[#566358]">
        {error}{" "}
        <Link href="/organizer/games" className="font-semibold text-[#2D7A4F]">
          戻る
        </Link>
      </p>
    );
  }

  if (!game) {
    return <p className="text-[13px] text-[#566358]">印刷用QRを準備しています…</p>;
  }

  return (
    <div className="org-game-print">
      <div className="org-game-print__toolbar print:hidden">
        <Link href={`/organizer/games/${game.id}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2D7A4F]">
          <ArrowLeft className="size-3.5" strokeWidth={2.4} aria-hidden />
          設定に戻る
        </Link>
        <button type="button" className="org-games__create" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" aria-hidden />
          印刷する
        </button>
      </div>

      <header className="org-game-print__head">
        <p className="org-game-print__kicker">{game.typeLabel}</p>
        <h1>{game.name}</h1>
        <p>参加用QRは入口へ。スポット用QRは各場所に貼ってください。</p>
      </header>

      <section className="org-game-print__card">
        <h2>参加用QR</h2>
        <GameQrCard
          title={game.name}
          caption="ゲームに参加する"
          path={game.joinPath}
          filename={`game-join-${game.id}.png`}
        />
      </section>

      {spots.map((spot, index) => (
        <section key={spot.id} className="org-game-print__card">
          <h2>
            {index + 1}. {spot.name}
            <span>{ORGANIZER_GAME_SPOT_KIND_LABEL[spot.kind]}</span>
          </h2>
          <GameQrCard
            title={spot.name}
            caption={ORGANIZER_GAME_SPOT_KIND_LABEL[spot.kind]}
            path={spot.path}
            filename={`game-spot-${spot.id}.png`}
          />
        </section>
      ))}

      {spots.length === 0 ? (
        <p className="org-game-print__empty">スポットを追加すると、ここに場所ごとのQRが並びます。</p>
      ) : null}
    </div>
  );
}
