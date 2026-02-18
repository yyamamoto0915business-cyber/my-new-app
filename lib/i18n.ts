export type Locale = "ja" | "en";

export const tagLabels: Record<Locale, Record<string, string>> = {
  ja: {
    free: "無料",
    kids: "子供向け",
    beginner: "初心者歓迎",
    rain_ok: "雨天OK",
    indoor: "屋内",
    english: "英語対応",
    tourist: "観光客向け",
    student: "学生限定",
  },
  en: {
    free: "Free",
    kids: "Kids",
    beginner: "Beginner",
    rain_ok: "Rain OK",
    indoor: "Indoor",
    english: "English",
    tourist: "Tourist-friendly",
    student: "Students only",
  },
};

export const translations: Record<
  Locale,
  {
    event: string;
    platformTitle: string;
    platformSubtitle: string;
    eventRequests: string;
    recruitments: string;
    forOrganizers: string;
    viewAllEvents: string;
    viewAllRecruitments: string;
    viewDetails: string;
    more: string;
    noUpcomingEvents: string;
    noRecruitments: string;
    login: string;
    sectionEvents: string;
    sectionRecruitments: string;
  }
> = {
  ja: {
    event: "イベント",
    platformTitle: "地域イベントプラットフォーム",
    platformSubtitle: "地域のイベントを探して、参加しよう",
    eventRequests: "やってほしいイベント",
    recruitments: "募集一覧",
    forOrganizers: "主催者向け",
    viewAllEvents: "すべてのイベントを見る",
    viewAllRecruitments: "募集一覧を見る",
    viewDetails: "詳しく見る",
    more: "More",
    noUpcomingEvents: "近日のイベントはありません",
    noRecruitments: "募集中の案件はありません",
    login: "ログイン",
    sectionEvents: "イベント",
    sectionRecruitments: "ボランティア・募集",
  },
  en: {
    event: "Events",
    platformTitle: "Regional Event Platform",
    platformSubtitle: "Find local events and participate",
    eventRequests: "Event Requests",
    recruitments: "Recruitments",
    forOrganizers: "For Organizers",
    viewAllEvents: "View All Events",
    viewAllRecruitments: "View Recruitments",
    viewDetails: "View Details",
    more: "More",
    noUpcomingEvents: "No upcoming events",
    noRecruitments: "No recruitments",
    login: "Login",
    sectionEvents: "Events",
    sectionRecruitments: "Volunteer & Recruitments",
  },
};
