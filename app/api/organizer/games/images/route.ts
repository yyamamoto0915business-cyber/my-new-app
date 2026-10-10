import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function extForContentType(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

function normalizeMime(type: string, fileName: string): string {
  const raw = type === "image/jpg" ? "image/jpeg" : type;
  if (ALLOWED_MIME.has(raw)) return raw;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return map[ext] ?? "";
}

/** POST: スタンプラリーの写真。JPEG / PNG / WEBP、5MBまで。 */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "画像ファイルが必要です" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "ファイルサイズが大きすぎます（5MBまで）" }, { status: 400 });
  }
  const contentType = normalizeMime(file.type, file.name);
  if (!contentType) {
    return NextResponse.json(
      { error: "対応していないファイル形式です（JPEG・PNG・WEBP のみ）" },
      { status: 400 }
    );
  }

  const gameId = String(form.get("gameId") ?? "").trim();
  if (gameId) {
    const { data, error } = await auth.supabase
      .from("organizer_games")
      .select("id")
      .eq("id", gameId)
      .eq("organizer_id", auth.organizerId)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
    }
  }

  const uploader = createAdminClient() ?? auth.supabase;
  const ext = extForContentType(contentType);
  const path = `${user.id}/games/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  let bucket = "game-images";
  let { error: uploadError } = await uploader.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (uploadError) {
    bucket = "event-images";
    const retry = await uploader.storage.from(bucket).upload(path, bytes, { contentType, upsert: false });
    uploadError = retry.error;
  }
  if (uploadError) {
    console.error("game image upload:", uploadError.message);
    return NextResponse.json({ error: "画像のアップロードに失敗しました" }, { status: 500 });
  }

  const { data } = uploader.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    return NextResponse.json({ error: "公開URLの取得に失敗しました" }, { status: 500 });
  }
  return NextResponse.json({ url: data.publicUrl });
}
