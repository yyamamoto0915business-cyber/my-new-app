"use client";

import { RewardLine } from "@/components/play/RewardLine";
import { shrinkPhoto } from "@/components/play/shrinkPhoto";
import { useState } from "react";
import Link from "next/link";
import type { PublicPhotoPlay, PublicPhotoSpot } from "@/lib/organizer/photo-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";
import { usePlayCopy } from "@/components/play/usePlayCopy";

type Props = {
  token: string;
  photo: PublicPhotoPlay;
  progress: PlayProgress;
  onProgress: (progress: PlayProgress) => void;
  /** 主催者のプレビュー：この項目を開いたところから見せる。 */
  previewOpen?: number;
};

export function PlayPhoto({ token, photo, progress, onProgress, previewOpen }: Props) {
  const done = progress.photo?.done ?? [];
  const needed = progress.photo?.needed ?? photo.clearCount;
  const rewards = progress.photo?.rewards ?? photo.rewards;
  const [activeIndex, setActiveIndex] = useState<number | null>(previewOpen ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const copy = usePlayCopy();

  const active = photo.spots.find((spot) => spot.index === activeIndex) ?? null;

  /** GPS で確かめるスポットは、現在地を取ってから送る。 */
  function withHere(spot: PublicPhotoSpot, next: (here: { lat: number; lng: number } | null) => void) {
    if (spot.arrival !== "gps") {
      next(null);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("この端末では現在地を取れません");
      return;
    }
    setSaving(true);
    setNote("現在地を確認しています…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNote(null);
        next({
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

  function finish(next: PlayProgress) {
    setActiveIndex(null);
    setKeyword("");
    onProgress(next);
  }

  /** 写真が要らないスポット：着いたことを確かめて記録する。 */
  function shoot(spot: PublicPhotoSpot) {
    if (saving || done.includes(spot.index)) return;
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setError(null);
    withHere(spot, async (here) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/play/${encodeURIComponent(token)}/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceToken: stored.deviceToken, spotIndex: spot.index, here, keyword }),
        });
        const json = (await res.json()) as { progress?: PlayProgress; error?: string };
        if (!res.ok || !json.progress) {
          setError(json.error ?? "記録を保存できませんでした");
          return;
        }
        finish(json.progress);
      } catch {
        setError("通信エラーが発生しました");
      } finally {
        setSaving(false);
      }
    });
  }

  /** 写真が要るスポット：撮った写真を送る（着いたことも一緒に確かめる）。 */
  function sendPhoto(spot: PublicPhotoSpot, file: File) {
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setError(null);
    withHere(spot, async (here) => {
      setSaving(true);
      setNote("写真を送っています…");
      try {
        const body = new FormData();
        body.set("deviceToken", stored.deviceToken);
        body.set("spotIndex", String(spot.index));
        body.set("keyword", keyword);
        if (here) {
          body.set("lat", String(here.lat));
          body.set("lng", String(here.lng));
        }
        body.set("file", await shrinkPhoto(file), "photo.jpg");
        const res = await fetch(`/api/play/${encodeURIComponent(token)}/photo-upload`, { method: "POST", body });
        const json = (await res.json()) as { progress?: PlayProgress; error?: string };
        if (!res.ok || !json.progress) {
          setError(json.error ?? "写真を送れませんでした");
          return;
        }
        finish(json.progress);
      } catch {
        setError("通信エラーが発生しました");
      } finally {
        setNote(null);
        setSaving(false);
      }
    });
  }

  if (progress.completed) {
    return (
      <div className="play-quiz">
        <p className="game-test__kicker">{copy.cleared}</p>
        <h2>{copy.photoDone}</h2>
        <p>{copy.photoScore(photo.spots.length, done.length)}</p>
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
        <h2>{active.name}</h2>
        {active.place ? <p className="game-test__meta">{active.place}</p> : null}
        {active.prompt ? <p>{active.prompt}</p> : null}
        {active.arrival ? (
          <p className="game-test__meta">
            {copy.msg(active.arrival === "gps" ? "着いたら、現在地で確かめます。" : "現地にある合言葉を入れて確かめます。")}
          </p>
        ) : null}
        {active.arrival === "keyword" ? (
          <input
            className="game-test__field"
            value={keyword}
            maxLength={40}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={copy.msg("現地の合言葉")}
            aria-label={copy.msg("現地の合言葉")}
          />
        ) : null}
        {note ? <p className="game-test__note">{copy.msg(note)}</p> : null}
        {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
        <div className="play-dock play-dock--pair">
          {photo.photoRequired ? (
            <label
              className="play-dock__go"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? copy.msg("送っています…") : copy.msg("写真を撮って送る")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                disabled={saving || (active.arrival === "keyword" && !keyword.trim())}
                style={{ display: "none" }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) sendPhoto(active, file);
                }}
              />
            </label>
          ) : (
            <button
              type="button"
              className="play-dock__go"
              disabled={saving || (active.arrival === "keyword" && !keyword.trim())}
              onClick={() => shoot(active)}
            >
              {saving ? copy.recording : copy.msg(active.arrival === "gps" ? "現在地で確かめる" : active.actionLabel)}
            </button>
          )}
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
        {photo.spots.map((spot) => (
          <button
            key={spot.index}
            type="button"
            className={done.includes(spot.index) ? "game-test__item is-done" : "game-test__item"}
            onClick={() => {
              if (done.includes(spot.index)) return;
              setActiveIndex(spot.index);
              setError(null);
            }}
          >
            {spot.name}
            <small>{done.includes(spot.index) ? copy.recorded : spot.place || copy.msg("撮影スポット")}</small>
          </button>
        ))}
      </div>
      {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
    </div>
  );
}
