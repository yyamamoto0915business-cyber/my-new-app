import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/get-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { createOrganizerWithGrants } from "@/lib/db/organizers-with-grants";
import { createAdminClient } from "@/lib/supabase/admin";
import { truncateShortBio } from "@/lib/organizer/organizer-display";

type RegisterBody = {
  organizationName?: string;
  contactEmail?: string;
  contactPhone?: string;
  activityArea?: string;
  bio?: string;
};

function isAuthDisabled(): boolean {
  return (
    process.env.AUTH_DISABLED === "true" ||
    (process.env.NODE_ENV === "development" && process.env.AUTH_DISABLED !== "false")
  );
}

/**
 * POST: 主催者登録（Earlybird/Founder30付与付き）
 */
export async function POST(request: NextRequest) {
  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const organizationName = String(body.organizationName ?? "").trim();
  if (!organizationName) {
    return NextResponse.json({ error: "団体名は必須です" }, { status: 400 });
  }

  const supabase = await createClient();
  let userId: string | null = null;
  let userEmail: string | null = null;
  let userName: string | null = null;

  if (supabase) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) {
      userId = user.id;
      userEmail = user.email ?? null;
      userName =
        (user.user_metadata?.display_name as string) ??
        (user.user_metadata?.name as string) ??
        user.email?.split("@")[0] ??
        "ユーザー";
    }
  }

  if (!userId && isAuthDisabled()) {
    const session = await getAuth();
    if (session?.user) {
      userId = session.user.id;
      userEmail = session.user.email ?? null;
      userName = session.user.name ?? null;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const activityArea = body.activityArea?.trim() || null;
  const bio = body.bio?.trim() || null;
  const shortBio = bio ? truncateShortBio(bio) : null;
  const contactEmail = body.contactEmail?.trim() || undefined;
  const contactPhone = body.contactPhone?.trim() || undefined;

  const [existing, profileResult] = await Promise.all([
    getOrganizerIdByProfileId(supabase, userId),
    supabase.from("profiles").select("id").eq("id", userId).maybeSingle(),
  ]);

  if (existing) {
    // 初回オンボーディングなどからの再実行を許容
    return NextResponse.json({ id: existing, alreadyRegistered: true }, { status: 200 });
  }

  if (!profileResult.data) {
    // profiles の INSERT は RLS で弾かれることがあるため、サーバー側では Service Role で補完する。
    const admin = createAdminClient();
    const writer = admin ?? supabase;

    const { error: profileErr } = await writer.from("profiles").upsert(
      {
        id: userId,
        email: userEmail ?? undefined,
        display_name: userName ?? userEmail ?? undefined,
      },
      { onConflict: "id" }
    );
    if (profileErr) {
      console.error("organizer register: profile ensure failed", profileErr);
      return NextResponse.json(
        { error: "プロフィールの準備に失敗しました。一度マイページを開いて保存してから再度お試しください。" },
        { status: 500 }
      );
    }
  }

  try {
    const organizer = await createOrganizerWithGrants(supabase, {
      profileId: userId,
      organizationName,
      contactEmail,
      contactPhone,
    });

    const { error: profErr } = await supabase.from("organizer_profiles").insert({
      organizer_id: organizer.id,
      activity_area: activityArea,
      bio,
      short_bio: shortBio,
    });
    if (profErr) {
      console.error("organizer register: organizer_profiles insert failed", profErr);
      return NextResponse.json(
        { error: "公開プロフィールの作成に失敗しました。もう一度お試しください。" },
        { status: 500 }
      );
    }

    return NextResponse.json(organizer, { status: 201 });
  } catch (e) {
    console.error("organizer register:", e);
    const err = e && typeof e === "object" ? (e as Record<string, unknown>) : null;
    const message =
      typeof err?.message === "string"
        ? err.message
        : typeof err?.details === "string"
          ? err.details
          : typeof err?.hint === "string"
            ? err.hint
            : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
