import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchMyApplication,
  fetchRecruitmentById,
  saveApplicationFormDraft,
  submitApplicationFormAnswers,
} from "@/lib/db/recruitments-mvp";
import {
  getStoreApplication,
  getStoreRecruitmentById,
  updateStoreApplication,
} from "@/lib/created-recruitments-store";
import { getStoreRecruitmentIfExists } from "@/lib/store-recruitment-api";
import {
  getManualFormInputLabels,
  parseApplicationFormAnswers,
  resolveApplicationFormConfig,
  validateApplicationFormAnswers,
  type ApplicationFormAnswers,
} from "@/lib/recruitment-application-form";

type Params = { params: Promise<{ id: string }> };

async function loadProfilePrefill(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  if (!supabase) return { displayName: null as string | null, phone: null as string | null, avatarUrl: null as string | null };
  const { data } = await supabase
    .from("profiles")
    .select("display_name, phone, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return {
    displayName: (data?.display_name as string | null) ?? null,
    phone: (data?.phone as string | null) ?? null,
    avatarUrl: (data?.avatar_url as string | null) ?? null,
  };
}

/** GET: 応募フォーム設定・既存回答 */
export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: recruitmentId } = await params;
  if (!recruitmentId) {
    return NextResponse.json({ error: "募集IDが必要です" }, { status: 400 });
  }

  const supabase = await createClient();

  if (getStoreRecruitmentIfExists(recruitmentId) || !supabase) {
    const recruitment = getStoreRecruitmentById(recruitmentId);
    if (!recruitment) {
      return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
    }
    const application = getStoreApplication(recruitmentId, user.id);
    if (!application) {
      return NextResponse.json({ error: "先に応募してください" }, { status: 400 });
    }
    const config = resolveApplicationFormConfig(recruitment.application_form_config);
    return NextResponse.json({
      recruitment: {
        id: recruitment.id,
        title: recruitment.title,
        description: recruitment.description,
        start_at: recruitment.start_at,
        end_at: recruitment.end_at,
        meeting_place: recruitment.meeting_place,
        roles: recruitment.roles,
        provisions: recruitment.provisions,
        items_to_bring: recruitment.items_to_bring,
        notes: recruitment.notes,
        organizerName: recruitment.organizers?.organization_name ?? null,
      },
      config,
      requiredLabels: getManualFormInputLabels(config),
      application: {
        id: application.id,
        status: application.status,
        form_answers: application.form_answers,
        form_completed_at: application.form_completed_at,
        message: application.message,
      },
      profile: { displayName: null, phone: null, avatarUrl: null },
    });
  }

  try {
    const recruitment = await fetchRecruitmentById(supabase, recruitmentId);
    if (!recruitment) {
      return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
    }
    const application = await fetchMyApplication(supabase, recruitmentId, user.id);
    if (!application) {
      return NextResponse.json({ error: "先に応募してください" }, { status: 400 });
    }
    const config = resolveApplicationFormConfig(recruitment.application_form_config);
    const profile = await loadProfilePrefill(supabase, user.id);
    return NextResponse.json({
      recruitment: {
        id: recruitment.id,
        title: recruitment.title,
        description: recruitment.description,
        start_at: recruitment.start_at,
        end_at: recruitment.end_at,
        meeting_place: recruitment.meeting_place,
        roles: recruitment.roles,
        provisions: recruitment.provisions,
        items_to_bring: recruitment.items_to_bring,
        notes: recruitment.notes,
        organizerName: recruitment.organizers?.organization_name ?? null,
      },
      config,
      requiredLabels: getManualFormInputLabels(config),
      application: {
        id: application.id,
        status: application.status,
        form_answers: application.form_answers,
        form_completed_at: application.form_completed_at,
        message: application.message,
      },
      profile,
    });
  } catch (e) {
    console.error("application-form GET:", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

/** POST: フォーム提出 */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: recruitmentId } = await params;
  if (!recruitmentId) {
    return NextResponse.json({ error: "募集IDが必要です" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const answers = parseApplicationFormAnswers(body.answers);
  const isDraft = body.draft === true;

  const supabase = await createClient();

  if (getStoreRecruitmentIfExists(recruitmentId) || !supabase) {
    const recruitment = getStoreRecruitmentById(recruitmentId);
    if (!recruitment) {
      return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
    }
    const application = getStoreApplication(recruitmentId, user.id);
    if (!application) {
      return NextResponse.json({ error: "先に応募してください" }, { status: 400 });
    }
    if (application.form_completed_at) {
      return NextResponse.json({ error: "すでに提出済みです" }, { status: 400 });
    }
    const config = resolveApplicationFormConfig(recruitment.application_form_config);
    if (!isDraft) {
      const validationError = validateApplicationFormAnswers(config, answers);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }
    const messageFromForm =
      typeof answers.message === "string" ? answers.message : application.message;
    updateStoreApplication(application.id, {
      form_answers: answers as ApplicationFormAnswers,
      ...(isDraft
        ? {}
        : {
            form_completed_at: new Date().toISOString(),
            ...(typeof answers.desired_role === "string" && answers.desired_role.trim()
              ? { role_assigned: answers.desired_role.trim() }
              : {}),
          }),
      message: messageFromForm,
    });
    return NextResponse.json({ success: true, formCompleted: !isDraft, draft: isDraft });
  }

  try {
    const recruitment = await fetchRecruitmentById(supabase, recruitmentId);
    if (!recruitment) {
      return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
    }
    const application = await fetchMyApplication(supabase, recruitmentId, user.id);
    if (!application) {
      return NextResponse.json({ error: "先に応募してください" }, { status: 400 });
    }
    if (application.form_completed_at) {
      return NextResponse.json({ error: "すでに提出済みです" }, { status: 400 });
    }
    const config = resolveApplicationFormConfig(recruitment.application_form_config);
    if (!isDraft) {
      const validationError = validateApplicationFormAnswers(config, answers);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }
    const messageFromForm =
      typeof answers.message === "string" ? answers.message : application.message;
    if (isDraft) {
      await saveApplicationFormDraft(
        supabase,
        application.id,
        user.id,
        answers,
        messageFromForm
      );
      return NextResponse.json({ success: true, formCompleted: false, draft: true });
    }
    await submitApplicationFormAnswers(
      supabase,
      application.id,
      user.id,
      answers,
      messageFromForm
    );
    // 希望役割は主催者確認用に role_assigned へも反映（未割当時）
    if (
      typeof answers.desired_role === "string" &&
      answers.desired_role.trim() &&
      !application.role_assigned
    ) {
      await supabase
        .from("recruitment_applications")
        .update({ role_assigned: answers.desired_role.trim() })
        .eq("id", application.id)
        .eq("user_id", user.id);
    }
    return NextResponse.json({ success: true, formCompleted: true });
  } catch (e) {
    console.error("application-form POST:", e);
    return NextResponse.json({ error: "提出に失敗しました" }, { status: 500 });
  }
}
