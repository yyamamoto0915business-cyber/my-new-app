import { randomBytes, randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CLAIM_GIFT_DAYS, CLAIM_GIFT_PLAN } from "@/lib/organizer/claim-gift";

/**
 * 運営が代わりに作る主催者ページ（受け取りリンクで相手に渡す）。
 * - 作るとき：仮の持ち主（ログインに使わないアカウント）を作り、運営の人を「管理者メンバー」にする。
 *   いつもの主催者画面（使うチームの切りかえ）で、お店・キッチンカー・イベントを作り込める。
 * - 受け取るとき：相手のアカウントを持ち主にし、運営の管理者メンバーと仮の持ち主を消す。
 */

export const CLAIM_LINK_DAYS = 7;
const PROXY_EMAIL_DOMAIN = "proxy.machiglyph.jp";

export type ProxyOrganizerRow = {
  organizerId: string;
  name: string;
  contactNote: string | null;
  createdAt: string;
  claimedAt: string | null;
  linkExpiresAt: string | null;
  hasLink: boolean;
  stores: number;
  events: number;
};

export async function createProxyOrganizer(
  admin: SupabaseClient,
  input: { name: string; contactNote: string | null; adminProfileId: string }
): Promise<{ ok: true; organizerId: string } | { ok: false; error: string }> {
  const name = input.name.trim().slice(0, 80);
  if (!name) return { ok: false, error: "団体名・店名を入れてください" };

  // 1) 仮の持ち主（メールは届かない宛先。確認済みにして、メールを送らない）
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email: `owner-${randomUUID()}@${PROXY_EMAIL_DOMAIN}`,
    password: randomBytes(24).toString("hex"),
    email_confirm: true,
    user_metadata: { role: "organizer", display_name: name, proxy_placeholder: true },
  });
  if (userError || !created?.user) return { ok: false, error: "仮のアカウントを作れませんでした" };
  const placeholderId = created.user.id;

  const rollback = async () => {
    await admin.auth.admin.deleteUser(placeholderId).catch(() => {});
  };

  // 2) 主催者
  const { data: org, error: orgError } = await admin
    .from("organizers")
    .insert({ profile_id: placeholderId, organization_name: name })
    .select("id")
    .single();
  if (orgError || !org) {
    await rollback();
    return { ok: false, error: "主催者を作れませんでした" };
  }
  const organizerId = (org as { id: string }).id;

  // プロフィールの行を用意する（公開用の名前は organizers の名前がそのまま出る）
  await admin.from("organizer_profiles").upsert({ organizer_id: organizerId }, { onConflict: "organizer_id" }).then(
    () => undefined,
    () => undefined
  );

  // 3) 運営の人を管理者メンバーに。使うチームもこの主催者に切りかえる
  const { error: memberError } = await admin
    .from("organizer_members")
    .insert({ organizer_id: organizerId, profile_id: input.adminProfileId, role: "admin", invited_by: input.adminProfileId });
  if (memberError) {
    await rollback();
    return { ok: false, error: "運営の人をメンバーにできませんでした" };
  }
  await admin
    .from("organizer_choices")
    .upsert({ profile_id: input.adminProfileId, organizer_id: organizerId, updated_at: new Date().toISOString() });

  // 4) 受け取りの記録
  const { error: claimError } = await admin.from("organizer_claims").insert({
    organizer_id: organizerId,
    placeholder_profile_id: placeholderId,
    created_by: input.adminProfileId,
    contact_note: input.contactNote?.trim().slice(0, 200) || null,
  });
  if (claimError) {
    await rollback();
    return { ok: false, error: "受け取りの記録を作れませんでした（データベースの更新が必要かもしれません）" };
  }
  return { ok: true, organizerId };
}

