import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { fetchInboxByQueries } from "@/lib/inbox-queries";
import { fetchInboxDirectDb } from "@/lib/inbox-direct-db";

/** GET: トーク一覧（直接DB接続を優先、スキーマキャッシュ問題を回避） */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (dbUrl) {
    try {
      const items = await fetchInboxDirectDb(user.id);
      return NextResponse.json(items);
    } catch (e) {
      const err = e as Error;
      console.error("fetchInboxDirectDb error:", err);
      return NextResponse.json(
        {
          error: "DB接続に失敗しました",
          detail: err.message,
        },
        { status: 500 }
      );
    }
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase が設定されていません" },
      { status: 503 }
    );
  }

  try {
    const items = await fetchInboxByQueries(supabase, user.id);
    return NextResponse.json(items);
  } catch (e) {
    const err = e as Error;
    console.error("fetchInboxByQueries error:", err);
    return NextResponse.json(
      {
        error: "トーク一覧の取得に失敗しました",
        detail: err.message,
      },
      { status: 500 }
    );
  }
}
