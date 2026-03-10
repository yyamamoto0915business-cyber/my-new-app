import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireDeveloperAdmin } from "@/lib/auth/admin";
import { getAdminLogs } from "@/lib/admin/queries";
import { logsQuerySchema } from "@/lib/admin/validators";
import { ok, err } from "@/lib/admin/dto";

export async function GET(req: NextRequest) {
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

  const parsed = logsQuerySchema.safeParse({
    q: req.nextUrl.searchParams.get("q") ?? undefined,
    actionType: req.nextUrl.searchParams.get("actionType") ?? undefined,
    page: req.nextUrl.searchParams.get("page") ?? undefined,
    pageSize: req.nextUrl.searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "パラメータが不正です", parsed.error.flatten()),
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

  const result = await getAdminLogs(supabase, parsed.data);
  return NextResponse.json(ok(result));
}
