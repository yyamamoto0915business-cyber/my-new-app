"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProfileMode } from "@/components/profile/mode-switcher";
import {
  getUpcomingParticipations,
  getSavedEvents,
  getVolunteerApplications,
  getOrganizerNextEvent,
  getOrganizerRecruitments,
} from "@/lib/profile-dashboard-data";
import type { Event } from "@/lib/db/types";

export type ModeDashboardData = {
  stat1: number;
  stat2: number;
  stat3: number;
  list1: { id: string; title: string; href: string; subText?: string }[];
  list2: { id: string; title: string; href: string; subText?: string }[];
};

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(date: string, startTime: string, endTime?: string) {
  const d = new Date(date + "T12:00:00");
  const day = WEEKDAY[d.getDay()];
  const dateStr = date.replace(/-/g, "/").replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  const timeStr = endTime ? `${startTime}-${endTime}` : startTime;
  return `${day} ${dateStr} ${timeStr}`;
}

export function useModeDashboardData(
  mode: ProfileMode,
  userId: string | null,
  unreadCount: number
): { data: ModeDashboardData; loading: boolean } {
  const [data, setData] = useState<ModeDashboardData>({
    stat1: 0,
    stat2: 0,
    stat3: unreadCount,
    list1: [],
    list2: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!userId) {
      setData({
        stat1: 0,
        stat2: 0,
        stat3: unreadCount,
        list1: [],
        list2: [],
      });
      setLoading(false);
      return;
    }

    if (mode === "participant") {
      const upcoming = getUpcomingParticipations(userId);
      const pending = getSavedEvents(userId); // 申込中は保存イベントで代用（実際は event_participants から取得が望ましい）
      setData({
        stat1: upcoming.length,
        stat2: pending.length,
        stat3: unreadCount,
        list1: upcoming.slice(0, 5).map((e) => ({
          id: e.id,
          title: e.title,
          href: `/events/${e.id}`,
          subText: formatDate(e.date, e.startTime, e.endTime),
        })),
        list2: pending.slice(0, 5).map((e) => ({
          id: e.id,
          title: e.title,
          href: `/events/${e.id}`,
          subText: formatDate(e.date, e.startTime, e.endTime),
        })),
      });
    } else if (mode === "volunteer") {
      const applications = getVolunteerApplications(userId);
      const confirmed = applications.filter((a) => a.status === "確定");
      const pending = applications.filter((a) => a.status === "確認中");
      setData({
        stat1: confirmed.length,
        stat2: pending.length,
        stat3: unreadCount,
        list1: confirmed.slice(0, 5).map((a) => ({
          id: a.id,
          title: a.roleTitle,
          href: `/volunteer/${a.volunteerRoleId}`,
          subText: a.eventTitle,
        })),
        list2: pending.slice(0, 5).map((a) => ({
          id: a.id,
          title: a.roleTitle,
          href: `/volunteer/${a.volunteerRoleId}`,
          subText: a.eventTitle,
        })),
      });
    } else {
      // organizer: stat2 = 要対応（未読メッセージ、内訳は別途）
      const nextEvent = getOrganizerNextEvent(userId);
      const recruitments = getOrganizerRecruitments(userId);
      const hostingList: { id: string; title: string; href: string; subText?: string }[] = [];
      if (nextEvent) {
        hostingList.push({
          id: nextEvent.id,
          title: nextEvent.title,
          href: `/events/${nextEvent.id}`,
          subText: formatDate(nextEvent.date, nextEvent.startTime),
        });
      }
      setData({
        stat1: hostingList.length,
        stat2: unreadCount,
        stat3: unreadCount,
        list1: hostingList,
        list2: recruitments.slice(0, 5).map((r) => ({
          id: r.id,
          title: r.title,
          href: `/organizer/recruitments/${r.id}`,
          subText: `👥 ${r.applicantCount}件${r.unreadCount > 0 ? `・${r.unreadCount}件未読` : ""}`,
        })),
      });
    }
    setLoading(false);
  }, [mode, userId, unreadCount]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, loading };
}
