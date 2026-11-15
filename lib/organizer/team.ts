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

/**
 * いま使えるチーム（主催者）をすべて。本人の主催者（owner）が先、そのあとメンバーとして入っている主催者（役割の高い順・古い順）。
 * メンバーとして使えるのは、その主催者が TEAM プランのあいだだけ（00133。データベースのルールも同じ）。
 */
export async function listOrganizerAccesses(supabase: SupabaseClient, profileId: string): Promise<OrganizerAccess[]> {
  const [{ data: own }, { data: rows, error }] = await Promise.all([
    supabase.from("organizers").select("id").eq("profile_id", profileId).maybeSingle(),
    // メンバーの表（00131）がまだないときはエラーになるが、そのときはメンバーはいない
    supabase
      .from("organizer_members")
      .select("organizer_id, role, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true })
      .limit(10),
  ]);
  const list: OrganizerAccess[] = own?.id ? [{ organizerId: own.id as string, role: "owner" }] : [];
  if (error || !rows?.length) return list;
  const candidates = (rows as { organizer_id: string; role: string }[])
    .filter((r) => (r.role === "admin" || r.role === "editor" || r.role === "staff") && r.organizer_id !== own?.id)
    .sort((a, b) => RANK[b.role as OrganizerRole] - RANK[a.role as OrganizerRole]);
  const active = await Promise.all(
    candidates.map(async (r) => {
      const { data, error: rpcError } = await supabase.rpc("organizer_team_plan_active", { p_organizer_id: r.organizer_id });
      // 00133 の適用前は関数がない。そのときは今までどおり使える扱い
      return rpcError ? /organizer_team_plan_active|does not exist|Could not find/i.test(rpcError.message ?? "") : data === true;
    }),
  );
  candidates.forEach((r, i) => {
    if (active[i]) list.push({ organizerId: r.organizer_id, role: r.role as OrganizerRole });
  });
  return list;
}

/** いま選んでいるチーム（00135）。表がまだない・選んでいないときは null */
async function readOrganizerChoice(supabase: SupabaseClient, profileId: string): Promise<string | null> {
  const { data, error } = await supabase.from("organizer_choices").select("organizer_id").eq("profile_id", profileId).maybeSingle();
  if (error || !data) return null;
  return (data.organizer_id as string | null) ?? null;
}

/**
 * どの主催者として・どの役割で動くか。
 * 選んだチーム（organizer_choices）が今も使えればそれ。なければ本人の主催者、それもなければメンバーとして入っている主催者（役割の高いもの・古いものから1つ）。
 */
export async function getOrganizerAccess(
  supabase: SupabaseClient,
  profileId: string
): Promise<OrganizerAccess | null> {
  const [list, chosen] = await Promise.all([
    listOrganizerAccesses(supabase, profileId),
    readOrganizerChoice(supabase, profileId),
  ]);
  if (list.length === 0) return null;
  return (chosen ? list.find((a) => a.organizerId === chosen) : undefined) ?? list[0];
}

/** 本人の主催者だけ（プランの変更・売上の受取設定など、お金と契約にかかわる操作はオーナーだけ） */
export async function getOwnOrganizerId(supabase: SupabaseClient, profileId: string): Promise<string | null> {
  const { data } = await supabase.from("organizers").select("id").eq("profile_id", profileId).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}
