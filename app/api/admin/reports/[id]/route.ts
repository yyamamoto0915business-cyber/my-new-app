import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDeveloperAdminWithSupabase } from "@/lib/auth/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, err } from "@/lib/admin/dto";

const paramSchema = z.object({ id: z.string().uuid() });

const patchSchema = z.object({
  /** hide: 投稿・コメントを非表示にする / dismiss: 問題なしとして閉じる */
  action: z.enum(["hide", "dismiss"]),
});

const CONTENT_TABLES = {
  post: "community_posts",
  comment: "community_post_comments",
} as const;

/** PATCH: 通報に対応する */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const response = NextResponse.next();
  const routeSupabase = createRouteSupabaseClient(req, response);
  if (!routeSupabase) {
    return NextResponse.json(err("INTERNAL_ERROR", "Supabase が設定されていません"), {
      status: 500,
    });
  }

  const auth = await requireDeveloperAdminWithSupabase(routeSupabase);
  if (!auth.ok) {
    return NextResponse.json(
      err(
        auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        auth.status === 401 ? "ログインが必要です" : "開発者権限が必要です",
      ),
      { status: auth.status },
    );
  }

  const paramParsed = paramSchema.safeParse(await params);
  if (!paramParsed.success) {
    return NextResponse.json(err("VALIDATION_ERROR", "通報 ID が不正です"), { status: 400 });
  }
  const bodyParsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!bodyParsed.success) {
    return NextResponse.json(err("VALIDATION_ERROR", "リクエストが不正です"), { status: 400 });
  }
  const { action } = bodyParsed.data;

  const client = createAdminClient() ?? routeSupabase;
  const { data: report, error: findError } = await client
    .from("content_reports")
    .select("id, target_type, target_id")
    .eq("id", paramParsed.data.id)
    .maybeSingle();
  if (findError || !report) {
    return NextResponse.json(err("NOT_FOUND", "通報が見つかりません"), { status: 404 });
  }
  const { target_type: targetType, target_id: targetId } = report as {
    target_type: "post" | "comment" | "user";
    target_id: string;
  };

  if (action === "hide") {
    if (targetType === "user") {
      return NextResponse.json(
        err("VALIDATION_ERROR", "ユーザーの通報は非表示にできません。内容を確認して対応してください"),
        { status: 400 },
      );
    }
    const { error } = await client
      .from(CONTENT_TABLES[targetType])
      .update({ status: "hidden" })
      .eq("id", targetId);
    if (error) {
      console.error("[admin/reports] hide failed:", error.message);
      return NextResponse.json(err("INTERNAL_ERROR", "非表示にできませんでした"), {
        status: 500,
      });
    }
  }

  // 同じものへのほかの通報もまとめて閉じる
  const status = action === "hide" ? "hidden" : "dismissed";
  const { error: updateError } = await client
    .from("content_reports")
    .update({ status, handled_at: new Date().toISOString() })
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "open");
  if (updateError) {
    console.error("[admin/reports] update failed:", updateError.message);
    return NextResponse.json(err("INTERNAL_ERROR", "更新に失敗しました"), { status: 500 });
  }

  try {
    await client.from("admin_logs").insert({
      admin_user_id: auth.profile.id,
      admin_email: auth.profile.email,
      target_organizer_id: null,
      action_type: action === "hide" ? "hide_reported_content" : "dismiss_report",
      before_value: null,
      after_value: { status },
      reason: `report_id=${paramParsed.data.id}`,
      metadata: { report_id: paramParsed.data.id, target_type: targetType, target_id: targetId },
    });
  } catch {
    // ignore log failure
  }

  return NextResponse.json(
    ok({ id: paramParsed.data.id, status, toast: action === "hide" ? "非表示にしました" : "対応済みにしました" }),
  );
}
