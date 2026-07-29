import {
  CalendarDays,
  Heart,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  getCategoryLabel,
  getDisplayBenefits,
  type VolunteerRoleWithEvent,
} from "@/lib/volunteer-utils";

export type InfoSection =
  | { icon: LucideIcon; title: string; type: "kv"; kvItems: { k: string; v: string }[] }
  | { icon: LucideIcon; title: string; type: "list"; listItems: string[] };

export function buildVolunteerInfoSections(
  role: VolunteerRoleWithEvent,
  locationValue: string
): InfoSection[] {
  const { chips } = getDisplayBenefits(role);
  const categoryLabel = getCategoryLabel(role.roleType);

  const activityItems = (() => {
    const lines = role.description
      .split(/\n|。/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 40);
    if (lines.length >= 2) return lines.slice(0, 4);
    return [categoryLabel, ...role.description.slice(0, 60).split("、").slice(0, 3)].filter(
      Boolean
    );
  })();

  const conditionItems = [
    role.beginnerFriendly ? "初参加OK" : null,
    role.oneDayOk ? "短時間OK" : null,
    "動きやすい服装",
    "18歳以上推奨",
  ].filter(Boolean) as string[];

  const supportItems = chips.length > 0 ? chips.map((c) => c.label) : ["特になし"];

  return [
    {
      icon: CalendarDays,
      title: "募集概要",
      type: "kv",
      kvItems: [
        { k: "日時", v: role.dateTime },
        { k: "集合場所", v: locationValue },
        { k: "募集人数", v: `${role.capacity}名` },
        { k: "参加費", v: "無料" },
      ],
    },
    {
      icon: Wrench,
      title: "活動内容",
      type: "list",
      listItems: activityItems,
    },
    {
      icon: Users,
      title: "参加条件",
      type: "list",
      listItems: conditionItems,
    },
    {
      icon: Heart,
      title: "提供サポート",
      type: "list",
      listItems: supportItems,
    },
  ];
}

export function hasVenueInfo(role: VolunteerRoleWithEvent): boolean {
  const loc = role.location?.trim() ?? "";
  if (loc && loc !== "場所は募集内容をご確認ください") return true;
  return role.meetingLat != null && role.meetingLng != null;
}
