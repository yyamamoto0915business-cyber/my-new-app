import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const REPORT_TARGET_TYPES = ["post", "comment", "user"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "sexual",
  "violence",
  "privacy",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "スパム・宣伝",
  harassment: "嫌がらせ・いじめ",
  sexual: "性的な内容",
  violence: "暴力・危険な内容",
  privacy: "個人情報・なりすまし",
  other: "その他",
};

export type ReportStatus = "open" | "hidden" | "dismissed";

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

function isMissingTable(message: string): boolean {
  return /schema cache|does not exist|42P01/i.test(message);
}

/** ブロックされた側の行も読むため、サービスロールを優先する */
async function reader() {
  return createAdminClient() ?? (await createClient());
}

/**
 * 閲覧者から見えなくする人の id。
 * 自分がブロックした人と、自分をブロックした人の両方。
 */
export async function listHiddenUserIds(viewerId: string | null): Promise<Set<string>> {
  const out = new Set<string>();
  if (!isUuid(viewerId)) return out;
  const client = await reader();
  if (!client) return out;

  const { data, error } = await client
    .from("user_blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${viewerId},blocked_id.eq.${viewerId}`);
  if (error) {
    if (!isMissingTable(error.message)) console.error("listHiddenUserIds:", error.message);
    return out;
  }
  for (const row of data ?? []) {
    const { blocker_id, blocked_id } = row as { blocker_id: string; blocked_id: string };
    out.add(blocker_id === viewerId ? blocked_id : blocker_id);
  }
  return out;
}

/** 閲覧者が通報済みのもの（通報した人にはすぐ見えなくする） */
export async function listReportedTargetIds(
  viewerId: string | null,
  targetType: ReportTargetType,
): Promise<Set<string>> {
  const out = new Set<string>();
  if (!isUuid(viewerId)) return out;
  const client = await reader();
  if (!client) return out;

  const { data, error } = await client
    .from("content_reports")
    .select("target_id")
    .eq("reporter_id", viewerId)
    .eq("target_type", targetType);
  if (error) {
    if (!isMissingTable(error.message)) console.error("listReportedTargetIds:", error.message);
    return out;
  }
  for (const row of data ?? []) out.add((row as { target_id: string }).target_id);
  return out;
}

/** ブロック関係の人の投稿・コメントと、自分が通報したものを一覧から外す */
export async function filterModerated<T extends { id: string; author_id: string | null }>(
  rows: T[],
  viewerId: string | null,
  targetType: Extract<ReportTargetType, "post" | "comment">,
): Promise<T[]> {
  if (!viewerId || rows.length === 0) return rows;
  const [hiddenUsers, reported] = await Promise.all([
    listHiddenUserIds(viewerId),
    listReportedTargetIds(viewerId, targetType),
  ]);
  if (hiddenUsers.size === 0 && reported.size === 0) return rows;
  return rows.filter(
    (row) => !reported.has(row.id) && !(row.author_id && hiddenUsers.has(row.author_id)),
  );
}

/** どちらかがブロックしているか */
export async function isBlockedBetween(
  viewerId: string | null,
  otherId: string | null,
): Promise<boolean> {
  if (!viewerId || !otherId || viewerId === otherId) return false;
  const hidden = await listHiddenUserIds(viewerId);
  return hidden.has(otherId);
}

export async function isBlockedByMe(viewerId: string, otherId: string): Promise<boolean> {
  if (!isUuid(viewerId) || !isUuid(otherId)) return false;
  const client = await reader();
  if (!client) return false;
  const { data, error } = await client
    .from("user_blocks")
    .select("blocker_id")
    .eq("blocker_id", viewerId)
    .eq("blocked_id", otherId)
    .maybeSingle();
  if (error) {
    if (!isMissingTable(error.message)) console.error("isBlockedByMe:", error.message);
    return false;
  }
  return Boolean(data);
}

/** ブロックすると、お互いのフォローも外す */
export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const client = await reader();
  if (!client) throw new Error("データベースに接続できません");
  const { error } = await client
    .from("user_blocks")
    .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  const { error: followError } = await client
    .from("user_follows")
    .delete()
    .or(
      `and(follower_id.eq.${blockerId},followee_id.eq.${blockedId}),and(follower_id.eq.${blockedId},followee_id.eq.${blockerId})`,
    );
  if (followError && !isMissingTable(followError.message)) {
    console.error("blockUser unfollow:", followError.message);
  }
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const client = await reader();
  if (!client) throw new Error("データベースに接続できません");
  const { error } = await client
    .from("user_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw new Error(error.message);
}

export type BlockedUser = { id: string; displayName: string; blockedAt: string };

export async function listBlockedUsers(blockerId: string): Promise<BlockedUser[]> {
  const client = await reader();
  if (!client || !isUuid(blockerId)) return [];
  const { data, error } = await client
    .from("user_blocks")
    .select("blocked_id, created_at, profile:blocked_id ( display_name )")
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false });
  if (error) {
    if (!isMissingTable(error.message)) console.error("listBlockedUsers:", error.message);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as unknown as {
      blocked_id: string;
      created_at: string;
      profile: { display_name: string | null } | null;
    };
    return {
      id: r.blocked_id,
      displayName: r.profile?.display_name?.trim() || "ユーザー",
      blockedAt: r.created_at,
    };
  });
}

export async function createReport(input: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetUserId: string | null;
  reason: ReportReason;
  detail: string;
}): Promise<void> {
  const client = await reader();
  if (!client) throw new Error("データベースに接続できません");
  const { error } = await client.from("content_reports").upsert(
    {
      reporter_id: input.reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      target_user_id: isUuid(input.targetUserId) ? input.targetUserId : null,
      reason: input.reason,
      detail: input.detail,
    },
    { onConflict: "reporter_id,target_type,target_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
}
