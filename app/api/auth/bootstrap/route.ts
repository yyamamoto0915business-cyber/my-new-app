import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * ブラウザの Supabase クライアントが Cookie からセッションを読めない場合の復旧用。
 * サーバーは Request の Cookie からセッションを読めるため、トークンを返しクライアントで setSession する。
 * 同一オリジン・credentials 付き fetch のみ想定。
 */
export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ session: null });
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token || !session.refresh_token) {
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    },
  });
}
