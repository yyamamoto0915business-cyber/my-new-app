import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOrganizerApi } from "@/lib/organizer/require-organizer-api";
import { requireOrganizerFeature } from "@/lib/organizer/require-organizer-feature";

const ALLOWED_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_BYTES = 20 * 1024 * 1024;
const DIRECT_MAX_BYTES = 4 * 1024 * 1024;

function extForContentType(contentType: string): string {
  if (contentType === "video/webm") return "webm";
  if (contentType === "video/quicktime") return "mov";
  return "mp4";
}

function normalizeMime(type: string, fileName: string): string {
  if (ALLOWED_MIME.has(type)) return type;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
  };
  return map[ext] ?? "";
}

/** POST: スタンプラリーの動画。JSON は20MBまでのアップロード先、ファイル直送は4MBまで。 */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const auth = await requireOrganizerApi();
  if (!auth.ok) return auth.response;
  const planBlocked = await requireOrganizerFeature(auth.supabase, auth.organizerId, "games");
  if (planBlocked) return planBlocked;

  if ((request.headers.get("content-type") ?? "").includes("application/json")) {
    let body: { fileName?: unknown; contentType?: unknown; size?: unknown; gameId?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const fileName = typeof body.fileName === "string" ? body.fileName : "movie.mp4";
    const contentType = normalizeMime(typeof body.contentType === "string" ? body.contentType : "", fileName);
    const size = typeof body.size === "number" ? body.size : Number(body.size);
    if (!contentType) {
      return NextResponse.json({ error: "対応していない動画です（MP4・WEBM・MOV）" }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
      return NextResponse.json({ error: "動画は20MBまでです" }, { status: 400 });
    }
    const gameId = typeof body.gameId === "string" ? body.gameId.trim() : "";
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
    const path = `${user.id}/games/${Date.now()}-${Math.random().toString(16).slice(2)}.${extForContentType(contentType)}`;
    let bucket = "game-images";
    let signed = await uploader.storage.from(bucket).createSignedUploadUrl(path);
    if (signed.error) {
      bucket = "post-media";
      signed = await uploader.storage.from(bucket).createSignedUploadUrl(path);
    }
    if (signed.error || !signed.data) {
      console.error("game video sign:", signed.error?.message);
      return NextResponse.json({ error: "動画のアップロードを開始できませんでした" }, { status: 500 });
    }
    const { data: pub } = uploader.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({
      bucket,
      path: signed.data.path,
      token: signed.data.token,
      publicUrl: pub.publicUrl,
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "動画ファイルが必要です" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > DIRECT_MAX_BYTES) {
    return NextResponse.json({ error: "動画は20MBまでです。もう一度選んでください。" }, { status: 400 });
  }
  const contentType = normalizeMime(file.type, file.name);
  if (!contentType) {
    return NextResponse.json({ error: "対応していない動画です（MP4・WEBM・MOV）" }, { status: 400 });
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
    bucket = "post-media";
    const retry = await uploader.storage.from(bucket).upload(path, bytes, { contentType, upsert: false });
    uploadError = retry.error;
  }
  if (uploadError) {
    console.error("game video upload:", uploadError.message);
    return NextResponse.json({ error: "動画のアップロードに失敗しました" }, { status: 500 });
  }

  const { data } = uploader.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    return NextResponse.json({ error: "公開URLの取得に失敗しました" }, { status: 500 });
  }
  return NextResponse.json({ url: data.publicUrl });
}
