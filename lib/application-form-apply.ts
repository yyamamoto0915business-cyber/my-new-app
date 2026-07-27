import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applicationFormNeedsInput,
  applicationFormPath,
  resolveApplicationFormConfig,
  type ApplicationFormConfig,
} from "@/lib/recruitment-application-form";
import { notifyApplicationFormRequired } from "@/lib/db/notifications";

export type ApplyFormResult = {
  formRequired: boolean;
  formUrl: string | null;
  message: string;
};

export function buildApplyFormResult(
  recruitmentId: string,
  config: ApplicationFormConfig | null | undefined
): ApplyFormResult {
  const resolved = resolveApplicationFormConfig(config);
  const formRequired = applicationFormNeedsInput(resolved);
  return {
    formRequired,
    formUrl: formRequired ? applicationFormPath(recruitmentId) : null,
    message: formRequired
      ? "応募を受け付けました。お知らせに応募フォームが届きましたので、必要項目を入力・提出してください。"
      : "応募を受け付けました。主催者の確認をお待ちください。",
  };
}

/** DB応募後にフォーム要否に応じて通知を送る */
export async function afterApplicationCreated(
  supabase: SupabaseClient | null,
  userId: string,
  recruitment: { id: string; title: string; application_form_config?: ApplicationFormConfig | null }
): Promise<ApplyFormResult> {
  const result = buildApplyFormResult(recruitment.id, recruitment.application_form_config);
  if (result.formRequired && supabase) {
    await notifyApplicationFormRequired(supabase, userId, {
      id: recruitment.id,
      title: recruitment.title,
    });
  }
  return result;
}
