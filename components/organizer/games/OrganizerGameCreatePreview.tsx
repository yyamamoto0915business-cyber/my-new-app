"use client";

import { Smartphone, Stamp } from "lucide-react";

export type GameCreatePreviewSpot = {
  key: string;
  name: string;
  kindLabel: string;
};

type Props = {
  name: string;
  description: string;
  typeLabel: string;
  periodLabel: string | null;
  eventTitle: string | null;
  spots: GameCreatePreviewSpot[];
};

export function OrganizerGameCreatePreview({
  name,
  description,
  typeLabel,
  periodLabel,
  eventTitle,
  spots,
}: Props) {
  const title = name.trim() || "ゲーム名";
  const desc = description.trim();
  const spotCount = spots.length;

  return (
    <aside id="game-create-preview" className="org-game-preview">
      <div className="org-game-preview__head">
        <h2>参加者画面プレビュー</h2>
        <p>入力した内容が、参加画面でどう見えるかのイメージです。</p>
      </div>
      <div className="org-game-preview__phone" aria-hidden={false}>
        <div className="org-game-preview__notch" aria-hidden />
        <div className="org-game-preview__screen">
          <p className="org-game-preview__kicker">{typeLabel}</p>
          <div className="org-game-preview__hero">
            <span className="org-game-preview__hero-icon" aria-hidden>
              <Stamp className="h-6 w-6" strokeWidth={1.7} />
            </span>
            <h3>{title}</h3>
            {desc ? <p>{desc}</p> : <p>説明を書くと、ここに表示されます。</p>}
          </div>
          {eventTitle ? <p className="org-game-preview__meta">対象：{eventTitle}</p> : null}
          {periodLabel ? <p className="org-game-preview__meta">{periodLabel}</p> : null}
          <p className="org-game-preview__count">
            {spotCount === 0 ? "0 / — スポット" : `0 / ${spotCount} スポット`}
          </p>
          {spotCount === 0 ? (
            <div className="org-game-preview__empty">スポットを追加すると、ここに並びます。</div>
          ) : (
            <ol className="org-game-preview__spots">
              {spots.map((spot, index) => (
                <li key={spot.key}>
                  <span className="org-game-preview__spot-mark" aria-hidden>
                    {index + 1}
                  </span>
                  <span>
                    {spot.name.trim() || `スポット ${index + 1}`}
                    <em>{spot.kindLabel}</em>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      <p className="org-game-preview__note">
        <Smartphone className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        イメージです。実際の参加画面と少し違うことがあります。
      </p>
    </aside>
  );
}
