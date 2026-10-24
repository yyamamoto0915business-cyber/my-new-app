"use client";

import { RewardLine } from "@/components/play/RewardLine";
import { shrinkPhoto } from "@/components/play/shrinkPhoto";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicMission, PublicMissionPlay } from "@/lib/organizer/mission-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";
import { usePlayCopy } from "@/components/play/usePlayCopy";

type Props = {
  token: string;
  mission: PublicMissionPlay;
  progress: PlayProgress;
  onProgress: (progress: PlayProgress) => void;
};

export function PlayMission({ token, mission, progress, onProgress }: Props) {
  const done = progress.mission?.done ?? [];
  const needed = progress.mission?.needed ?? mission.clearCount;
  const rewards = progress.mission?.rewards ?? mission.rewards;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  /** 「友だちと参加」：相手が同じ合言葉を入れるのを待っている言葉。 */
  const [pairWaiting, setPairWaiting] = useState<string | null>(null);
  /** 「クイズに答える」で選んだ答え。 */
  const [picked, setPicked] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = usePlayCopy();

  const active = mission.missions.find((item) => item.index === activeIndex) ?? null;

  /** GPS で確かめるミッションは、現在地を取ってから送る。 */
  function completeHere(item: PublicMission) {
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
        void complete(item, {
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

  /** 「友だちと参加」：ふたりで決めた合言葉を送る。先に送った人は、相手が送るまで待つ。 */
  async function sendPair(item: PublicMission, word: string, quiet = false) {
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    if (!quiet) {
      setSaving(true);
      setError(null);
    }
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/mission-pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken: stored.deviceToken, missionIndex: item.index, word }),
      });
      const json = (await res.json()) as { done?: boolean; waiting?: boolean; progress?: PlayProgress; error?: string };
      if (!res.ok || !json.progress) {
        if (!quiet) setError(json.error ?? "合言葉を確かめられませんでした");
        return;
      }
      if (json.done) {
        setPairWaiting(null);
        setKeyword("");
        setActiveIndex(null);
        onProgress(json.progress);
        return;
      }
      setPairWaiting(word);
    } catch {
      if (!quiet) setError("通信エラーが発生しました");
    } finally {
      if (!quiet) setSaving(false);
    }
  }

  // 待っているあいだは、5秒ごとに相手が入れたか確かめる（10分まで）。
  const pairTarget = mission.missions.find((item) => item.index === activeIndex && item.kind === "friends") ?? null;
  useEffect(() => {
    if (!pairWaiting || !pairTarget) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started > 10 * 60 * 1000) {
        window.clearInterval(timer);
        return;
      }
      void sendPair(pairTarget, pairWaiting, true);
    }, 5000);
    return () => window.clearInterval(timer);
    // 待つ言葉か、開いているミッションが変わったときだけ、やり直す。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairWaiting, pairTarget?.index]);

  /** 「写真を投稿」：撮った写真を送ると達成。 */
  async function sendPhoto(item: PublicMission, file: File) {
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setSaving(true);
    setError(null);
    setNote("写真を送っています…");
    try {
      const body = new FormData();
      body.set("deviceToken", stored.deviceToken);
      body.set("missionIndex", String(item.index));
      body.set("file", await shrinkPhoto(file), "photo.jpg");
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/mission-photo`, { method: "POST", body });
      const json = (await res.json()) as { progress?: PlayProgress; error?: string };
      if (!res.ok || !json.progress) {
        setNote(null);
        setError(json.error ?? "写真を送れませんでした");
        return;
      }
      setNote(null);
      setActiveIndex(null);
      onProgress(json.progress);
    } catch {
      setNote(null);
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  async function complete(item: PublicMission, here: { lat: number; lng: number } | null = null) {
    if (saving || done.includes(item.index)) return;
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/mission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: stored.deviceToken,
          missionIndex: item.index,
          keyword,
          here,
          choice: picked,
        }),
      });
      const json = (await res.json()) as {
        done?: boolean;
        note?: string;
        progress?: PlayProgress;
        error?: string;
      };
      if (!res.ok || !json.progress) {
        setError(json.error ?? "達成を保存できませんでした");
        return;
      }
      if (!json.done) {
        setNote(json.note || "ちがいます。もう一度どうぞ。");
        return;
      }
      setKeyword("");
      setPicked(null);
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
        <h2>{copy.missionDone}</h2>
        <p>{copy.missionScore(mission.missions.length, done.length)}</p>
        {progress.quizRank ? <p className="play-clear__points">{copy.rankLine(progress.quizRank)}</p> : null}
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
          .filter((line) => line !== "ポイントが残ります。")
          .map((line) => (
            <RewardLine key={line} text={line}>{copy.msg(line)}</RewardLine>
          ))}
      </div>
    );
  }

  if (active) {
    return (
      <div className="play-quiz">
        <p className="game-test__kicker">{copy.msg(active.kindLabel)}</p>
        <h2>{active.name}</h2>
        {active.condition ? <p>{active.condition}</p> : null}
        {active.arrival ? (
          <p className="game-test__meta">
            {active.place ? `${active.place}・` : ""}
            {copy.msg(active.arrival === "gps" ? "着いたら、現在地で確かめます。" : "現地にある合言葉を入れて確かめます。")}
          </p>
        ) : null}
        {active.question && active.choices ? (
          <>
            <p style={{ margin: "0.4rem 0 0", fontWeight: 800 }}>{active.question}</p>
            <div className="game-test__choices">
              {active.choices.map((choice, index) => (
                <button
                  key={`${index}-${choice}`}
                  type="button"
                  className={picked === index ? "game-test__choice is-right" : "game-test__choice"}
                  aria-pressed={picked === index}
                  onClick={() => {
                    setPicked(index);
                    setNote(null);
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          </>
        ) : null}
        {active.kind === "friends" ? (
          <>
            <p className="game-test__meta">
              {copy.msg("友だちとふたりで合言葉を決めて、それぞれの画面で同じ言葉を入れてください。10分以内にふたりが入れると、ふたりとも達成です。")}
            </p>
            {pairWaiting ? (
              <p className="game-test__note is-right">
                {copy.msg("友だちが同じ合言葉を入れるのを待っています…")}（{pairWaiting}）
              </p>
            ) : (
              <input
                className="game-test__field"
                value={keyword}
                maxLength={40}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={copy.msg("ふたりで決めた合言葉")}
                aria-label={copy.msg("ふたりで決めた合言葉")}
              />
            )}
          </>
        ) : null}
        {(active.kind === "keyword" || active.arrival === "keyword") ? (
          <input
            className="game-test__field"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={active.arrival === "keyword" ? copy.msg("現地の合言葉") : copy.passphrase}
            aria-label={active.arrival === "keyword" ? copy.msg("現地の合言葉") : copy.passphrase}
          />
        ) : null}
        {note ? <p className="game-test__note">{copy.msg(note)}</p> : null}
        {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
        <div className="play-dock play-dock--pair">
          {active.kind === "friends" ? (
            <button
              type="button"
              className="play-dock__go"
              disabled={saving || (!pairWaiting && keyword.trim().length < 2)}
              onClick={() => void sendPair(active, pairWaiting ?? keyword)}
            >
              {saving ? copy.recording : copy.msg(pairWaiting ? "いま確かめる" : "合言葉を送る")}
            </button>
          ) : active.kind === "photo" ? (
            <label className="play-dock__go" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? copy.msg("写真を送っています…") : copy.msg("写真を撮って送る")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                disabled={saving}
                style={{ display: "none" }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void sendPhoto(active, file);
                }}
              />
            </label>
          ) : (
          <button
            type="button"
            className="play-dock__go"
            disabled={saving || (Boolean(active.choices) && picked == null)}
            onClick={() => (active.arrival === "gps" ? completeHere(active) : void complete(active))}
          >
            {saving ? copy.recording : copy.msg(active.actionLabel)}
          </button>
          )}
          <button
            type="button"
            className="play-dock__ghost"
            onClick={() => {
              setActiveIndex(null);
              setNote(null);
              setKeyword("");
              setPicked(null);
              setPairWaiting(null);
            }}
          >
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
          {done.length} / {needed} {copy.doneWord}
        </p>
      </div>
      <div className="game-test__list">
        {mission.missions.map((item) => (
          <button
            key={item.index}
            type="button"
            className={done.includes(item.index) ? "game-test__item is-done" : "game-test__item"}
            onClick={() => {
              if (done.includes(item.index)) return;
              setActiveIndex(item.index);
              setNote(null);
              setError(null);
            }}
          >
            {item.name}
            <small>{done.includes(item.index) ? copy.achieved : copy.msg(item.kindLabel)}</small>
          </button>
        ))}
      </div>
      {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
    </div>
  );
}
