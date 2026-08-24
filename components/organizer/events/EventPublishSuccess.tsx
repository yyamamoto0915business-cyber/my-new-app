"use client";

import { PublishSuccessCard } from "@/components/publish/PublishSuccessCard";
import { hasPublicPublishTargetId } from "@/lib/dev-publish-success-preview";

type Props = {
  eventId: string;
  isPreview?: boolean;
};

export function EventPublishSuccess({ eventId, isPreview = false }: Props) {
  const hasPublicPage = hasPublicPublishTargetId(eventId);

  return (
    <PublishSuccessCard
      description={
        <>
          イベントが公開されました。
          <br />
          地域の人に届くのを楽しみにしましょう！
        </>
      }
      primaryHref={hasPublicPage ? `/events/${eventId}` : "/"}
      primaryLabel={hasPublicPage ? "イベントページを表示" : "ホームを見る"}
      secondaryHref="/organizer/events"
      secondaryLabel="イベント管理に戻る"
      isPreview={isPreview}
    />
  );
}
