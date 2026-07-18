import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDeveloperAdmin } from "@/lib/auth/admin";
import { ok, err } from "@/lib/admin/dto";

const bodySchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});

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

  const { id } = await params;
  if (!id) {
    return NextResponse.json(err("VALIDATION_ERROR", "event ID が不正です"), {
      status: 400,
    });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "status が不正です", parsed.error.flatten()),
      { status: 400 }
    );
  }

  const supabase = createAdminClient() ?? (await createClient());
  if (!supabase) {
    return NextResponse.json(
      err("INTERNAL_ERROR", "Supabase が設定されていません"),
      { status: 500 }
    );
  }

  const { data: before } = await supabase
    .from("events")
    .select("id, status, published_at, organizer_id")
    .eq("id", id)
    .maybeSingle();

  if (!before) {
    return NextResponse.json(err("NOT_FOUND", "イベントが見つかりません"), {
      status: 404,
    });
  }

  const payload: Record<string, unknown> = {
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.status === "published" && !before.published_at) {
    payload.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from("events").update(payload).eq("id", id);
  if (error) {
    return NextResponse.json(err("INTERNAL_ERROR", error.message), {
      status: 500,
    });
  }

  try {
    await supabase.from("admin_logs").insert({
      admin_user_id: auth.profile.id,
      admin_email: auth.profile.email,
      target_organizer_id: before.organizer_id,
      action_type: "update_event_status",
      before_value: { status: before.status },
      after_value: { status: parsed.data.status },
      reason: `event_id=${id}`,
      metadata: { event_id: id },
    });
  } catch {
    // ignore log failure
  }

  return NextResponse.json(ok({ id, status: parsed.data.status }));
}