export async function listProxyOrganizers(admin: SupabaseClient): Promise<ProxyOrganizerRow[]> {
  const { data } = await admin
    .from("organizer_claims")
    .select("organizer_id, contact_note, created_at, claimed_at, token, token_expires_at, organizers(organization_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as unknown as {
    organizer_id: string;
    contact_note: string | null;
    created_at: string;
    claimed_at: string | null;
    token: string | null;
    token_expires_at: string | null;
    organizers: { organization_name: string | null } | { organization_name: string | null }[] | null;
  }[];
  const ids = rows.map((r) => r.organizer_id);
  const count = async (table: string) => {
    if (ids.length === 0) return new Map<string, number>();
    const { data: list } = await admin.from(table).select("organizer_id").in("organizer_id", ids);
    const map = new Map<string, number>();
    for (const r of (list ?? []) as { organizer_id: string }[]) map.set(r.organizer_id, (map.get(r.organizer_id) ?? 0) + 1);
    return map;
  };
  const [stores, events] = await Promise.all([count("stores"), count("events")]);
  const now = Date.now();
  return rows.map((r) => {
    const org = Array.isArray(r.organizers) ? r.organizers[0] : r.organizers;
    const live = Boolean(r.token && r.token_expires_at && Date.parse(r.token_expires_at) > now);
    return {
      organizerId: r.organizer_id,
      name: org?.organization_name?.trim() || "（名前なし）",
      contactNote: r.contact_note,
      createdAt: r.created_at,
      claimedAt: r.claimed_at,
      linkExpiresAt: live ? r.token_expires_at : null,
      hasLink: live,
      stores: stores.get(r.organizer_id) ?? 0,
      events: events.get(r.organizer_id) ?? 0,
    };
  });
}

/** 受け取りリンクを作り直す（前のリンクは使えなくなる） */
export async function issueClaimLink(
  admin: SupabaseClient,
  organizerId: string
): Promise<{ ok: true; token: string; expiresAt: string } | { ok: false; error: string }> {
  const { data: claim } = await admin
    .from("organizer_claims")
    .select("id, claimed_at")
    .eq("organizer_id", organizerId)
    .maybeSingle();
  if (!claim) return { ok: false, error: "代わりに作った主催者ページではありません" };
  if ((claim as { claimed_at: string | null }).claimed_at) return { ok: false, error: "もう受け取り済みです" };
  const token = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + CLAIM_LINK_DAYS * 86400000).toISOString();
  const { error } = await admin
    .from("organizer_claims")
    .update({ token, token_expires_at: expiresAt })
    .eq("organizer_id", organizerId);
  if (error) return { ok: false, error: "リンクを作れませんでした" };
  return { ok: true, token, expiresAt };
}

export type ClaimInfo =
  | { state: "ok"; organizerName: string; stores: number; events: number; expiresAt: string }
  | { state: "expired" | "used" | "missing" };

export async function readClaim(admin: SupabaseClient, token: string): Promise<ClaimInfo & { organizerId?: string }> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return { state: "missing" };
  const { data } = await admin
    .from("organizer_claims")
    .select("organizer_id, claimed_at, token_expires_at, organizers(organization_name)")
    .eq("token", token)
    .maybeSingle();
  if (!data) return { state: "missing" };
  const row = data as unknown as {
    organizer_id: string;
    claimed_at: string | null;
    token_expires_at: string | null;
    organizers: { organization_name: string | null } | { organization_name: string | null }[] | null;
  };
  if (row.claimed_at) return { state: "used" };
  if (!row.token_expires_at || Date.parse(row.token_expires_at) < Date.now()) return { state: "expired" };
  const org = Array.isArray(row.organizers) ? row.organizers[0] : row.organizers;
  const [{ count: stores }, { count: events }] = await Promise.all([
    admin.from("stores").select("id", { count: "exact", head: true }).eq("organizer_id", row.organizer_id),
    admin.from("events").select("id", { count: "exact", head: true }).eq("organizer_id", row.organizer_id),
  ]);
  return {
    state: "ok",
    organizerId: row.organizer_id,
    organizerName: org?.organization_name?.trim() || "主催者ページ",
    stores: stores ?? 0,
    events: events ?? 0,
    expiresAt: row.token_expires_at,
  };
}

