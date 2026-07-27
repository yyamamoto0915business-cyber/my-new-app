import {
  createDefaultApplicationFormConfig,
  type ApplicationFormAnswers,
  type ApplicationFormConfig,
} from "@/lib/recruitment-application-form";
import type {
  ApplicationFormProfile,
  ApplicationFormRecruitmentSummary,
} from "@/components/recruitments/ApplicationFormPcView";

const PREVIEW_RECRUITMENT_ID = "preview-spring-fleamarket";

/** 全項目ONの応募フォームプレビュー */
export function buildApplicationFormPreview(): {
  recruitmentId: string;
  recruitment: ApplicationFormRecruitmentSummary;
  config: ApplicationFormConfig;
  profile: ApplicationFormProfile;
  email: string;
  initialAnswers: ApplicationFormAnswers;
  lockedRoleNames: string[];
  bannerLabel: string;
} {
  const base = createDefaultApplicationFormConfig();
  const config: ApplicationFormConfig = {
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

  const start = new Date("2025-02-12T09:30:00+09:00");
  const end = new Date("2025-02-12T12:00:00+09:00");

  return {
    recruitmentId: PREVIEW_RECRUITMENT_ID,
    recruitment: {
      id: PREVIEW_RECRUITMENT_ID,
      title: "春のフリーマーケット",
      description:
        "来場者の受付と案内をお願いします。笑顔で対応いただける方を歓迎します。",
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      meeting_place: "中央公園 正面入口（東京都）",
      roles: [
        { name: "受付", count: 3 },
        { name: "会場誘導", count: 2 },
        { name: "運営補助", count: 2 },
      ],
      provisions: "交通費支給・昼食あり",
      items_to_bring: "動きやすい服装",
      notes: "雨天決行",
      organizerName: "まちの実行委員会",
      coverImageUrl:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop&q=80",
    },
    config,
    profile: {
      displayName: "山本 雄太",
      phone: "090-1234-5678",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80",
    },
    email: "yamamoto@example.com",
    initialAnswers: {
      desired_role: "受付",
      available_time: "終日参加可",
      terms: true,
    },
    lockedRoleNames: ["会場誘導", "運営補助"],
    bannerLabel: "プレビュー：全項目ON（ログイン不要）",
  };
}
