import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listPublishedOrganizerGames } from "@/lib/organizer/public-games";

/** GET: 公開中のゲーム一覧（まちの情報） */
export async function GET(request: NextRequest) {
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 100);
  const supabase = createAdminClient() ?? (await createClient());
  if (!supabase) {
    return NextResponse.json([]);
  }

  try {
    const games = await listPublishedOrganizerGames(supabase, limit);
    return NextResponse.json(games);
  } catch (e) {
    console.error("games GET:", e);
    return NextResponse.json([], { status: 500 });
  }
}
