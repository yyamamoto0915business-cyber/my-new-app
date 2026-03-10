import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireDeveloperAdmin } from "@/lib/auth/admin";
import { getAdminDashboard } from "@/lib/admin/queries";
import { ok, err } from "@/lib/admin/dto";

export async function GET() {
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

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      err("INTERNAL_ERROR", "Supabase が設定されていません"),
      { status: 500 }
    );
  }

  const stats = await getAdminDashboard(supabase);
  if (!stats) {
    return NextResponse.json(
      err("INTERNAL_ERROR", "ダッシュボードの取得に失敗しました"),
      { status: 500 }
    );
  }

  return NextResponse.json(
    ok({
      totalOrganizers: stats.totalOrganizers,
      freeCount: stats.freeCount,
      paidCount: stats.paidCount,
      manualGrantCount: stats.manualGrantCount,
      expiringSoonCount: stats.expiringSoonCount,
      recentLogs: stats.recentLogs,
    })
  );
}
