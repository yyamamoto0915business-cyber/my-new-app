import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSponsorApplication } from "@/lib/db/sponsors";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  if (!eventId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  let body: {
    tierId?: string;
    companyName?: string;
    personName?: string;
    email?: string;
    phone?: string;
    invoiceInfo?: string;
    message?: string;
    logoUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tierId, companyName, personName, email, phone, invoiceInfo, message, logoUrl } = body;

  if (!tierId || !companyName?.trim() || !personName?.trim() || !email?.trim()) {
    return NextResponse.json({
      error: "会社名・担当者名・メールアドレスは必須です",
    }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const application = await createSponsorApplication(supabase, {
    eventId,
    tierId,
    companyName: companyName.trim(),
    personName: personName.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    invoiceInfo: invoiceInfo?.trim(),
    message: message?.trim(),
    logoUrl: logoUrl?.trim(),
  });

  if (!application) {
    return NextResponse.json({ error: "申込の送信に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    applicationId: application.id,
    message: "申込を受け付けました。運営よりご連絡いたします。",
  });
}
