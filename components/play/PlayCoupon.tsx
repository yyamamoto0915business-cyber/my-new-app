"use client";

import { RewardLine } from "@/components/play/RewardLine";
import { useState } from "react";
import type { PublicCouponPlay, PublicCouponStore } from "@/lib/organizer/coupon-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";
import { usePlayCopy } from "@/components/play/usePlayCopy";

type Props = {
  token: string;
  coupon: PublicCouponPlay;
  progress: PlayProgress;
  onProgress: (progress: PlayProgress) => void;
};

export function PlayCoupon({ token, coupon, progress, onProgress }: Props) {
  const done = progress.coupon?.done ?? [];
  const needed = progress.coupon?.needed ?? coupon.needed;
  const autoGrant = progress.coupon?.autoGrant ?? coupon.autoGrant;
  const noStack = progress.coupon?.noStack ?? coupon.noStack;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = usePlayCopy();

  const active = coupon.stores.find((store) => store.index === activeIndex) ?? null;
  const collected = coupon.stores.filter((store) => done.includes(store.index));

  async function visit(store: PublicCouponStore) {
    if (saving || done.includes(store.index)) return;
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: stored.deviceToken,
          storeIndex: store.index,
        }),
      });
      const json = (await res.json()) as { progress?: PlayProgress; error?: string };
      if (!res.ok || !json.progress) {
        setError(json.error ?? "記録を保存できませんでした");
        return;
      }
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
        <h2>{copy.couponDone}</h2>
        <p>{copy.shopsVisited(done.length)}</p>
        {progress.rewardUsed ? (
          <p className="play-clear__used">{copy.used}</p>
        ) : progress.rewardCode ? (
          <>
            <p className="play-clear__code">{progress.rewardCode}</p>
            <p className="play-clear__code-note">{copy.showCode}</p>
          </>
        ) : (
          <p>{copy.msg(autoGrant ? "クーポンを受け取れます。" : "会場でクーポンを受け取れます。")}</p>
        )}
        {collected.map((store) => (
          <RewardLine key={store.index} text={store.name}>
            {store.name}
            {store.offer ? ` · ${store.offer}` : ""}
          </RewardLine>
        ))}
        {noStack ? <p className="game-test__meta">{copy.msg("クーポンの併用はできません。")}</p> : null}
      </div>
    );
  }

  if (active) {
    return (
      <div className="play-quiz">
        {active.imageUrl ? <img className="game-test__photo" src={active.imageUrl} alt="" /> : null}
        <h2>{active.name}</h2>
        {active.offer ? <p className="game-test__reward">{active.offer}</p> : null}
        {active.condition ? <p>{active.condition}</p> : null}
        {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
        <div className="play-dock play-dock--pair">
          <button type="button" className="play-dock__go" disabled={saving} onClick={() => void visit(active)}>
            {saving ? copy.recording : copy.stopBy}
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
          {done.length} / {needed} {copy.shops}
        </p>
      </div>
      <div className="game-test__list">
        {coupon.stores.map((store) => (
          <button
            key={store.index}
            type="button"
            className={done.includes(store.index) ? "game-test__item is-done" : "game-test__item"}
            onClick={() => {
              if (done.includes(store.index)) return;
              setActiveIndex(store.index);
              setError(null);
            }}
          >
            {store.name}
            <small>{done.includes(store.index) ? copy.visited : store.offer || store.category}</small>
          </button>
        ))}
      </div>
      {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
    </div>
  );
}
