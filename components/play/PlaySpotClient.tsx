"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { PlayProgressCard } from "@/components/play/PlayProgressCard";
import type { PlayProgress, PlayStampResult } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";

type PlaySpot = {
  spotName: string;
  kindLabel: string;
  gameName: string;
  typeLabel: string;
  joinToken: string;
  joinPath: string;
};

export function PlaySpotClient() {
  const params = useParams();
  const router = useRouter();
  const tokenParam = params?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : typeof tokenParam === "string" ? tokenParam : "";
  const [spot, setSpot] = useState<PlaySpot | null>(null);
  const [progress, setProgress] = useState<PlayProgress | null>(null);
  const [alreadyStamped, setAlreadyStamped] = useState(false);
  const [stampedSpotId, setStampedSpotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const spotRes = await fetch(`/api/play/spot/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const spotJson = await spotRes.json();
        if (!spotRes.ok) {
          if (!cancelled) setError(spotJson.error ?? "スポットが見つかりません");
          return;
        }
        const nextSpot = spotJson as PlaySpot;
        if (cancelled) return;
        setSpot(nextSpot);

        const stored = nextSpot.joinToken ? readPlaySession(nextSpot.joinToken) : null;
        if (!stored) {
          if (!nextSpot.joinPath) {
            if (!cancelled) setError("先に参加用QRから入ってください");
            return;
          }
          router.replace(`${nextSpot.joinPath}?spot=${encodeURIComponent(token)}`);
          return;
        }

        const stampRes = await fetch(`/api/play/spot/${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceToken: stored.deviceToken }),
        });
        const stampJson = (await stampRes.json()) as PlayStampResult & {
          error?: string;
          joinPath?: string;
        };
        if (!stampRes.ok) {
          if (stampJson.joinPath) {
            router.replace(`${stampJson.joinPath}?spot=${encodeURIComponent(token)}`);
            return;
          }
          if (!cancelled) setError(stampJson.error ?? "スタンプを押せませんでした");
          return;
        }
        if (cancelled) return;
        setAlreadyStamped(stampJson.alreadyStamped);
        setStampedSpotId(stampJson.spotId);
        setProgress(stampJson.progress);
      } catch {
        if (!cancelled) setError("読み込みに失敗しました");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (error) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <h1>スポットが見つかりません</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!spot || !progress) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <p>スタンプを準備しています…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="play-game">
      <div className="play-game__card">
        <span className="play-game__icon" aria-hidden>
          <MapPin className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <p className="play-game__kicker">
          {spot.typeLabel} ・ {spot.kindLabel}
        </p>
        <h1>{spot.spotName}</h1>
        <p className="play-game__meta">{spot.gameName}</p>
        <PlayProgressCard
          progress={progress}
          highlightSpotId={stampedSpotId}
          justStampedName={spot.spotName}
          alreadyStamped={alreadyStamped}
        />
      </div>
    </main>
  );
}
