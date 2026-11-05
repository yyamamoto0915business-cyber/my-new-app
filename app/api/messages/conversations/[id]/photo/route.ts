import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import {
  CHAT_MEDIA_BUCKET,
  CHAT_PHOTO_DEFAULT_TEXT,
  CHAT_PHOTO_MAX_BYTES,
  CHAT_PHOTO_TYPES,
} from "@/lib/chat/chat-photos";

const CAPTION_MAX = 1000;

/** POST: 会話に写真を1枚送る（multipart: photo, caption?） */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const sessionUser = supabase ? (await supabase.auth.getUser()).data.user : null;
  const userId = sessionUser?.id ?? (await getApiUser())?.id;
  if (!userId) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "いまは写真を送れません" }, { status: 503 });

  const { id: conversationId } = await params;
  if (!conversationId) return NextResponse.json({ error: "会話が見つかりません" }, { status: 400 });

  const { data: member } = await admin
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "この会話には送れません" }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "写真を読みこめませんでした" }, { status: 400 });
  }
  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "写真を選んでください" }, { status: 400 });
  }
  const ext = CHAT_PHOTO_TYPES[photo.type];
  if (!ext) return NextResponse.json({ error: "JPEG・PNG・WebP の写真を選んでください" }, { status: 400 });
  if (photo.size > CHAT_PHOTO_MAX_BYTES) {
    return NextResponse.json({ error: "写真が大きすぎます（4MB まで）" }, { status: 413 });
  }
  const captionRaw = form.get("caption");
  const caption = typeof captionRaw === "string" ? captionRaw.trim().slice(0, CAPTION_MAX) : "";

  const path = `${conversationId}/${userId}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(CHAT_MEDIA_BUCKET)
    .upload(path, Buffer.from(await photo.arrayBuffer()), { contentType: photo.type, upsert: false });
  if (uploadError) {
    console.error("[chat photo] upload failed", uploadError.message);
    return NextResponse.json({ error: "写真を送れませんでした" }, { status: 500 });
  }

  const { error: insertError } = await admin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    content: caption || CHAT_PHOTO_DEFAULT_TEXT,
    image_path: path,
  });
  if (insertError) {
    console.error("[chat photo] insert failed", insertError.message);
    await admin.storage.from(CHAT_MEDIA_BUCKET).remove([path]);
    return NextResponse.json({ error: "写真を送れませんでした" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
