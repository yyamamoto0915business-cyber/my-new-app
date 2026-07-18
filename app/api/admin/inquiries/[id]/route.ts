import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDeveloperAdminWithSupabase } from "@/lib/auth/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTACT_STATUS_VALUES } from "@/lib/contact";
import { ok, err } from "@/lib/admin/dto";

const paramSchema = z.object({
  id: z.string().uuid(),
});

const patchSchema = z.object({
  status: z.enum(CONTACT_STATUS_VALUES),
  adminNote: z.string().max(2000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const response = NextResponse.next();
  const routeSupabase = createRouteSupabaseClient(req, response);
  if (!routeSupabase) {
    return NextResponse.json(
      err("INTERNAL_ERROR", "Supabase が設定されていません"),
      { status: 500 }
    );
  }

  const auth = await requireDeveloperAdminWithSupabase(routeSupabase);
  if (!auth.ok) {
    return NextResponse.json(
      err(
        auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        auth.status === 401 ? "ログインが必要です" : "開発者権限が必要です"
      ),
      { status: auth.status }
    );
  }

  const paramParsed = paramSchema.safeParse(await params);
  if (!paramParsed.success) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "お問い合わせ ID が不正です"),
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const bodyParsed = patchSchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "リクエストが不正です", bodyParsed.error.flatten()),
      { status: 400 }
    );
  }

  const adminClient = createAdminClient() ?? routeSupabase;
  const { data, error } = await adminClient
    .from("contact_inquiries")
    .update({
      status: bodyParsed.data.status,
      admin_note: bodyParsed.data.adminNote ?? null,
    })
    .eq("id", paramParsed.data.id)
    .select("id, status, admin_note")
    .single();

  if (error) {
    console.error("[admin/inquiries] update failed:", error.message);
    return NextResponse.json(
      err("INTERNAL_ERROR", "更新に失敗しました"),
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      err("NOT_FOUND", "お問い合わせが見つかりません"),
      { status: 404 }
    );
  }

  try {
    await adminClient.from("admin_logs").insert({
      admin_user_id: auth.profile.id,
      admin_email: auth.profile.email,
      target_organizer_id: null,
      action_type: "update_inquiry_status",
      before_value: null,
      after_value: {
        status: data.status,
        admin_note: data.admin_note,
      },
      reason: `inquiry_id=${paramParsed.data.id}`,
      metadata: {
        inquiry_id: paramParsed.data.id,
        target_type: "contact_inquiry",
        target_id: paramParsed.data.id,
      },
    });
  } catch {
    // ignore log failure
  }

  return NextResponse.json(
    ok({
      id: data.id,
      status: data.status,
      adminNote: data.admin_note,
      toast: "保存しました",
    })
  );
}
