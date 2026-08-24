import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  POST_PHOTO_UPLOAD_MAX_BYTES,
  isAcceptedPhotoMime,
} from "@/lib/posts/post-photos";
import {
  POST_VIDEO_UPLOAD_SERVER_MAX_BYTES,
  POST_VIDEO_MAX_DURATION_SEC,
} from "@/lib/posts/post-video";

const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function extForVideo(contentType: string): string {
  switch (contentType) {
    case "video/webm":
      return "webm";
    case "video/quicktime":
      return "mov";
    default:
      return "mp4";
  }
}

function extForImage(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function normalizeVideoMime(type: string, fileName: string): string {
  const raw = type.toLowerCase().split(";")[0]?.trim() ?? "";
  if (VIDEO_MIME.has(raw)) return raw;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
  };
  return map[ext] ?? "";
}

function normalizeImageMime(type: string, fileName: string): string {
  const raw = type.toLowerCase();
  if (isAcceptedPhotoMime(raw)) return raw;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return map[ext] ?? "";
}

/** POST: 投稿メディアを Storage にアップロード */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "video");
  const durationRaw = Number(form.get("durationSec"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "ストレージが利用できません" },
      { status: 503 },
    );
  }

  try {
    const uploader = createAdminClient() ?? supabase;
    let path: string;
    let contentType: string;
    let bytes: Uint8Array;

    if (kind === "image") {
      if (file.size > POST_PHOTO_UPLOAD_MAX_BYTES) {
        return NextResponse.json(
          { error: "写真が大きすぎます。送信前に縮小してください" },
          { status: 400 },
        );
      }
      contentType = normalizeImageMime(file.type, file.name);
      if (!contentType) {
        return NextResponse.json(
          { error: "対応していない画像形式です（JPEG / PNG / WebP）" },
          { status: 400 },
        );
      }
      const ext = extForImage(contentType);
      path = `${user.id}/images/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
      bytes = new Uint8Array(await file.arrayBuffer());
    } else {
      if (file.size > POST_VIDEO_UPLOAD_SERVER_MAX_BYTES) {
        return NextResponse.json(
          { error: "動画が大きすぎます。送信前に圧縮してください" },
          { status: 400 },
        );
      }
      if (
        !Number.isFinite(durationRaw) ||
        durationRaw <= 0 ||
        durationRaw > POST_VIDEO_MAX_DURATION_SEC + 0.25
      ) {
        return NextResponse.json(
          { error: `動画は${POST_VIDEO_MAX_DURATION_SEC}秒以内にしてください` },
          { status: 400 },
        );
      }
      contentType = normalizeVideoMime(file.type, file.name);
      if (!contentType) {
        return NextResponse.json(
          { error: "対応していない動画形式です（MP4 / WebM / MOV）" },
          { status: 400 },
        );
      }
      const ext = extForVideo(contentType);
      path = `${user.id}/videos/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
      bytes = new Uint8Array(await file.arrayBuffer());
    }

    const { error: uploadError } = await uploader.storage
      .from("post-media")
      .upload(path, bytes, { contentType, upsert: false });

    if (uploadError) {
      console.error("post media upload:", uploadError.message);
      return NextResponse.json(
        { error: uploadError.message || "アップロードに失敗しました" },
        { status: 500 },
      );
    }

    const { data } = uploader.storage.from("post-media").getPublicUrl(path);
    const publicUrl = data?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json(
        { error: "公開URLの取得に失敗しました" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: publicUrl,
      ...(kind === "video" ? { durationSec: durationRaw } : {}),
    });
  } catch (e) {
    console.error("posts upload POST:", e);
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 },
    );
  }
}
