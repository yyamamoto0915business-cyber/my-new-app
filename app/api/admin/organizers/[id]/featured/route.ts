import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireDeveloperAdmin } from "@/lib/auth/admin";
import { organizerIdParamSchema, featuredUpdateBodySchema } from "@/lib/admin/validators";
import { ok, err } from "@/lib/admin/dto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireDeveloperAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      err(
        auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        auth.status === 401 ? "ログインが必要です" : "開発者権限が必要です"
      ),
      { status: auth.status }
    );
  }

  const parsedParams = organizerIdParamSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "organizer ID が不正です", parsedParams.error.flatten()),
      { status: 400 }
    );
  }

  const parsedBody = featuredUpdateBodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "パラメータが不正です", parsedBody.error.flatten()),
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      err("INTERNAL_ERROR", "Supabase が設定されていません"),
      { status: 500 }
    );
  }

  const organizerId = parsedParams.data.id;
  const { isFeatured, featuredRank, reason } = parsedBody.data;

  const { data: before } = await supabase
    .from("organizer_profiles")
    .select("is_featured, featured_rank")
    .eq("organizer_id", organizerId)
    .maybeSingle();

  const { error: upsertError } = await supabase
    .from("organizer_profiles")
    .upsert(
      {
        organizer_id: organizerId,
        is_featured: isFeatured,
        featured_rank: isFeatured ? featuredRank : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organizer_id" }
    );

  if (upsertError) {
    return NextResponse.json(err("INTERNAL_ERROR", upsertError.message), { status: 500 });
  }

  const { data: after } = await supabase
    .from("organizer_profiles")
    .select("is_featured, featured_rank")
    .eq("organizer_id", organizerId)
    .maybeSingle();

  // 管理ログ（失敗しても主処理は成功扱い）
  try {
    await supabase.from("admin_logs").insert({
      admin_user_id: auth.profile.id,
      admin_email: auth.profile.email ?? null,
      target_organizer_id: organizerId,
      action_type: "set_featured",
      reason: reason || null,
      before_value: before ?? null,
      after_value: after ?? null,
      metadata: { is_featured: isFeatured, featured_rank: isFeatured ? featuredRank : null },
    });
  } catch {
    // ignore
  }

  return NextResponse.json(
    ok({
      toast: isFeatured
        ? "注目の主催者に設定しました（反映は一覧の再読み込みで確認できます）"
        : "注目の主催者から外しました（反映は一覧の再読み込みで確認できます）",
    })
  );
}

