import type { Benefit, VolunteerRoleType } from "@/lib/volunteer-roles-mock";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import type { RecruitmentMvp } from "@/lib/db/recruitments-mvp";

/** recruitments テーブル由来（一覧APIでモック行と混在させる用） */
export type VolunteerRoleFromRecruitment = VolunteerRoleWithEvent & {
  createdAt: string;
  organizerId: string;
  hasTransportSupport: boolean;
  hasHonorarium: boolean;
};

/** `/volunteer/[id]` の応募先判定用（Supabase recruitments の id） */
export const RECRUITMENT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRecruitmentRowId(id: string): boolean {
  return RECRUITMENT_UUID_RE.test(id);
}

const ROLE_NAME_HINTS: { re: RegExp; type: VolunteerRoleType }[] = [
  { re: /受付/, type: "reception" },
  { re: /案内/, type: "guidance" },
  { re: /清掃/, type: "cleaning" },
  { re: /写真|撮影/, type: "photo" },
  { re: /翻訳/, type: "translation" },
  { re: /配信|ストリーミング/, type: "streaming" },
  { re: /システム|ＩＴ|IT|web|Web/, type: "system" },
  { re: /設営/, type: "setup" },
  { re: /災害/, type: "disaster" },
  { re: /運営|スタッフ|お手伝い/, type: "operation" },
];

const TECH_ROLE_TO_TYPE: Record<string, VolunteerRoleType> = {
  photo: "photo",
  streaming: "streaming",
  translation: "translation",
  web: "system",
  reception: "reception",
};

function inferRoleType(
  row: RecruitmentMvp & { tech_role?: string | null }
): VolunteerRoleType {
  if (row.type === "tech_volunteer") {
    const tr = row.tech_role?.trim().toLowerCase();
    if (tr && TECH_ROLE_TO_TYPE[tr]) return TECH_ROLE_TO_TYPE[tr];
    return "tech_other";
  }
  const firstName = row.roles?.[0]?.name ?? "";
  for (const { re, type } of ROLE_NAME_HINTS) {
    if (re.test(firstName)) return type;
  }
  return "operation";
}

function sumRoleCounts(row: RecruitmentMvp): number {
  const sum = row.roles?.reduce((acc, r) => acc + (Number(r.count) || 0), 0) ?? 0;
  return sum > 0 ? sum : 0;
}

function parseBenefitsFromProvisions(text: string | null | undefined): Benefit[] {
  if (!text?.trim()) return [];
  const out: Benefit[] = [];
  if (/交通|電車|バス|往復|運賃/.test(text)) out.push("TRANSPORT");
  if (/宿泊|ホテル|泊まり/.test(text)) out.push("LODGING");
  if (/食事|飲食|弁当|食費/.test(text)) out.push("MEAL");
  if (/謝礼|報酬|ギフト券|礼金/.test(text)) out.push("REWARD");
  if (/保険|補償/.test(text)) out.push("INSURANCE");
  if (/送迎|シャトル|ピックアップ/.test(text)) out.push("SHUTTLE");
  return [...new Set(out)];
}

function formatDateTime(
  startAt: string | null,
  endAt: string | null,
  eventDate: string | null | undefined
): string {
  if (startAt) {
    const s = new Date(startAt);
    if (!Number.isNaN(s.getTime())) {
      const dOpts: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        weekday: "short",
      };
      const tOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
      const datePart = s.toLocaleString("ja-JP", dOpts);
      const timeStart = s.toLocaleString("ja-JP", tOpts);
      if (endAt) {
        const e = new Date(endAt);
        if (!Number.isNaN(e.getTime())) {
          const timeEnd = e.toLocaleString("ja-JP", tOpts);
          return `${datePart} ${timeStart}〜${timeEnd}`;
        }
      }
      return `${datePart} ${timeStart}〜`;
    }
  }
  if (eventDate) return `${eventDate}（イベント当日・時間は募集内容をご確認ください）`;
  return "日程は募集内容をご確認ください";
}

type RowWithJoins = RecruitmentMvp & {
  tech_role?: string | null;
  organizers?: { organization_name: string | null };
  events?: { title: string; date: string; prefecture?: string | null } | null;
};

/** ボランティア一覧・詳細 API 用に recruitments 行を変換 */
export function recruitmentRowToVolunteerRole(row: RowWithJoins): VolunteerRoleFromRecruitment {
  const eventId = row.event_id ?? "";
  const event =
    row.event_id && row.events
      ? {
          id: row.event_id,
          title: row.events.title,
          date: row.events.date,
          ...(row.events.prefecture ? { prefecture: row.events.prefecture } : {}),
        }
      : null;

  const cap = row.capacity ?? sumRoleCounts(row);
  const benefits = parseBenefitsFromProvisions(row.provisions);
  const hasTransport = benefits.includes("TRANSPORT");
  const hasHonorarium = benefits.includes("REWARD");

  return {
    id: row.id,
    eventId,
    roleType: inferRoleType(row),
    title: row.title,
    description: row.description,
    dateTime: formatDateTime(row.start_at, row.end_at, row.events?.date),
    location: row.meeting_place?.trim() || event?.title || "場所は募集内容をご確認ください",
    capacity: cap > 0 ? cap : 1,
    perksText: row.provisions?.trim() || undefined,
    hasTransportSupport: hasTransport,
    hasHonorarium,
    beginnerFriendly: /初心者|未経験|初めて/.test(row.description + (row.notes ?? "")),
    oneDayOk: true,
    organizerVerified: true,
    contactAvailable: true,
    benefits: benefits.length ? benefits : undefined,
    event,
    createdAt: row.created_at,
    organizerId: row.organizer_id,
  };
}

export function isVolunteerDiscoveryType(type: string): boolean {
  return type === "volunteer" || type === "tech_volunteer";
}
