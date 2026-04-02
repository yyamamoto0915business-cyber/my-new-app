import { NextRequest, NextResponse } from "next/server";
import { requireDeveloperAdminWithSupabase } from "@/lib/auth/admin";
import { getAdminLogs } from "@/lib/admin/queries";
import { logsQuerySchema } from "@/lib/admin/validators";
import { ok, err } from "@/lib/admin/dto";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(req: NextRequest) {
  const response = NextResponse.next();
  const supabase = createRouteSupabaseClient(req, response);
  if (!supabase) {
    return NextResponse.json(
      err("INTERNAL_ERROR", "Supabase が設定されていません"),
      { status: 500 }
    );
  }

  const auth = await requireDeveloperAdminWithSupabase(supabase);
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

  try {
    const result = await getAdminLogs(supabase, parsed.data);
    return NextResponse.json(ok(result));
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "管理ログの取得に失敗しました";
    return NextResponse.json(err("INTERNAL_ERROR", message), { status: 500 });
  }
}