/** 受け取る：相手のアカウントを持ち主にする */
export async function acceptClaim(
  admin: SupabaseClient,
  token: string,
  userId: string
): Promise<{ ok: true; organizerId: string } | { ok: false; error: string }> {
  const info = await readClaim(admin, token);
  if (info.state === "used") return { ok: false, error: "このリンクはもう使われています" };
  if (info.state === "expired") return { ok: false, error: "このリンクは期限が切れています。運営にご連絡ください" };
  if (info.state !== "ok" || !info.organizerId) return { ok: false, error: "リンクが見つかりません" };
  const organizerId = info.organizerId;

  // 1つのアカウントが持てる主催者ページは1つまで
  const { data: own } = await admin.from("organizers").select("id").eq("profile_id", userId).maybeSingle();
  if (own) {
    return {
      ok: false,
      error: "このアカウントは、もう主催者ページを持っています。別のメールアドレスのアカウントで受け取るか、運営にご連絡ください",
    };
  }

  const { data: claim } = await admin
    .from("organizer_claims")
    .select("placeholder_profile_id, created_by")
    .eq("organizer_id", organizerId)
    .maybeSingle();
  const claimRow = claim as { placeholder_profile_id: string | null; created_by: string | null } | null;
  const placeholderId = claimRow?.placeholder_profile_id ?? null;

  // 先に印をつけて、同じリンクで2回受け取れないようにする
  const now = new Date().toISOString();
  const { data: marked } = await admin
    .from("organizer_claims")
    .update({ claimed_by: userId, claimed_at: now, terms_accepted_at: now, token: null })
    .eq("organizer_id", organizerId)
    .is("claimed_at", null)
    .select("id");
  if (!marked || marked.length === 0) return { ok: false, error: "このリンクはもう使われています" };

  // 持ち主を相手に（仮の持ち主を消す前に。消すと主催者ごと消えるため）
  const { error: ownerError } = await admin.from("organizers").update({ profile_id: userId }).eq("id", organizerId);
  if (ownerError) {
    await admin.from("organizer_claims").update({ claimed_by: null, claimed_at: null, terms_accepted_at: null }).eq("organizer_id", organizerId);
    return { ok: false, error: "受け取れませんでした。時間をおいてもう一度お試しください" };
  }

  // 運営のメンバーを外す・運営の「使うチーム」を戻す
  await admin.from("organizer_members").delete().eq("organizer_id", organizerId);
  await admin.from("organizer_choices").delete().eq("organizer_id", organizerId);

  // 代わりに作るあいだだけの TEAM を外し、受け取った日から半年の GAME にする（期限が来たら FREE に戻るだけで、料金はかからない）
  const expiresAt = new Date(Date.now() + CLAIM_GIFT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error: grantError } = claimRow?.created_by
    ? await admin.rpc("grant_organizer_plan", {
        p_target_organizer_id: organizerId,
        p_grant_days: CLAIM_GIFT_DAYS,
        p_reason: "代わりに掲載：受け取り特典（GAME 半年）",
        p_admin_user_id: claimRow.created_by,
        p_plan: CLAIM_GIFT_PLAN,
      })
    : { error: new Error("no admin") };
  if (grantError) {
    await admin
      .from("organizer_plan_state")
      .update({ current_plan: CLAIM_GIFT_PLAN, manual_grant_active: true, manual_grant_plan: CLAIM_GIFT_PLAN, manual_grant_expires_at: expiresAt })
      .eq("organizer_id", organizerId);
  }
  await admin
    .from("organizers")
    .update({ manual_grant_active: true, manual_grant_plan: CLAIM_GIFT_PLAN, manual_grant_expires_at: expiresAt })
    .eq("id", organizerId);

  // 相手が主催者の画面に入れるように（はじめの設定に飛ばされないように）
  const { data: u } = await admin.auth.admin.getUserById(userId);
  const meta = (u?.user?.user_metadata ?? {}) as Record<string, unknown>;
  if (!meta.role) await admin.auth.admin.updateUserById(userId, { user_metadata: { ...meta, role: "organizer" } });
  await admin.from("organizer_choices").upsert({ profile_id: userId, organizer_id: organizerId, updated_at: now });

  if (placeholderId) await admin.auth.admin.deleteUser(placeholderId).catch(() => {});
  return { ok: true, organizerId };
}
