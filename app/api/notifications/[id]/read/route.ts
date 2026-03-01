import { createClient } from "@/lib/supabase/server";
import { markAsRead } from "@/lib/db/notifications";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  if (!supabase) {
    return NextResponse.json({ error: "Supabase が設定されていません" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const ok = await markAsRead(supabase, id, user.id);
  if (!ok) {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
