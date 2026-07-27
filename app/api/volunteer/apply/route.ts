import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getAllVolunteerRoles } from "@/lib/volunteer-roles-mock";
import { getCreatedVolunteerRoles } from "@/lib/created-volunteer-roles-store";
import {
  createApplication,
  fetchRecruitmentById,
  getApplicationStatus,
  getOrganizerIdByProfileId,
} from "@/lib/db/recruitments-mvp";
import {
  addStoreApplication,
  getStoreApplicationStatus,
  getDevOrganizerId,
  getStoreRecruitmentById,
} from "@/lib/created-recruitments-store";
import {
  getOrCreateStoreRecruitmentForVolunteerRole,
  type VolunteerRoleRecruitmentSource,
} from "@/lib/volunteer-role-recruitment-bridge";
import { isVolunteerRoleFromRecruitment } from "@/lib/map-recruitment-to-volunteer-role";
import {
  afterApplicationCreated,
  buildApplyFormResult,
} from "@/lib/application-form-apply";
import {
  applicationFormNeedsInput,
  resolveApplicationFormConfig,
} from "@/lib/recruitment-application-form";

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const volunteerRoleId = body.volunteerRoleId as string | undefined;
  if (!volunteerRoleId) {
    return NextResponse.json({ error: "volunteerRoleId が必要です" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const supabase = await createClient();

  const isProduction = process.env.NODE_ENV === "production";
  const allRoles = [
    ...(isProduction ? [] : getAllVolunteerRoles()),
    ...getCreatedVolunteerRoles(),
  ];
  const mockRole = allRoles.find((r) => r.id === volunteerRoleId);

  if (mockRole && isVolunteerRoleFromRecruitment(mockRole) && supabase) {
    try {
      const recruitment = await fetchRecruitmentById(supabase, mockRole.id);
      if (!recruitment || recruitment.status !== "public") {
        return NextResponse.json({ error: "この募集は受付中ではありません" }, { status: 400 });
      }

      const existingStatus = await getApplicationStatus(supabase, mockRole.id, user.id);
      if (existingStatus) {
        return NextResponse.json(
          { error: "すでに応募済みです", status: existingStatus, recruitmentId: mockRole.id },
          { status: 400 }
        );
      }

      const formRequired = applicationFormNeedsInput(
        resolveApplicationFormConfig(recruitment.application_form_config)
      );
      await createApplication(supabase, mockRole.id, user.id, message || undefined, {
        formRequired,
      });
      const form = await afterApplicationCreated(supabase, user.id, recruitment);

      return NextResponse.json({
        success: true,
        status: "pending",
        recruitmentId: mockRole.id,
        ...form,
      });
    } catch (e) {
      console.error("volunteer/apply POST (recruitment):", e);
      return NextResponse.json({ error: "応募に失敗しました" }, { status: 500 });
    }
  }

  if (!mockRole && supabase) {
    try {
      const recruitment = await fetchRecruitmentById(supabase, volunteerRoleId);
      if (recruitment && recruitment.status === "public") {
        const existingStatus = await getApplicationStatus(supabase, volunteerRoleId, user.id);
        if (existingStatus) {
          return NextResponse.json(
            {
              error: "すでに応募済みです",
              status: existingStatus,
              recruitmentId: volunteerRoleId,
            },
            { status: 400 }
          );
        }

        const formRequired = applicationFormNeedsInput(
          resolveApplicationFormConfig(recruitment.application_form_config)
        );
        await createApplication(supabase, volunteerRoleId, user.id, message || undefined, {
          formRequired,
        });
        const form = await afterApplicationCreated(supabase, user.id, recruitment);

        return NextResponse.json({
          success: true,
          status: "pending",
          recruitmentId: volunteerRoleId,
          ...form,
        });
      }
    } catch (e) {
      console.error("volunteer/apply: fetchRecruitmentById", e);
    }
  }

  if (!mockRole) {
    return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
  }

  const roleSource: VolunteerRoleRecruitmentSource = {
    id: mockRole.id,
    eventId: mockRole.eventId,
    title: mockRole.title,
    description: mockRole.description,
    dateTime: mockRole.dateTime,
    location: mockRole.location,
    capacity: mockRole.capacity,
    perksText: mockRole.perksText,
  };

  let storeOrganizerId = getDevOrganizerId();
  if (supabase) {
    storeOrganizerId = (await getOrganizerIdByProfileId(supabase, user.id)) ?? getDevOrganizerId();
  }

  const recruitment = getOrCreateStoreRecruitmentForVolunteerRole(roleSource, storeOrganizerId);
  const existingStatus = getStoreApplicationStatus(recruitment.id, user.id);
  if (existingStatus) {
    return NextResponse.json(
      { error: "すでに応募済みです", status: existingStatus, recruitmentId: recruitment.id },
      { status: 400 }
    );
  }

  const storeRec = getStoreRecruitmentById(recruitment.id);
  const formPreview = buildApplyFormResult(
    recruitment.id,
    storeRec?.application_form_config
  );
  addStoreApplication(recruitment.id, user.id, message || undefined, {
    formRequired: formPreview.formRequired,
  });
  if (formPreview.formRequired && supabase) {
    await afterApplicationCreated(supabase, user.id, {
      id: recruitment.id,
      title: storeRec?.title ?? mockRole.title,
      application_form_config: storeRec?.application_form_config,
    });
  }

  return NextResponse.json({
    success: true,
    status: "pending",
    recruitmentId: recruitment.id,
    ...formPreview,
  });
}
