import {
  createDefaultApplicationFormConfig,
  type ApplicationFormAnswers,
  type ApplicationFormConfig,
} from "@/lib/recruitment-application-form";
import type { Application } from "@/components/organizer/applications/ApplicationCard";

const PREVIEW_RECRUITMENT_ID = "preview-spring-fleamarket";

/** 全項目入力済みの応募確認プレビュー用データ */
export function buildApplicationsConfirmPreview(): {
  recruitmentId: string;
  recruitmentTitle: string;
  recruitmentDescription: string;
  eventTitle: string;
  startAt: string;
  endAt: string;
  capacity: number;
  roles: { name: string; count: number }[];
  formConfig: ApplicationFormConfig;
  applications: Application[];
  bannerLabel: string;
} {
  const base = createDefaultApplicationFormConfig();
  const formConfig: ApplicationFormConfig = {
    fields: base.fields.map((f) => ({ ...f, enabled: true })),
    customQuestions: [
      {
        id: "cq-transport",
        label: "交通手段を教えてください",
        answerType: "select",
        required: false,
        options: ["電車", "バス", "自転車", "徒歩", "車", "その他"],
      },
    ],
  };

  const startAt = "2026-04-25T09:30:00+09:00";
  const endAt = "2026-04-25T12:00:00+09:00";
  const completedAt = "2026-04-08T21:21:00+09:00";

  const fullAnswers: ApplicationFormAnswers = {
    phone: "090-1234-5678",
    age: "28",
    desired_role: "受付",
    available_time: "終日参加可",
    message:
      "地域のイベントに興味があり応募しました。受付経験がありますので、笑顔で対応します。",
    experience: "フリーマーケット受付2回、地域お祭り誘導1回",
    self_intro: "近隣に住んでおり、まちの活動に関わりたいと思っています。",
    terms: true,
    emergency_contact: "090-9876-5432（母）",
    "cq-transport": "電車",
  };

  const applications: Application[] = [
    {
      id: "preview-app-1",
      user_id: "preview-user-1",
      status: "pending",
      message: fullAnswers.message as string,
      role_assigned: "受付",
      checked_in_at: null,
      organizer_memo: "",
      form_answers: fullAnswers,
      form_completed_at: completedAt,
      created_at: completedAt,
      user: {
        display_name: "山本 雄太",
        email: "yu.091315@icloud.com",
      },
    },
    {
      id: "preview-app-2",
      user_id: "preview-user-2",
      status: "accepted",
      message: "参加できる時間帯が合うので応募しました。",
      role_assigned: "会場誘導",
      checked_in_at: null,
      organizer_memo: "経験あり。当日は早め到着予定。",
      form_answers: {
        phone: "080-2222-3333",
        age: "35",
        desired_role: "会場誘導",
        available_time: "午前のみ",
        message: "参加できる時間帯が合うので応募しました。",
        experience: "スポーツイベント誘導の経験あり",
        self_intro: "近隣在住です。",
        terms: true,
        emergency_contact: "080-1111-2222（配偶者）",
        "cq-transport": "自転車",
      },
      form_completed_at: "2026-04-07T18:00:00+09:00",
      created_at: "2026-04-07T18:00:00+09:00",
      user: {
        display_name: "佐藤 美咲",
        email: "misaki.sato@example.com",
      },
    },
    {
      id: "preview-app-3",
      user_id: "preview-user-3",
      status: "pending",
      message: null,
      role_assigned: null,
      checked_in_at: null,
      organizer_memo: null,
      form_answers: null,
      form_completed_at: null,
      created_at: "2026-04-09T10:15:00+09:00",
      user: {
        display_name: "田中 健",
        email: "ken.tanaka@example.com",
      },
    },
  ];

  return {
    recruitmentId: PREVIEW_RECRUITMENT_ID,
    recruitmentTitle: "春のフリーマーケット",
    recruitmentDescription:
      "来場者の受付と案内をお願いします。笑顔で対応いただける方を歓迎します。",
    eventTitle: "春のフリーマーケット 2026",
    startAt,
    endAt,
    capacity: 7,
    roles: [
      { name: "受付", count: 3 },
      { name: "会場誘導", count: 2 },
      { name: "運営補助", count: 2 },
    ],
    formConfig,
    applications,
    bannerLabel: "プレビュー：応募確認（全項目入力済み・ログイン不要）",
  };
}
