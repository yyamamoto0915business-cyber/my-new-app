import type {
  NotificationItem,
  PendingFormItem,
} from "@/components/notifications/NotificationsView";

const PREVIEW_RECRUITMENT_ID = "preview-spring-fleamarket";

/** モックどおりのお知らせプレビュー用データ */
export function buildNotificationsPreview(): {
  notifications: NotificationItem[];
  pendingForms: PendingFormItem[];
  unreadCount: number;
  bannerLabel: string;
} {
  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

  const pendingForms: PendingFormItem[] = [
    {
      applicationId: "preview-app-1",
      recruitmentId: PREVIEW_RECRUITMENT_ID,
      title: "春のフリーマーケット",
      roleLabel: "受付スタッフ",
      formUrl: `/recruitments/${PREVIEW_RECRUITMENT_ID}/application-form`,
      requiredLabels: [
        "希望する役割",
        "参加可能時間",
        "応募メッセージ",
        "規約への同意",
      ],
      createdAt: minutesAgo(5),
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: "preview-n-1",
      user_id: "preview",
      type: "system_message",
      title: "応募フォームの入力が必要です",
      body: "必須項目を入力して提出しないと、応募は完了しません。",
      link: `/recruitments/${PREVIEW_RECRUITMENT_ID}/application-form`,
      read_at: null,
      created_at: minutesAgo(5),
    },
    {
      id: "preview-n-2",
      user_id: "preview",
      type: "system_message",
      title: "応募を受け付けました",
      body: "受付スタッフ｜春のフリーマーケット",
      link: `/recruitments/${PREVIEW_RECRUITMENT_ID}`,
      read_at: minutesAgo(25),
      created_at: minutesAgo(30),
    },
    {
      id: "preview-n-3",
      user_id: "preview",
      type: "system_message",
      title: "主催者からメッセージが届きました",
      body: "当日の集合場所についてご案内です。",
      link: "/messages",
      read_at: daysAgo(1),
      created_at: daysAgo(1),
    },
    {
      id: "preview-n-4",
      user_id: "preview",
      type: "system_message",
      title: "応募内容を確認しました",
      body: "主催者が応募内容を確認しました。",
      link: `/recruitments/${PREVIEW_RECRUITMENT_ID}`,
      read_at: daysAgo(2),
      created_at: daysAgo(2),
    },
    {
      id: "preview-n-5",
      user_id: "preview",
      type: "system_message",
      title: "ボランティア活動が完了しました",
      body: "ご参加ありがとうございました。",
      link: "/pass",
      read_at: daysAgo(3),
      created_at: daysAgo(3),
    },
    {
      id: "preview-n-6",
      user_id: "preview",
      type: "system_message",
      title: "イベント開始のリマインド",
      body: "明日の集合時間をお知らせします。",
      link: "/pass",
      read_at: daysAgo(3),
      created_at: daysAgo(3),
    },
  ];

  return {
    notifications,
    pendingForms,
    unreadCount: 1,
    bannerLabel: "プレビュー表示です（ダミーデータ・ログイン不要）",
  };
}
