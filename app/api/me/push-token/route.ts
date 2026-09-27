import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";

export const runtime = "nodejs";

const TOKEN_PATTERN = /^[0-9a-f]{16,256}$/i;

/** POST: iOS アプリのデバイストークンをログインユーザーに紐づける */
export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let token = "";
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    token = "";
  }
  if (!TOKEN_PATTERN.test(token)) {
    return NextResponse.json({ error: "トークンが正しくありません" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "保存できませんでした" }, { status: 503 });
  }

  const { error } = await admin.from("push_device_tokens").upsert(
    {
      user_id: user.id,
      token,
      platform: "ios",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" }
  );
  if (error) {
    console.error("[push-token]", error);
    return NextResponse.json({ error: "保存できませんでした" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
