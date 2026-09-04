import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const MAX_BYTES = 10 * 1024 * 1024;

function extForContentType(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function normalizeMime(type: string, fileName: string): string {
  const raw = type === "image/jpg" ? "image/jpeg" : type;
  if (ALLOWED_MIME.has(raw)) {
    return raw === "image/jpg" ? "image/jpeg" : raw;
  }
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return map[ext] ?? "";
}

/** POST: レジ商品画像アップロード */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

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
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "ファイルサイズが大きすぎます（10MBまで）" }, { status: 400 });
  }

  const contentType = normalizeMime(file.type, file.name);
  if (!contentType) {
    return NextResponse.json(
      { error: "対応していないファイル形式です（JPEG・PNG・GIF・WebP のみ）" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "画像ストレージが利用できません" }, { status: 503 });
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  }

  try {
    const ext = extForContentType(contentType);
    const path = `${user.id}/pos/${organizerId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const uploader = createAdminClient() ?? supabase;

    let uploadedBucket = "store-images";
    let { error: uploadError } = await uploader.storage
      .from(uploadedBucket)
      .upload(path, bytes, { contentType, upsert: false });

    if (uploadError) {
      uploadedBucket = "event-images";
      const retry = await uploader.storage
        .from(uploadedBucket)
        .upload(path, bytes, { contentType, upsert: false });
      uploadError = retry.error;
    }

    if (uploadError) {
      console.error("pos image upload:", uploadError.message);
      return NextResponse.json(
        { error: uploadError.message || "画像のアップロードに失敗しました" },
        { status: 500 }
      );
    }

    const { data } = uploader.storage.from(uploadedBucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      return NextResponse.json({ error: "公開URLの取得に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error("pos images POST:", e);
    return NextResponse.json({ error: "画像のアップロードに失敗しました" }, { status: 500 });
  }
}
