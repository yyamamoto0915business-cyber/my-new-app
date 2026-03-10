import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireDeveloperAdmin } from "@/lib/auth/admin";
import { getAdminOrganizerDetail } from "@/lib/admin/queries";
import { organizerIdParamSchema } from "@/lib/admin/validators";
import { ok, err } from "@/lib/admin/dto";

export async function GET(
  _req: NextRequest,
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

  const parsed = organizerIdParamSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "organizer ID が不正です", parsed.error.flatten()),
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

  const detail = await getAdminOrganizerDetail(supabase, parsed.data.id);
  if (!detail) {
    return NextResponse.json(
      err("NOT_FOUND", "主催者が見つかりません"),
      { status: 404 }
    );
  }

  return NextResponse.json(ok(detail));
}
