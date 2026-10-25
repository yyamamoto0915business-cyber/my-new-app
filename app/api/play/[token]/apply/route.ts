import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/db/notifications";
import { applyPlayGameEntry, getPlayDb } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";
import { getGamePassHref } from "@/lib/event-purchase";

type Params = { params: Promise<{ token: string }> };

/** POST: ゲームに申し込む（イベントを使わず、ゲームだけで申し込みを受け付けるとき） */
export async function POST(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  const db = getPlayDb();
  if (!db) return NextResponse.json({ error: "申し込みを受け付けられません" }, { status: 503 });

  const userId = await readPlayUserId();
  try {
    const result = await applyPlayGameEntry(db, token, userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code ?? null }, { status: result.status });
    }
    if (!result.already && userId) {
      try {
        const supabase = await createClient();
        if (supabase) {
          await createNotification(supabase, userId, "system_message", "参加パスが届きました", {
            body: `「${result.gameName}」の申し込みが完了しました。参加パスから、いつでもゲームを始められます。`,
            link: getGamePassHref(result.gameId),
          });
        }
      } catch (error) {
        // 通知が送れなくても、申し込みはできている。
        console.error("game entry notification:", error);
      }
    }
    return NextResponse.json({ ok: true, already: result.already, passHref: getGamePassHref(result.gameId) });
  } catch (e) {
    console.error("play apply POST:", e);
    return NextResponse.json({ error: "申し込みに失敗しました" }, { status: 500 });
  }
}
