import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import { requireOrganizerFeature } from "@/lib/organizer/require-organizer-feature";

const ALLOWED_MIME = new Set(["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/aac"]);
const MAX_BYTES = 4 * 1024 * 1024;

function extFor(contentType: string): string {
  if (contentType === "audio/wav" || contentType === "audio/x-wav") return "wav";
  if (contentType === "audio/mp4") return "m4a";
  if (contentType === "audio/aac") return "aac";
  return "mp3";
}

function normalizeMime(type: string, fileName: string): string {
  if (ALLOWED_MIME.has(type)) return type;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    aac: "audio/aac",
  };
  return map[ext] ?? "";
}

/** POST: スタンプの音。MP3 / M4A / WAV / AAC、4MBまで。 */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;
  const planBlocked = await requireOrganizerFeature(auth.supabase, auth.organizerId, "games");
  if (planBlocked) return planBlocked;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "音声ファイルが必要です" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "音声は4MBまでです" }, { status: 400 });
  }
  const contentType = normalizeMime(file.type, file.name);
  if (!contentType) {
    return NextResponse.json({ error: "対応していない音声です（MP3・M4A・WAV・AAC）" }, { status: 400 });
  }
  const gameId = String(form.get("gameId") ?? "").trim();
  if (gameId) {
    const { data, error } = await auth.supabase
      .from("organizer_games")
      .select("id")
      .eq("id", gameId)
      .eq("organizer_id", auth.organizerId)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const uploader = createAdminClient() ?? auth.supabase;
  const path = `${user.id}/games/${Date.now()}-${Math.random().toString(16).slice(2)}.${extFor(contentType)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bucket = "game-images";
  let uploaded = await uploader.storage.from(bucket).upload(path, bytes, { contentType, upsert: false });
  if (uploaded.error) {
    bucket = "post-media";
    uploaded = await uploader.storage.from(bucket).upload(path, bytes, { contentType, upsert: false });
  }
  if (uploaded.error) {
    console.error("game audio upload:", uploaded.error.message);
    return NextResponse.json({ error: "音声のアップロードに失敗しました" }, { status: 500 });
  }
  const { data } = uploader.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) return NextResponse.json({ error: "公開URLの取得に失敗しました" }, { status: 500 });
  return NextResponse.json({ url: data.publicUrl });
}
