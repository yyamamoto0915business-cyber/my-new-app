import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireDeveloperAdminWithSupabase } from "@/lib/auth/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 代わりに作った主催者ページのプロフィール（名前・アイコン・カバー・紹介）。
 * ふだんのプロフィール編集は「自分の主催者」だけを書くので、受け取り前のページは運営がここで書く。
 */

async function guard(req: NextRequest) {
  const supabase = createRouteSupabaseClient(req, NextResponse.next());
  if (!supabase) return { error: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) };
  const auth = await requireDeveloperAdminWithSupabase(supabase);
  if (!auth.ok) return { error: NextResponse.json({ error: "開発者権限が必要です" }, { status: auth.status }) };
  const admin = createAdminClient();
  if (!admin) return { error: NextResponse.json({ error: "データベースに接続できません" }, { status: 503 }) };
  return { admin };
}

/** 受け取り前の、代わりに作ったページだけを書けるようにする */
async function assertUnclaimedProxy(admin: SupabaseClient, organizerId: string): Promise<string | null> {
  const { data } = await admin.from("organizer_claims").select("claimed_at").eq("organizer_id", organizerId).maybeSingle();
  if (!data) return "代わりに作ったページではありません";
  if ((data as { claimed_at: string | null }).claimed_at) return "受け取り済みのページは、相手が編集します";
  return null;
}

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_BYTES = 8 * 1024 * 1024;

async function upload(admin: SupabaseClient, bucket: string, organizerId: string, name: string, file: File): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("画像は JPEG・PNG・WebP・GIF にしてください");
  if (file.size > MAX_BYTES) throw new Error("画像は 8MB 以下にしてください");
  const path = `proxy/${organizerId}/${name}-${Date.now()}.${ext}`;
  const { error } = await admin.storage.from(bucket).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error("画像を保存できませんでした");
  return admin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if ("error" in g) return g.error;
  const { id } = await params;
  const [{ data: org }, { data: op }] = await Promise.all([
    g.admin.from("organizers").select("organization_name").eq("id", id).maybeSingle(),
    g.admin
      .from("organizer_profiles")
      .select("avatar_url, cover_image_url, short_bio, bio, activity_area, website_url, instagram_url")
      .eq("organizer_id", id)
      .maybeSingle(),
  ]);
  if (!org) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  const p = (op ?? {}) as Record<string, string | null>;
  return NextResponse.json({
    name: (org as { organization_name: string | null }).organization_name ?? "",
    avatarUrl: p.avatar_url ?? null,
    coverUrl: p.cover_image_url ?? null,
    shortBio: p.short_bio ?? "",
    bio: p.bio ?? "",
    area: p.activity_area ?? "",
    websiteUrl: p.website_url ?? "",
    instagramUrl: p.instagram_url ?? "",
  });
}

/** POST（multipart）：name・shortBio・bio・area・websiteUrl・instagramUrl・avatar（画像）・cover（画像） */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if ("error" in g) return g.error;
  const { id } = await params;
  const blocked = await assertUnclaimedProxy(g.admin, id);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 400 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "内容を読み取れませんでした" }, { status: 400 });
  const text = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const name = text("name", 80);
  if (!name) return NextResponse.json({ error: "名前を入れてください" }, { status: 400 });

  try {
    const avatar = form.get("avatar");
    const cover = form.get("cover");
    const avatarUrl = avatar instanceof File && avatar.size > 0 ? await upload(g.admin, "organizer-avatars", id, "avatar", avatar) : undefined;
    const coverUrl = cover instanceof File && cover.size > 0 ? await upload(g.admin, "organizer-covers", id, "cover", cover) : undefined;
    const now = new Date().toISOString();

    const { error: e1 } = await g.admin.from("organizers").update({ organization_name: name, updated_at: now }).eq("id", id);
    if (e1) throw new Error("保存できませんでした");
    const row: Record<string, unknown> = {
      organizer_id: id,
      // 公開用の名前は display_name が先に出るので空にして、organizers の名前を出す
      display_name: null,
      short_bio: text("shortBio", 120) || null,
      bio: text("bio", 2000) || null,
      activity_area: text("area", 80) || null,
      website_url: text("websiteUrl", 300) || null,
      instagram_url: text("instagramUrl", 300) || null,
      updated_at: now,
    };
    if (avatarUrl) row.avatar_url = avatarUrl;
    if (coverUrl) row.cover_image_url = coverUrl;
    const { error: e2 } = await g.admin.from("organizer_profiles").upsert(row, { onConflict: "organizer_id" });
    if (e2) throw new Error("保存できませんでした");
    return NextResponse.json({ ok: true, avatarUrl: avatarUrl ?? null, coverUrl: coverUrl ?? null });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存できませんでした" }, { status: 400 });
  }
}
