import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 公開プロフィールの最小情報（詳細ページ用・軽量） */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("organizer_public_profiles")
    .select("organization_name, avatar_url, short_bio, bio, activity_area")
    .eq("organizer_id", id)
    .maybeSingle();

  if (error) {
    console.error("organizers/[id]/public", error.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      organizerId: id,
      organizerName: null,
      organizerAvatarUrl: null,
      organizerBio: null,
      organizerRegion: null,
    });
  }

  const shortBio =
    typeof data.short_bio === "string" ? data.short_bio.trim() : "";
  const bio = typeof data.bio === "string" ? data.bio.trim() : "";

  return NextResponse.json({
    organizerId: id,
    organizerName:
      typeof data.organization_name === "string"
        ? data.organization_name.trim() || null
        : null,
    organizerAvatarUrl:
      typeof data.avatar_url === "string" ? data.avatar_url : null,
    organizerBio: shortBio || bio || null,
    organizerRegion:
      typeof data.activity_area === "string" ? data.activity_area : null,
  });
}
