"use client";

import { RewardLine } from "@/components/play/RewardLine";
import { useState } from "react";
import Link from "next/link";
import type { PublicCheckinPlay, PublicCheckinSpot } from "@/lib/organizer/checkin-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";
import { usePlayCopy } from "@/components/play/usePlayCopy";

type Props = {
  token: string;
  checkin: PublicCheckinPlay;
  progress: PlayProgress;
  onProgress: (progress: PlayProgress) => void;
};

export function PlayCheckin({ token, checkin, progress, onProgress }: Props) {
  const done = progress.checkin?.done ?? [];
  const needed = progress.checkin?.needed ?? checkin.needed;
  const rewards = progress.checkin?.rewards ?? checkin.rewards;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = usePlayCopy();

  const active = checkin.spots.find((spot) => spot.index === activeIndex) ?? null;

  /** GPS のスポットは、現在地を取ってから記録する（地図で場所が決まっていれば、範囲にいるかをサーバーで確かめる）。 */
  function recordHere(spot: PublicCheckinSpot) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("この端末では現在地を取れません");
      return;
    }
    setSaving(true);
    setError(null);
    setNote("現在地を確認しています…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSaving(false);
        setNote(null);
        void record(spot, {
          lat: Math.round(position.coords.latitude * 1e6) / 1e6,
          lng: Math.round(position.coords.longitude * 1e6) / 1e6,
        });
      },
      () => {
        setSaving(false);
        setNote(null);
        setError("現在地を取得できませんでした。位置情報を許可して、もう一度押してください。");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  async function record(spot: PublicCheckinSpot, here: { lat: number; lng: number } | null = null) {
    if (saving || done.includes(spot.index)) return;
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: stored.deviceToken,
          spotIndex: spot.index,
          keyword,
          here,
        }),
      });
      const json = (await res.json()) as {
        done?: boolean;
        note?: string;
        progress?: PlayProgress;
        error?: string;
      };
      if (!res.ok || !json.progress) {
        setError(json.error ?? "記録を保存できませんでした");
        return;
      }
      if (!json.done) {
        setNote(json.note || "ちがいます。もう一度どうぞ。");
        return;
      }
      setKeyword("");
      setNote(null);
      setActiveIndex(null);
      onProgress(json.progress);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (progress.completed) {
    return (
      <div className="play-quiz">
        <p className="game-test__kicker">{copy.cleared}</p>
        <h2>{copy.checkinDone}</h2>
        <p>{copy.checkinScore(checkin.spots.length, done.length)}</p>
        {progress.quizRank ? <p className="play-clear__points">{copy.rankLine(progress.quizRank)}</p> : null}
        {progress.rewardUsed ? (
          <p className="play-clear__used">{copy.used}</p>
        ) : progress.rewardCode ? (
          <>
            <p className="game-test__kicker" style={{ margin: "0.8rem 0 0" }}>
              {copy.msg(rewards.some((line) => line.startsWith("クーポン")) ? "クーポンのコード" : "景品の引き換えコード")}
            </p>
            <p className="play-clear__code">{progress.rewardCode}</p>
            <p className="play-clear__code-note">{copy.showCode}</p>
          </>
        ) : null}
        {progress.rewardPoints ? (
          progress.rewardPointsAwarded ? (
            <>
              <p className="play-clear__points">{copy.pointsGot(progress.rewardPoints)}</p>
              <Link className="play-join__login" href="/points">
                {copy.seePoints}
              </Link>
            </>
          ) : (
            <p className="play-clear__points">{copy.pointsReady(progress.rewardPoints)}</p>
          )
        ) : null}
        {rewards
          .filter((line) => !line.includes("ポイントが残ります"))
          .map((line) => (
            <RewardLine key={line} text={line}>{copy.msg(line)}</RewardLine>
          ))}
      </div>
    );
  }

  if (active) {
    return (
      <div className="play-quiz">
        {active.imageUrl ? <img className="game-test__photo" src={active.imageUrl} alt="" /> : null}
        <p className="game-test__kicker">{copy.msg(active.methodLabel)}</p>
        <h2>{active.name}</h2>
        {active.place ? <p>{active.place}</p> : null}
        {active.method === "gps" ? <p className="game-test__meta">{copy.nearRadius(active.radius)}</p> : null}
        {active.method === "gps" && note ? <p className="game-test__note">{copy.msg(note)}</p> : null}
        {active.method === "keyword" ? (
          <>
            <input
              className="game-test__field"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={copy.keywordPlaceholder}
              aria-label={copy.keywordPlaceholder}
            />
            {note ? <p className="game-test__note">{copy.msg(note)}</p> : null}
          </>
        ) : null}
        {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
        <div className="play-dock play-dock--pair">
          <button
            type="button"
            className="play-dock__go"
            disabled={saving}
            onClick={() => (active.method === "gps" ? recordHere(active) : void record(active))}
          >
            {saving ? copy.recording : active.method === "keyword" ? copy.msg("答える") : copy.msg(active.actionLabel)}
          </button>
          <button type="button" className="play-dock__ghost" onClick={() => setActiveIndex(null)}>
            {copy.backToList}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="play-quiz">
      <div className="game-test__top">
        <p>
          {done.length} / {needed} {copy.places}
        </p>
      </div>
      <div className="game-test__list">
        {checkin.spots.map((spot) => (
          <button
            key={spot.index}
            type="button"
            className={done.includes(spot.index) ? "game-test__item is-done" : "game-test__item"}
            onClick={() => {
              if (done.includes(spot.index)) return;
              setActiveIndex(spot.index);
              setKeyword("");
              setNote(null);
              setError(null);
            }}
          >
            {spot.name}
            <small>{done.includes(spot.index) ? copy.recorded : copy.msg(spot.methodLabel)}</small>
          </button>
        ))}
      </div>
      {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
    </div>
  );
}
