import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listPublicStores } from "@/lib/db/stores";
import { listMemoryPublicStores } from "@/lib/stores/memory-store";

/** GET: 公開中の店舗一覧（まち情報ハブ） */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const supabase = await createClient();
  if (supabase) {
    try {
      const list = await listPublicStores(supabase, { limit });
      return NextResponse.json(list);
    } catch (e) {
      console.error("stores GET:", e);
      return NextResponse.json([], { status: 500 });
    }
  }

  return NextResponse.json(listMemoryPublicStores(limit));
}
