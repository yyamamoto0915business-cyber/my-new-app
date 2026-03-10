import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchFeaturedOrganizers } from "@/lib/db/organizers";

/** GET: 注目の主催者（公開イベントを持つ主催者） */
export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
  try {
    const organizers = await fetchFeaturedOrganizers(supabase, 6);
    return NextResponse.json(organizers, {
      headers: { "Cache-Control": "no-store, max-age=60" },
    });
  } catch (e) {
    console.error("organizers featured GET:", e);
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
