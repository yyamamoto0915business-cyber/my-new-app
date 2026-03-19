/** マイページダッシュボード用モック・ユーティリティ */

import type { Event } from "./db/types";
import { getEvents, getEventById } from "./events";
import { getAllVolunteerRoles } from "./volunteer-roles-mock";
import { getCreatedVolunteerRoles } from "./created-volunteer-roles-store";
import { getThreadsForVolunteer } from "./dm-mock";
import type { VolunteerRole } from "./volunteer-roles-mock";
import type { Thread } from "./dm-mock";

/** 参加予定イベント（モック） */
export function getUpcomingParticipations(userId: string): Event[] {
  const all = getEvents();
  const today = new Date().toISOString().split("T")[0];
  return all
    .filter((e) => e.date >= today)
    .slice(0, 5);
}

/** 保存したイベント（モック - 未実装時は空） */
export function getSavedEvents(_userId: string): Event[] {
  return [];
}

/** レビュー待ち（モック - 参加済みイベントで未レビュー） */
export function getReviewPending(_userId: string): Event[] {
  return [];
}

/** 参加履歴（モック） */
export function getParticipationHistory(_userId: string): Event[] {
  const all = getEvents();
  const today = new Date().toISOString().split("T")[0];
  return all.filter((e) => e.date < today).slice(0, 10);
}

/** ボランティア応募一覧（モック - DMスレッドから復元） */
export type VolunteerApplication = {
  id: string;
  volunteerRoleId: string;
  roleTitle: string;
  eventTitle: string;
  eventId: string;
  status: "確認中" | "確定" | "見送り";
  dateTime: string;
};

export function getVolunteerApplications(userId: string): VolunteerApplication[] {
  const threads = getThreadsForVolunteer(userId);
  const isProduction = process.env.NODE_ENV === "production";
  // 本番では初期シード（モック）のボランティア募集を混ぜない
  const roles = [
    ...(isProduction ? [] : getAllVolunteerRoles()),
    ...getCreatedVolunteerRoles(),
  ];

  return threads.map((t) => {
    const role = roles.find((r) => r.id === t.volunteerRoleId);
    const statusMap = { open: "確認中" as const, resolved: "確定" as const };
    return {
      id: t.id,
      volunteerRoleId: t.volunteerRoleId,
      roleTitle: role?.title ?? "ボランティア",
      eventTitle: role ? getEventById(role.eventId)?.title ?? "イベント" : "イベント",
      eventId: t.eventId,
      status: statusMap[t.status as keyof typeof statusMap] ?? "確認中",
      dateTime: role?.dateTime ?? t.lastMessageAt,
    };
  });
}

/** 主催者の次回イベント（モック） */
export function getOrganizerNextEvent(_organizerId: string): Event | null {
  const all = getEvents();
  const today = new Date().toISOString().split("T")[0];
  const upcoming = all.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] ?? null;
}

/** 主催者の募集中ボランティア（モック） */
export type OrganizerRecruitment = {
  id: string;
  title: string;
  eventId: string;
  applicantCount: number;
  unreadCount: number;
};

export function getOrganizerRecruitments(_organizerId: string): OrganizerRecruitment[] {
  return [];
}

/** プロフィール完成度を計算 */
export function getProfileCompletion(profile: {
  display_name?: string | null;
  region?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}): number {
  let filled = 0;
  const total = 5;
  if (profile.display_name?.trim()) filled++;
  if (profile.region?.trim()) filled++;
  if (profile.phone?.trim()) filled++;
  if (profile.bio?.trim()) filled++;
  if (profile.avatar_url?.trim()) filled++;
  return Math.round((filled / total) * 100);
}
