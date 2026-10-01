"use client";

import { PublishSuccessCard } from "@/components/publish/PublishSuccessCard";

type Props = {
  typeLabel: string;
  isPreview?: boolean;
};

export function GamePublishSuccess({ typeLabel, isPreview = false }: Props) {
  return (
    <PublishSuccessCard
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
