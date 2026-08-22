import type { Metadata } from "next";
import { NotificationsView } from "@/components/notifications/NotificationsView";
import { buildNotificationsPreview } from "@/lib/notifications-preview";

export const metadata: Metadata = {
  title: "お知らせ（プレビュー） | MachiGlyph",
  description: "フォロー・応募フォームなどお知らせ画面のプレビュー（ログイン不要）",
};

/**
 * ログイン不要。
 * 本番の /notifications と同じ NotificationsView で見た目を確認する。
 */
export default function NotificationsPreviewPage() {
  const preview = buildNotificationsPreview();

  return (
    <NotificationsView
      notifications={preview.notifications}
      pendingForms={preview.pendingForms}
      pendingFollows={preview.pendingFollows}
      unreadCount={preview.unreadCount}
      previewBanner={preview.bannerLabel}
    />
  );
}
