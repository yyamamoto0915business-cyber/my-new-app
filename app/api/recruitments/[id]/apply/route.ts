import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchRecruitmentById,
  createApplication,
  getApplicationStatus,
} from "@/lib/db/recruitments-mvp";
import {
  getStoreRecruitmentById,
  addStoreApplication,
  getStoreApplicationStatus,
} from "@/lib/created-recruitments-store";
import {
  afterApplicationCreated,
  buildApplyFormResult,
} from "@/lib/application-form-apply";
import {
  applicationFormNeedsInput,
  resolveApplicationFormConfig,
} from "@/lib/recruitment-application-form";

type Params = { params: Promise<{ id: string }> };

/** POST: 応募（1タップ応募 + フォーム入力通知） */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: recruitmentId } = await params;
  if (!recruitmentId) {
    return NextResponse.json({ error: "募集IDが必要です" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    // 空body OK
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  const supabase = await createClient();

  if (supabase) {
    try {
      const recruitment = await fetchRecruitmentById(supabase, recruitmentId);
      if (!recruitment) {
        return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
      }
      if (recruitment.status !== "public") {
        return NextResponse.json({ error: "この募集は受付中ではありません" }, { status: 400 });
      }

      const existingStatus = await getApplicationStatus(supabase, recruitmentId, user.id);
      if (existingStatus) {
        return NextResponse.json(
          { error: "すでに応募済みです", status: existingStatus },
          { status: 400 }
        );
      }

      const formRequired = applicationFormNeedsInput(
        resolveApplicationFormConfig(recruitment.application_form_config)
      );
      await createApplication(supabase, recruitmentId, user.id, message || undefined, {
        formRequired,
      });
      const form = await afterApplicationCreated(supabase, user.id, recruitment);

      return NextResponse.json({
        success: true,
        status: "pending",
        recruitmentId,
        ...form,
      });
    } catch (e) {
      console.error("recruitments/[id]/apply POST:", e);
      return NextResponse.json(
        { error: "応募に失敗しました" },
        { status: 500 }
      );
    }
  }

  // フォールバック: ストア
  const recruitment = getStoreRecruitmentById(recruitmentId);
  if (!recruitment) {
    return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
  }
  if (recruitment.status !== "public") {
    return NextResponse.json({ error: "この募集は受付中ではありません" }, { status: 400 });
  }

  const existingStatus = getStoreApplicationStatus(recruitmentId, user.id);
  if (existingStatus) {
    return NextResponse.json(
      { error: "すでに応募済みです", status: existingStatus },
      { status: 400 }
    );
  }

  const form = buildApplyFormResult(recruitmentId, recruitment.application_form_config);
  addStoreApplication(recruitmentId, user.id, message || undefined, {
    formRequired: form.formRequired,
  });

  return NextResponse.json({
    success: true,
    status: "pending",
    recruitmentId,
    ...form,
  });
}
