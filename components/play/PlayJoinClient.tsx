"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Stamp } from "lucide-react";
import { PlayProgressCard } from "@/components/play/PlayProgressCard";
import {
  PLAY_NICKNAME_MAX,
  PLAY_PASSPHRASE_MAX,
  PLAY_PASSPHRASE_MIN,
  type PlayProgress,
  type PlaySession,
  type PlayStampResult,
} from "@/lib/organizer/play-types";
import {
  clearPlaySession,
  readPlaySession,
  writePlaySession,
} from "@/lib/organizer/play-session";

type PlayGame = {
  name: string;
  description: string;
  typeLabel: string;
  spotCount: number;
};

export function PlayJoinClient() {
  const params = useParams();
  const router = useRouter();
  const tokenParam = params?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : typeof tokenParam === "string" ? tokenParam : "";

  const [game, setGame] = useState<PlayGame | null>(null);
  const [progress, setProgress] = useState<PlayProgress | null>(null);
  const [highlightSpotId, setHighlightSpotId] = useState<string | null>(null);
  const [stampMessage, setStampMessage] = useState<{ name: string; already: boolean } | null>(null);
  const [nickname, setNickname] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSpot, setPendingSpot] = useState("");

  useEffect(() => {
    if (!token) {
      setError("ゲームが見つかりません");
      setLoading(false);
      return;
    }
    const spotFromUrl =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("spot") ?? "" : "";
    setPendingSpot(spotFromUrl);
    let cancelled = false;

    (async () => {
      try {
        const gameRes = await fetch(`/api/play/${encodeURIComponent(token)}`, { cache: "no-store" });
        const gameJson = await gameRes.json();
        if (!gameRes.ok) {
          if (!cancelled) setError(gameJson.error ?? "ゲームが見つかりません");
          return;
        }
        if (!cancelled) setGame(gameJson as PlayGame);

        const stored = readPlaySession(token);
        if (!stored) return;
        const resumeRes = await fetch(`/api/play/${encodeURIComponent(token)}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceToken: stored.deviceToken }),
        });
        if (!resumeRes.ok) {
          clearPlaySession(token);
          return;
        }
        const session = (await resumeRes.json()) as PlaySession;
        if (cancelled) return;
        writePlaySession(token, { deviceToken: session.deviceToken, nickname: session.progress.nickname });
        setProgress(session.progress);
        if (spotFromUrl) {
          await stampPendingSpot(token, session.deviceToken, spotFromUrl, cancelled);
        }
      } catch {
        if (!cancelled) setError("読み込みに失敗しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function stampPendingSpot(
    joinToken: string,
    deviceToken: string,
    spotToken: string,
    cancelled: boolean
  ) {
    try {
      const res = await fetch(`/api/play/spot/${encodeURIComponent(spotToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken }),
      });
      const json = (await res.json()) as PlayStampResult & { error?: string };
      if (!res.ok || cancelled) return;
      setProgress(json.progress);
      setStampMessage({ name: json.spotName, already: json.alreadyStamped });
      setHighlightSpotId(json.spotId ?? null);
      router.replace(`/play/${joinToken}`);
    } catch {
      /* 参加は継続 */
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, passphrase }),
      });
      const json = (await res.json()) as PlaySession & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "参加できませんでした");
        return;
      }
      writePlaySession(token, { deviceToken: json.deviceToken, nickname: json.progress.nickname });
      setProgress(json.progress);
      if (pendingSpot) {
        await stampPendingSpot(token, json.deviceToken, pendingSpot, false);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (error && !game) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <h1>ゲームが見つかりません</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (loading || !game) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <p>読み込み中です…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="play-game">
      <div className="play-game__card">
        <span className="play-game__icon" aria-hidden>
          <Stamp className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <p className="play-game__kicker">{game.typeLabel}</p>
        <h1>{game.name}</h1>
        {game.description ? <p className="play-game__desc">{game.description}</p> : null}
        <p className="play-game__meta">
          {game.spotCount > 0 ? `スポット ${game.spotCount} か所` : "スポット準備中"}
        </p>

        {progress ? (
          <PlayProgressCard
            progress={progress}
            highlightSpotId={highlightSpotId}
            justStampedName={stampMessage?.name}
            alreadyStamped={stampMessage?.already}
          />
        ) : (
          <form className="play-join" onSubmit={(e) => void handleJoin(e)}>
            <p className="play-join__lead">
              {pendingSpot
                ? "スタンプの前に、ニックネームと合言葉を入れて参加します。"
                : "ニックネームと合言葉で参加します。同じ端末なら、次からそのまま再開できます。"}
            </p>
            <label>
              ニックネーム
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={PLAY_NICKNAME_MAX}
                autoComplete="nickname"
                required
              />
            </label>
            <label>
              合言葉
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                minLength={PLAY_PASSPHRASE_MIN}
                maxLength={PLAY_PASSPHRASE_MAX}
                autoComplete="off"
                required
              />
            </label>
            {error ? <p className="play-join__error">{error}</p> : null}
            <button type="submit" disabled={saving}>
              {saving ? "入っています…" : "参加する"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
