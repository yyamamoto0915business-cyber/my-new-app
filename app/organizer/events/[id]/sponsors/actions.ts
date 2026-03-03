"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { isOrganizerOfEvent } from "@/lib/db/events";
import { updateSponsorApplicationStatus } from "@/lib/db/sponsors";

export type SetStatusResult = { error?: string };

/** FormData 用：主催者による承認/却下 */
export async function setSponsorStatusFromForm(
  _prev: SetStatusResult | null,
  formData: FormData
): Promise<SetStatusResult> {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const status = formData.get("status") as "approved" | "rejected" | null;

  if (!eventId || !applicationId || (status !== "approved" && status !== "rejected")) {
    return { error: "パラメータが不正です" };
  }

  return setSponsorStatus(eventId, applicationId, status);
}

/** 主催者：スポンサー申込のステータスを承認/却下に更新 */
export async function setSponsorStatus(
  eventId: string,
  applicationId: string,
  status: "approved" | "rejected"
): Promise<SetStatusResult> {
  if (process.env.NODE_ENV === "production") {
    const user = await getApiUser();
    if (!user) {
      return { error: "ログインが必要です" };
    }

    const supabase = await createClient();
    if (!supabase) {
      return { error: "データベースに接続できません" };
    }

    const isOrganizer = await isOrganizerOfEvent(supabase, eventId, user.id);
    if (!isOrganizer) {
      return { error: "このイベントの主催者ではありません" };
    }
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "データベースに接続できません" };
  }

  const { data: app } = await supabase
    .from("sponsor_applications")
    .select("event_id")
    .eq("id", applicationId)
    .single();

  if (!app || app.event_id !== eventId) {
    return { error: "申込が見つかりません" };
  }

  const ok = await updateSponsorApplicationStatus(supabase, applicationId, status);
  if (!ok) {
    return { error: "更新に失敗しました" };
  }

  revalidatePath(`/organizer/events/${eventId}/sponsors`);
  revalidatePath(`/events/${eventId}`);

  return {};
}
