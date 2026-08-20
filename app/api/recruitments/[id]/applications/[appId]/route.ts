import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import {
  fetchRecruitmentById,
  fetchApplicationsByRecruitment,
  updateApplicationStatus,
  getOrganizerIdByProfileId,
} from "@/lib/db/recruitments-mvp";
import {
  getStoreApplicationsByRecruitment,
  updateStoreApplication,
} from "@/lib/created-recruitments-store";
import {
  canManageStoreRecruitment,
  getStoreRecruitmentIfExists,
} from "@/lib/store-recruitment-api";
import type { ApplicationStatus } from "@/lib/db/recruitments-mvp";
import { createNotification } from "@/lib/db/notifications";

type Params = { params: Promise<{ id: string; appId: string }> };

const PASS_ISSUED_STATUSES = new Set(["accepted", "confirmed"]);

function wasAlreadyPassEligible(status: string | null | undefined): boolean {
  return PASS_ISSUED_STATUSES.has(String(status ?? ""));
}

async function notifyPassIssued(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  input: {
    userId: string;
    recruitmentTitle: string;
  }
) {
  await createNotification(supabase, input.userId, "participation_confirmed", "参加パスが届きました", {
    body: `「${input.recruitmentTitle}」のスタッフとして承認されました。参加パスから当日の受付にご利用ください。`,
    link: "/pass",
  });
}

/** PATCH: 応募ステータス更新（採用/不採用/チェックイン/役割） */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: recruitmentId, appId } = await params;
  if (!recruitmentId || !appId) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なJSONです" }, { status: 400 });
  }

  const supabase = await createClient();
  const storeRecruitment = getStoreRecruitmentIfExists(recruitmentId);

  if (storeRecruitment) {
    const allowed = await canManageStoreRecruitment(supabase, user.id, storeRecruitment);
    if (!allowed) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const apps = getStoreApplicationsByRecruitment(recruitmentId);
    const app = apps.find((a) => a.id === appId);
    if (!app) {
      return NextResponse.json({ error: "応募が見つかりません" }, { status: 404 });
    }

    const updates: {
      status?: string;
      checked_in_at?: string | null;
      role_assigned?: string | null;
      organizer_memo?: string | null;
    } = {};
    if (
      body.status != null &&
      [
        "accepted",
        "rejected",
        "canceled",
        "confirmed",
        "pending",
        "checked_in",
        "on_hold",
      ].includes(String(body.status))
    ) {
      updates.status = body.status as string;
    }
    if (body.checked_in_at === true) {
      updates.checked_in_at = new Date().toISOString();
      // 手動到着時も status を checked_in に揃える
      if (!updates.status) updates.status = "checked_in";
    }
    if (body.role_assigned !== undefined) {
      updates.role_assigned = typeof body.role_assigned === "string" ? body.role_assigned : null;
    }
    if (body.organizer_memo !== undefined) {
      updates.organizer_memo =
        typeof body.organizer_memo === "string" ? body.organizer_memo.slice(0, 500) : null;
    }

    const updated = updateStoreApplication(appId, updates);
    return NextResponse.json(updated);
  }

  if (supabase) {
    try {
      const recruitment = await fetchRecruitmentById(supabase, recruitmentId);
      if (!recruitment) return NextResponse.json(null, { status: 404 });

      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      if (!organizerId || recruitment.organizer_id !== organizerId) {
        return NextResponse.json({ error: "権限がありません" }, { status: 403 });
      }

      const apps = await fetchApplicationsByRecruitment(supabase, recruitmentId);
      const app = apps.find((a) => a.id === appId);
      if (!app) {
        return NextResponse.json({ error: "応募が見つかりません" }, { status: 404 });
      }

      const updates: {
        status?: ApplicationStatus;
        checked_in_at?: string | null;
        role_assigned?: string | null;
        organizer_memo?: string | null;
      } = {};

      if (body.status != null) {
        const s = body.status as string;
        if (
          [
            "accepted",
            "rejected",
            "canceled",
            "confirmed",
            "pending",
            "checked_in",
            "on_hold",
          ].includes(s)
        ) {
          updates.status = s as ApplicationStatus;
        }
      }
      if (body.checked_in_at !== undefined) {
        updates.checked_in_at = body.checked_in_at === true || body.checked_in_at
          ? new Date().toISOString()
          : null;
        // 手動到着時も status を checked_in に揃える
        if (updates.checked_in_at && !updates.status) {
          updates.status = "checked_in";
        }
      }
      if (body.role_assigned !== undefined) {
        updates.role_assigned = typeof body.role_assigned === "string" ? body.role_assigned : null;
      }
      if (body.organizer_memo !== undefined) {
        updates.organizer_memo =
          typeof body.organizer_memo === "string" ? body.organizer_memo.slice(0, 500) : null;
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "更新項目がありません" }, { status: 400 });
      }

      const becomingPassEligible =
        updates.status != null &&
        PASS_ISSUED_STATUSES.has(updates.status) &&
        !wasAlreadyPassEligible(app.status);

      await updateApplicationStatus(supabase, appId, updates);

      if (becomingPassEligible && app.user_id) {
        try {
          await notifyPassIssued(supabase, {
            userId: app.user_id,
            recruitmentTitle: recruitment.title,
          });
        } catch (err) {
          console.error("applications PATCH pass notification:", err);
        }
      }

      const updated = (await fetchApplicationsByRecruitment(supabase, recruitmentId)).find(
        (a) => a.id === appId
      );
      return NextResponse.json(updated);
    } catch (e) {
      console.error("applications PATCH:", e);
      return NextResponse.json(
        { error: "更新に失敗しました" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
}
