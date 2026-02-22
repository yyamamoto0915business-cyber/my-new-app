import { NextResponse } from "next/server";
import { getAuth } from "@/lib/get-auth";
import { createApplicationAndThread } from "@/lib/dm-mock";
import { getAllVolunteerRoles } from "@/lib/volunteer-roles-mock";
import { getCreatedVolunteerRoles } from "@/lib/created-volunteer-roles-store";
import { getOrganizerIdByEventId } from "@/lib/event-organizers";

export async function POST(request: Request) {
  const session = await getAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const volunteerRoleId = body.volunteerRoleId as string | undefined;
  if (!volunteerRoleId) {
    return NextResponse.json(
      { error: "volunteerRoleId が必要です" },
      { status: 400 }
    );
  }

  const allRoles = [...getAllVolunteerRoles(), ...getCreatedVolunteerRoles()];
  const role = allRoles.find((r) => r.id === volunteerRoleId);
  if (!role) {
    return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });
  }

  const organizerId = getOrganizerIdByEventId(role.eventId);
  if (!organizerId) {
    return NextResponse.json(
      { error: "主催者情報がありません" },
      { status: 400 }
    );
  }

  const result = createApplicationAndThread(
    volunteerRoleId,
    session.user.id,
    organizerId,
    role.eventId
  );
  if (!result) {
    return NextResponse.json(
      { error: "応募の作成に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    applicationId: result.application.id,
    threadId: result.thread.id,
    redirectUrl: `/dm/${result.thread.id}`,
  });
}
