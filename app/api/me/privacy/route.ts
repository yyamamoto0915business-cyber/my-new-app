import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getMemoryIsPrivate,
  setMemoryIsPrivate,
} from "@/lib/created-profile-privacy-store";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const supabase = await createClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_private")
      .eq("id", user.id)
      .maybeSingle();
    if (!error && data && typeof (data as { is_private?: boolean }).is_private === "boolean") {
      const isPrivate = Boolean((data as { is_private: boolean }).is_private);
      setMemoryIsPrivate(user.id, isPrivate);
      return NextResponse.json({ isPrivate });
    }
  }
  return NextResponse.json({ isPrivate: getMemoryIsPrivate(user.id) });
}

export async function PATCH(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON が不正です" }, { status: 400 });
  }
  const isPrivate = Boolean((body as { isPrivate?: unknown }).isPrivate);
  setMemoryIsPrivate(user.id, isPrivate);

  const client = createAdminClient() ?? (await createClient());
  if (client) {
    const { error } = await client
      .from("profiles")
      .update({ is_private: isPrivate, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error && !/schema cache|does not exist|42703/i.test(error.message)) {
      console.error("PATCH /api/me/privacy:", error.message);
    }
  }

  return NextResponse.json({ isPrivate });
}
