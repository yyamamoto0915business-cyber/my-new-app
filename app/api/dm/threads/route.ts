import { NextResponse } from "next/server";
import { getAuth } from "@/lib/get-auth";
import { getThreadsForOrganizer, getThreadsForVolunteer } from "@/lib/dm-mock";
import { getUserById } from "@/lib/auth-users";

export async function GET(request: Request) {
  const session = await getAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const asOrganizer = searchParams.get("as") === "organizer";

  const threads = asOrganizer
    ? getThreadsForOrganizer(session.user.id)
    : getThreadsForVolunteer(session.user.id);

  const withPartner = threads.map((t) => {
    const partnerId =
      session.user!.id === t.organizerId ? t.volunteerId : t.organizerId;
    const partner = getUserById(partnerId);
    return {
      ...t,
      partnerName: partner?.name ?? partner?.email ?? "ユーザー",
    };
  });

  return NextResponse.json(withPartner);
}
