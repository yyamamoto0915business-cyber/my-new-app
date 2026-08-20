/** マイページ用サマリーの共有型 */

export type MypageNextEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  imageUrl: string | null;
  passHref: string;
};

export type MypageNextVolunteer = {
  id: string;
  recruitmentId: string;
  title: string;
  roleLabel: string | null;
  startAt: string | null;
  meetingPlace: string | null;
  imageUrl: string | null;
  statusLabel: string;
  href: string;
};

export type MypagePostPreview = {
  id: string;
  title: string;
  imageUrl: string | null;
  dateLabel: string;
  likeCount: number;
  commentCount: number;
  href: string;
};

export type MypageActivityItem = {
  id: string;
  dateLabel: string;
  text: string;
  href: string;
  thumbUrl?: string | null;
};

export type MypageSummaryResponse = {
  profile: {
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    region: string | null;
    isOrganizerRegistered: boolean;
  };
  stats: {
    participated: number;
    posts: number;
    volunteer: number;
    favorites: number;
  };
  counts: {
    planned: number;
    interested: number;
    passes: number;
    volunteerApplications: number;
  };
  nextEvent: MypageNextEvent | null;
  nextVolunteer: MypageNextVolunteer | null;
  posts: MypagePostPreview[];
  activity: MypageActivityItem[];
};

export function volunteerStatusLabel(status: string): string {
  switch (status) {
    case "accepted":
    case "confirmed":
    case "checked_in":
      return "確定";
    case "completed":
      return "完了";
    case "rejected":
      return "見送り";
    case "canceled":
      return "キャンセル";
    case "on_hold":
    case "pending":
    case "applied":
    default:
      return "確認中";
  }
}

export function isConfirmedVolunteerStatus(status: string): boolean {
  return (
    status === "accepted" ||
    status === "confirmed" ||
    status === "checked_in" ||
    status === "completed"
  );
}
