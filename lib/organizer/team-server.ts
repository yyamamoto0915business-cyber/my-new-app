import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isTeamPlanWithPlanState } from "@/lib/billing";
import { roleAtLeast, type OrganizerRole } from "@/lib/organizer/team";

/**
 * TEAM（メンバー・招待リンク）のサーバー側の処理。書き込みはサーバーの鍵（admin）で行い、
 * だれが何をしてよいかはここで決める（データベースのルールでは、メンバー表は書けない）。
 */

/** TEAM のメンバーは、オーナーを入れて5人まで（プランの説明「5人までチーム」） */
export const TEAM_MAX_PEOPLE = 5;
export const INVITE_DAYS = [1, 7, 30] as const;
export type MemberRole = Exclude<OrganizerRole, "owner">;

export function isMemberRole(v: unknown): v is MemberRole {
  return v === "admin" || v === "editor" || v === "staff";
}

export function newInviteToken(): string {
  return randomBytes(18).toString("base64url");
}

/** その主催者が TEAM プランか */
export async function organizerHasTeamPlan(admin: SupabaseClient, organizerId: string): Promise<boolean> {
  const [{ data: org }, { data: planState }] = await Promise.all([
    admin
      .from("organizers")
      .select("plan, subscription_status, stripe_status, manual_grant_active, manual_grant_plan, manual_grant_expires_at")
      .eq("id", organizerId)
      .maybeSingle(),
    admin
      .from("organizer_plan_state")
      .select("stripe_status, manual_grant_active, manual_grant_plan, manual_grant_expires_at")
      .eq("organizer_id", organizerId)
      .maybeSingle(),
  ]);
  if (!org) return false;
  return isTeamPlanWithPlanState(org, planState);
}

/** いまの人数（オーナー1人＋メンバー） */
export async function teamHeadcount(admin: SupabaseClient, organizerId: string): Promise<number> {
  const { count } = await admin
    .from("organizer_members")
    .select("id", { count: "exact", head: true })
    .eq("organizer_id", organizerId);
  return 1 + (count ?? 0);
}

/**
 * actor（操作する人の役割）が、target（相手の今の役割）を next（新しい役割）に変えてよいか。
 * - オーナーは何でもできる
 * - 管理者は、編集者・スタッフだけを、編集者・スタッフに変えられる（管理者を増やす・管理者を変えるのはオーナーだけ）
 */
export function canChangeRole(actor: OrganizerRole, target: MemberRole, next: MemberRole): boolean {
  if (actor === "owner") return true;
  if (actor !== "admin") return false;
  return target !== "admin" && next !== "admin";
}

/** actor が target を外してよいか（自分が抜けるのはだれでも可。ほかの人はルールは役割を変えるときと同じ） */
export function canRemoveMember(actor: OrganizerRole, target: MemberRole, isSelf: boolean): boolean {
  if (isSelf) return true;
  if (actor === "owner") return true;
  return actor === "admin" && target !== "admin";
}

/** 招待リンクを作れるか（管理者以上。管理者の招待はオーナーだけ） */
export function canInviteAs(actor: OrganizerRole, role: MemberRole): boolean {
  if (!roleAtLeast(actor, "admin")) return false;
  return role !== "admin" || actor === "owner";
}

export type InviteRow = {
  id: string;
  organizer_id: string;
  token: string;
  role: MemberRole;
  expires_at: string;
  max_uses: number;
  used_count: number;
  revoked_at: string | null;
};

export type InviteState = "ok" | "expired" | "used_up" | "revoked";

export function inviteState(inv: InviteRow, now = Date.now()): InviteState {
  if (inv.revoked_at) return "revoked";
  if (Date.parse(inv.expires_at) <= now) return "expired";
  if (inv.used_count >= inv.max_uses) return "used_up";
  return "ok";
}

export const INVITE_STATE_MESSAGE: Record<Exclude<InviteState, "ok">, string> = {
  expired: "この招待リンクは有効期限が切れています。招待した人に、新しいリンクをもらってください。",
  used_up: "この招待リンクは、もう使われています。招待した人に、新しいリンクをもらってください。",
  revoked: "この招待リンクは取り消されました。",
};

export type AcceptResult =
  | { ok: true; organizerId: string; role: MemberRole }
  | { ok: false; status: number; error: string };

/** 招待リンクで参加する（ログインしている本人を、メンバーに入れる） */
export async function acceptInvite(admin: SupabaseClient, token: string, profileId: string): Promise<AcceptResult> {
  const { data } = await admin.from("organizer_invites").select("*").eq("token", token).maybeSingle();
  const inv = data as InviteRow | null;
  if (!inv) return { ok: false, status: 404, error: "招待リンクが見つかりません" };
  const state = inviteState(inv);
  if (state !== "ok") return { ok: false, status: 410, error: INVITE_STATE_MESSAGE[state] };

  const { data: owner } = await admin.from("organizers").select("id").eq("id", inv.organizer_id).eq("profile_id", profileId).maybeSingle();
  if (owner) return { ok: false, status: 400, error: "ご自身の団体には参加できません（もうオーナーです）" };
  const { data: already } = await admin
    .from("organizer_members")
    .select("id")
    .eq("organizer_id", inv.organizer_id)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (already) return { ok: false, status: 400, error: "すでにこのチームのメンバーです" };
  if (!(await organizerHasTeamPlan(admin, inv.organizer_id))) {
    return { ok: false, status: 403, error: "このチームは、いまメンバーを招待できない状態です（TEAMプランではありません）" };
  }
  if ((await teamHeadcount(admin, inv.organizer_id)) >= TEAM_MAX_PEOPLE) {
    return { ok: false, status: 400, error: `チームは${TEAM_MAX_PEOPLE}人までです。招待した人に確かめてください` };
  }

  // 使った回数を先に1つ進める（同時に2人が使っても、上限を超えない）
  const { data: claimed } = await admin
    .from("organizer_invites")
    .update({ used_count: inv.used_count + 1 })
    .eq("id", inv.id)
    .eq("used_count", inv.used_count)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return { ok: false, status: 409, error: "もう一度お試しください" };

  const { error } = await admin.from("organizer_members").insert({
    organizer_id: inv.organizer_id,
    profile_id: profileId,
    role: inv.role,
  });
  if (error) {
    await admin.from("organizer_invites").update({ used_count: inv.used_count }).eq("id", inv.id);
    if (/duplicate|unique/i.test(error.message ?? "")) return { ok: false, status: 400, error: "すでにこのチームのメンバーです" };
    console.error("accept invite:", error);
    return { ok: false, status: 500, error: "参加できませんでした。時間をおいてお試しください" };
  }
  return { ok: true, organizerId: inv.organizer_id, role: inv.role };
}
