"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { PlayClearPanel, PlaySpotCopy, PlayStampBurst, playMomentHasClear } from "@/components/play/PlayMoment";
import { PlaySpotPlace } from "@/components/play/PlaySpotPlace";
import { PlayProgressCard } from "@/components/play/PlayProgressCard";
import { readPublicPlayMoment, type PublicPlayMoment } from "@/lib/organizer/game-experience";
import type { PlayProgress, PlayStampResult } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";
import { useWatchCouponUse } from "@/components/play/useWatchCouponUse";

type PlaySpot = {
  spotName: string;
  kindLabel: string;
  gameName: string;
  type: string;
  typeLabel: string;
  joinToken: string;
  joinPath: string;
  moment: PublicPlayMoment | null;
};

/** スタンプラリーは、押したあとラリー画面へ戻して獲得演出を出す。 */
function rallyGotPath(spot: PlaySpot, spotId: string, already: boolean): string | null {
  if (spot.type !== "stamp" || !spot.joinToken) return null;
  const base = spot.joinPath || `/play/${spot.joinToken}`;
  return `${base}?got=${encodeURIComponent(spotId)}${already ? "&again=1" : ""}`;
}

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
  const [blocked, setBlocked] = useState(false);
  const [backPath, setBackPath] = useState<string | null>(null);
  const [keywordMode, setKeywordMode] = useState(false);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [gpsMode, setGpsMode] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [replayNote, setReplayNote] = useState<string | null>(null);
  const [gateTitle, setGateTitle] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  useWatchCouponUse(spot?.joinToken ?? "", progress, setProgress);

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
        const body = spotJson as PlaySpot & { moment?: unknown };
        const nextSpot: PlaySpot = {
          spotName: body.spotName,
          kindLabel: body.kindLabel,
          gameName: body.gameName,
          type: body.type ?? "stamp",
          typeLabel: body.typeLabel,
          joinToken: body.joinToken,
          joinPath: body.joinPath,
          moment: readPublicPlayMoment(body.moment),
        };
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
          code?: string | null;
          progress?: PlayProgress | null;
        };
        if (stampRes.status === 422 && stampJson.code === "keyword_required") {
          if (cancelled) return;
          setKeywordMode(true);
          if (stampJson.progress) setProgress(stampJson.progress);
          return;
        }
        if (stampRes.status === 422 && stampJson.code === "gps_required") {
          if (cancelled) return;
          setGpsMode(true);
          if (stampJson.progress) setProgress(stampJson.progress);
          return;
        }
        if (!stampRes.ok) {
          if (typeof stampJson.code === "string" && stampJson.code.startsWith("audience_")) {
            if (!cancelled) {
              setBlocked(true);
              setGateTitle("このラリーには入れません");
              setNeedsLogin(stampJson.code === "audience_login");
              setBackPath(stampJson.joinPath ?? nextSpot.joinPath ?? null);
              setError(stampJson.error ?? "このラリーには入れません");
            }
            return;
          }
          if (stampRes.status === 409) {
            if (!cancelled) {
              setBlocked(true);
              setBackPath(stampJson.joinPath ?? nextSpot.joinPath ?? null);
              setError(stampJson.error ?? "先のスポットを巡ってください");
            }
            return;
          }
          if (stampJson.joinPath && stampRes.status === 401) {
            router.replace(`${stampJson.joinPath}?spot=${encodeURIComponent(token)}`);
            return;
          }
          if (!cancelled) setError(stampJson.error ?? "スタンプを押せませんでした");
          return;
        }
        if (cancelled) return;
        const gotPath = rallyGotPath(nextSpot, stampJson.spotId, stampJson.alreadyStamped);
        if (gotPath) {
          router.replace(gotPath);
          return;
        }
        setKeywordMode(false);
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

  async function replay() {
    if (!spot?.joinToken) return;
    if (!window.confirm("スタンプを最初から集め直します。特典は、このままです。よろしいですか？")) return;
    const stored = readPlaySession(spot.joinToken);
    if (!stored) return;
    setReplaying(true);
    setReplayNote(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(spot.joinToken)}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken: stored.deviceToken }),
      });
      const json = (await res.json()) as { error?: string; code?: string | null };
      if (!res.ok) {
        setNeedsLogin(json.code === "audience_login");
        setReplayNote(json.error ?? "もう一周できませんでした");
        return;
      }
      router.push(spot.joinPath || `/play/${spot.joinToken}`);
    } catch {
      setReplayNote("通信エラーが発生しました");
    } finally {
      setReplaying(false);
    }
  }

  if (error) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <h1>{gateTitle ?? (blocked ? "まだこちらは押せません" : "スポットが見つかりません")}</h1>
          <p>{error}</p>
          {needsLogin ? (
            <Link className="play-join__login" href={`/auth?next=${encodeURIComponent(backPath || `/play/spot/${token}`)}`}>
              ログインする
            </Link>
          ) : null}
          {blocked && backPath ? (
            <Link className="play-game__back" href={backPath}>
              スタンプ帳へ戻る
            </Link>
          ) : null}
        </div>
      </main>
    );
  }

  async function submitKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !spot?.joinToken || submitting) return;
    const stored = readPlaySession(spot.joinToken);
    if (!stored) {
      if (spot.joinPath) router.replace(`${spot.joinPath}?spot=${encodeURIComponent(token)}`);
      return;
    }
    setSubmitting(true);
    setKeywordError(null);
    try {
      const res = await fetch(`/api/play/spot/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken: stored.deviceToken, keyword: keywordDraft }),
      });
      const json = (await res.json()) as PlayStampResult & {
        error?: string;
        joinPath?: string;
        code?: string | null;
      };
      if (res.status === 422) {
        setKeywordError(json.error ?? "キーワードが違います");
        return;
      }
      if (typeof json.code === "string" && json.code.startsWith("audience_")) {
        setBlocked(true);
        setGateTitle("このラリーには入れません");
        setNeedsLogin(json.code === "audience_login");
        setBackPath(json.joinPath ?? spot.joinPath ?? null);
        setError(json.error ?? "このラリーには入れません");
        return;
      }
      if (res.status === 409) {
        setBlocked(true);
        setBackPath(json.joinPath ?? spot.joinPath ?? null);
        setError(json.error ?? "先のスポットを巡ってください");
        return;
      }
      if (json.joinPath && res.status === 401) {
        router.replace(`${json.joinPath}?spot=${encodeURIComponent(token)}`);
        return;
      }
      if (!res.ok) {
        setKeywordError(json.error ?? "スタンプを押せませんでした");
        return;
      }
      const gotPath = rallyGotPath(spot, json.spotId, json.alreadyStamped);
      if (gotPath) {
        router.replace(gotPath);
        return;
      }
      setKeywordMode(false);
      setAlreadyStamped(json.alreadyStamped);
      setStampedSpotId(json.spotId);
      setProgress(json.progress);
    } catch {
      setKeywordError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitGps() {
    if (!token || !spot?.joinToken || submitting) return;
    const stored = readPlaySession(spot.joinToken);
    if (!stored) {
      if (spot.joinPath) router.replace(`${spot.joinPath}?spot=${encodeURIComponent(token)}`);
      return;
    }
    if (!navigator.geolocation) {
      setGpsError("この端末では現在地を取れません");
      return;
    }
    setSubmitting(true);
    setGpsError(null);
    try {
      const here = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => reject(new Error("denied")),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      });
      const res = await fetch(`/api/play/spot/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: stored.deviceToken,
          lat: here.lat,
          lng: here.lng,
        }),
      });
      const json = (await res.json()) as PlayStampResult & {
        error?: string;
        joinPath?: string;
        code?: string | null;
      };
      if (res.status === 422) {
        setGpsError(json.error ?? "もう少し近づいてください");
        return;
      }
      if (typeof json.code === "string" && json.code.startsWith("audience_")) {
        setBlocked(true);
        setGateTitle("このラリーには入れません");
        setNeedsLogin(json.code === "audience_login");
        setBackPath(json.joinPath ?? spot.joinPath ?? null);
        setError(json.error ?? "このラリーには入れません");
        return;
      }
      if (res.status === 409) {
        setBlocked(true);
        setBackPath(json.joinPath ?? spot.joinPath ?? null);
        setError(json.error ?? "先のスポットを巡ってください");
        return;
      }
      if (json.joinPath && res.status === 401) {
        router.replace(`${json.joinPath}?spot=${encodeURIComponent(token)}`);
        return;
      }
      if (!res.ok) {
        setGpsError(json.error ?? "スタンプを押せませんでした");
        return;
      }
      const gotPath = rallyGotPath(spot, json.spotId, json.alreadyStamped);
      if (gotPath) {
        router.replace(gotPath);
        return;
      }
      setGpsMode(false);
      setAlreadyStamped(json.alreadyStamped);
      setStampedSpotId(json.spotId);
      setProgress(json.progress);
    } catch (err) {
      setGpsError(
        err instanceof Error && err.message === "denied"
          ? "現在地を取得できませんでした。位置情報を許可して、もう一度押してください。"
          : "通信エラーが発生しました",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!spot || (!progress && !keywordMode && !gpsMode)) {
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
        {progress ? (
          <PlayProgressCard
            progress={progress}
            highlightSpotId={keywordMode || gpsMode ? null : stampedSpotId}
            justStampedName={keywordMode || gpsMode ? null : spot.spotName}
            alreadyStamped={alreadyStamped}
            quietToast={
              spot.type === "stamp" && !keywordMode && !gpsMode && !alreadyStamped && Boolean(spot.moment?.stampMessage)
            }
            quietDone={
              spot.type === "stamp" &&
              (playMomentHasClear(spot.moment) ||
                Boolean(progress?.rewardCode) ||
                Boolean(progress?.rewardUsed) ||
                Boolean(progress?.rewardPoints) ||
                Boolean(progress?.rewardBadge))
            }
            asCard={spot.type === "stamp"}
          >
            {spot.type === "stamp" && spot.moment ? (
              <PlaySpotPlace lat={spot.moment.lat} lng={spot.moment.lng} name={spot.spotName} caption="この場所" />
            ) : null}
            {spot.type === "stamp" && spot.moment ? (
              <PlaySpotCopy
                intro={spot.moment.intro}
                description={spot.moment.description}
                hint={spot.moment.hint}
                imageUrl={spot.moment.imageUrl}
                videoUrl={spot.moment.videoUrl}
                imageAlt={spot.spotName}
              />
            ) : null}
            {keywordMode ? (
              <form className="play-keyword" onSubmit={(e) => void submitKeyword(e)}>
                <label>
                  この場所のキーワード
                  <input
                    value={keywordDraft}
                    onChange={(e) => setKeywordDraft(e.target.value)}
                    maxLength={40}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="done"
                    autoFocus
                    required
                  />
                </label>
                {keywordError ? <p className="play-keyword__error">{keywordError}</p> : null}
                <div className="play-dock">
                  <button
                    type="submit"
                    className="play-dock__go"
                    disabled={submitting || keywordDraft.trim().length === 0}
                  >
                    {submitting ? "確認しています…" : "スタンプを押す"}
                  </button>
                </div>
              </form>
            ) : null}
            {gpsMode ? (
              <div className="play-keyword">
                <p className="play-gps__lead">
                  {spot.moment?.radiusM ? `半径${spot.moment.radiusM}m以内で押せます。` : "この場所の近くで押せます。"}
                </p>
                {gpsError ? <p className="play-keyword__error">{gpsError}</p> : null}
                <div className="play-dock">
                  <button type="button" className="play-dock__go" onClick={() => void submitGps()} disabled={submitting}>
                    {submitting ? "現在地を確認しています…" : "現在地でスタンプを押す"}
                  </button>
                </div>
              </div>
            ) : null}
            {spot.type === "stamp" && spot.moment && !keywordMode && !gpsMode ? (
              <PlayStampBurst
                message={spot.moment.stampMessage}
                animation={spot.moment.stampAnimation}
                already={alreadyStamped}
                imageUrl={spot.moment.stampImageUrl}
                sound={spot.moment.stampSound}
                soundUrl={spot.moment.stampSoundUrl}
              />
            ) : null}
            {spot.type === "stamp" && progress.completed && spot.moment && !keywordMode && !gpsMode ? (
              <PlayClearPanel
                moment={spot.moment}
                code={progress.rewardCode}
                used={progress.rewardUsed}
                points={progress.rewardPoints}
                pointsAwarded={progress.rewardPointsAwarded}
                badge={progress.rewardBadge}
                badgeAwarded={progress.rewardBadgeAwarded}
                badgeImage={progress.rewardBadgeImage}
                claimHref={`/auth?next=${encodeURIComponent(`/play/spot/${token}`)}`}
              />
            ) : null}
          </PlayProgressCard>
        ) : (
          <>
            {spot.type === "stamp" && spot.moment ? (
              <PlaySpotCopy
                intro={spot.moment.intro}
                description={spot.moment.description}
                hint={spot.moment.hint}
                imageUrl={spot.moment.imageUrl}
                videoUrl={spot.moment.videoUrl}
                imageAlt={spot.spotName}
              />
            ) : null}
            {keywordMode ? (
              <form className="play-keyword" onSubmit={(e) => void submitKeyword(e)}>
                <label>
                  この場所のキーワード
                  <input
                    value={keywordDraft}
                    onChange={(e) => setKeywordDraft(e.target.value)}
                    maxLength={40}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="done"
                    autoFocus
                    required
                  />
                </label>
                {keywordError ? <p className="play-keyword__error">{keywordError}</p> : null}
                <div className="play-dock">
                  <button
                    type="submit"
                    className="play-dock__go"
                    disabled={submitting || keywordDraft.trim().length === 0}
                  >
                    {submitting ? "確認しています…" : "スタンプを押す"}
                  </button>
                </div>
              </form>
            ) : null}
            {gpsMode ? (
              <div className="play-keyword">
                <p className="play-gps__lead">
                  {spot.moment?.radiusM ? `半径${spot.moment.radiusM}m以内で押せます。` : "この場所の近くで押せます。"}
                </p>
                {gpsError ? <p className="play-keyword__error">{gpsError}</p> : null}
                <div className="play-dock">
                  <button type="button" className="play-dock__go" onClick={() => void submitGps()} disabled={submitting}>
                    {submitting ? "現在地を確認しています…" : "現在地でスタンプを押す"}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
        {progress?.canReplay ? (
          <button type="button" className="play-clear__replay" disabled={replaying} onClick={() => void replay()}>
            {replaying ? "はじめています…" : "もう一周する"}
          </button>
        ) : null}
        {replayNote ? <p className="play-clear__replay-note">{replayNote}</p> : null}
        {needsLogin && replayNote ? (
          <Link
            className="play-join__login"
            href={`/auth?next=${encodeURIComponent(spot.joinPath || `/play/spot/${token}`)}`}
          >
            ログインする
          </Link>
        ) : null}
      </div>
    </main>
  );
}
