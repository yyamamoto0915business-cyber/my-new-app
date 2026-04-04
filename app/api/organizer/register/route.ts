import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { createOrganizerWithGrants } from "@/lib/db/organizers-with-grants";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST: 主催者登録（Earlybird/Founder30付与付き）
 */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const existing = await getOrganizerIdByProfileId(supabase, user.id);
  if (existing) {
    return NextResponse.json({ error: "既に主催者登録済みです" }, { status: 400 });
  }

  // RLS で organizers の INSERT は「profiles に id = auth.uid() の行があること」が条件。
  // トリガで自動作成されない環境ではプロフィールが無いため、ここで 1 件だけ作成する。
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profileRow) {
    // profiles の INSERT は RLS で弾かれることがあるため、サーバー側では Service Role で補完する。
    const admin = createAdminClient();
    const writer = admin ?? supabase;

    const { error: profileErr } = await writer.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? undefined,
        display_name: user.name ?? user.email ?? undefined,
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

  let body: {
    organizationName?: string;
    contactEmail?: string;
    contactPhone?: string;
    activityArea?: string;
    bio?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const organizationName = String(body.organizationName ?? "").trim();
  if (!organizationName) {
    return NextResponse.json({ error: "団体名は必須です" }, { status: 400 });
  }

  try {
    const organizer = await createOrganizerWithGrants(supabase, {
      profileId: user.id,
      organizationName,
      contactEmail: body.contactEmail?.trim() || undefined,
      contactPhone: body.contactPhone?.trim() || undefined,
    });

    const activityArea = body.activityArea?.trim();
    const bio = body.bio?.trim();
    if (activityArea || bio) {
      const { error: profErr } = await supabase.from("organizer_profiles").insert({
        organizer_id: organizer.id,
        activity_area: activityArea || null,
        bio: bio || null,
      });
      if (profErr) {
        console.error("organizer register: organizer_profiles insert failed", profErr);
      }
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
