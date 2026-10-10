"use client";

import { useState } from "react";
import { GameTestSheet } from "@/components/organizer/games/GameTestSheet";
import type { CouponStore, CouponWinMode } from "@/lib/organizer/coupon";

type Props = {
  name: string;
  description: string;
  stores: CouponStore[];
  winMode: CouponWinMode;
  winCount: number;
  oncePerPerson: boolean;
  noStack: boolean;
  autoGrant: boolean;
  onClose: () => void;
};

export function CouponTestPlay({
  name,
  description,
  stores,
  winMode,
  winCount,
  oncePerPerson,
  noStack,
  autoGrant,
  onClose,
}: Props) {
  const visible = stores.filter((store) => store.published && store.name.trim());
  const needed =
    winMode === "all" ? Math.max(visible.length, 1) : Math.min(Math.max(winCount, 1), Math.max(visible.length, 1));
  const [started, setStarted] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const title = name.trim() || "クーポンラリー";
  const active = visible.find((store) => store.key === activeKey) ?? null;
  const collected = visible.filter((store) => done.includes(store.key));

  function reset() {
    setStarted(false);
    setActiveKey(null);
    setDone([]);
    setFinished(false);
  }

  function visit(key: string) {
    const next = done.includes(key) ? done : [...done, key];
    setDone(next);
    if (next.length >= needed) setFinished(true);
    else setActiveKey(null);
  }

  return (
    <GameTestSheet onClose={onClose}>
      {visible.length === 0 ? (
        <div className="play-game__card">
          <h2>{title}</h2>
          <p>店舗を1つ入れてから、お試しできます。</p>
        </div>
      ) : !started ? (
        <div className="play-game__card play-start">
          <h2>{title}</h2>
          {description.trim() ? <p>{description.trim()}</p> : null}
          <p className="play-game__meta">
            {visible.length}店舗 · {needed}店舗でクーポン
          </p>
          {oncePerPerson ? <p className="game-test__meta">1人1回です。</p> : null}
          <button type="button" className="play-start__go" onClick={() => setStarted(true)}>
            めぐりをはじめる
          </button>
        </div>
      ) : finished ? (
        <div className="play-game__card">
          <p className="game-test__kicker">クリア</p>
          <h2>クーポン獲得</h2>
          <p>
            {done.length}店舗をまわりました。
            {autoGrant ? "クーポンを受け取れます。" : "会場でクーポンを受け取れます。"}
          </p>
          {collected.map((store) => (
            <p key={store.key} className="game-test__reward">
              {store.name}
              {store.offer ? ` · ${store.offer}` : ""}
            </p>
          ))}
          {noStack ? <p className="game-test__meta">クーポンの併用はできません。</p> : null}
          <button type="button" className="play-start__go" onClick={reset}>
            はじめから
          </button>
        </div>
      ) : active ? (
        <div className="play-game__card">
          {active.imageUrl ? <img className="game-test__photo" src={active.imageUrl} alt="" /> : null}
          <h2>{active.name}</h2>
          {active.offer ? <p className="game-test__reward">{active.offer}</p> : null}
          {active.condition ? <p>{active.condition}</p> : null}
          <button type="button" className="play-start__go" onClick={() => visit(active.key)}>
            この店に寄る
          </button>
          <button type="button" className="game-test__back" onClick={() => setActiveKey(null)}>
            一覧へ戻る
          </button>
        </div>
      ) : (
        <div className="play-game__card">
          <div className="game-test__top">
            <p>{title}</p>
            <span>
              {done.length} / {needed}
            </span>
          </div>
          <div className="game-test__list">
            {visible.map((store) => (
              <button
                key={store.key}
                type="button"
                className={done.includes(store.key) ? "game-test__item is-done" : "game-test__item"}
                onClick={() => {
                  if (!done.includes(store.key)) setActiveKey(store.key);
                }}
              >
                {store.name}
                <small>{done.includes(store.key) ? "寄りました" : store.offer || store.category}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </GameTestSheet>
  );
}
