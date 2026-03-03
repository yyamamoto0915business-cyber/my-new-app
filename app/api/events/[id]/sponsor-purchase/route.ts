import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSponsorPurchase } from "@/lib/db/sponsors";
import { addSponsorPurchase } from "@/lib/sponsor-purchases-store";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  if (!eventId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  let body: {
    tierId?: string;
    amount?: number;
    quantity?: number;
    displayName?: string;
    isAnonymous?: boolean;
    comment?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tierId, amount, quantity = 1, displayName, isAnonymous = false, comment } = body;

  if (!tierId || !amount || amount <= 0) {
    return NextResponse.json({ error: "tierId と amount は必須です" }, { status: 400 });
  }

  const supabase = await createClient();
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  const status = stripeConfigured ? "pending" : "paid";

  if (supabase) {
    const isSyntheticTier = tierId.startsWith("f-ind-") || tierId.startsWith("f-cmp-");
    if (!isSyntheticTier) {
      const purchase = await createSponsorPurchase(supabase, {
        eventId,
        tierId,
        amount,
        quantity,
        displayName,
        isAnonymous,
        comment,
        status,
      });
      if (purchase) {
        if (stripeConfigured) {
          return NextResponse.json({
            success: true,
            purchaseId: purchase.id,
            status: "pending",
            message: "Stripe決済の準備ができ次第、リダイレクトURLを返します",
          });
        }
        return NextResponse.json({
          success: true,
          purchaseId: purchase.id,
          status: "paid",
          message: "応援ありがとうございます",
        });
      }
    }
  }

  addSponsorPurchase({
    eventId,
    tierId,
    amount,
    quantity,
    displayName: displayName || undefined,
    isAnonymous,
    comment: comment || undefined,
    status: "paid",
  });

  return NextResponse.json({
    success: true,
    purchaseId: "local",
    status: "paid",
    message: "応援ありがとうございます",
  });
}
