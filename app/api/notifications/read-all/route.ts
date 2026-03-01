import { createClient } from "@/lib/supabase/server";
import { markAllAsRead } from "@/lib/db/notifications";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase が設定されていません" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const ok = await markAllAsRead(supabase, user.id);
  if (!ok) {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
