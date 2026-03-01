import { NextRequest, NextResponse } from "next/server";
import { createGiftCode } from "../../../lib/gift-codes-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, recipientEmail, recipientName, message, expiresInDays } = body;

    if (!eventId?.trim()) {
      return NextResponse.json(
        { error: "eventId は必須です" },
        { status: 400 }
      );
    }

    const gift = createGiftCode({
      eventId: String(eventId).trim(),
      recipientEmail: recipientEmail?.trim() || null,
      recipientName: recipientName?.trim() || null,
      message: message?.trim() || null,
      expiresInDays: expiresInDays ? Number(expiresInDays) : 30,
    });

    return NextResponse.json(gift, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "ギフトコードの作成に失敗しました" },
      { status: 500 }
    );
  }
}
