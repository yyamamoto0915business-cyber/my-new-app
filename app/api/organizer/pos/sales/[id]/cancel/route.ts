import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getPosSaleById } from "@/lib/db/pos";
import { getStripeSecretKey } from "@/lib/stripe";
import { settlePendingPosSale } from "@/lib/pos/pending-sales";

type Params = { params: Promise<{ id: string }> };

/**
 * POST: スマホ払い・カードタッチの支払い待ちを「やめる」。
 * 先に Stripe 側でその支払いを止めて（あとから払えないように）、会計を取り消し、預かっていたポイントを戻す。
 * Stripe 側で払い終わっていたら、支払い済みにして返す。
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });

  try {
    const sale = await getPosSaleById(supabase, organizerId, id);
    if (!sale) return NextResponse.json({ error: "会計が見つかりません" }, { status: 404 });
    const key = getStripeSecretKey();
    const stripe = key ? new Stripe(key) : null;
    const outcome = await settlePendingPosSale(supabase, stripe, sale);
    const after = await getPosSaleById(supabase, organizerId, id);
    const pts = sale.pointsUsed > 0 ? `${sale.pointsUsed}ptを戻しました。` : "";
    if (outcome === "cancelled") {
      return NextResponse.json({ outcome, sale: after, message: `支払いをやめました。${pts}` });
    }
    if (outcome === "paid") {
      return NextResponse.json({ outcome, sale: after, message: "お支払いはもう終わっていました。" });
    }
    if (outcome === "busy") {
      return NextResponse.json(
        { outcome, sale: after, error: "いま支払いの途中のため、やめられません。少し待ってからもう一度押してください。" },
        { status: 409 }
      );
    }
    return NextResponse.json({ outcome, sale: after, message: "この会計は、もう支払い待ちではありません。" });
  } catch (e) {
    console.error("pos sale cancel:", e);
    return NextResponse.json({ error: "やめる処理に失敗しました。時間をおいてもう一度押してください。" }, { status: 500 });
  }
}
