import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ code: string }> };

/** GET: 受付コードからトークンを引く（公開エンドポイント） */
export async function GET(_req: NextRequest, { params }: Params) {
  const { code } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB未設定" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("events")
    .select("checkin_token")
    .eq("checkin_code", code.toUpperCase())
    .eq("checkin_enabled", true)
    .maybeSingle();

  if (error || !data?.checkin_token) {
    return NextResponse.json({ error: "受付コードが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ token: data.checkin_token });
}
