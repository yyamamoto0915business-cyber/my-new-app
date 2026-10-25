import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  REPORT_REASONS,
  REPORT_TARGET_TYPES,
  createReport,
  type ReportReason,
  type ReportTargetType,
} from "@/lib/db/moderation";

const DETAIL_MAX_LENGTH = 1000;

/** 通報されたものを書いた人。見つからなければ null */
async function findTargetUserId(
  targetType: ReportTargetType,
  targetId: string,
): Promise<string | null> {
  if (targetType === "user") return targetId;
  const client = createAdminClient() ?? (await createClient());
  if (!client) return null;
  const table = targetType === "post" ? "community_posts" : "community_post_comments";
  const { data } = await client.from(table).select("author_id").eq("id", targetId).maybeSingle();
  return (data as { author_id: string | null } | null)?.author_id ?? null;
}

/** POST: 投稿・コメント・ユーザーを通報する */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "通報するにはログインが必要です" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const targetType = String(body.targetType ?? "") as ReportTargetType;
  const targetId = String(body.targetId ?? "").trim();
  const reason = String(body.reason ?? "") as ReportReason;
  const detail = String(body.detail ?? "").trim().slice(0, DETAIL_MAX_LENGTH);

  if (!REPORT_TARGET_TYPES.includes(targetType) || !targetId) {
    return NextResponse.json({ error: "通報する対象が不正です" }, { status: 400 });
  }
  if (!REPORT_REASONS.includes(reason)) {
    return NextResponse.json({ error: "理由を選んでください" }, { status: 400 });
  }

  const targetUserId = await findTargetUserId(targetType, targetId);
  if (targetUserId && targetUserId === user.id) {
    return NextResponse.json({ error: "自分自身は通報できません" }, { status: 400 });
  }

  try {
    await createReport({
      reporterId: user.id,
      targetType,
      targetId,
      targetUserId,
      reason,
      detail,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("reports POST:", e);
    return NextResponse.json({ error: "通報を送れませんでした" }, { status: 500 });
  }
}
