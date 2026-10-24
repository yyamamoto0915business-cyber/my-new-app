"use client";

import { PublishSuccessCard } from "@/components/publish/PublishSuccessCard";
import { MachiFeedCard } from "@/components/machi/MachiFeedCard";
import type { MachiFeedItem } from "@/lib/machi/feed";

type Props = {
  typeLabel: string;
  isPreview?: boolean;
  /** まちの情報に載ったカード（見本）。 */
  card?: MachiFeedItem;
};

export function GamePublishSuccess({ typeLabel, isPreview = false, card }: Props) {
  return (
    <PublishSuccessCard
      notice={
        card ? (
          <div style={{ display: "grid", gap: "0.4rem", justifyItems: "center", marginTop: "1rem" }}>
            <small style={{ fontSize: "0.74rem", color: "#5d6b62" }}>まちの情報に、このカードで載りました</small>
            <div style={{ width: "min(12rem, 70%)", textAlign: "left" }}>
              <MachiFeedCard item={card} />
            </div>
          </div>
        ) : undefined
      }
      description={
        <>
          {typeLabel}が公開されました。
          <br />
          まちの情報に掲載されました。地域の人に届くのを楽しみにしましょう！
        </>
      }
      primaryHref="/machi?kind=game"
      primaryLabel="まちの情報で見る"
      secondaryHref="/organizer/games"
      secondaryLabel="ゲーム機能に戻る"
      isPreview={isPreview}
    />
  );
}
