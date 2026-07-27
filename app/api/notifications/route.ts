import { createClient } from "@/lib/supabase/server";
import { fetchNotifications, getUnreadCount } from "@/lib/db/notifications";
import { fetchPendingApplicationForms } from "@/lib/db/recruitments-mvp";
import {
  getStorePendingApplicationForms,
  getStoreRecruitmentById,
} from "@/lib/created-recruitments-store";
import {
  applicationFormPath,
  getManualFormInputLabels,
  resolveApplicationFormConfig,
} from "@/lib/recruitment-application-form";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const supabase = await createClient();
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get("count") === "true";

  if (countOnly) {
    if (!supabase) {
      return NextResponse.json({ unreadCount: 0 });
    }
    const unreadCount = await getUnreadCount(supabase, user.id);
    return NextResponse.json({ unreadCount });
  }

  let notifications: Awaited<ReturnType<typeof fetchNotifications>> = [];
  let unreadCount = 0;
  let pendingApplicationForms: {
    applicationId: string;
    recruitmentId: string;
    title: string;
    roleLabel: string | null;
    formUrl: string;
    requiredLabels: string[];
    createdAt: string;
  }[] = [];

  if (supabase) {
    const [notifs, unread, pending] = await Promise.all([
      fetchNotifications(supabase, user.id),
      getUnreadCount(supabase, user.id),
      fetchPendingApplicationForms(supabase, user.id),
    ]);
    notifications = notifs;
    unreadCount = unread;
    pendingApplicationForms = pending.map((p) => ({
      applicationId: p.applicationId,
      recruitmentId: p.recruitmentId,
      title: p.title,
      roleLabel: p.roleLabel,
      formUrl: applicationFormPath(p.recruitmentId),
      requiredLabels: getManualFormInputLabels(
        resolveApplicationFormConfig(p.applicationFormConfig)
      ),
      createdAt: p.createdAt,
    }));
  } else {
    const storePending = getStorePendingApplicationForms(user.id);
    pendingApplicationForms = storePending.map((a) => {
      const recruitment = getStoreRecruitmentById(a.recruitment_id);
      const config = resolveApplicationFormConfig(recruitment?.application_form_config);
      return {
        applicationId: a.id,
        recruitmentId: a.recruitment_id,
        title: recruitment?.title ?? "募集",
        roleLabel: recruitment?.roles?.[0]?.name ?? null,
        formUrl: applicationFormPath(a.recruitment_id),
        requiredLabels: getManualFormInputLabels(config),
        createdAt: a.created_at,
      };
    });
  }

  return NextResponse.json({
    notifications,
    unreadCount,
    pendingApplicationForms,
  });
}
