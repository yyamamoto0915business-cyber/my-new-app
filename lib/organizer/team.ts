import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * TEAM：ログインしている人が、どの主催者として・どの役割で動くか。
 * - owner：主催者アカウントの本人（organizers.profile_id）。いつもすべてできる
 * - admin：管理者（すべての機能・メンバー管理・プラン）
 * - editor：編集者（掲載の作成・編集・応募の管理・ダッシュボード）
 * - staff：スタッフ（当日の受付・チェックイン・レジ）
 * データベースのルール（00131 の my_organizer_ids）でも同じ線を引いている。こちらは画面と API の入口の確認用。
 */
export type OrganizerRole = "owner" | "admin" | "editor" | "staff";

const RANK: Record<OrganizerRole, number> = { staff: 1, editor: 2, admin: 3, owner: 4 };

export function roleAtLeast(role: OrganizerRole, min: OrganizerRole): boolean {
  return RANK[role] >= RANK[min];
}

export const ORGANIZER_ROLE_LABEL: Record<OrganizerRole, string> = {
  owner: "オーナー",
  admin: "管理者",
  editor: "編集者",
  staff: "スタッフ",
};

export type OrganizerAccess = { organizerId: string; role: OrganizerRole };

/** 本人の主催者があればそれ（owner）。なければメンバーになっている主催者（役割の高いもの・古いものから1つ） */
export async function getOrganizerAccess(
  supabase: SupabaseClient,
  profileId: string
): Promise<OrganizerAccess | null> {
  const { data: own } = await supabase
    .from("organizers")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (own?.id) return { organizerId: own.id as string, role: "owner" };

  // メンバーの表（00131）がまだないときはエラーになるが、そのときはメンバーはいないので null
  const { data: rows, error } = await supabase
    .from("organizer_members")
    .select("organizer_id, role, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true })
    .limit(10);
  if (error || !rows?.length) return null;
  const best = (rows as { organizer_id: string; role: string }[])
    .filter((r) => r.role === "admin" || r.role === "editor" || r.role === "staff")
    .sort((a, b) => RANK[b.role as OrganizerRole] - RANK[a.role as OrganizerRole])[0];
  return best ? { organizerId: best.organizer_id, role: best.role as OrganizerRole } : null;
}

/** 本人の主催者だけ（プランの変更・売上の受取設定など、お金と契約にかかわる操作はオーナーだけ） */
export async function getOwnOrganizerId(supabase: SupabaseClient, profileId: string): Promise<string | null> {
  const { data } = await supabase.from("organizers").select("id").eq("profile_id", profileId).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}
