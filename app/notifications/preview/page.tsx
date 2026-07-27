import type { Metadata } from "next";
import { NotificationsView } from "@/components/notifications/NotificationsView";
import { buildNotificationsPreview } from "@/lib/notifications-preview";

export const metadata: Metadata = {
  title: "お知らせ（プレビュー） | MachiGlyph",
  description: "応募フォーム入力案内のお知らせ画面プレビュー（ログイン不要）",
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
      unreadCount={preview.unreadCount}
      previewBanner={preview.bannerLabel}
    />
  );
}
